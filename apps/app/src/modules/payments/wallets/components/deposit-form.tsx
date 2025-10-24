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
import { useDepositToWallet } from "../wallet.mutations";
import { type DepositFormValues, depositSchema } from "../wallet.schema";

type DepositFormProps = {
  /**
   * Callback function called when deposit is successfully initiated
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
 * Form component for depositing funds to wallet via M-Pesa.
 *
 * @component
 * @param {DepositFormProps} props - The component props
 * @returns {JSX.Element} The rendered deposit form
 */
export function DepositForm({
  onSuccess,
  onCancel,
  defaultPhoneNumber,
}: DepositFormProps) {
  const depositMutation = useDepositToWallet();

  const form = useForm<DepositFormValues>({
    resolver: zodResolver(depositSchema),
    defaultValues: {
      amount: undefined,
      phoneNumber: defaultPhoneNumber || "",
    },
  });

  const onSubmit = async (values: DepositFormValues) => {
    try {
      const result = await depositMutation.mutateAsync(values);

      if (result.status === "success" && result.data) {
        toast.success("Deposit initiated", {
          description:
            result.data.message || "Please complete payment on your phone",
        });

        form.reset();
        onSuccess?.(result.data);
      } else {
        toast.error("Deposit failed", {
          description: result.message || "Failed to initiate deposit",
        });
      }
    } catch (error: any) {
      toast.error("Deposit failed", {
        description:
          error?.message || "An error occurred while processing your deposit",
      });
    }
  };

  return (
    <Form {...form}>
      <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
        <Alert>
          <InfoIcon className="h-4 w-4" />
          <AlertDescription>
            You will receive an M-Pesa prompt on your phone to complete the
            payment. Enter your M-Pesa PIN to confirm the transaction.
          </AlertDescription>
        </Alert>

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
                Enter your M-Pesa registered phone number (254XXXXXXXXX)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-3">
          {onCancel && (
            <Button
              className="flex-1"
              disabled={depositMutation.isPending}
              onClick={onCancel}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
          )}
          <Button
            className="flex-1"
            disabled={depositMutation.isPending}
            type="submit"
          >
            {depositMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Deposit"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
