"use client";

import { Button } from "@kaa/ui/components/button";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@kaa/ui/components/form";
import { Input } from "@kaa/ui/components/input";
import { Switch } from "@kaa/ui/components/switch";
import { cn } from "@kaa/ui/lib/utils";
import { Calendar, Minus, PawPrint, Plus } from "lucide-react";
import { useFormContext } from "react-hook-form";
import type { PropertyFormData } from "../schema";

export function RulesStep() {
  const form = useFormContext<PropertyFormData>();

  const petsAllowed = form.watch("petsAllowed");
  const minimumLease = form.watch("minimumLease");

  const handleIncrementLease = () => {
    if (minimumLease < 60) {
      form.setValue("minimumLease", minimumLease + 1, { shouldValidate: true });
    }
  };

  const handleDecrementLease = () => {
    if (minimumLease > 1) {
      form.setValue("minimumLease", minimumLease - 1, { shouldValidate: true });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h2 className="font-semibold text-2xl text-foreground md:text-3xl">
          Rules & Policies
        </h2>
        <p className="text-muted-foreground text-sm md:text-base">
          Set clear expectations for your tenants
        </p>
      </div>

      {/* Pets Policy */}
      <FormField
        control={form.control}
        name="petsAllowed"
        render={({ field }) => (
          <FormItem>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-lg",
                    petsAllowed
                      ? "bg-green-100 dark:bg-green-950/20"
                      : "bg-red-100 dark:bg-red-950/20"
                  )}
                >
                  <PawPrint
                    className={cn(
                      "h-6 w-6",
                      petsAllowed ? "text-green-600" : "text-red-600"
                    )}
                  />
                </div>
                <div>
                  <FormLabel className="text-base">Pets Allowed</FormLabel>
                  <FormDescription className="mt-1 text-xs md:text-sm">
                    {petsAllowed
                      ? "Tenants can bring pets to the property"
                      : "Pets are not allowed on the property"}
                  </FormDescription>
                </div>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Minimum Lease Period */}
      <FormField
        control={form.control}
        name="minimumLease"
        render={({ field }) => (
          <FormItem>
            <div className="rounded-lg border p-4 md:p-6">
              <FormLabel className="mb-4 flex items-center gap-2 text-base">
                <Calendar className="h-5 w-5" />
                <span>Minimum Lease Period *</span>
              </FormLabel>

              <div className="space-y-4">
                {/* Visual Display */}
                <div className="flex items-center justify-center gap-4 rounded-lg bg-primary/5 p-6">
                  <span className="font-bold text-5xl text-primary">
                    {minimumLease}
                  </span>
                  <span className="text-lg text-muted-foreground">
                    {minimumLease === 1 ? "Month" : "Months"}
                  </span>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-2">
                  <Button
                    className="flex-1"
                    disabled={minimumLease === 1}
                    onClick={handleDecrementLease}
                    size="lg"
                    type="button"
                    variant="outline"
                  >
                    <Minus className="h-5 w-5" />
                  </Button>
                  <Input
                    className="h-12 w-24 text-center text-base"
                    max={60}
                    min={1}
                    type="number"
                    {...field}
                    onChange={(e) => {
                      const value = Number.parseInt(e.target.value, 10);
                      if (!Number.isNaN(value) && value >= 1 && value <= 60) {
                        field.onChange(value);
                      }
                    }}
                  />
                  <Button
                    className="flex-1"
                    disabled={minimumLease === 60}
                    onClick={handleIncrementLease}
                    size="lg"
                    type="button"
                    variant="outline"
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
                </div>

                <FormDescription className="text-center text-xs md:text-sm">
                  Minimum lease period in months (1-60 months)
                </FormDescription>
              </div>
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Common Lease Terms Reference */}
      <div className="rounded-lg border p-4">
        <h4 className="mb-3 font-semibold text-sm">Common Lease Terms:</h4>
        <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
          <button
            className={cn(
              "rounded-lg border-2 p-3 text-center transition-colors hover:border-primary",
              minimumLease === 6 && "border-primary bg-primary/10"
            )}
            onClick={() =>
              form.setValue("minimumLease", 6, { shouldValidate: true })
            }
            type="button"
          >
            <p className="font-bold text-lg">6</p>
            <p className="text-muted-foreground text-xs">months</p>
          </button>
          <button
            className={cn(
              "rounded-lg border-2 p-3 text-center transition-colors hover:border-primary",
              minimumLease === 12 && "border-primary bg-primary/10"
            )}
            onClick={() =>
              form.setValue("minimumLease", 12, { shouldValidate: true })
            }
            type="button"
          >
            <p className="font-bold text-lg">12</p>
            <p className="text-muted-foreground text-xs">months</p>
          </button>
          <button
            className={cn(
              "rounded-lg border-2 p-3 text-center transition-colors hover:border-primary",
              minimumLease === 24 && "border-primary bg-primary/10"
            )}
            onClick={() =>
              form.setValue("minimumLease", 24, { shouldValidate: true })
            }
            type="button"
          >
            <p className="font-bold text-lg">24</p>
            <p className="text-muted-foreground text-xs">months</p>
          </button>
          <button
            className={cn(
              "rounded-lg border-2 p-3 text-center transition-colors hover:border-primary",
              minimumLease === 36 && "border-primary bg-primary/10"
            )}
            onClick={() =>
              form.setValue("minimumLease", 36, { shouldValidate: true })
            }
            type="button"
          >
            <p className="font-bold text-lg">36</p>
            <p className="text-muted-foreground text-xs">months</p>
          </button>
        </div>
      </div>

      {/* Info Box */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/20">
        <h4 className="mb-2 font-semibold text-blue-900 text-sm dark:text-blue-100">
          💡 Setting Fair Rules
        </h4>
        <ul className="space-y-1 text-blue-700 text-xs dark:text-blue-300">
          <li>• Shorter lease terms (6-12 months) attract more tenants</li>
          <li>• Longer terms (24+ months) provide more stability</li>
          <li>• Pet-friendly properties typically have higher demand</li>
          <li>• Consider a pet deposit if allowing pets</li>
          <li>• Be clear and consistent with all rules</li>
        </ul>
      </div>
    </div>
  );
}
