import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@kaa/ui/components/button";
import { Calendar } from "@kaa/ui/components/calendar";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@kaa/ui/components/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@kaa/ui/components/select";
import { CalendarIcon } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import {
  useCreateManualPayment,
  useCreateStripePaymentIntent,
  useInitiateMpesaPayment,
} from "../payment.queries";

const paymentFormSchema = z.object({
  bookingId: z.string(),
  amount: z.number().min(1, "Amount must be greater than 0"),
  paymentMethod: z.enum(["mpesa", "card", "bank"]),
  paymentType: z.enum(["rent", "deposit", "fee"]),
  phoneNumber: z.string().optional(),
  transactionId: z.string().optional(),
  paymentDate: z.date().optional(),
  currency: z.string(),
});

type PaymentFormData = z.infer<typeof paymentFormSchema>;

type PaymentFormProps = {
  bookingId: string;
  defaultAmount?: number;
  defaultPaymentType?: "rent" | "deposit" | "fee";
  onSuccess?: () => void;
};

/*
<PaymentForm
    bookingId="booking_123"
    defaultAmount={5000}
    defaultPaymentType="rent"
    onSuccess={() => {
        // Handle successful payment
        refetch();
        closeModal();
    }}
/>*/

/*
 * PaymentForm component allows users to make payments for bookings.
 * It supports M-Pesa, Card, and Bank Transfer methods.
 * Users can select payment type (rent, deposit, fee) and enter relevant details.
 */
export function PaymentForm({
  bookingId,
  defaultAmount,
  defaultPaymentType = "rent",
  onSuccess,
}: PaymentFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { mutateAsync: createManualPayment } = useCreateManualPayment();
  const { mutateAsync: initiateMpesa } = useInitiateMpesaPayment();
  const { mutateAsync: createStripeIntent } = useCreateStripePaymentIntent();

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      bookingId,
      amount: defaultAmount || 0,
      currency: "KES",
      paymentType: defaultPaymentType,
    },
  });

  const paymentMethod = form.watch("paymentMethod");

  const onSubmit = async (data: PaymentFormData) => {
    try {
      setIsLoading(true);

      switch (data.paymentMethod) {
        case "mpesa":
          if (!data.phoneNumber) {
            toast.error("Phone number is required for M-Pesa payments");
            return;
          }
          await initiateMpesa({
            bookingId: data.bookingId,
            phoneNumber: data.phoneNumber,
            amount: data.amount,
            paymentMethod: data.paymentMethod,
            paymentType: data.paymentType,
          });
          toast.success(
            "M-Pesa payment initiated. Please complete the payment on your phone."
          );
          break;

        case "card":
          {
            const { clientSecret } = await createStripeIntent({
              tenantId: "dummy", // This should come from context or props
              amount: data.amount,
              currency: data.currency,
            });
            // Here you would typically launch the Stripe payment modal
            toast.success("Card payment initiated");
          }
          break;

        case "bank":
          if (!data.transactionId) {
            toast.error("Transaction ID is required for bank payments");
            return;
          }
          await createManualPayment({
            bookingId: data.bookingId,
            amount: data.amount,
            paymentMethod: data.paymentMethod,
            transactionId: data.transactionId,
            paymentDate: data.paymentDate,
          });
          toast.success("Manual payment recorded successfully");
          break;
        default:
          toast.error("Invalid payment method");
          break;
      }

      onSuccess?.();
      form.reset();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to process payment"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="paymentType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Payment Type</FormLabel>
              <Select defaultValue={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="rent">Rent</SelectItem>
                  <SelectItem value="deposit">Deposit</SelectItem>
                  <SelectItem value="fee">Fee</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="paymentMethod"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Payment Method</FormLabel>
              <Select defaultValue={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="mpesa">M-Pesa</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="bank">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  {...field}
                  onChange={(e) =>
                    field.onChange(Number.parseFloat(e.target.value))
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {paymentMethod === "mpesa" && (
          <FormField
            control={form.control}
            name="phoneNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input placeholder="254700000000" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {paymentMethod === "bank" && (
          <>
            <FormField
              control={form.control}
              name="transactionId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Transaction ID</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter bank transaction ID" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="paymentDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Date</FormLabel>
                  <FormControl>
                    {/* <Input
                      type="date"
                      {...field}
                      onChange={(e) => field.onChange(new Date(e.target.value))}
                    /> */}

                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          className="w-[280px] justify-start text-left font-normal"
                          variant={"outline"}
                        >
                          {field.value ? (
                            <p>Selected: {field.value.toLocaleDateString()}</p>
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          initialFocus
                          mode="single"
                          onSelect={field.onChange}
                          selected={
                            field.value ? new Date(field.value) : undefined
                          }
                        />
                      </PopoverContent>
                    </Popover>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        <Button className="w-full" disabled={isLoading} type="submit">
          {isLoading
            ? "Processing..."
            : `Pay ${form.getValues("amount")} ${form.getValues("currency")}`}
        </Button>
      </form>
    </Form>
  );
}
