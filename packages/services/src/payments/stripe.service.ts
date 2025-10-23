import config from "@kaa/config/api";
// import { handleSubscriptionEvent } from "~/features/subscriptions/subscription.controller";
import { Property, Tenant } from "@kaa/models";
import type { IProperty, ITenant, PaymentType } from "@kaa/models/types";
import { logger } from "@kaa/utils";
import { stripeClient } from "@kaa/utils/stripe";
import type mongoose from "mongoose";
import type Stripe from "stripe";

class StripeService {
  async createPaymentIntent(
    property: IProperty,
    tenant: ITenant,
    amountInSmallestUnit: number,
    paymentType: PaymentType,
    description: string,
    propertyId: string,
    contractId: string
  ) {
    // Ensure tenant has a Stripe customer ID
    let customer = tenant.stripeCustomerId;
    if (!customer) {
      const stripeCustomer = await stripeClient.customers.create({
        email: tenant.personalInfo.email,
        name: `${tenant.personalInfo.firstName} ${tenant.personalInfo.lastName}`,
      });

      customer = stripeCustomer.id;

      // Save Stripe customer ID to user
      await Tenant.findByIdAndUpdate(tenant._id, {
        stripeCustomerId: customer,
      });
    }

    // Create payment intent
    const paymentIntent = await stripeClient.paymentIntents.create({
      amount: amountInSmallestUnit,
      currency: "kes",
      customer,
      payment_method_options: {
        card: {
          // Set up future usage for recurring payments if this is a rent payment
          ...(paymentType === "rent"
            ? { setup_future_usage: "off_session" }
            : {}),
        },
      },
      description:
        description || `${paymentType} payment for ${property.title}`,
      metadata: {
        propertyId: propertyId.toString(),
        paymentType: paymentType.toString(),
        tenantId: (tenant._id as mongoose.Types.ObjectId).toString(),
        landlordId: (
          property.landlord as mongoose.Types.ObjectId
        )._id.toString(),
        ...(contractId ? { contractId: contractId.toString() } : {}),
      },
    });

    return paymentIntent;
  }

  webhookHandler = async (signature: string, eventData: any) => {
    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripeClient.webhooks.constructEvent(
        eventData,
        signature,
        config.stripe.webhookSecret
      );
    } catch (err: unknown) {
      logger.error("Webhook signature verification failed:", err as Error);
      return;
    }

    // Handle the event based on its type
    switch (event.type) {
      case "payment_intent.succeeded":
        await this.handlePaymentIntentSucceeded(
          event.data.object as Stripe.PaymentIntent
        );
        break;
      case "payment_intent.payment_failed":
        await this.handlePaymentIntentFailed(
          event.data.object as Stripe.PaymentIntent
        );
        break;
      case "payment_intent.canceled":
        await this.handlePaymentIntentCanceled(
          event.data.object as Stripe.PaymentIntent
        );
        break;
      case "charge.dispute.created":
        await this.handleChargeDispute(event.data.object as Stripe.Dispute);
        break;
      case "charge.refunded":
        await this.handleChargeRefunded(event.data.object as Stripe.Charge);
        break;
      // Payment method events
      case "payment_method.attached":
        await this.handlePaymentMethodAttached(
          event.data.object as Stripe.PaymentMethod
        );
        break;
      // Subscription-related events
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
      case "invoice.payment_succeeded":
      case "invoice.payment_failed":
        // await handleSubscriptionEvent(event);
        break;
      default:
        logger.info(`Unhandled event type: ${event.type}`);
    }
  };

  /**
   * Handle successful payment intent
   * @param paymentIntent - Stripe payment intent object
   */
  handlePaymentIntentSucceeded = async (
    paymentIntent: Stripe.PaymentIntent
  ): Promise<void> => {
    try {
      if (!paymentIntent.metadata) {
        logger.error("Payment intent missing metadata");
        return;
      }

      const { propertyId, paymentType, tenantId } = paymentIntent.metadata;

      // Update property status if this was a holding deposit or deposit
      if (paymentType === "holding_deposit" || paymentType === "deposit") {
        await Property.findByIdAndUpdate(propertyId, {
          status: paymentType === "deposit" ? "let" : "active",
          ...(paymentType === "deposit" && { currentTenants: [tenantId] }),
        });
      }

      // TODO: Create payment record in database

      // TODO: Send notification to landlord and tenant

      logger.info(
        `Payment of ${(paymentIntent.amount || 0) / 100} for ${paymentType} succeeded.`
      );
    } catch (error: unknown) {
      logger.error("Handle payment intent succeeded error:", error as Error);
    }
  };

  /**
   * Handle failed payment intent
   * @param paymentIntent - Stripe payment intent object
   */
  handlePaymentIntentFailed = async (
    paymentIntent: Stripe.PaymentIntent
  ): Promise<void> => {
    try {
      if (!paymentIntent.metadata) {
        logger.error("Payment intent missing metadata");
        return;
      }

      const { paymentType } = paymentIntent.metadata;

      // TODO: Send notification to tenant about failed payment
      await Promise.resolve();

      logger.info(
        `Payment of ${(paymentIntent.amount || 0) / 100} for ${paymentType} failed.`
      );
    } catch (error: unknown) {
      logger.error("Error handling payment intent failed:", error as Error);
    }
  };

  /**
   * Handle canceled payment intent
   * @param paymentIntent - Stripe payment intent object
   */
  handlePaymentIntentCanceled = async (
    paymentIntent: Stripe.PaymentIntent
  ): Promise<void> => {
    try {
      if (!paymentIntent.metadata) {
        logger.error("Payment intent missing metadata");
        return;
      }

      const { paymentType } = paymentIntent.metadata;

      // TODO: Update payment status in database
      // TODO: Send notification about canceled payment
      await Promise.resolve();

      logger.info(
        `Payment of ${(paymentIntent.amount || 0) / 100} for ${paymentType} was canceled.`
      );
    } catch (error: unknown) {
      logger.error("Error handling payment intent canceled:", error as Error);
    }
  };

  /**
   * Handle charge dispute
   * @param dispute - Stripe dispute object
   */
  handleChargeDispute = async (dispute: Stripe.Dispute): Promise<void> => {
    try {
      logger.warn(
        `Charge dispute created for ${dispute.amount} cents. Reason: ${dispute.reason}`
      );
      // TODO: Send notification to admin about dispute
      // TODO: Update payment record with dispute information
      await Promise.resolve();
    } catch (error: unknown) {
      logger.error("Error handling charge dispute:", error as Error);
    }
  };

  /**
   * Handle charge refund
   * @param charge - Stripe charge object
   */
  handleChargeRefunded = async (charge: Stripe.Charge): Promise<void> => {
    try {
      logger.info(
        `Charge ${charge.id} was refunded for ${charge.amount_refunded} cents`
      );
      // TODO: Update payment record with refund information
      // TODO: Send notification about refund
      await Promise.resolve();
    } catch (error: unknown) {
      logger.error("Error handling charge refunded:", error as Error);
    }
  };

  /**
   * Handle payment method attached
   * @param paymentMethod - Stripe payment method object
   */
  handlePaymentMethodAttached = async (
    paymentMethod: Stripe.PaymentMethod
  ): Promise<void> => {
    try {
      logger.info(
        `Payment method ${paymentMethod.id} attached to customer ${paymentMethod.customer}`
      );
      // TODO: Save payment method to database if needed
      await Promise.resolve();
    } catch (error: unknown) {
      logger.error("Error handling payment method attached:", error as Error);
    }
  };

  /**
   * Create a setup intent for saving payment methods
   */
  async createSetupIntent(
    customerId: string,
    paymentMethodTypes: string[] = ["card"]
  ) {
    try {
      return await stripeClient.setupIntents.create({
        customer: customerId,
        payment_method_types: paymentMethodTypes,
        usage: "off_session",
      });
    } catch (error) {
      logger.error("Error creating setup intent:", error);
      throw error;
    }
  }

  /**
   * Retrieve payment methods for a customer
   */
  async getCustomerPaymentMethods(customerId: string, type = "card") {
    try {
      return await stripeClient.paymentMethods.list({
        customer: customerId,
        type: type as any,
      });
    } catch (error) {
      logger.error("Error retrieving customer payment methods:", error);
      throw error;
    }
  }

  /**
   * Detach a payment method from a customer
   */
  async detachPaymentMethod(paymentMethodId: string) {
    try {
      return await stripeClient.paymentMethods.detach(paymentMethodId);
    } catch (error) {
      logger.error("Error detaching payment method:", error);
      throw error;
    }
  }

  /**
   * Create a refund for a charge
   */
  async createRefund(chargeId: string, amount?: number, reason?: string) {
    try {
      const refundData: any = { charge: chargeId };
      if (amount) refundData.amount = amount;
      if (reason) refundData.reason = reason;

      return await stripeClient.refunds.create(refundData);
    } catch (error) {
      logger.error("Error creating refund:", error);
      throw error;
    }
  }

  /**
   * Get customer by ID
   */
  async getCustomer(customerId: string) {
    try {
      return await stripeClient.customers.retrieve(customerId);
    } catch (error) {
      logger.error("Error retrieving customer:", error);
      throw error;
    }
  }

  /**
   * Update customer information
   */
  async updateCustomer(
    customerId: string,
    updateData: Stripe.CustomerUpdateParams
  ) {
    try {
      return await stripeClient.customers.update(customerId, updateData);
    } catch (error) {
      logger.error("Error updating customer:", error);
      throw error;
    }
  }

  /**
   * Confirm a payment intent (for server-side confirmation)
   */
  async confirmPaymentIntent(
    paymentIntentId: string,
    paymentMethodId?: string
  ) {
    try {
      const confirmData: any = {};
      if (paymentMethodId) confirmData.payment_method = paymentMethodId;

      return await stripeClient.paymentIntents.confirm(
        paymentIntentId,
        confirmData
      );
    } catch (error) {
      logger.error("Error confirming payment intent:", error);
      throw error;
    }
  }

  /**
   * Cancel a payment intent
   */
  async cancelPaymentIntent(paymentIntentId: string) {
    try {
      return await stripeClient.paymentIntents.cancel(paymentIntentId);
    } catch (error) {
      logger.error("Error canceling payment intent:", error);
      throw error;
    }
  }

  /**
   * Get payment intent by ID
   */
  async getPaymentIntent(paymentIntentId: string) {
    try {
      return await stripeClient.paymentIntents.retrieve(paymentIntentId);
    } catch (error) {
      logger.error("Error retrieving payment intent:", error);
      throw error;
    }
  }
}

export const stripeService = new StripeService();
