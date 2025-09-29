import { Invoice, Subscription } from "@kaa/models";
import { InternalServerError, logger } from "@kaa/utils";

export const billingService = {
  /**
   * Get invoices for tenant
   */
  getInvoices: async (memberId: string, query: any = {}) => {
    const { page = 1, limit = 10 } = query;

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute query
    const invoices = await Invoice.find({ memberId })
      .skip(skip)
      .limit(limit)
      .sort({ invoiceDate: -1 });

    const total = await Invoice.countDocuments({ memberId });

    return {
      invoices,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Handle Stripe webhook
   */
  handleStripeWebhook: async (event: any) => {
    try {
      switch (event.type) {
        case "invoice.paid":
          await handleInvoicePaid(event.data.object);
          break;
        default:
          logger.info(`Unhandled event type: ${event.type}`);
      }

      return { success: true };
    } catch (error) {
      logger.error("Error handling Stripe webhook", error);
      throw new InternalServerError("Failed to process webhook");
    }
  },
};

/**
 * Handle invoice paid event
 */
async function handleInvoicePaid(invoice: any) {
  try {
    // Find subscription by Stripe subscription ID
    const subscription = await Subscription.findOne({
      stripeSubscriptionId: invoice.subscription,
    });

    if (!subscription) {
      logger.error("Subscription not found for invoice", {
        invoiceId: invoice.id,
      });
      return;
    }

    // Create invoice in database
    await Invoice.create({
      memberId: subscription.memberId,
      subscriptionId: subscription._id,
      amount: invoice.amount_due,
      currency: invoice.currency,
      status: invoice.status,
      invoiceDate: new Date(invoice.created * 1000),
      dueDate: new Date(invoice.due_date * 1000),
      paidAt:
        invoice.status === "paid" ? new Date(invoice.paid_at * 1000) : null,
      stripeInvoiceId: invoice.id,
    });

    logger.info(`Invoice recorded: ${invoice.id}`);
  } catch (error) {
    logger.error("Error handling invoice paid event", error);
  }
}
