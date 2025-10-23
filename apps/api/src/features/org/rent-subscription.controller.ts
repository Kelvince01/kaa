import {
  Payment,
  Property,
  AppSubscription as Subscription,
  Tenant,
  User,
} from "@kaa/models";
import type { IAppSubscription } from "@kaa/models/types";
import { subscriptionService } from "@kaa/services/subscriptions";
import { logger } from "@kaa/utils";
import { stripeClient } from "@kaa/utils/stripe";
import Elysia, { t } from "elysia";
import type { FilterQuery } from "mongoose";
import mongoose from "mongoose";
import type stripe from "stripe";
import { authPlugin } from "~/features/auth/auth.plugin";
import { rolePlugin } from "~/features/rbac/rbac.plugin";

/**
 *   Recurring payment subscription management
 */
export const rentSubscriptionController = new Elysia().group(
  "rent-subscriptions",
  (app) =>
    app
      .use(authPlugin)
      .post(
        "/",
        async ({ set, body, user }) => {
          try {
            const {
              propertyId,
              paymentMethodId,
              startDate,
              endDate,
              billingCycle = "month",
              billingCycleCount = 1,
              metadata = {},
            } = body;

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

            // Find the tenant (current user)
            const tenant = await Tenant.findById(user.id);

            if (!tenant) {
              set.status = 404;
              return {
                status: "error",
                message: "User not found",
              };
            }

            const { subscription } = await subscriptionService.getSubscription(
              tenant.id,
              tenant.memberId?.toString() as string
            );

            if (!subscription) {
              set.status = 404;
              return {
                status: "error",
                message: "Subscription not found",
              };
            }

            // Ensure tenant has a Stripe customer ID
            let customerId = subscription.stripeCustomerId as string;
            if (!customerId) {
              const stripeCustomer = await stripeClient.customers.create({
                email: tenant.personalInfo.email,
                name: `${tenant.personalInfo.firstName} ${tenant.personalInfo.lastName}`,
              });

              customerId = stripeCustomer.id;

              // Save Stripe customer ID to user
              await User.findByIdAndUpdate(tenant._id, {
                stripeCustomerId: customerId,
              });
            }

            // Attach payment method to customer if not already attached
            await stripeClient.paymentMethods.attach(paymentMethodId, {
              customer: customerId,
            });

            // Set as default payment method
            await stripeClient.customers.update(customerId, {
              invoice_settings: {
                default_payment_method: paymentMethodId,
              },
            });

            // Calculate price in smallest currency unit (pence/cents)
            const priceInSmallestUnit = Math.round(property.pricing.rent * 100);

            // Create a product for this property
            const product = await stripeClient.products.create({
              name: `Rent for ${property.title}`,
              description: `Monthly rent for property at ${property.location.address.line1}, ${property.location.address.town}`,
              metadata: {
                propertyId: propertyId.toString(),
                landlordId: (
                  property.landlord as mongoose.Types.ObjectId
                )._id.toString(),
              },
            });

            // Create a price for the product
            const price = await stripeClient.prices.create({
              product: product.id,
              unit_amount: priceInSmallestUnit,
              currency: "gbp",
              recurring: {
                interval: billingCycle as stripe.Price.Recurring.Interval,
                interval_count: billingCycleCount,
              },
              metadata: {
                propertyId: propertyId.toString(),
                landlordId: (
                  property.landlord as mongoose.Types.ObjectId
                )._id.toString(),
              },
            });

            // Parse start date
            const subscriptionStartDate = startDate
              ? new Date(startDate)
              : new Date();
            // Convert to Unix timestamp
            const startTimestamp = Math.floor(
              subscriptionStartDate.getTime() / 1000
            );

            // Create the subscription
            const stripeSubscription = await stripeClient.subscriptions.create({
              customer: customerId,
              items: [{ price: price.id }],
              billing_cycle_anchor: startTimestamp,
              proration_behavior: "none",
              metadata: {
                ...metadata,
                propertyId: propertyId.toString(),
                tenantId: (tenant._id as mongoose.Types.ObjectId).toString(),
                landlordId: (
                  property.landlord as mongoose.Types.ObjectId
                )._id.toString(),
              },
              expand: ["latest_invoice.payment_intent"],
            });

            // Save subscription to database
            const newSubscription = new Subscription({
              stripeSubscriptionId: stripeSubscription.id,
              status: stripeSubscription.status,
              tenant: tenant._id,
              landlord: (property.landlord as mongoose.Types.ObjectId)._id,
              property: propertyId,
              amount: priceInSmallestUnit,
              currency: "gbp",
              interval: billingCycle,
              intervalCount: billingCycleCount,
              startDate: subscriptionStartDate,
              endDate: endDate ? new Date(endDate) : undefined,

              nextBillingDate: new Date(
                (stripeSubscription as any).current_period_end * 1000
              ),
              paymentMethod: paymentMethodId,
              metadata,
            });

            await newSubscription.save();

            // If there's an invoice with a payment intent, save it as a payment
            if (
              stripeSubscription.latest_invoice &&
              typeof stripeSubscription.latest_invoice !== "string" &&
              (stripeSubscription.latest_invoice as any).payment_intent &&
              typeof (stripeSubscription.latest_invoice as any)
                .payment_intent !== "string"
            ) {
              const paymentIntent = (stripeSubscription.latest_invoice as any)
                .payment_intent;

              // Create a payment record
              const payment = new Payment({
                amount: priceInSmallestUnit,
                currency: "gbp",
                status: paymentIntent.status,
                paymentType: "rent",
                paymentMethod: "card",
                paymentIntentId: paymentIntent.id,
                description: `Rent payment for ${property.title}`,
                metadata: {
                  subscriptionId: stripeSubscription.id,
                  invoiceId: stripeSubscription.latest_invoice.id,
                },
                tenant: tenant._id,
                landlord: (property.landlord as mongoose.Types.ObjectId)._id,
                property: propertyId,
              });

              await payment.save();
            }

            set.status = 200;
            return {
              status: "success",
              data: {
                subscription: {
                  id: newSubscription._id,
                  stripeSubscriptionId: stripeSubscription.id,
                  status: stripeSubscription.status,
                  tenant: tenant._id,
                  landlord: (property.landlord as mongoose.Types.ObjectId)._id,
                  property: propertyId,
                  startDate: subscriptionStartDate,

                  nextBillingDate: new Date(
                    (stripeSubscription as any).current_period_end * 1000
                  ),
                  amount: priceInSmallestUnit / 100, // Convert back to pounds
                  currency: "gbp",
                  clientSecret:
                    stripeSubscription.latest_invoice &&
                    typeof stripeSubscription.latest_invoice !== "string" &&
                    (stripeSubscription.latest_invoice as any).payment_intent &&
                    typeof (stripeSubscription.latest_invoice as any)
                      .payment_intent !== "string"
                      ? (stripeSubscription.latest_invoice as any)
                          .payment_intent.client_secret
                      : null,
                },
              },
            };
          } catch (error) {
            set.status = 500;
            return {
              status: "error",
              message: "",
            };
          }
        },
        {
          body: t.Object({
            propertyId: t.String(),
            paymentMethodId: t.String(),
            startDate: t.Date(),
            endDate: t.Date(),
            billingCycle: t.String(),
            billingCycleCount: t.Number(),
            metadata: t.Any(),
          }),
          detail: {
            tags: ["rent-subscriptions"],
            summary: "Create subscription",
            description: "Create a recurring payment subscription for rent",
            security: [
              {
                bearerAuth: [],
              },
            ],
          },
        }
      )
      .use(rolePlugin)
      .get(
        "/",
        async ({ set, user, role, query }) => {
          try {
            const { status, propertyId, page = 1, limit = 10 } = query;

            const filter: FilterQuery<IAppSubscription> = {};

            // Filter by user role (tenant or landlord)
            if (role.name === "tenant") {
              filter.tenant = user.id;
            } else if (role.name === "landlord") {
              filter.landlord = user.id;
            } else if (role.name !== "admin") {
              set.status = 403;
              return {
                status: "error",
                message: "Unauthorized access",
              };
            }

            // Filter by status if provided
            if (status) {
              filter.status = status;
            }

            // Filter by property if provided
            if (propertyId) {
              filter.property = propertyId;
            }

            // Pagination
            const pageNumber = page;
            const limitNumber = limit;
            const skip = (pageNumber - 1) * limitNumber;

            // Get total count
            const total = await Subscription.countDocuments(filter);

            // Get subscriptions
            const subscriptions = await Subscription.find(filter)
              .populate("tenant", "firstName lastName email")
              .populate("landlord", "firstName lastName email")
              .populate("property", "title address")
              .sort({ createdAt: -1 })
              .skip(skip)
              .limit(limitNumber);

            set.status = 200;
            return {
              status: "success",
              data: {
                subscriptions,
                pagination: {
                  total,
                  page: pageNumber,
                  limit: limitNumber,
                  pages: Math.ceil(total / limitNumber),
                },
              },
            };
          } catch (error) {
            set.status = 500;
            return {
              status: "error",
              message: "Failed to get subscriptions",
            };
          }
        },
        {
          query: t.Object({
            status: t.String(),
            propertyId: t.String(),
            page: t.Number(),
            limit: t.Number(),
          }),
          detail: {
            tags: ["rent-subscriptions"],
            summary: "Get subscriptions",
            description:
              "Retrieve subscriptions for the authenticated user (as tenant or landlord)",
            security: [
              {
                bearerAuth: [],
              },
            ],
          },
        }
      )
      .use(rolePlugin)
      .get(
        "/subscriptionId",
        async ({ set, params, user, role }) => {
          try {
            const { subscriptionId } = params;
            // Find subscription
            const subscription = await Subscription.findById(subscriptionId)
              .populate("tenant", "firstName lastName email")
              .populate("landlord", "firstName lastName email")
              .populate("property", "title address");

            if (!subscription) {
              set.status = 404;
              return {
                status: "error",
                message: "Subscription not found",
              };
            }

            // Check if user has access to this subscription
            if (
              role.name !== "admin" &&
              subscription.tenant._id.toString() !== user.id &&
              subscription.landlord._id.toString() !== user.id
            ) {
              set.status = 403;
              return {
                status: "error",
                message: "Unauthorized access",
              };
            }

            // Get payment history for this subscription
            const payments = await Payment.find({
              "metadata.subscriptionId": subscription.stripeSubscriptionId,
            })
              .sort({ createdAt: -1 })
              .limit(10);

            // Get Stripe subscription details
            const stripeSubscription =
              await stripeClient.subscriptions.retrieve(
                subscription.stripeSubscriptionId,
                {
                  expand: [
                    "default_payment_method",
                    "items.data.price.product",
                  ],
                }
              );

            set.status = 200;
            return {
              status: "success",
              data: {
                subscription: {
                  ...subscription.toObject(),
                  stripeDetails: stripeSubscription,
                  payments,
                },
              },
            };
          } catch (error) {
            set.status = 500;
            return {
              status: "error",
              message: "Failed to get subscription",
            };
          }
        },
        {
          params: t.Object({
            subscriptionId: t.String(),
          }),
          detail: {
            tags: ["rent-subscriptions"],
            summary: "Get subscription by ID",
            description:
              "Retrieve detailed information about a specific subscription",
            security: [
              {
                bearerAuth: [],
              },
            ],
          },
        }
      )
      .use(rolePlugin)
      .patch(
        "/subscriptionId",
        async ({ set, params, body, user, role }) => {
          try {
            const { subscriptionId } = params;
            const { paymentMethodId, endDate, metadata } = body;

            // Find subscription
            const subscription = await Subscription.findById(subscriptionId);

            if (!subscription) {
              set.status = 404;
              return {
                status: "error",
                message: "Subscription not found",
              };
            }

            // Check if user has access to this subscription
            if (
              role.name !== "admin" &&
              subscription.tenant.toString() !== user.id &&
              subscription.landlord.toString() !== user.id
            ) {
              set.status = 403;
              return {
                status: "error",
                message: "Unauthorized access",
              };
            }

            // Update payment method if provided
            if (paymentMethodId && subscription.tenant.toString() === user.id) {
              const tenant = await Tenant.findById(user.id);
              if (!tenant) {
                set.status = 404;
                return {
                  status: "error",
                  message: "User not found",
                };
              }

              const { subscription } =
                await subscriptionService.getSubscription(
                  tenant.id,
                  tenant.memberId?.toString() as string
                );

              if (!subscription) {
                set.status = 404;
                return {
                  status: "error",
                  message: "Subscription not found",
                };
              }

              if (!(tenant && subscription.stripeCustomerId)) {
                set.status = 400;
                return {
                  status: "error",
                  message: "Tenant Stripe customer not found",
                };
              }

              // Attach payment method to customer if not already attached
              await stripeClient.paymentMethods.attach(paymentMethodId, {
                customer: subscription.stripeCustomerId,
              });

              // Set as default payment method
              await stripeClient.customers.update(
                subscription.stripeCustomerId,
                {
                  invoice_settings: {
                    default_payment_method: paymentMethodId,
                  },
                }
              );

              // Update subscription with new payment method
              subscription.paymentMethod = new mongoose.Types.ObjectId(
                paymentMethodId
              );
            }

            // Update end date if provided
            if (endDate) {
              subscription.endDate = new Date(endDate);
            }

            // Update metadata if provided
            if (metadata) {
              subscription.metadata = { ...subscription.metadata, ...metadata };

              // Update Stripe subscription metadata
              await stripeClient.subscriptions.update(
                subscription.stripeSubscriptionId,
                {
                  metadata: { ...subscription.metadata },
                }
              );
            }

            await subscription.save();

            set.status = 200;
            return {
              status: "success",
              data: subscription,
            };
          } catch (error) {
            set.status = 500;
            return {
              status: "error",
              message: "Failed to update subscription",
            };
          }
        },
        {
          params: t.Object({
            subscriptionId: t.String(),
          }),
          body: t.Object({
            paymentMethodId: t.String(),
            endDate: t.Date(),
            metadata: t.Any(),
          }),
          detail: {
            tags: ["rent-subscriptions"],
            summary: "Update subscriptions",
            description:
              "Update a subscription (payment method, end date, metadata)",
            security: [
              {
                bearerAuth: [],
              },
            ],
          },
        }
      )
      .use(rolePlugin)
      .post(
        "/:subscriptionId/cancel",
        async ({ set, params, body, user, role }) => {
          try {
            const { subscriptionId } = params;
            const { cancelImmediately = false } = body;

            // Find subscription
            const subscription = await Subscription.findById(subscriptionId);

            if (!subscription) {
              set.status = 404;
              return {
                status: "error",
                message: "Subscription not found",
              };
            }

            // Check if user has access to this subscription
            if (
              role.name !== "admin" &&
              subscription.tenant.toString() !== user.id &&
              subscription.landlord.toString() !== user.id
            ) {
              set.status = 403;
              return {
                status: "error",
                message: "Unauthorized access",
              };
            }

            // Cancel the subscription in Stripe
            const canceledSubscription =
              await stripeClient.subscriptions.update(
                subscription.stripeSubscriptionId,
                {
                  cancel_at_period_end: !cancelImmediately,
                  ...(cancelImmediately ? { status: "canceled" } : {}),
                }
              );

            // Update subscription in database
            subscription.status = cancelImmediately
              ? "canceled"
              : subscription.status;
            subscription.canceledAt = new Date();
            await subscription.save();

            set.status = 200;
            return {
              status: "success",
              data: {
                subscription: {
                  ...subscription.toObject(),
                  stripeDetails: {
                    status: canceledSubscription.status,
                    cancelAt: canceledSubscription.cancel_at
                      ? new Date(canceledSubscription.cancel_at * 1000)
                      : null,
                    cancelAtPeriodEnd:
                      canceledSubscription.cancel_at_period_end,
                  },
                },
              },
            };
          } catch (error) {
            set.status = 500;
            return {
              status: "error",
              message: "Failed to cancel subscription",
            };
          }
        },
        {
          params: t.Object({
            subscriptionId: t.String(),
          }),
          body: t.Object({
            cancelImmediately: t.Boolean(),
          }),
          detail: {
            tags: ["rent-subscriptions"],
            summary: "Cancel subscription",
            description: "Cancel a subscription (at period end or immediately)",
            security: [
              {
                bearerAuth: [],
              },
            ],
          },
        }
      )
);

/**
 * Handle subscription webhook events
 * @param event - Stripe event object
 */
export const handleSubscriptionEvent = async (
  event: stripe.Event
): Promise<void> => {
  try {
    switch (event.type) {
      case "customer.subscription.created":
        await handleSubscriptionCreated(
          event.data.object as stripe.Subscription
        );
        break;
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(
          event.data.object as stripe.Subscription
        );
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(
          event.data.object as stripe.Subscription
        );
        break;
      case "invoice.payment_succeeded":
        await handleInvoicePaymentSucceeded(
          event.data.object as stripe.Invoice
        );
        break;
      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object as stripe.Invoice);
        break;
      default:
        logger.info(`Unhandled subscription event type: ${event.type}`);
    }
  } catch (error: unknown) {
    logger.error("Handle subscription event error:", error as Error);
  }
};

/**
 * Handle subscription created event
 * @param subscription - Stripe subscription object
 */
const handleSubscriptionCreated = async (
  subscription: stripe.Subscription
): Promise<void> => {
  try {
    // Check if subscription already exists in our database
    const existingSubscription = await Subscription.findOne({
      stripeSubscriptionId: subscription.id,
    });

    if (existingSubscription) {
      logger.info(`Subscription ${subscription.id} already exists in database`);
      return;
    }

    // Extract metadata
    const { propertyId, tenantId, landlordId } = subscription.metadata;

    if (!(propertyId && tenantId && landlordId)) {
      logger.error(
        `Missing required metadata for subscription ${subscription.id}`
      );
      return;
    }

    // Create new subscription in database
    const newSubscription = new Subscription({
      stripeSubscriptionId: subscription.id,
      status: subscription.status,
      tenant: tenantId,
      landlord: landlordId,
      property: propertyId,
      amount: subscription.items.data[0].price.unit_amount,
      currency: subscription.currency,
      interval: subscription.items.data[0].price.recurring?.interval,
      intervalCount: subscription.items.data[0].price.recurring?.interval_count,
      startDate: new Date(subscription.start_date * 1000),

      nextBillingDate: new Date(
        (subscription as any).current_period_end * 1000
      ),
      metadata: subscription.metadata,
    });

    await newSubscription.save();
    logger.info(`Subscription ${subscription.id} created in database`);
  } catch (error: unknown) {
    logger.error("Handle subscription created error:", error as Error);
  }
};

/**
 * Handle subscription updated event
 * @param subscription - Stripe subscription object
 */
const handleSubscriptionUpdated = async (
  subscription: stripe.Subscription
): Promise<void> => {
  try {
    // Find subscription in database
    const existingSubscription = await Subscription.findOne({
      stripeSubscriptionId: subscription.id,
    });

    if (!existingSubscription) {
      logger.error(`Subscription ${subscription.id} not found in database`);
      return;
    }

    // Update subscription
    existingSubscription.status = subscription.status;
    existingSubscription.nextBillingDate = new Date(
      (subscription as any).current_period_end * 1000
    );

    if (subscription.canceled_at) {
      existingSubscription.canceledAt = new Date(
        subscription.canceled_at * 1000
      );
    }

    await existingSubscription.save();
    logger.info(`Subscription ${subscription.id} updated in database`);
  } catch (error: unknown) {
    logger.error("Handle subscription updated error:", error as Error);
  }
};

/**
 * Handle subscription deleted event
 * @param subscription - Stripe subscription object
 */
const handleSubscriptionDeleted = async (
  subscription: stripe.Subscription
): Promise<void> => {
  try {
    // Find subscription in database
    const existingSubscription = await Subscription.findOne({
      stripeSubscriptionId: subscription.id,
    });

    if (!existingSubscription) {
      logger.error(`Subscription ${subscription.id} not found in database`);
      return;
    }

    // Update subscription status
    existingSubscription.status = "canceled";
    existingSubscription.canceledAt = new Date();
    await existingSubscription.save();
    logger.info(
      `Subscription ${subscription.id} marked as canceled in database`
    );
  } catch (error: unknown) {
    logger.error("Handle subscription deleted error:", error as Error);
  }
};

/**
 * Handle invoice payment succeeded event
 * @param invoice - Stripe invoice object
 */
const handleInvoicePaymentSucceeded = async (
  invoice: stripe.Invoice
): Promise<void> => {
  try {
    // Check if this is a subscription invoice

    if (!(invoice as any).subscription) {
      return;
    }

    // Find subscription in database
    const subscription = await Subscription.findOne({
      stripeSubscriptionId:
        typeof (invoice as any).subscription === "string"
          ? (invoice as any).subscription
          : (invoice as any).subscription.id,
    });

    if (!subscription) {
      logger.error(
        `Subscription for invoice ${invoice.id} not found in database`
      );
      return;
    }

    // Create payment record
    const payment = new Payment({
      amount: invoice.amount_paid,
      currency: invoice.currency,
      status: "succeeded",
      paymentType: "rent",
      paymentMethod: "card",
      paymentIntentId:
        typeof (invoice as any).payment_intent === "string"
          ? (invoice as any).payment_intent
          : (invoice as any).payment_intent.id,
      description:
        invoice.description ||
        `Rent payment for subscription ${subscription.stripeSubscriptionId}`,
      metadata: {
        subscriptionId: subscription.stripeSubscriptionId,
        invoiceId: invoice.id,
      },
      tenant: subscription.tenant,
      landlord: subscription.landlord,
      property: subscription.property,
    });

    await payment.save();
    logger.info(`Payment record created for invoice ${invoice.id}`);

    // Update subscription next billing date
    if (invoice.lines.data[0]?.period?.end) {
      subscription.nextBillingDate = new Date(
        invoice.lines.data[0].period.end * 1000
      );
      await subscription.save();
    }
  } catch (error: unknown) {
    logger.error("Handle invoice payment succeeded error:", error as Error);
  }
};

/**
 * Handle invoice payment failed event
 * @param invoice - Stripe invoice object
 */
const handleInvoicePaymentFailed = async (
  invoice: stripe.Invoice
): Promise<void> => {
  try {
    // Check if this is a subscription invoice

    if (!(invoice as any).subscription) {
      return;
    }

    // Find subscription in database
    const subscription = await Subscription.findOne({
      stripeSubscriptionId:
        typeof (invoice as any).subscription === "string"
          ? (invoice as any).subscription
          : (invoice as any).subscription.id,
    });

    if (!subscription) {
      logger.error(
        `Subscription for invoice ${invoice.id} not found in database`
      );
      return;
    }

    // Create payment record for failed payment

    if ((invoice as any).payment_intent) {
      const payment = new Payment({
        amount: invoice.amount_due,
        currency: invoice.currency,
        status: "failed",
        paymentType: "rent",
        paymentMethod: "card",
        paymentIntentId:
          typeof (invoice as any).payment_intent === "string"
            ? (invoice as any).payment_intent
            : (invoice as any).payment_intent.id,
        description:
          invoice.description ||
          `Failed rent payment for subscription ${subscription.stripeSubscriptionId}`,
        metadata: {
          subscriptionId: subscription.stripeSubscriptionId,
          invoiceId: invoice.id,
        },
        tenant: subscription.tenant,
        landlord: subscription.landlord,
        property: subscription.property,
      });

      await payment.save();
      logger.info(`Failed payment record created for invoice ${invoice.id}`);
    }

    // If subscription is past_due, update status
    if (invoice.next_payment_attempt === null) {
      subscription.status = "unpaid";
      await subscription.save();
    }
  } catch (error: unknown) {
    logger.error("Handle invoice payment failed error:", error as Error);
  }
};
