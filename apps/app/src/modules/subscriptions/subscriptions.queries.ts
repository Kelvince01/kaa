import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { subscriptionsService } from "./subscriptions.service";

// Query Keys
export const subscriptionKeys = {
  all: ["subscriptions"] as const,
  plans: () => [...subscriptionKeys.all, "plans"] as const,
  subscription: () => [...subscriptionKeys.all, "subscription"] as const,
  invoices: () => [...subscriptionKeys.all, "invoices"] as const,
  paymentMethods: () => [...subscriptionKeys.all, "paymentMethods"] as const,
  usage: () => [...subscriptionKeys.all, "usage"] as const,
};

/**
 * Hook to get subscription plans
 */
export const useSubscriptionPlans = () => {
  return useQuery({
    queryKey: subscriptionKeys.plans(),
    queryFn: subscriptionsService.getPlans,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

/**
 * Hook to get current subscription
 */
export const useSubscription = () => {
  return useQuery({
    queryKey: subscriptionKeys.subscription(),
    queryFn: subscriptionsService.getSubscription,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to create subscription
 */
export const useCreateSubscription = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: subscriptionsService.createSubscription,
    onSuccess: (data) => {
      if (data.status === "success") {
        toast.success("Subscription created successfully!");
        queryClient.invalidateQueries({
          queryKey: subscriptionKeys.subscription(),
        });
        queryClient.invalidateQueries({
          queryKey: subscriptionKeys.invoices(),
        });
      } else {
        toast.error(data.message || "Failed to create subscription");
      }
    },
    onError: (error: any) => {
      console.error("Create subscription error:", error);
      toast.error(
        error?.response?.data?.message || "Failed to create subscription"
      );
    },
  });
};

/**
 * Hook to update subscription
 */
export const useUpdateSubscription = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: subscriptionsService.updateSubscription,
    onSuccess: (data) => {
      if (data.status === "success") {
        toast.success("Subscription updated successfully!");
        queryClient.invalidateQueries({
          queryKey: subscriptionKeys.subscription(),
        });
        queryClient.invalidateQueries({
          queryKey: subscriptionKeys.invoices(),
        });
      } else {
        toast.error(data.message || "Failed to update subscription");
      }
    },
    onError: (error: any) => {
      console.error("Update subscription error:", error);
      toast.error(
        error?.response?.data?.message || "Failed to update subscription"
      );
    },
  });
};

/**
 * Hook to cancel subscription
 */
export const useCancelSubscription = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: subscriptionsService.cancelSubscription,
    onSuccess: (data) => {
      if (data.status === "success") {
        toast.success("Subscription canceled successfully");
        queryClient.invalidateQueries({
          queryKey: subscriptionKeys.subscription(),
        });
      } else {
        toast.error(data.message || "Failed to cancel subscription");
      }
    },
    onError: (error: any) => {
      console.error("Cancel subscription error:", error);
      toast.error(
        error?.response?.data?.message || "Failed to cancel subscription"
      );
    },
  });
};

/**
 * Hook to get invoices
 */
export const useInvoices = (params?: {
  page?: number;
  limit?: number;
  status?: string;
}) => {
  return useQuery({
    queryKey: [...subscriptionKeys.invoices(), params],
    queryFn: () => subscriptionsService.getInvoices(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to download invoice
 */
export const useDownloadInvoice = () => {
  return useMutation({
    mutationFn: subscriptionsService.downloadInvoice,
    onSuccess: (blob, invoiceId) => {
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${invoiceId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Invoice downloaded successfully");
    },
    onError: (error: any) => {
      console.error("Download invoice error:", error);
      toast.error("Failed to download invoice");
    },
  });
};

/**
 * Hook to get payment methods
 */
export const usePaymentMethods = () => {
  return useQuery({
    queryKey: subscriptionKeys.paymentMethods(),
    queryFn: subscriptionsService.getPaymentMethods,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to add payment method
 */
export const useAddPaymentMethod = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: subscriptionsService.addPaymentMethod,
    onSuccess: (data) => {
      if (data.status === "success") {
        toast.success("Payment method added successfully!");
        queryClient.invalidateQueries({
          queryKey: subscriptionKeys.paymentMethods(),
        });
      } else {
        toast.error(data.message || "Failed to add payment method");
      }
    },
    onError: (error: any) => {
      console.error("Add payment method error:", error);
      toast.error(
        error?.response?.data?.message || "Failed to add payment method"
      );
    },
  });
};

/**
 * Hook to remove payment method
 */
export const useRemovePaymentMethod = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: subscriptionsService.removePaymentMethod,
    onSuccess: (data) => {
      if (data.status === "success") {
        toast.success("Payment method removed successfully!");
        queryClient.invalidateQueries({
          queryKey: subscriptionKeys.paymentMethods(),
        });
      } else {
        toast.error(data.message || "Failed to remove payment method");
      }
    },
    onError: (error: any) => {
      console.error("Remove payment method error:", error);
      toast.error(
        error?.response?.data?.message || "Failed to remove payment method"
      );
    },
  });
};

/**
 * Hook to set default payment method
 */
export const useSetDefaultPaymentMethod = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: subscriptionsService.setDefaultPaymentMethod,
    onSuccess: (data) => {
      if (data.status === "success") {
        toast.success("Default payment method updated!");
        queryClient.invalidateQueries({
          queryKey: subscriptionKeys.paymentMethods(),
        });
      } else {
        toast.error(data.message || "Failed to update default payment method");
      }
    },
    onError: (error: any) => {
      console.error("Set default payment method error:", error);
      toast.error(
        error?.response?.data?.message ||
          "Failed to update default payment method"
      );
    },
  });
};

/**
 * Hook to get usage statistics
 */
export const useUsage = (params?: {
  startDate?: string;
  endDate?: string;
  type?: string;
}) => {
  return useQuery({
    queryKey: [...subscriptionKeys.usage(), params],
    queryFn: () => subscriptionsService.getUsage(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

/**
 * Hook to get subscription status with enhanced data
 */
export const useSubscriptionStatus = () => {
  const { data: subscriptionData, isLoading: isSubscriptionLoading } =
    useSubscription();
  const { data: plansData } = useSubscriptionPlans();

  const subscription = subscriptionData?.subscription;
  const plans = plansData?.plans || [];
  const currentPlan = plans.find((plan) => plan.type === subscription?.plan);

  const isActive = subscription?.status === "active";
  const isTrialing = subscription?.status === "trialing";
  const isCanceled = subscription?.status === "canceled";
  const isPastDue = subscription?.status === "past_due";

  const trialEndsAt = subscription?.trialEndsAt
    ? new Date(subscription.trialEndsAt)
    : null;
  const isTrialExpiring =
    trialEndsAt && trialEndsAt.getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000; // 7 days

  return {
    subscription,
    currentPlan,
    plans,
    isActive,
    isTrialing,
    isCanceled,
    isPastDue,
    isTrialExpiring,
    isLoading: isSubscriptionLoading,
  };
};
