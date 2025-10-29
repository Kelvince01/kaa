"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@kaa/ui/components/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@kaa/ui/components/form";
import { Input } from "@kaa/ui/components/input";
import { CardElement, useElements, useStripe } from "@stripe/react-stripe-js";
import type React from "react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { httpClient } from "@/lib/axios";
import type {
  PaymentMethod,
  PaymentResponse,
} from "@/modules/payments/payment.type";
import PaymentMethodsList from "../payment-methods-list";

const paymentFormSchema = z.object({
  amount: z.number().min(0.01, "Amount must be at least £0.01").optional(),
  description: z.string().optional(),
  useExistingMethod: z.boolean(),
  paymentMethodId: z.string().optional(),
});

type PaymentFormData = z.infer<typeof paymentFormSchema>;

type PaymentFormProps = {
  propertyId: string;
  paymentType: "rent" | "deposit" | "holding_deposit" | "fee" | "other";
  amount?: number;
  description?: string;
  contractId?: string;
  onSuccess?: (paymentId: string) => void;
  onCancel?: () => void;
  showSavedMethods?: boolean;
  className?: string;
};

const PaymentForm: React.FC<PaymentFormProps> = ({
  propertyId,
  paymentType,
  amount,
  description,
  contractId,
  onSuccess,
  onCancel,
  showSavedMethods = true,
  className = "",
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<PaymentMethod | null>(null);

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      amount,
      description,
      useExistingMethod: true,
    },
  });

  const useExistingMethod = form.watch("useExistingMethod");

  const onSubmit = async (data: PaymentFormData) => {
    if (!stripe) {
      toast.error("Stripe has not loaded yet. Please try again.");
      return;
    }

    setIsLoading(true);
    setCardError(null);

    try {
      // Create payment intent on the server
      const paymentIntentResponse = await httpClient.api.post<PaymentResponse>(
        "/payments/create-payment-intent",
        {
          propertyId,
          paymentType,
          amount: data.amount,
          description: data.description,
          ...(contractId && { contractId }),
        }
      );

      const {
        data: { clientSecret, paymentIntentId: paymentId },
      } = paymentIntentResponse.data;

      let paymentResult: any;

      if (useExistingMethod && selectedPaymentMethod) {
        // Use saved payment method
        paymentResult = await stripe.confirmCardPayment(
          clientSecret as string,
          {
            payment_method: selectedPaymentMethod.id,
          }
        );
      } else {
        // Use new card
        const cardElement = elements?.getElement(CardElement);
        if (!cardElement) {
          throw new Error("Card element not found");
        }

        paymentResult = await stripe.confirmCardPayment(
          clientSecret as string,
          {
            payment_method: {
              card: cardElement,
              billing_details: {
                name: data.description || `Payment for ${paymentType}`,
              },
            },
          }
        );
      }

      if (paymentResult.error) {
        throw new Error(paymentResult.error.message);
      }

      toast.success("Payment processed successfully!");

      if (onSuccess) {
        onSuccess(paymentId as string);
      }
    } catch (error: any) {
      console.error("Payment error:", error);
      setCardError(
        error.message || "An error occurred processing your payment"
      );
      toast.error(error.message || "Payment failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentMethodSelect = (paymentMethod: PaymentMethod) => {
    setSelectedPaymentMethod(paymentMethod);
    form.setValue("paymentMethodId", paymentMethod.id);
  };

  const togglePaymentMethod = (useExisting: boolean) => {
    form.setValue("useExistingMethod", useExisting);
  };

  return (
    <div className={`w-full ${className}`}>
      <Form {...form}>
        <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
          {paymentType === "other" && (
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount (£)</FormLabel>
                  <FormControl>
                    <Input
                      min="0.01"
                      placeholder="0.00"
                      step="0.01"
                      type="number"
                      {...field}
                      onChange={(e) => {
                        const value = e.target.value;
                        field.onChange(
                          value ? Number.parseFloat(value) : undefined
                        );
                      }}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description (optional)</FormLabel>
                <FormControl>
                  <Input
                    placeholder={`${paymentType.charAt(0).toUpperCase() + paymentType.slice(1)} payment`}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {showSavedMethods && (
            <div className="space-y-4">
              <div className="flex space-x-4">
                <button
                  className={`rounded-md px-4 py-2 font-medium text-sm ${
                    useExistingMethod
                      ? "border border-primary-300 bg-primary-100 text-primary-700"
                      : "border border-gray-300 bg-gray-100 text-gray-700"
                  }`}
                  onClick={() => togglePaymentMethod(true)}
                  type="button"
                >
                  Use Saved Card
                </button>
                <button
                  className={`rounded-md px-4 py-2 font-medium text-sm ${
                    useExistingMethod
                      ? "border border-gray-300 bg-gray-100 text-gray-700"
                      : "border border-primary-300 bg-primary-100 text-primary-700"
                  }`}
                  onClick={() => togglePaymentMethod(false)}
                  type="button"
                >
                  Use New Card
                </button>
              </div>

              {useExistingMethod ? (
                <PaymentMethodsList
                  onSelect={handlePaymentMethodSelect}
                  selectable
                  showAddNew={false}
                />
              ) : (
                <div className="rounded-md border bg-white p-4">
                  <CardElement
                    options={{
                      style: {
                        base: {
                          fontSize: "16px",
                          color: "#424770",
                          "::placeholder": {
                            color: "#aab7c4",
                          },
                        },
                        invalid: {
                          color: "#9e2146",
                        },
                      },
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {!showSavedMethods && (
            <div className="rounded-md border bg-white p-4">
              <CardElement
                options={{
                  style: {
                    base: {
                      fontSize: "16px",
                      color: "#424770",
                      "::placeholder": {
                        color: "#aab7c4",
                      },
                    },
                    invalid: {
                      color: "#9e2146",
                    },
                  },
                }}
              />
            </div>
          )}

          {cardError && <div className="text-red-500 text-sm">{cardError}</div>}

          <div className="flex space-x-4">
            <Button
              className="flex-1"
              disabled={!stripe || isLoading}
              type="submit"
            >
              Pay {amount ? `£${amount.toFixed(2)}` : ""}
            </Button>
            {onCancel && (
              <Button
                className="flex-1"
                disabled={isLoading}
                onClick={onCancel}
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
};

export default PaymentForm;
