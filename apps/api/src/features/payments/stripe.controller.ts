import { Payment, Property, Tenant } from "@kaa/models";
import type { PaymentType } from "@kaa/models/types";
import { stripeService } from "@kaa/services/stripe";
import { logger } from "@kaa/utils";
import { stripeClient } from "@kaa/utils/stripe";
import Elysia, { t } from "elysia";
import type mongoose from "mongoose";
import type Stripe from "stripe";
import { authPlugin } from "~/features/auth/auth.plugin";
import { rolePlugin } from "~/features/rbac/rbac.plugin";
import { tenantPlugin } from "../users/tenants/tenant.plugin";

export const stripeController = new Elysia().group("/stripe", (app) =>
  app
    .use(authPlugin)
    .use(tenantPlugin)
    .post(
      "/payment-intent",
      async ({ set, body, tenant }) => {
        try {
          const { propertyId, paymentType, description, contractId } = body;

          // Validate payment type
          const validPaymentTypes = [
            "deposit",
            "rent",
            "holding_deposit",
            "fee",
            "other",
          ];
          if (!validPaymentTypes.includes(paymentType as string)) {
            set.status = 400;
            return {
              status: "error",
              message: "Invalid payment type",
            };
          }

          // Check if property exists
          const property = await Property.findById(propertyId).populate(
            "landlord",
            "email stripeCustomerId"
          );

          if (!property) {
            set.status = 404;
            return {
              status: "error",
              message: "Property not found",
            };
          }

          // Calculate amount based on payment type
          let amount: number;
          switch (paymentType) {
            case "deposit":
              amount = property.pricing.deposit;
              break;
            case "rent":
              amount = property.pricing.rent;
              break;
            case "holding_deposit":
              // Typically a week's rent
              amount =
                property.pricing.paymentFrequency === "weekly"
                  ? property.pricing.rent
                  : Math.ceil(property.pricing.rent / 4);
              break;
            case "fee":
              // Default to a service fee if not specified
              amount = body.amount || 50; // £50 default service fee
              break;
            case "other":
              // Must specify amount for 'other' payment type
              if (!body.amount) {
                set.status = 400;
                return {
                  status: "error",
                  message: "Amount is required for 'other' payment type",
                };
              }
              amount = body.amount;
              break;
            default:
              amount = 0; // This should never happen due to validation above
          }

          // Convert to pence/cents (Stripe requires smallest currency unit)
          const amountInSmallestUnit = Math.round(amount * 100);

          // Find the user (tenant)
          const tenantObj = await Tenant.findById(tenant.id);

          if (!tenantObj) {
            set.status = 404;
            return {
              status: "error",
              message: "Tenant not found",
            };
          }

          // Create payment intent
          const paymentIntent = await stripeService.createPaymentIntent(
            property,
            tenantObj,
            amountInSmallestUnit,
            paymentType as PaymentType,
            description,
            propertyId,
            contractId
          );

          // Create a pending payment record in the database
          const payment = new Payment({
            amount: amountInSmallestUnit,
            currency: "kes",
            status: "pending",
            paymentType,
            paymentMethod: "card",
            paymentIntentId: paymentIntent.id,
            description:
              description || `${paymentType} payment for ${property.title}`,
            metadata: {
              ...(contractId ? { contractId } : {}),
            },
            tenant: tenantObj._id,
            landlord: (property.landlord as mongoose.Types.ObjectId)._id,
            property: propertyId,
            ...(contractId ? { contract: contractId } : {}),
          });

          await payment.save();

          return {
            status: "success",
            data: {
              clientSecret: paymentIntent.client_secret,
              amount: amountInSmallestUnit,
              paymentIntentId: paymentIntent.id,
              paymentId: payment._id,
            },
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: "Failed to handle payment intent",
          };
        }
      },
      {
        body: t.Object({
          propertyId: t.String(),
          paymentType: t.String(),
          description: t.String(),
          contractId: t.String(),
          amount: t.Number(),
        }),
        detail: {
          tags: ["stripe"],
          summary: "Create a payment intent",
        },
      }
    )
    .post(
      "/webhook",
      async ({ set, body, headers }) => {
        try {
          const signature = headers["stripe-signature"] as string;

          // Verify webhook signature
          try {
            await stripeService.webhookHandler(signature, body);
          } catch (err: unknown) {
            set.status = 400;
            return {
              status: "error",
              message: `Webhook Error: ${(err as Error).message}`,
            };
          }

          // Return a 200 response to acknowledge receipt of the event
          return {
            status: "success",
            data: {
              received: true,
            },
            message: "Webhook received",
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: "Failed to handle webhook",
          };
        }
      },
      {
        body: t.Any(),
        detail: {
          tags: ["stripe"],
          summary: "Handle a webhook",
        },
      }
    )
    .use(rolePlugin)
    .get(
      "/:paymentIntentId",
      async ({ params, tenant, set, role }) => {
        const { paymentIntentId } = params;

        // Find the user
        const user = await Tenant.findById(tenant.id);

        if (!user) {
          set.status = 404;
          return {
            status: "error",
            message: "Tenant not found",
          };
        }

        // In a real implementation, you would fetch from a Payment model
        // For demo purposes, fetch from Stripe directly
        try {
          const paymentIntent =
            await stripeClient.paymentIntents.retrieve(paymentIntentId);

          // Check if this payment belongs to the user
          const isAuthorized =
            paymentIntent.metadata?.tenantId ===
              (user._id as mongoose.Types.ObjectId).toString() ||
            paymentIntent.metadata?.landlordId ===
              (user._id as mongoose.Types.ObjectId).toString() ||
            role.name === "admin";

          if (!isAuthorized) {
            set.status = 403;
            return {
              status: "error",
              message: "Not authorized to view this payment",
            };
          }

          // Get property details if available
          let property: any = null;
          if (paymentIntent.metadata?.propertyId) {
            property = await Property.findById(
              paymentIntent.metadata.propertyId
            )
              .select("title address media")
              .populate("landlord", "personalInfo");
          }

          // Format the payment data
          const payment = {
            _id: paymentIntent.id,
            amount: paymentIntent.amount || 0,
            amountFormatted: `£${((paymentIntent.amount || 0) / 100).toFixed(2)}`,
            currency: paymentIntent.currency,
            status: paymentIntent.status,
            paymentType: paymentIntent.metadata?.paymentType || "other",
            paymentMethod: "card", // This would be more detailed in a real implementation
            description: paymentIntent.description,
            tenant: paymentIntent.metadata?.tenantId,
            landlord: paymentIntent.metadata?.landlordId,
            property: property
              ? {
                  _id: property._id,
                  title: property.title,
                  address: property.location.address,
                  image: property.media.photos?.[0].url || "",
                }
              : null,
            paymentDate: new Date(paymentIntent.created * 1000),
            transactionId: paymentIntent.latest_charge,
            receiptUrl: "", // Would get this from charges in real implementation
            createdAt: new Date(paymentIntent.created * 1000),
            updatedAt: new Date(),
          };

          // Return the payment data
          set.status = 200;
          return {
            status: "success",
            data: payment,
          };
        } catch (stripeError) {
          set.status = 404;
          return {
            status: "error",
            message: "Payment not found",
          };
        }
      },
      {
        params: t.Object({
          paymentIntentId: t.String(),
        }),
        detail: {
          summary: "Get a payment intent",
          tags: ["stripe"],
        },
      }
    )
    .post(
      "/refund",
      async ({ set, body, params, tenant, role }) => {
        try {
          const { paymentId } = params;
          const { amount, reason = "requested_by_customer" } = body;

          // Find the user
          const user = await Tenant.findById(tenant.id);

          if (!user) {
            set.status = 404;
            return {
              status: "error",
              message: "Tenant not found",
            };
          }

          // Check if user has admin or landlord role
          if (role.name !== "admin" && role.name !== "landlord") {
            set.status = 403;
            return {
              status: "error",
              message: "Not authorized to issue refunds",
            };
          }

          // In a real implementation, you would fetch from a Payment model
          // For demo purposes, use Stripe directly
          try {
            const paymentIntent =
              await stripeClient.paymentIntents.retrieve(paymentId);

            // Check if this payment can be refunded
            if (paymentIntent.status !== "succeeded") {
              set.status = 400;
              return {
                status: "error",
                message: "Payment cannot be refunded - invalid status",
              };
            }

            // Check if landlord is authorized for this property
            if (
              role.name === "landlord" &&
              paymentIntent.metadata?.landlordId !==
                (user._id as mongoose.Types.ObjectId).toString()
            ) {
              set.status = 403;
              return {
                status: "error",
                message: "Not authorized to refund this payment",
              };
            }

            // Get charge ID from payment intent
            const chargeId = paymentIntent.latest_charge as string;
            if (!chargeId) {
              set.status = 400;
              return {
                status: "error",
                message: "Unable to locate charge for this payment",
              };
            }

            // Create the refund
            const refundParams: Stripe.RefundCreateParams = {
              charge: chargeId,
              amount: amount ? Number.parseInt(amount, 10) : undefined, // Optional for partial refunds
              reason: reason as Stripe.RefundCreateParams.Reason,
              metadata: {
                refundedBy: (user._id as mongoose.Types.ObjectId).toString(),
                originalPaymentId: paymentId,
              },
            };

            const refund = await stripeClient.refunds.create(refundParams);

            // Return the refund details
            set.status = 200;
            return {
              status: "success",
              data: {
                refund: {
                  id: refund.id,
                  amount: refund.amount,
                  status: refund.status,
                  originalPayment: paymentId,
                },
              },
            };
          } catch (stripeError: unknown) {
            logger.error("Stripe refund error:", stripeError as Error);

            set.status = 400;
            return {
              status: "error",
              message: "Failed to process refund",
            };
          }
        } catch (stripeError: unknown) {
          logger.error("Stripe refund error:", stripeError as Error);

          set.status = 400;
          return {
            status: "error",
            message: "Failed to process refund",
          };
        }
      },
      {
        body: t.Object({
          amount: t.String(),
          reason: t.String(),
        }),
        params: t.Object({
          paymentId: t.String(),
        }),
        detail: {
          tags: ["stripe"],
          summary: "Handle stripe refund",
        },
      }
    )
    .post(
      "/setup-intent",
      async ({ set, body, tenant }) => {
        try {
          const { paymentMethodTypes } = body;

          // Find the tenant
          const tenantObj = await Tenant.findById(tenant.id);

          if (!tenantObj) {
            set.status = 404;
            return {
              status: "error",
              message: "Tenant not found",
            };
          }

          // Ensure tenant has a Stripe customer ID
          let customerId = tenantObj.stripeCustomerId;
          if (!customerId) {
            const customer = await stripeClient.customers.create({
              email: tenantObj.personalInfo.email,
              name: `${tenantObj.personalInfo.firstName} ${tenantObj.personalInfo.lastName}`,
            });

            customerId = customer.id;

            // Save Stripe customer ID to tenant
            await Tenant.findByIdAndUpdate(tenant.id, {
              stripeCustomerId: customerId,
            });
          }

          // Create setup intent
          const setupIntent = await stripeService.createSetupIntent(
            customerId,
            paymentMethodTypes
          );

          return {
            status: "success",
            data: {
              clientSecret: setupIntent.client_secret,
              setupIntentId: setupIntent.id,
            },
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: "Failed to create setup intent",
          };
        }
      },
      {
        body: t.Object({
          paymentMethodTypes: t.Optional(t.Array(t.String())),
        }),
        detail: {
          tags: ["stripe"],
          summary: "Create setup intent for saving payment methods",
          description:
            "Create a setup intent to save payment methods for future use",
        },
      }
    )
    .get(
      "/payment-methods",
      async ({ set, tenant, query }) => {
        try {
          const { type } = query;

          // Find the tenant
          const tenantObj = await Tenant.findById(tenant.id);

          if (!tenantObj?.stripeCustomerId) {
            set.status = 404;
            return {
              status: "error",
              message: "Tenant not found or no Stripe customer ID",
            };
          }

          // Get payment methods
          const paymentMethods = await stripeService.getCustomerPaymentMethods(
            tenantObj.stripeCustomerId,
            type as string
          );

          return {
            status: "success",
            data: paymentMethods,
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: "Failed to retrieve payment methods",
          };
        }
      },
      {
        query: t.Object({
          type: t.Optional(t.String()),
        }),
        detail: {
          tags: ["stripe"],
          summary: "Get customer payment methods",
          description: "Retrieve all payment methods for the current customer",
        },
      }
    )
    .delete(
      "/payment-methods/:paymentMethodId",
      async ({ set, params, tenant }) => {
        try {
          const { paymentMethodId } = params;

          // Find the tenant
          const tenantObj = await Tenant.findById(tenant.id);

          if (!tenantObj) {
            set.status = 404;
            return {
              status: "error",
              message: "Tenant not found",
            };
          }

          // Detach payment method
          const paymentMethod =
            await stripeService.detachPaymentMethod(paymentMethodId);

          return {
            status: "success",
            data: paymentMethod,
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: "Failed to detach payment method",
          };
        }
      },
      {
        params: t.Object({
          paymentMethodId: t.String(),
        }),
        detail: {
          tags: ["stripe"],
          summary: "Delete payment method",
          description: "Detach a payment method from the customer",
        },
      }
    )
    .post(
      "/confirm/:paymentIntentId",
      async ({ set, params, body, tenant }) => {
        try {
          const { paymentIntentId } = params;
          const { paymentMethodId } = body;

          // Find the tenant
          const tenantObj = await Tenant.findById(tenant.id);

          if (!tenantObj) {
            set.status = 404;
            return {
              status: "error",
              message: "Tenant not found",
            };
          }

          // Confirm payment intent
          const paymentIntent = await stripeService.confirmPaymentIntent(
            paymentIntentId,
            paymentMethodId
          );

          return {
            status: "success",
            data: paymentIntent,
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: "Failed to confirm payment intent",
          };
        }
      },
      {
        params: t.Object({
          paymentIntentId: t.String(),
        }),
        body: t.Object({
          paymentMethodId: t.Optional(t.String()),
        }),
        detail: {
          tags: ["stripe"],
          summary: "Confirm payment intent",
          description: "Confirm a payment intent on the server side",
        },
      }
    )
    .post(
      "/cancel/:paymentIntentId",
      async ({ set, params, tenant }) => {
        try {
          const { paymentIntentId } = params;

          // Find the tenant
          const tenantObj = await Tenant.findById(tenant.id);

          if (!tenantObj) {
            set.status = 404;
            return {
              status: "error",
              message: "Tenant not found",
            };
          }

          // Verify payment intent belongs to this customer
          const paymentIntent =
            await stripeService.getPaymentIntent(paymentIntentId);
          if (paymentIntent.customer !== tenantObj.stripeCustomerId) {
            set.status = 403;
            return {
              status: "error",
              message: "Not authorized to cancel this payment",
            };
          }

          // Cancel payment intent
          const canceledPaymentIntent =
            await stripeService.cancelPaymentIntent(paymentIntentId);

          return {
            status: "success",
            data: canceledPaymentIntent,
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: "Failed to cancel payment intent",
          };
        }
      },
      {
        params: t.Object({
          paymentIntentId: t.String(),
        }),
        detail: {
          tags: ["stripe"],
          summary: "Cancel payment intent",
          description: "Cancel a payment intent",
        },
      }
    )
);
