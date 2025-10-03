import type { AxiosResponse } from "axios";
import { httpClient } from "@/lib/axios";
import type {
  AddPaymentMethodRequest,
  AddPaymentMethodResponse,
  CreateSubscriptionRequest,
  CreateSubscriptionResponse,
  GetInvoicesResponse,
  GetPaymentMethodsResponse,
  GetPlansResponse,
  GetSubscriptionResponse,
  GetUsageResponse,
  PlanInterval,
  PlanType,
  SubscriptionPlan,
  UpdateSubscriptionRequest,
  UpdateSubscriptionResponse,
} from "./subscriptions.type";

export const subscriptionsService = {
  /**
   * Get all available subscription plans
   */
  getPlans: async (): Promise<GetPlansResponse> => {
    const response: AxiosResponse<GetPlansResponse> = await httpClient.api.get(
      "/subscriptions/plans"
    );
    return response.data;
  },

  /**
   * Get current user's subscription
   */
  getSubscription: async (): Promise<GetSubscriptionResponse> => {
    const response: AxiosResponse<GetSubscriptionResponse> =
      await httpClient.api.get("/billing/subscription");
    return response.data;
  },

  /**
   * Create a new subscription
   */
  createSubscription: async (
    data: CreateSubscriptionRequest
  ): Promise<CreateSubscriptionResponse> => {
    const response: AxiosResponse<CreateSubscriptionResponse> =
      await httpClient.api.post("/billing/subscription", data);
    return response.data;
  },

  /**
   * Update existing subscription
   */
  updateSubscription: async (
    data: UpdateSubscriptionRequest
  ): Promise<UpdateSubscriptionResponse> => {
    const response: AxiosResponse<UpdateSubscriptionResponse> =
      await httpClient.api.patch("/billing/subscription", data);
    return response.data;
  },

  /**
   * Cancel subscription
   */
  cancelSubscription: async (): Promise<{
    status: "success" | "error";
    message?: string;
  }> => {
    const response: AxiosResponse<{
      status: "success" | "error";
      message?: string;
    }> = await httpClient.api.delete("/billing/subscription");
    return response.data;
  },

  /**
   * Get subscription invoices
   */
  getInvoices: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<GetInvoicesResponse> => {
    const response: AxiosResponse<GetInvoicesResponse> =
      await httpClient.api.get("/billing/invoices", {
        params,
      });
    return response.data;
  },

  /**
   * Download invoice PDF
   */
  downloadInvoice: async (invoiceId: string): Promise<Blob> => {
    const response: AxiosResponse<Blob> = await httpClient.api.get(
      `/billing/invoices/${invoiceId}/pdf`,
      {
        responseType: "blob",
      }
    );
    return response.data;
  },

  /**
   * Get payment methods
   */
  getPaymentMethods: async (): Promise<GetPaymentMethodsResponse> => {
    const response: AxiosResponse<GetPaymentMethodsResponse> =
      await httpClient.api.get("/billing/payment-methods");
    return response.data;
  },

  /**
   * Add payment method
   */
  addPaymentMethod: async (
    data: AddPaymentMethodRequest
  ): Promise<AddPaymentMethodResponse> => {
    const response: AxiosResponse<AddPaymentMethodResponse> =
      await httpClient.api.post("/billing/payment-methods", data);
    return response.data;
  },

  /**
   * Remove payment method
   */
  removePaymentMethod: async (
    paymentMethodId: string
  ): Promise<{ status: "success" | "error"; message?: string }> => {
    const response: AxiosResponse<{
      status: "success" | "error";
      message?: string;
    }> = await httpClient.api.delete(
      `/billing/payment-methods/${paymentMethodId}`
    );
    return response.data;
  },

  /**
   * Set default payment method
   */
  setDefaultPaymentMethod: async (
    paymentMethodId: string
  ): Promise<{ status: "success" | "error"; message?: string }> => {
    const response: AxiosResponse<{
      status: "success" | "error";
      message?: string;
    }> = await httpClient.api.post(
      `/billing/payment-methods/${paymentMethodId}/set-default`
    );
    return response.data;
  },

  /**
   * Get usage statistics
   */
  getUsage: async (params?: {
    startDate?: string;
    endDate?: string;
    type?: string;
  }): Promise<GetUsageResponse> => {
    const response: AxiosResponse<GetUsageResponse> = await httpClient.api.get(
      "/billing/usage",
      {
        params,
      }
    );
    return response.data;
  },

  /**
   * Get plan pricing for interval
   */
  getPlanPrice: (plan: SubscriptionPlan, interval: PlanInterval): number =>
    interval === "monthly" ? plan.price.monthly : plan.price.yearly,

  /**
   * Calculate annual savings
   */
  getAnnualSavings: (plan: SubscriptionPlan): number => {
    const monthlyTotal = plan.price.monthly * 12;
    const yearlyPrice = plan.price.yearly;
    return monthlyTotal - yearlyPrice;
  },

  /**
   * Calculate savings percentage
   */
  getSavingsPercentage: (plan: SubscriptionPlan): number => {
    const monthlyTotal = plan.price.monthly * 12;
    const yearlyPrice = plan.price.yearly;
    const savings = monthlyTotal - yearlyPrice;
    return Math.round((savings / monthlyTotal) * 100);
  },

  /**
   * Format price for display
   */
  formatPrice: (amount: number, currency = "USD"): string =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
      minimumFractionDigits: amount % 100 === 0 ? 0 : 2,
    }).format(amount / 100),

  /**
   * Check if plan has feature
   */
  hasFeature: (plan: SubscriptionPlan, feature: string): boolean =>
    plan.features.includes(feature),

  /**
   * Get plan by type
   */
  getPlanByType: (
    plans: SubscriptionPlan[],
    type: PlanType
  ): SubscriptionPlan | undefined => plans.find((plan) => plan.type === type),
};
