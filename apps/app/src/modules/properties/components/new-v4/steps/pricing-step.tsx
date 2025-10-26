"use client";

import { Badge } from "@kaa/ui/components/badge";
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
import { cn } from "@kaa/ui/lib/utils";
import { AlertCircle, DollarSign, Info, TrendingUp } from "lucide-react";
import { useFormContext } from "react-hook-form";
import type { PropertyFormData } from "../schema";

const PAYMENT_FREQUENCY_OPTIONS = [
  { value: "monthly", label: "Monthly", description: "Most common option" },
  { value: "quarterly", label: "Quarterly", description: "Every 3 months" },
  { value: "annually", label: "Annually", description: "Yearly payment" },
];

export function PricingStep() {
  const form = useFormContext<PropertyFormData>();

  const rent = form.watch("rent") || 0;
  const deposit = form.watch("deposit") || 0;
  const serviceFee = form.watch("serviceFee") || 0;
  const advanceMonths = form.watch("advanceMonths") || 0;
  const depositMonths = form.watch("depositMonths") || 0;
  const frequency = form.watch("paymentFrequency");

  // Calculate totals
  const totalUpfront = advanceMonths * rent + deposit + (serviceFee || 0);
  const monthlyTotal = rent + (serviceFee || 0);

  // Market analysis (mock data - should come from API)
  const marketAnalysis = {
    averageRent: 45_000,
    minRent: 35_000,
    maxRent: 65_000,
    isCompetitive: rent >= 35_000 && rent <= 65_000,
  };

  const getRentStatus = () => {
    if (rent === 0)
      return {
        label: "Not set",
        color: "text-gray-500",
        variant: "outline" as const,
      };
    if (rent < marketAnalysis.minRent)
      return {
        label: "Below market",
        color: "text-yellow-600",
        variant: "secondary" as const,
      };
    if (rent > marketAnalysis.maxRent)
      return {
        label: "Above market",
        color: "text-orange-600",
        variant: "secondary" as const,
      };
    return {
      label: "Market rate",
      color: "text-green-600",
      variant: "default" as const,
    };
  };

  const rentStatus = getRentStatus();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h2 className="font-semibold text-2xl text-foreground md:text-3xl">
          Pricing & Payment Terms
        </h2>
        <p className="text-muted-foreground text-sm md:text-base">
          Set competitive pricing and clear payment terms
        </p>
      </div>

      {/* Market Insight */}
      {rent > 0 && (
        <div
          className={cn(
            "rounded-lg border p-4",
            marketAnalysis.isCompetitive
              ? "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/20"
              : "border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950/20"
          )}
        >
          <div className="flex items-start gap-3">
            {marketAnalysis.isCompetitive ? (
              <TrendingUp className="h-5 w-5 shrink-0 text-green-600" />
            ) : (
              <AlertCircle className="h-5 w-5 shrink-0 text-yellow-600" />
            )}
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-sm">Market Analysis</p>
                <Badge
                  className={rentStatus.color}
                  variant={rentStatus.variant}
                >
                  {rentStatus.label}
                </Badge>
              </div>
              <p className="text-xs md:text-sm">
                Similar properties in your area: KES{" "}
                {marketAnalysis.minRent.toLocaleString()} - KES{" "}
                {marketAnalysis.maxRent.toLocaleString()} per month
              </p>
              <p className="text-xs">
                Average: KES {marketAnalysis.averageRent.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Monthly Rent */}
      <FormField
        control={form.control}
        name="rent"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-base">Monthly Rent *</FormLabel>
            <FormControl>
              <div className="relative">
                <DollarSign className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-10 text-base"
                  min={1}
                  placeholder="e.g., 45000"
                  step="100"
                  type="number"
                  {...field}
                  onChange={(e) =>
                    field.onChange(Number.parseFloat(e.target.value))
                  }
                />
                <span className="absolute top-3 right-3 text-muted-foreground text-sm">
                  KES
                </span>
              </div>
            </FormControl>
            <FormDescription className="text-xs md:text-sm">
              Set the monthly rent amount in Kenyan Shillings
            </FormDescription>
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
            <FormLabel className="text-base">Payment Frequency *</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger className="text-base">
                  <SelectValue placeholder="Select payment frequency" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {PAYMENT_FREQUENCY_OPTIONS.map((option) => (
                  <SelectItem
                    className="text-base"
                    key={option.value}
                    value={option.value}
                  >
                    <div className="flex flex-col items-start">
                      <span className="font-medium">{option.label}</span>
                      <span className="text-muted-foreground text-xs">
                        {option.description}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Deposit and Service Fee */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FormField
          control={form.control}
          name="deposit"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base">Security Deposit *</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    className="text-base"
                    min={0}
                    placeholder="e.g., 45000"
                    step="100"
                    type="number"
                    {...field}
                    onChange={(e) =>
                      field.onChange(Number.parseFloat(e.target.value))
                    }
                  />
                  <span className="absolute top-3 right-3 text-muted-foreground text-sm">
                    KES
                  </span>
                </div>
              </FormControl>
              <FormDescription className="text-xs">
                Typical: 1-2 months' rent
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
              <FormLabel className="text-base">
                Service Fee (Optional)
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    className="text-base"
                    min={0}
                    placeholder="e.g., 2000"
                    step="100"
                    type="number"
                    {...field}
                    onChange={(e) => {
                      const value = e.target.value
                        ? Number.parseFloat(e.target.value)
                        : undefined;
                      field.onChange(value);
                    }}
                    value={field.value || ""}
                  />
                  <span className="absolute top-3 right-3 text-muted-foreground text-sm">
                    KES
                  </span>
                </div>
              </FormControl>
              <FormDescription className="text-xs">
                Monthly maintenance/service charge
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Advance Payment Terms */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FormField
          control={form.control}
          name="advanceMonths"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base">Advance Payment *</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    className="text-base"
                    max={12}
                    min={0}
                    placeholder="e.g., 1"
                    type="number"
                    {...field}
                    onChange={(e) =>
                      field.onChange(Number.parseInt(e.target.value, 10))
                    }
                  />
                  <span className="absolute top-3 right-3 text-muted-foreground text-sm">
                    months
                  </span>
                </div>
              </FormControl>
              <FormDescription className="text-xs">
                Months of rent paid in advance
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="depositMonths"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base">Deposit Months *</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    className="text-base"
                    max={12}
                    min={0}
                    placeholder="e.g., 1"
                    type="number"
                    {...field}
                    onChange={(e) =>
                      field.onChange(Number.parseInt(e.target.value, 10))
                    }
                  />
                  <span className="absolute top-3 right-3 text-muted-foreground text-sm">
                    months
                  </span>
                </div>
              </FormControl>
              <FormDescription className="text-xs">
                Deposit as months of rent
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Payment Summary */}
      <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
        <div className="mb-3 flex items-center gap-2">
          <Info className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-base">Payment Summary</h3>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Monthly Rent</p>
              <p className="font-semibold text-base">
                KES {rent.toLocaleString()}
              </p>
            </div>
            {serviceFee && serviceFee > 0 ? (
              <div>
                <p className="text-muted-foreground">Service Fee</p>
                <p className="font-semibold text-base">
                  KES {serviceFee.toLocaleString()}
                </p>
              </div>
            ) : null}
            <div>
              <p className="text-muted-foreground">Security Deposit</p>
              <p className="font-semibold text-base">
                KES {deposit.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Advance Payment</p>
              <p className="font-semibold text-base">
                {advanceMonths} {advanceMonths === 1 ? "month" : "months"}
              </p>
            </div>
          </div>

          <div className="border-t pt-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">
                  Total Upfront Cost
                </p>
                <p className="text-muted-foreground text-xs">
                  ({advanceMonths} months + deposit + fees)
                </p>
              </div>
              <p className="font-bold text-2xl text-primary">
                KES {totalUpfront.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-md bg-background p-3">
            <p className="text-muted-foreground text-sm">Monthly Total</p>
            <p className="font-semibold text-lg">
              KES {monthlyTotal.toLocaleString()} /{" "}
              {frequency === "monthly"
                ? "mo"
                : frequency === "quarterly"
                  ? "qtr"
                  : "yr"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
