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
import { Textarea } from "@kaa/ui/components/textarea";
import {
  ArrowLeftRight,
  DollarSign,
  InfoIcon,
  Loader2,
  Smartphone,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useTransferFunds } from "../wallet.mutations";
import { useWalletBalance } from "../wallet.queries";
import { type TransferFormValues, transferSchema } from "../wallet.schema";
import { formatCurrency } from "../wallet.utils";

type TransferFormProps = {
  /**
   * Callback function called when transfer is successfully initiated
   */
  onSuccess?: (data: any) => void;

  /**
   * Callback function called when the cancel button is clicked
   */
  onCancel?: () => void;

  /**
   * Default recipient phone number to pre-fill
   */
  defaultRecipientPhone?: string;
};

/**
 * Form component for transferring funds to another wallet.
 *
 * @component
 * @param {TransferFormProps} props - The component props
 * @returns {JSX.Element} The rendered transfer form
 */
export function TransferForm({
  onSuccess,
  onCancel,
  defaultRecipientPhone,
}: TransferFormProps) {
  const transferMutation = useTransferFunds();
  const { data: walletData } = useWalletBalance();

  const form = useForm<TransferFormValues>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      recipientPhone: defaultRecipientPhone || "",
      amount: undefined,
      note: "",
    },
  });

  const onSubmit = async (values: TransferFormValues) => {
    // Check if user has sufficient balance
    if (walletData && values.amount > walletData.balance) {
      toast.error("Insufficient balance", {
        description: `Your available balance is ${formatCurrency(walletData.balance)}`,
      });
      return;
    }

    try {
      const result = await transferMutation.mutateAsync(values);

      if (result.status === "success" && result.data) {
        toast.success("Transfer successful", {
          description: result.data.message || "Funds transferred successfully",
        });

        form.reset();
        onSuccess?.(result.data);
      } else {
        toast.error("Transfer failed", {
          description: result.message || "Failed to transfer funds",
        });
      }
    } catch (error: any) {
      toast.error("Transfer failed", {
        description:
          error?.message || "An error occurred while processing your transfer",
      });
    }
  };

  const availableBalance = walletData?.balance || 0;

  return (
    <Form {...form}>
      <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
        <Alert>
          <InfoIcon className="h-4 w-4" />
          <AlertDescription>
            Transfer funds instantly to another wallet user. The recipient will
            receive the funds immediately.
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
          name="recipientPhone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Recipient Phone Number</FormLabel>
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
                Enter the recipient's registered phone number (254XXXXXXXXX)
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
                Minimum: KES 1, Maximum: KES 150,000
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="note"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Note (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  className="resize-none"
                  placeholder="Add a note for the recipient..."
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormDescription>Maximum 200 characters</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-3">
          {onCancel && (
            <Button
              className="flex-1"
              disabled={transferMutation.isPending}
              onClick={onCancel}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
          )}
          <Button
            className="flex-1"
            disabled={transferMutation.isPending || availableBalance <= 0}
            type="submit"
          >
            {transferMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <ArrowLeftRight className="mr-2 h-4 w-4" />
                Transfer
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
