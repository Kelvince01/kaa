"use client";

import { Card } from "@kaa/ui/components/card";
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
import { Calculator, DollarSign, Info } from "lucide-react";
import { useMemo } from "react";
import { useFormContext } from "react-hook-form";
import type { PropertyFormData } from "../schema";

const PAYMENT_FREQUENCY_OPTIONS = [
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "annually", label: "Annually" },
];

export function PricingStep() {
  const form = useFormContext<PropertyFormData>();

  const rent = form.watch("rent") || 0;
  const deposit = form.watch("deposit") || 0;
  const serviceFee = form.watch("serviceFee") || 0;
  const advanceMonths = form.watch("advanceMonths") || 0;
  const depositMonths = form.watch("depositMonths") || 0;

  const calculatedDeposit = useMemo(
    () => rent * depositMonths,
    [rent, depositMonths]
  );

  const totalUpfront = useMemo(() => {
    const advancePayment = rent * advanceMonths;
    return advancePayment + deposit + serviceFee;
  }, [rent, advanceMonths, deposit, serviceFee]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-2 font-semibold text-2xl text-foreground">
          Pricing Information
        </h2>
        <p className="text-muted-foreground text-sm">
          Set your rental rates and payment terms
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <FormField
          control={form.control}
          name="rent"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Monthly Rent (KES) *</FormLabel>
              <FormControl>
                <div className="relative">
                  <DollarSign className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-10 text-base"
                    min={0}
                    placeholder="25000"
                    step={100}
                    type="number"
                    {...field}
                    onChange={(e) =>
                      field.onChange(Number.parseFloat(e.target.value) || 0)
                    }
                  />
                </div>
              </FormControl>
              <FormDescription>
                The monthly rent amount in Kenyan Shillings
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="paymentFrequency"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Payment Frequency *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="text-base">
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {PAYMENT_FREQUENCY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>How often rent is paid</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="depositMonths"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Deposit (in months) *</FormLabel>
              <FormControl>
                <div className="space-y-2">
                  <Input
                    className="text-base"
                    max={12}
                    min={0}
                    placeholder="1"
                    type="number"
                    {...field}
                    onChange={(e) => {
                      const months = Number.parseInt(e.target.value, 10) || 0;
                      field.onChange(months);
                      form.setValue("deposit", rent * months);
                    }}
                  />
                  {calculatedDeposit > 0 && (
                    <p className="text-muted-foreground text-sm">
                      = KES {calculatedDeposit.toLocaleString()}
                    </p>
                  )}
                </div>
              </FormControl>
              <FormDescription>Typically 1-2 months rent</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="deposit"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Deposit Amount (KES) *</FormLabel>
              <FormControl>
                <div className="relative">
                  <DollarSign className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-10 text-base"
                    min={0}
                    placeholder="25000"
                    step={100}
                    type="number"
                    {...field}
                    onChange={(e) =>
                      field.onChange(Number.parseFloat(e.target.value) || 0)
                    }
                  />
                </div>
              </FormControl>
              <FormDescription>Refundable security deposit</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="advanceMonths"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Advance Payment (months) *</FormLabel>
              <FormControl>
                <Input
                  className="text-base"
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
              <FormDescription>
                Months to pay upfront (usually 1-3)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="serviceFee"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Service Fee (KES) (Optional)</FormLabel>
              <FormControl>
                <div className="relative">
                  <DollarSign className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-10 text-base"
                    min={0}
                    placeholder="0"
                    step={100}
                    type="number"
                    {...field}
                    onChange={(e) =>
                      field.onChange(
                        Number.parseFloat(e.target.value) || undefined
                      )
                    }
                    value={field.value || ""}
                  />
                </div>
              </FormControl>
              <FormDescription>Any additional one-time fees</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <Card className="border-primary/20 bg-primary/5 p-5">
        <div className="flex items-start gap-3">
          <Calculator className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div className="flex-1 space-y-3">
            <h3 className="font-semibold text-base">Cost Summary</h3>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Monthly Rent:</span>
                <span className="font-medium">KES {rent.toLocaleString()}</span>
              </div>

              {advanceMonths > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Advance ({advanceMonths}{" "}
                    {advanceMonths === 1 ? "month" : "months"}):
                  </span>
                  <span className="font-medium">
                    KES {(rent * advanceMonths).toLocaleString()}
                  </span>
                </div>
              )}

              {deposit > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Security Deposit:
                  </span>
                  <span className="font-medium">
                    KES {deposit.toLocaleString()}
                  </span>
                </div>
              )}

              {serviceFee > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Service Fee:</span>
                  <span className="font-medium">
                    KES {serviceFee.toLocaleString()}
                  </span>
                </div>
              )}

              <div className="border-t pt-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Total Upfront Cost:</span>
                  <span className="font-bold text-lg text-primary">
                    KES {totalUpfront.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2 rounded-md bg-background/50 p-3 text-muted-foreground text-xs">
              <Info className="mt-0.5 h-3 w-3 shrink-0" />
              <p>
                This is what tenants need to pay before moving in. Clear pricing
                builds trust and attracts serious tenants.
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
