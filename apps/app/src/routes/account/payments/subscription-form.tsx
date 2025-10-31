"use client";

import { Button } from "@kaa/ui/components/button";
// shadcn form imports
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@kaa/ui/components/form";
import { Input } from "@kaa/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@kaa/ui/components/select";
import { useElements, useStripe } from "@stripe/react-stripe-js";
import { format } from "date-fns";
import type React from "react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { httpClient } from "@/lib/axios";
import type { GetSubscriptionResponse } from "@/modules/subscriptions/subscriptions.type";
import PaymentMethodsList from "./payment-methods-list";

interface SubscriptionFormProps {
  propertyId: string;
  contractId?: string;
  onSuccess?: (subscriptionId: string) => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
  className?: string;
}

interface SubscriptionFormData {
  startDate: string;
  endDate?: string;
  billingCycle: "month" | "week" | "year";
  billingCycleCount: number;
  paymentMethodId: string;
}

const SubscriptionForm: React.FC<SubscriptionFormProps> = ({
  propertyId,
  contractId,
  onSuccess,
  onError,
  onCancel,
  className = "",
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<SubscriptionFormData>({
    defaultValues: {
      startDate: format(new Date(), "yyyy-MM-dd"),
      billingCycle: "month",
      billingCycleCount: 1,
    },
  });

  const { setValue, handleSubmit } = form;

  const handlePaymentMethodSelect = (paymentMethod: any) => {
    setValue("paymentMethodId", paymentMethod.id);
  };

  const onSubmit = async (data: SubscriptionFormData) => {
    if (!stripe) {
      toast.error("Stripe has not loaded yet. Please try again.");
      return;
    }

    if (!data.paymentMethodId) {
      setError("Please select a payment method");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Create subscription on the server
      const response = await httpClient.api.post<GetSubscriptionResponse>(
        "/subscriptions",
        {
          propertyId,
          paymentMethodId: data.paymentMethodId,
          startDate: data.startDate,
          endDate: data.endDate,
          billingCycle: data.billingCycle,
          billingCycleCount: data.billingCycleCount,
          ...(contractId && { contractId }),
        }
      );

      // TODO: fix type
      const { subscription } = response.data as any;

      // If there's a client secret, we need to confirm the initial payment
      if (subscription.clientSecret) {
        const result = await stripe.confirmCardPayment(
          subscription.clientSecret
        );

        if (result.error) {
          throw new Error(result.error.message);
        }
      }

      toast.success("Recurring payment set up successfully!");

      if (onSuccess) {
        onSuccess(subscription._id);
      }
    } catch (error: any) {
      console.error("Subscription error:", error);
      const errorMessage =
        error.message || "An error occurred setting up the recurring payment";
      setError(errorMessage);
      toast.error(errorMessage);

      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`w-full ${className}`}>
      <Form {...form}>
        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <Input id="startDate" type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
                rules={{ required: "Start date is required" }}
              />
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        id="endDate"
                        type="date"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="billingCycle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Billing Cycle</FormLabel>
                    <Select
                      defaultValue={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger id="billingCycle">
                          <SelectValue placeholder="Select billing cycle" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="month">Monthly</SelectItem>
                        <SelectItem value="week">Weekly</SelectItem>
                        <SelectItem value="year">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
                rules={{ required: "Billing cycle is required" }}
              />
              <FormField
                control={form.control}
                name="billingCycleCount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Billing Cycle Count</FormLabel>
                    <FormControl>
                      <Input
                        id="billingCycleCount"
                        min="1"
                        type="number"
                        {...field}
                        onChange={(e) =>
                          field.onChange(Number.parseInt(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
                rules={{
                  required: "Billing cycle count is required",
                  min: { value: 1, message: "Must be at least 1" },
                }}
              />
            </div>
          </div>
          <div className="space-y-2">
            <FormLabel>Payment Method</FormLabel>
            <PaymentMethodsList
              onSelect={handlePaymentMethodSelect}
              selectable
            />
          </div>
          {error && <div className="text-red-500 text-sm">{error}</div>}
          <div className="flex space-x-4">
            <Button
              className="flex-1"
              disabled={!stripe || isLoading}
              type="submit"
            >
              Set Up Recurring Payment
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

export default SubscriptionForm;
