"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import {
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
import { Calculator, Calendar, CreditCard, DollarSign } from "lucide-react";
import { useMemo } from "react";
import type { UseFormReturn } from "react-hook-form";
import type { PropertyFormData } from "../schema";

const PAYMENT_FREQUENCIES = [
  { value: "monthly", label: "Monthly", icon: "📅" },
  { value: "quarterly", label: "Quarterly (Every 3 months)", icon: "📆" },
  { value: "annually", label: "Annually (Yearly)", icon: "🗓️" },
];

type PricingStepProps = {
  form: UseFormReturn<PropertyFormData>;
};

export function PricingStep({ form }: PricingStepProps) {
  const watchedValues = form.watch();

  // Calculate deposit based on depositMonths and rent
  const calculatedDeposit = useMemo(() => {
    const { rent = 0, depositMonths = 0 } = watchedValues;
    return rent * depositMonths;
  }, [watchedValues]);

  // Calculate total move-in cost
  const totalMoveinCost = useMemo(() => {
    const {
      rent = 0,
      deposit = 0,
      serviceFee = 0,
      advanceMonths = 0,
    } = watchedValues;
    return deposit + rent * advanceMonths + serviceFee;
  }, [watchedValues]);

  // Auto-calculate deposit when depositMonths changes
  const handleDepositMonthsChange = (months: number) => {
    form.setValue("depositMonths", months);
    const rent = watchedValues.rent || 0;
    form.setValue("deposit", rent * months);
  };

  return (
    <div className="space-y-6">
      {/* Monthly Rent */}
      <FormField
        control={form.control}
        name="rent"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-2 font-semibold text-base">
              <DollarSign className="h-4 w-4" />
              Monthly Rent <span className="text-red-500">*</span>
            </FormLabel>
            <FormDescription className="text-xs">
              Rental amount per month in Kenyan Shillings (KES)
            </FormDescription>
            <FormControl>
              <div className="relative">
                <span className="-translate-y-1/2 absolute top-1/2 left-3 text-muted-foreground">
                  KES
                </span>
                <Input
                  className="pl-14 font-semibold text-lg"
                  min={1000}
                  placeholder="20,000"
                  type="number"
                  {...field}
                  onChange={(e) => {
                    const value = Number.parseInt(e.target.value, 10) || 0;
                    field.onChange(value);
                    // Auto-update deposit if depositMonths is set
                    if (watchedValues.depositMonths) {
                      form.setValue(
                        "deposit",
                        value * watchedValues.depositMonths
                      );
                    }
                  }}
                />
              </div>
            </FormControl>
            {field.value > 0 && (
              <p className="text-muted-foreground text-xs">
                ≈ ${(field.value / 130).toFixed(2)} USD per month
              </p>
            )}
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Payment Frequency */}
      <FormField
        control={form.control}
        name="paymentFrequency"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-2 font-semibold text-base">
              <Calendar className="h-4 w-4" />
              Payment Frequency <span className="text-red-500">*</span>
            </FormLabel>
            <FormDescription className="text-xs">
              How often rent should be paid
            </FormDescription>
            <Select defaultValue={field.value} onValueChange={field.onChange}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select payment frequency" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {PAYMENT_FREQUENCIES.map((freq) => (
                  <SelectItem key={freq.value} value={freq.value}>
                    <span className="flex items-center gap-2">
                      <span>{freq.icon}</span>
                      <span>{freq.label}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Deposit Section */}
      <Card className="border-blue-200 bg-linear-to-br from-blue-50 to-white dark:from-blue-950 dark:to-background">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Security Deposit</CardTitle>
          <CardDescription className="text-xs">
            Refundable amount held as security
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            control={form.control}
            name="depositMonths"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm">
                  Deposit in Months <span className="text-red-500">*</span>
                </FormLabel>
                <FormDescription className="text-xs">
                  Number of months' rent as deposit
                </FormDescription>
                <FormControl>
                  <Input
                    max={12}
                    min={0}
                    placeholder="1"
                    type="number"
                    {...field}
                    onChange={(e) => {
                      const months = Number.parseInt(e.target.value, 10) || 0;
                      handleDepositMonthsChange(months);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="deposit"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm">
                  Deposit Amount (KES) <span className="text-red-500">*</span>
                </FormLabel>
                <FormDescription className="text-xs">
                  {watchedValues.depositMonths > 0 &&
                    `Calculated: ${watchedValues.depositMonths} month${watchedValues.depositMonths !== 1 ? "s" : ""} × KES ${watchedValues.rent?.toLocaleString() || 0}`}
                </FormDescription>
                <FormControl>
                  <div className="relative">
                    <span className="-translate-y-1/2 absolute top-1/2 left-3 text-muted-foreground">
                      KES
                    </span>
                    <Input
                      className="pl-14 font-semibold"
                      min={0}
                      placeholder="0"
                      type="number"
                      {...field}
                      onChange={(e) =>
                        field.onChange(Number.parseInt(e.target.value, 10) || 0)
                      }
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      {/* Advance Rent */}
      <FormField
        control={form.control}
        name="advanceMonths"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-2 font-semibold text-base">
              <CreditCard className="h-4 w-4" />
              Advance Rent Months <span className="text-red-500">*</span>
            </FormLabel>
            <FormDescription className="text-xs">
              Number of months' rent to pay in advance (typically 1-2 months)
            </FormDescription>
            <FormControl>
              <Input
                max={12}
                min={0}
                placeholder="1"
                type="number"
                {...field}
                onChange={(e) =>
                  field.onChange(Number.parseInt(e.target.value, 10) || 0)
                }
              />
            </FormControl>
            {field.value > 0 && watchedValues.rent > 0 && (
              <p className="text-muted-foreground text-xs">
                Advance payment: KES{" "}
                {(field.value * watchedValues.rent).toLocaleString()}
              </p>
            )}
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Service Fee (Optional) */}
      <FormField
        control={form.control}
        name="serviceFee"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="font-semibold text-base">
              Service/Agent Fee (Optional)
            </FormLabel>
            <FormDescription className="text-xs">
              One-time fee for property management or agent services (KES)
            </FormDescription>
            <FormControl>
              <div className="relative">
                <span className="-translate-y-1/2 absolute top-1/2 left-3 text-muted-foreground">
                  KES
                </span>
                <Input
                  className="pl-14"
                  min={0}
                  placeholder="0"
                  type="number"
                  {...field}
                  onChange={(e) =>
                    field.onChange(
                      e.target.value
                        ? Number.parseInt(e.target.value, 10)
                        : undefined
                    )
                  }
                  value={field.value || ""}
                />
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Cost Summary */}
      {watchedValues.rent > 0 && (
        <Card className="border-green-200 bg-linear-to-br from-green-50 to-white dark:from-green-950 dark:to-background">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Calculator className="h-5 w-5 text-green-600" />
              Move-in Cost Summary
            </CardTitle>
            <CardDescription className="text-xs">
              Total amount needed to secure this property
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2 text-sm">
              {watchedValues.deposit > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Security Deposit ({watchedValues.depositMonths}{" "}
                    {watchedValues.depositMonths === 1 ? "month" : "months"}):
                  </span>
                  <span className="font-medium">
                    KES {watchedValues.deposit.toLocaleString()}
                  </span>
                </div>
              )}
              {watchedValues.advanceMonths > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Advance Rent ({watchedValues.advanceMonths}{" "}
                    {watchedValues.advanceMonths === 1 ? "month" : "months"}):
                  </span>
                  <span className="font-medium">
                    KES{" "}
                    {(
                      watchedValues.rent * watchedValues.advanceMonths
                    ).toLocaleString()}
                  </span>
                </div>
              )}
              {watchedValues.serviceFee && watchedValues.serviceFee > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Service Fee:</span>
                  <span className="font-medium">
                    KES {watchedValues.serviceFee.toLocaleString()}
                  </span>
                </div>
              )}
            </div>
            <div className="border-t pt-2">
              <div className="flex justify-between text-base">
                <span className="font-semibold">Total Move-in Cost:</span>
                <span className="font-bold text-green-600">
                  KES {totalMoveinCost.toLocaleString()}
                </span>
              </div>
              <p className="mt-1 text-muted-foreground text-xs">
                ≈ ${(totalMoveinCost / 130).toFixed(2)} USD
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
