"use client";

import { Button } from "@kaa/ui/components/button";
import { CardElement, useElements, useStripe } from "@stripe/react-stripe-js";
import type React from "react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { httpClient } from "@/lib/axios";
import { useAuthStore } from "@/modules/auth/auth.store";

type PaymentMethodFormProps = {
  onSuccess?: (paymentMethod: any) => void;
  buttonText?: string;
  className?: string;
};

const PaymentMethodForm: React.FC<PaymentMethodFormProps> = ({
  onSuccess,
  buttonText = "Add Payment Method",
  className = "",
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);

  const { handleSubmit } = useForm();

  const onSubmit = async () => {
    if (!(stripe && elements)) {
      // Stripe.js has not loaded yet
      return;
    }

    setIsLoading(true);
    setCardError(null);

    try {
      const cardElement = elements.getElement(CardElement);

      if (!cardElement) {
        throw new Error("Card element not found");
      }

      // Create payment method
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: "card",
        card: cardElement,
        billing_details: {
          name:
            user?.firstName && user?.lastName
              ? `${user.firstName} ${user.lastName}`
              : undefined,
          email: user?.email,
        },
      });

      if (error) {
        setCardError(error.message || "An error occurred with your card");
        return;
      }

      if (!paymentMethod) {
        throw new Error("Failed to create payment method");
      }

      // Save payment method to the backend
      await httpClient.api.post("/users/payment-methods", {
        paymentMethodId: paymentMethod.id,
        isDefault: true,
      });

      // Clear the card element
      cardElement.clear();

      toast.success("Payment method added successfully");

      if (onSuccess) {
        onSuccess(paymentMethod);
      }
    } catch (error: any) {
      console.error("Payment method error:", error);
      toast.error(error.message || "Failed to add payment method");
      setCardError(error.message || "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`w-full ${className}`}>
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
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

        {cardError && (
          <div className="mt-1 text-red-500 text-sm">{cardError}</div>
        )}

        <Button
          className="w-full"
          disabled={!stripe || isLoading}
          // loading={isLoading}
          type="submit"
        >
          {buttonText}
        </Button>
      </form>
    </div>
  );
};

export default PaymentMethodForm;
