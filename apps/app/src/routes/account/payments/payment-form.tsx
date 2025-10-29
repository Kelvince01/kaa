"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@kaa/ui/components/button";
// import { mpesaClient } from "@/lib/mpesa.service";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
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
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

const paymentFormSchema = z.object({
  phoneNumber: z
    .string()
    .min(10, { message: "Phone number must be at least 10 digits" })
    .max(12)
    .regex(/^(?:254|\+254|0)?([17](0|1|2|4|5|6|7|8|9)[0-9]{6})$/, {
      message: "Please enter a valid Safaricom number",
    }),
  amount: z.number().min(1, { message: "Amount must be greater than 0" }),
});

type PaymentFormValues = z.infer<typeof paymentFormSchema>;

type PaymentFormProps = {
  unitId: string;
  rentAmount: number;
  unitNumber: string;
  propertyName: string;
};

export function PaymentForm({ rentAmount }: PaymentFormProps) {
  const t = useTranslations("payments");
  const [isLoading, setIsLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<
    "pending" | "success" | "failed"
  >();
  const [checkoutRequestId, setCheckoutRequestId] = useState<string>();

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      phoneNumber: "",
      amount: rentAmount,
    },
  });

  const onSubmit = (data: PaymentFormValues) => {
    try {
      setIsLoading(true);
      setPaymentStatus("pending");

      // Format phone number to include country code
      const phoneNumber = data.phoneNumber.startsWith("0")
        ? `254${data.phoneNumber.slice(1)}`
        : data.phoneNumber;

      // const response = await mpesaClient.initiatePayment({
      // 	phoneNumber,
      // 	amount: data.amount,
      // 	accountReference: unitNumber,
      // 	description: `Rent payment for ${unitNumber} - ${propertyName}`,
      // });

      // setCheckoutRequestId(response.CheckoutRequestID);

      // Start polling for payment status
      const pollInterval = setInterval(() => {
        try {
          // const status: any = await mpesaClient.checkStatus(response.CheckoutRequestID);
          // if (status.ResultCode === "0") {
          // 	setPaymentStatus("success");
          // 	toast.success(t("paymentSuccess"));
          // 	clearInterval(pollInterval);
          // } else if (status.ResultCode === "1") {
          // 	setPaymentStatus("failed");
          // 	toast.error(status.ResultDesc);
          // 	clearInterval(pollInterval);
          // }
        } catch (error) {
          // console.error("Error checking payment status:", error);
        }
      }, 5000); // Poll every 5 seconds

      // Stop polling after 2 minutes
      setTimeout(() => {
        clearInterval(pollInterval);
        if (paymentStatus === "pending") {
          setPaymentStatus("failed");
          toast.error(t("paymentTimeout"));
        }
      }, 120_000);
    } catch (error) {
      toast.error(t("paymentError"));
      setPaymentStatus("failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("makePayment")}</CardTitle>
        <CardDescription>{t("mpesaDescription")}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form className="space-y-8" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("phoneNumber")}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="0712345678" />
                  </FormControl>
                  <FormDescription>
                    {t("phoneNumberDescription")}
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
                  <FormLabel>{t("amount")}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>{t("amountDescription")}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              className="w-full"
              disabled={isLoading || paymentStatus === "pending"}
              type="submit"
            >
              {isLoading || paymentStatus === "pending" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("processing")}
                </>
              ) : (
                t("payNow")
              )}
            </Button>
          </form>
        </Form>

        {paymentStatus === "pending" && (
          <div className="mt-4 rounded-md bg-yellow-50 p-4 text-yellow-800">
            <p className="text-sm">{t("pendingMessage")}</p>
          </div>
        )}

        {paymentStatus === "success" && (
          <div className="mt-4 rounded-md bg-green-50 p-4 text-green-800">
            <p className="text-sm">{t("successMessage")}</p>
          </div>
        )}

        {paymentStatus === "failed" && (
          <div className="mt-4 rounded-md bg-red-50 p-4 text-red-800">
            <p className="text-sm">{t("failureMessage")}</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="text-muted-foreground text-sm">
        {t("mpesaSupport")}
      </CardFooter>
    </Card>
  );
}
