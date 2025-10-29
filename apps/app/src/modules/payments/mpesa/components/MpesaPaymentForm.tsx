import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, AlertDescription } from "@kaa/ui/components/alert";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@kaa/ui/components/select";
import { CheckCircle, Clock, Phone, XCircle } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import {
  useInitiateMpesaPayment,
  usePollPaymentStatus,
} from "../mpesa.queries";
import {
  formatMpesaPhoneNumber,
  validateMpesaPhoneNumber,
} from "../mpesa.service";

const mpesaFormSchema = z.object({
  bookingId: z.string(),
  phoneNumber: z
    .string()
    .min(1, "Phone number is required")
    .refine(validateMpesaPhoneNumber, "Please enter a valid M-Pesa number"),
  amount: z.number().min(1, "Amount must be greater than 0"),
  paymentType: z.enum(["rent", "deposit", "fee"]),
});

type MpesaFormData = z.infer<typeof mpesaFormSchema>;

type MpesaPaymentFormProps = {
  bookingId: string;
  defaultAmount?: number;
  defaultPaymentType?: "rent" | "deposit" | "fee";
  onSuccess?: () => void;
  onCancel?: () => void;
};

export function MpesaPaymentForm({
  bookingId,
  defaultAmount,
  defaultPaymentType = "rent",
  onSuccess,
  onCancel,
}: MpesaPaymentFormProps) {
  const [paymentStatus, setPaymentStatus] = useState<
    "idle" | "initiated" | "polling" | "completed" | "failed"
  >("idle");
  const [checkoutRequestID, setCheckoutRequestID] = useState<string>("");

  const { mutateAsync: initiateMpesa, isPending } = useInitiateMpesaPayment();

  // Poll payment status when payment is initiated
  const { data: paymentStatusData } = usePollPaymentStatus(
    checkoutRequestID,
    paymentStatus === "polling"
  );

  const form = useForm<MpesaFormData>({
    resolver: zodResolver(mpesaFormSchema),
    defaultValues: {
      bookingId,
      amount: defaultAmount || 0,
      paymentType: defaultPaymentType,
    },
  });

  // Update payment status based on polling results
  if (paymentStatusData && paymentStatus === "polling") {
    if (paymentStatusData.data?.status === "completed") {
      setPaymentStatus("completed");
      toast.success("Payment completed successfully!");
      onSuccess?.();
    } else if (paymentStatusData.data?.status === "failed") {
      setPaymentStatus("failed");
      toast.error("Payment failed. Please try again.");
    }
  }

  const onSubmit = async (data: MpesaFormData) => {
    try {
      setPaymentStatus("initiated");

      const response = await initiateMpesa({
        ...data,
        phoneNumber: formatMpesaPhoneNumber(data.phoneNumber),
        paymentMethod: "mpesa",
      });

      // @ts-expect-error - response is not typed
      if (response.data?.mpesaResponse?.CheckoutRequestID) {
        // @ts-expect-error - response is not typed
        setCheckoutRequestID(response.data.mpesaResponse.CheckoutRequestID);
        setPaymentStatus("polling");
        toast.success(
          "Payment request sent to your phone. Please complete the payment."
        );
      }
    } catch (error) {
      setPaymentStatus("failed");
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to initiate M-Pesa payment"
      );
    }
  };

  const handleRetry = () => {
    setPaymentStatus("idle");
    setCheckoutRequestID("");
    form.reset();
  };

  if (paymentStatus === "completed") {
    return (
      <div className="space-y-4 text-center">
        <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
        <div>
          <h3 className="font-semibold text-green-700 text-lg">
            Payment Successful!
          </h3>
          <p className="text-gray-600 text-sm">
            Your M-Pesa payment has been completed.
          </p>
        </div>
        <Button className="w-full" onClick={onSuccess}>
          Continue
        </Button>
      </div>
    );
  }

  if (paymentStatus === "polling") {
    return (
      <div className="space-y-4 text-center">
        <Clock className="mx-auto h-16 w-16 animate-spin text-blue-500" />
        <div>
          <h3 className="font-semibold text-blue-700 text-lg">
            Payment Pending
          </h3>
          <p className="text-gray-600 text-sm">
            Please check your phone and complete the M-Pesa payment.
          </p>
        </div>
        <Alert>
          <Phone className="h-4 w-4" />
          <AlertDescription>
            A payment request has been sent to {form.getValues("phoneNumber")}.
            Enter your M-Pesa PIN when prompted.
          </AlertDescription>
        </Alert>
        <div className="flex space-x-2">
          <Button className="flex-1" onClick={onCancel} variant="outline">
            Cancel
          </Button>
          <Button className="flex-1" onClick={handleRetry} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (paymentStatus === "failed") {
    return (
      <div className="space-y-4 text-center">
        <XCircle className="mx-auto h-16 w-16 text-red-500" />
        <div>
          <h3 className="font-semibold text-lg text-red-700">Payment Failed</h3>
          <p className="text-gray-600 text-sm">
            Your M-Pesa payment could not be processed. Please try again.
          </p>
        </div>
        <div className="flex space-x-2">
          <Button className="flex-1" onClick={onCancel} variant="outline">
            Cancel
          </Button>
          <Button className="flex-1" onClick={handleRetry}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

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
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount (KES)</FormLabel>
              <FormControl>
                <Input
                  min="1"
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

        <FormField
          control={form.control}
          name="phoneNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>M-Pesa Phone Number</FormLabel>
              <FormControl>
                <Input
                  placeholder="254700000000 or 0700000000"
                  {...field}
                  onChange={(e) => {
                    const formatted = formatMpesaPhoneNumber(e.target.value);
                    field.onChange(formatted);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Alert>
          <Phone className="h-4 w-4" />
          <AlertDescription>
            You will receive an M-Pesa prompt on your phone. Enter your M-Pesa
            PIN to complete the payment.
          </AlertDescription>
        </Alert>

        <div className="flex space-x-2">
          {onCancel && (
            <Button
              className="flex-1"
              onClick={onCancel}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
          )}
          <Button
            className="flex-1"
            disabled={isPending || paymentStatus === "initiated"}
            type="submit"
          >
            {isPending || paymentStatus === "initiated"
              ? "Initiating..."
              : `Pay KES ${form.watch("amount") || 0}`}
          </Button>
        </div>
      </form>
    </Form>
  );
}
