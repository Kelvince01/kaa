"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, AlertDescription } from "@kaa/ui/components/alert";
import { Button } from "@kaa/ui/components/button";
import {
  Form,
  FormControl,
  FormDescription,
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
import { DollarSign, Home, InfoIcon, Loader2, Receipt } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useProperties } from "@/modules/properties/property.queries";
import { usePayRentFromWallet } from "../wallet.mutations";
import { useWalletBalance } from "../wallet.queries";
import { type PayRentFormValues, payRentSchema } from "../wallet.schema";
import { formatCurrency } from "../wallet.utils";

type PayRentFormProps = {
  /**
   * Callback function called when rent payment is successful
   */
  onSuccess?: (data: any) => void;

  /**
   * Callback function called when the cancel button is clicked
   */
  onCancel?: () => void;

  /**
   * Pre-selected property ID
   */
  defaultPropertyId?: string;

  /**
   * Pre-selected application ID
   */
  defaultApplicationId?: string;

  /**
   * Pre-filled amount
   */
  defaultAmount?: number;
};

/**
 * Form component for paying rent from wallet.
 *
 * @component
 * @param {PayRentFormProps} props - The component props
 * @returns {JSX.Element} The rendered pay rent form
 */
export function PayRentForm({
  onSuccess,
  onCancel,
  defaultPropertyId,
  defaultApplicationId,
  defaultAmount,
}: PayRentFormProps) {
  const payRentMutation = usePayRentFromWallet();
  const { data: walletData } = useWalletBalance();
  const { data: propertiesData } = useProperties();

  const form = useForm<PayRentFormValues>({
    resolver: zodResolver(payRentSchema),
    defaultValues: {
      propertyId: defaultPropertyId || "",
      applicationId: defaultApplicationId || "",
      amount: defaultAmount || undefined,
    },
  });

  const onSubmit = async (values: PayRentFormValues) => {
    // Check if user has sufficient balance
    if (walletData && values.amount > walletData.balance) {
      toast.error("Insufficient balance", {
        description: `Your available balance is ${formatCurrency(walletData.balance)}`,
      });
      return;
    }

    try {
      const result = await payRentMutation.mutateAsync(values);

      if (result.status === "success" && result.data) {
        toast.success("Rent payment successful", {
          description:
            result.data.message || "Your rent has been paid successfully",
        });

        form.reset();
        onSuccess?.(result.data);
      } else {
        toast.error("Payment failed", {
          description: result.message || "Failed to process rent payment",
        });
      }
    } catch (error: any) {
      toast.error("Payment failed", {
        description:
          error?.message || "An error occurred while processing your payment",
      });
    }
  };

  const availableBalance = walletData?.balance || 0;
  const properties = propertiesData?.properties || [];

  return (
    <Form {...form}>
      <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
        <Alert>
          <InfoIcon className="h-4 w-4" />
          <AlertDescription>
            Pay your rent securely using your wallet balance. The payment will
            be processed instantly.
          </AlertDescription>
        </Alert>

        {/* Available Balance Display */}
        <div className="rounded-lg border bg-muted/50 p-4">
          <div className="flex items-center justify-between">
            <span className="font-medium text-muted-foreground text-sm">
              Available Balance
            </span>
            <span className="font-bold text-lg">
              {formatCurrency(availableBalance)}
            </span>
          </div>
        </div>

        <FormField
          control={form.control}
          name="propertyId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Property</FormLabel>
              <Select
                defaultValue={field.value}
                disabled={!!defaultPropertyId}
                onValueChange={field.onChange}
              >
                <FormControl>
                  <SelectTrigger>
                    <div className="flex items-center gap-2">
                      <Home className="h-4 w-4 text-muted-foreground" />
                      <SelectValue placeholder="Select property" />
                    </div>
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {properties.length === 0 ? (
                    <div className="px-2 py-6 text-center text-muted-foreground text-sm">
                      No properties found
                    </div>
                  ) : (
                    properties.map((property: any) => (
                      <SelectItem key={property._id} value={property._id}>
                        {property.name || property.title}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <FormDescription>
                Select the property for which you're paying rent
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="applicationId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Application ID</FormLabel>
              <FormControl>
                <div className="relative">
                  <Receipt className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    placeholder="Enter application ID"
                    {...field}
                    disabled={!!defaultApplicationId}
                  />
                </div>
              </FormControl>
              <FormDescription>
                Your rental application reference number
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount (KES)</FormLabel>
              <FormControl>
                <div className="relative">
                  <DollarSign className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    placeholder="Enter rent amount"
                    type="number"
                    {...field}
                    disabled={!!defaultAmount}
                    onChange={(e) => {
                      const value = e.target.value;
                      field.onChange(value === "" ? undefined : Number(value));
                    }}
                    value={field.value ?? ""}
                  />
                </div>
              </FormControl>
              <FormDescription>Enter the rent amount to pay</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Payment Summary */}
        {form.watch("amount") && (
          <div className="space-y-2 rounded-lg border p-4">
            <h4 className="font-medium text-sm">Payment Summary</h4>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Rent Amount</span>
                <span className="font-medium">
                  {formatCurrency(form.watch("amount") || 0)}
                </span>
              </div>
              <div className="flex justify-between border-t pt-1.5">
                <span className="text-muted-foreground">Remaining Balance</span>
                <span className="font-medium">
                  {formatCurrency(
                    Math.max(0, availableBalance - (form.watch("amount") || 0))
                  )}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          {onCancel && (
            <Button
              className="flex-1"
              disabled={payRentMutation.isPending}
              onClick={onCancel}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
          )}
          <Button
            className="flex-1"
            disabled={payRentMutation.isPending || availableBalance <= 0}
            type="submit"
          >
            {payRentMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Receipt className="mr-2 h-4 w-4" />
                Pay Rent
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
