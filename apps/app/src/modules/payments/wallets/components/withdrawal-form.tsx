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
import { DollarSign, InfoIcon, Loader2, Smartphone } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useWithdrawFromWallet } from "../wallet.mutations";
import { useWalletBalance } from "../wallet.queries";
import { type WithdrawalFormValues, withdrawalSchema } from "../wallet.schema";
import { formatCurrency } from "../wallet.utils";

type WithdrawalFormProps = {
  /**
   * Callback function called when withdrawal is successfully initiated
   */
  onSuccess?: (data: any) => void;

  /**
   * Callback function called when the cancel button is clicked
   */
  onCancel?: () => void;

  /**
   * Default phone number to pre-fill
   */
  defaultPhoneNumber?: string;
};

/**
 * Form component for withdrawing funds from wallet to M-Pesa.
 *
 * @component
 * @param {WithdrawalFormProps} props - The component props
 * @returns {JSX.Element} The rendered withdrawal form
 */
export function WithdrawalForm({
  onSuccess,
  onCancel,
  defaultPhoneNumber,
}: WithdrawalFormProps) {
  const withdrawalMutation = useWithdrawFromWallet();
  const { data: walletData } = useWalletBalance();

  const form = useForm<WithdrawalFormValues>({
    resolver: zodResolver(withdrawalSchema),
    defaultValues: {
      amount: undefined,
      phoneNumber: defaultPhoneNumber || "",
    },
  });

  const onSubmit = async (values: WithdrawalFormValues) => {
    // Check if user has sufficient balance
    if (walletData && values.amount > walletData.balance) {
      toast.error("Insufficient balance", {
        description: `Your available balance is ${formatCurrency(walletData.balance)}`,
      });
      return;
    }

    try {
      const result = await withdrawalMutation.mutateAsync(values);

      if (result.status === "success" && result.data) {
        toast.success("Withdrawal initiated", {
          description:
            result.data.message || "Your withdrawal is being processed",
        });

        form.reset();
        onSuccess?.(result.data);
      } else {
        toast.error("Withdrawal failed", {
          description: result.message || "Failed to initiate withdrawal",
        });
      }
    } catch (error: any) {
      toast.error("Withdrawal failed", {
        description:
          error?.message ||
          "An error occurred while processing your withdrawal",
      });
    }
  };

  const availableBalance = walletData?.balance;

  return (
    <Form {...form}>
      <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
        <Alert>
          <InfoIcon className="h-4 w-4" />
          <AlertDescription>
            Funds will be sent to your M-Pesa account. Processing typically
            takes a few minutes.
          </AlertDescription>
        </Alert>

        {/* Available Balance Display */}
        <div className="rounded-lg border bg-muted/50 p-4">
          <div className="flex items-center justify-between">
            <span className="font-medium text-muted-foreground text-sm">
              Available Balance
            </span>
            <span className="font-bold text-lg">
              {availableBalance ? formatCurrency(availableBalance) : "KES 0.00"}
            </span>
          </div>
        </div>

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
                    placeholder="Enter amount"
                    type="number"
                    {...field}
                    onChange={(e) => {
                      const value = e.target.value;
                      field.onChange(value === "" ? undefined : Number(value));
                    }}
                    value={field.value ?? ""}
                  />
                </div>
              </FormControl>
              <FormDescription>
                Minimum: KES 10, Maximum: KES 150,000
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phoneNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>M-Pesa Phone Number</FormLabel>
              <FormControl>
                <div className="relative">
                  <Smartphone className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    placeholder="254712345678"
                    type="tel"
                    {...field}
                  />
                </div>
              </FormControl>
              <FormDescription>
                Enter the M-Pesa phone number to receive funds (254XXXXXXXXX)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-3">
          {onCancel && (
            <Button
              className="flex-1"
              disabled={withdrawalMutation.isPending}
              onClick={onCancel}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
          )}
          <Button
            className="flex-1"
            disabled={
              withdrawalMutation.isPending ||
              !availableBalance ||
              availableBalance <= 0
            }
            type="submit"
          >
            {withdrawalMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Withdraw"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
