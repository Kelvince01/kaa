import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, AlertDescription } from "@kaa/ui/components/alert";
import { Badge } from "@kaa/ui/components/badge";
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
import { Textarea } from "@kaa/ui/components/textarea";
import {
  CheckCircle,
  Clock,
  CreditCard,
  ExternalLink,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import {
  useCreateStripePaymentIntent,
  useStripePaymentIntent,
} from "../stripe.queries";
import { formatStripeAmount, getPaymentIntentStatus } from "../stripe.service";

const stripeFormSchema = z.object({
  propertyId: z.string(),
  paymentType: z.enum(["rent", "deposit", "fee", "other"]),
  description: z.string().optional(),
  contractId: z.string().optional(),
  amount: z.number().min(1, "Amount must be greater than 0").optional(),
});

type StripeFormData = z.infer<typeof stripeFormSchema>;

type StripePaymentFormProps = {
  propertyId: string;
  defaultAmount?: number;
  defaultPaymentType?: "rent" | "deposit" | "fee" | "other";
  defaultDescription?: string;
  contractId?: string;
  onSuccess?: (paymentIntentId: string) => void;
  onCancel?: () => void;
};

export function StripePaymentForm({
  propertyId,
  defaultAmount,
  defaultPaymentType = "rent",
  defaultDescription,
  contractId,
  onSuccess,
  onCancel,
}: StripePaymentFormProps) {
  const [paymentIntentId, setPaymentIntentId] = useState<string>("");
  const [clientSecret, setClientSecret] = useState<string>("");

  const { mutateAsync: createPaymentIntent, isPending } =
    useCreateStripePaymentIntent();

  // Poll payment intent status
  const { data: paymentIntentData } = useStripePaymentIntent(paymentIntentId);

  const form = useForm<StripeFormData>({
    resolver: zodResolver(stripeFormSchema),
    defaultValues: {
      propertyId,
      paymentType: defaultPaymentType,
      description: defaultDescription,
      contractId,
      amount: defaultAmount,
    },
  });

  const paymentType = form.watch("paymentType");

  const onSubmit = async (data: StripeFormData) => {
    try {
      const response = await createPaymentIntent(data);

      setPaymentIntentId(response.paymentIntentId);
      setClientSecret(response.clientSecret);

      toast.success(
        "Payment intent created. Complete your payment in the Stripe checkout."
      );

      // In a real implementation, you would redirect to Stripe Checkout or
      // initialize Stripe Elements here with the client secret
      window.open(
        `https://checkout.stripe.com/pay/${response.clientSecret}`,
        "_blank"
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to create payment intent"
      );
    }
  };

  const handleRetry = () => {
    setPaymentIntentId("");
    setClientSecret("");
    form.reset();
  };

  // Show payment status if we have a payment intent
  if (paymentIntentId && paymentIntentData?.data) {
    const payment = paymentIntentData.data;
    const statusInfo = getPaymentIntentStatus(payment.status);

    if (payment.status === "succeeded") {
      return (
        <div className="space-y-4 text-center">
          <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
          <div>
            <h3 className="font-semibold text-green-700 text-lg">
              Payment Successful!
            </h3>
            <p className="text-gray-600 text-sm">
              Your card payment of{" "}
              {formatStripeAmount(payment.amount, payment.currency)} has been
              completed.
            </p>
          </div>
          <Badge variant="success">{statusInfo.label}</Badge>
          <Button
            className="w-full"
            onClick={() => onSuccess?.(paymentIntentId)}
          >
            Continue
          </Button>
        </div>
      );
    }

    if (
      payment.status === "canceled" ||
      payment.status === "requires_payment_method"
    ) {
      return (
        <div className="space-y-4 text-center">
          <XCircle className="mx-auto h-16 w-16 text-red-500" />
          <div>
            <h3 className="font-semibold text-lg text-red-700">
              Payment Failed
            </h3>
            <p className="text-gray-600 text-sm">
              Your payment could not be processed. Please try again.
            </p>
          </div>
          <Badge variant="destructive">{statusInfo.label}</Badge>
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

    // Show processing status
    return (
      <div className="space-y-4 text-center">
        <Clock className="mx-auto h-16 w-16 animate-spin text-blue-500" />
        <div>
          <h3 className="font-semibold text-blue-700 text-lg">
            Payment Processing
          </h3>
          <p className="text-gray-600 text-sm">
            Please complete your payment in the Stripe checkout window.
          </p>
        </div>
        <Badge variant={statusInfo.variant as any}>{statusInfo.label}</Badge>
        <Alert>
          <CreditCard className="h-4 w-4" />
          <AlertDescription>
            If the checkout window didn't open,
            <Button asChild className="ml-1 h-auto p-0" variant="link">
              <a
                href={`https://checkout.stripe.com/pay/${clientSecret}`}
                rel="noopener noreferrer"
                target="_blank"
              >
                click here to complete your payment
                <ExternalLink className="ml-1 h-3 w-3" />
              </a>
            </Button>
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
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {paymentType === "other" && (
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount (KES)</FormLabel>
                <FormControl>
                  <Input
                    min="1"
                    step="0.01"
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
        )}

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Add a description for this payment..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Alert>
          <CreditCard className="h-4 w-4" />
          <AlertDescription>
            You will be redirected to Stripe's secure checkout to complete your
            payment with a credit or debit card.
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
          <Button className="flex-1" disabled={isPending} type="submit">
            {isPending
              ? "Creating Payment..."
              : paymentType === "other"
                ? `Pay KES ${form.watch("amount") || 0}`
                : "Continue to Payment"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
