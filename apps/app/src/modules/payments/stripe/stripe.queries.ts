import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	createStripePaymentIntent,
	createStripeSetupIntent,
	getStripePaymentMethods,
	deleteStripePaymentMethod,
	confirmStripePaymentIntent,
	cancelStripePaymentIntent,
	getStripePaymentIntent,
	createStripeRefund,
	type StripePaymentIntentRequest,
	type StripeSetupIntentRequest,
	type StripeConfirmPaymentRequest,
	type StripeRefundRequest,
} from "./stripe.service";

// Payment Intent creation
export const useCreateStripePaymentIntent = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (data: StripePaymentIntentRequest) => createStripePaymentIntent(data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["payments"] });
			queryClient.invalidateQueries({ queryKey: ["payment-history"] });
		},
	});
};

// Setup Intent creation
export const useCreateStripeSetupIntent = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (data: StripeSetupIntentRequest) => createStripeSetupIntent(data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["stripe-payment-methods"] });
		},
	});
};

// Payment Methods management
export const useStripePaymentMethods = (type = "card") => {
	return useQuery({
		queryKey: ["stripe-payment-methods", type],
		queryFn: () => getStripePaymentMethods(type),
		staleTime: 5 * 60 * 1000, // 5 minutes
	});
};

export const useDeleteStripePaymentMethod = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (paymentMethodId: string) => deleteStripePaymentMethod(paymentMethodId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["stripe-payment-methods"] });
		},
	});
};

// Payment Intent operations
export const useConfirmStripePaymentIntent = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			paymentIntentId,
			data,
		}: {
			paymentIntentId: string;
			data: StripeConfirmPaymentRequest;
		}) => confirmStripePaymentIntent(paymentIntentId, data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["payments"] });
			queryClient.invalidateQueries({ queryKey: ["stripe-payment-intent"] });
		},
	});
};

export const useCancelStripePaymentIntent = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (paymentIntentId: string) => cancelStripePaymentIntent(paymentIntentId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["payments"] });
			queryClient.invalidateQueries({ queryKey: ["stripe-payment-intent"] });
		},
	});
};

export const useStripePaymentIntent = (paymentIntentId: string) => {
	return useQuery({
		queryKey: ["stripe-payment-intent", paymentIntentId],
		queryFn: () => getStripePaymentIntent(paymentIntentId),
		enabled: !!paymentIntentId,
		staleTime: 30 * 1000, // 30 seconds
		refetchInterval: (data) => {
			// Stop polling if payment is completed or failed
			// @ts-expect-error - data is not typed
			const status = data?.data?.status;
			if (status === "succeeded" || status === "canceled" || status === "requires_payment_method") {
				return false;
			}
			return 5000; // Poll every 5 seconds for pending payments
		},
	});
};

// Refunds
export const useCreateStripeRefund = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ paymentId, data }: { paymentId: string; data: StripeRefundRequest }) =>
			createStripeRefund(paymentId, data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["payments"] });
			queryClient.invalidateQueries({ queryKey: ["payment-history"] });
		},
	});
};
