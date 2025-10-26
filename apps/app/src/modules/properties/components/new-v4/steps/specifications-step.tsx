"use client";

import { PropertyCondition } from "@kaa/models/types";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@kaa/ui/components/select";
import { cn } from "@kaa/ui/lib/utils";
import { Bath, Bed, Minus, Plus, Ruler } from "lucide-react";
import { useFormContext } from "react-hook-form";
import type { PropertyFormData } from "../schema";

const CONDITION_OPTIONS: {
  value: PropertyCondition;
  label: string;
  icon: string;
  color: string;
}[] = [
  {
    value: PropertyCondition.NEW,
    label: "New/Brand New",
    icon: "✨",
    color: "text-green-600",
  },
  {
    value: PropertyCondition.EXCELLENT,
    label: "Excellent",
    icon: "⭐",
    color: "text-blue-600",
  },
  {
    value: PropertyCondition.GOOD,
    label: "Good",
    icon: "👍",
    color: "text-indigo-600",
  },
  {
    value: PropertyCondition.FAIR,
    label: "Fair",
    icon: "👌",
    color: "text-yellow-600",
  },
  {
    value: PropertyCondition.NEEDS_RENOVATION,
    label: "Needs Renovation",
    icon: "🔧",
    color: "text-orange-600",
  },
];

export function SpecificationsStep() {
  const form = useFormContext<PropertyFormData>();

  const bedrooms = form.watch("bedrooms");
  const bathrooms = form.watch("bathrooms");

  const handleIncrement = (field: "bedrooms" | "bathrooms") => {
    const currentValue = form.getValues(field);
    if (currentValue < 50) {
      form.setValue(field, currentValue + 1, { shouldValidate: true });
    }
  };

  const handleDecrement = (field: "bedrooms" | "bathrooms") => {
    const currentValue = form.getValues(field);
    if (currentValue > 0) {
      form.setValue(field, currentValue - 1, { shouldValidate: true });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h2 className="font-semibold text-2xl text-foreground md:text-3xl">
          Property Specifications
        </h2>
        <p className="text-muted-foreground text-sm md:text-base">
          Provide key details about your property's size and layout
        </p>
      </div>

      {/* Bedrooms and Bathrooms */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Bedrooms */}
        <FormField
          control={form.control}
          name="bedrooms"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base">Bedrooms *</FormLabel>
              <FormControl>
                <div className="space-y-3">
                  {/* Number Display */}
                  <div className="flex items-center justify-center gap-4 rounded-lg border-2 border-primary/20 bg-primary/5 p-4">
                    <Bed className="h-6 w-6 text-primary" />
                    <span className="font-bold text-4xl text-primary">
                      {bedrooms}
                    </span>
                    <span className="text-muted-foreground text-sm">
                      {bedrooms === 0
                        ? "Studio"
                        : bedrooms === 1
                          ? "Bedroom"
                          : "Bedrooms"}
                    </span>
                  </div>

                  {/* Controls */}
                  <div className="flex items-center gap-2">
                    <Button
                      className="flex-1"
                      disabled={bedrooms === 0}
                      onClick={() => handleDecrement("bedrooms")}
                      size="lg"
                      type="button"
                      variant="outline"
                    >
                      <Minus className="h-5 w-5" />
                    </Button>
                    <Input
                      className="h-12 w-20 text-center text-base"
                      max={50}
                      min={0}
                      type="number"
                      {...field}
                      onChange={(e) => {
                        const value = Number.parseInt(e.target.value, 10);
                        if (!Number.isNaN(value) && value >= 0 && value <= 50) {
                          field.onChange(value);
                        }
                      }}
                    />
                    <Button
                      className="flex-1"
                      disabled={bedrooms === 50}
                      onClick={() => handleIncrement("bedrooms")}
                      size="lg"
                      type="button"
                      variant="outline"
                    >
                      <Plus className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Bathrooms */}
        <FormField
          control={form.control}
          name="bathrooms"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base">Bathrooms *</FormLabel>
              <FormControl>
                <div className="space-y-3">
                  {/* Number Display */}
                  <div className="flex items-center justify-center gap-4 rounded-lg border-2 border-blue-500/20 bg-blue-50 p-4 dark:bg-blue-950/20">
                    <Bath className="h-6 w-6 text-blue-600" />
                    <span className="font-bold text-4xl text-blue-600">
                      {bathrooms}
                    </span>
                    <span className="text-muted-foreground text-sm">
                      {bathrooms === 1 ? "Bathroom" : "Bathrooms"}
                    </span>
                  </div>

                  {/* Controls */}
                  <div className="flex items-center gap-2">
                    <Button
                      className="flex-1"
                      disabled={bathrooms === 0}
                      onClick={() => handleDecrement("bathrooms")}
                      size="lg"
                      type="button"
                      variant="outline"
                    >
                      <Minus className="h-5 w-5" />
                    </Button>
                    <Input
                      className="h-12 w-20 text-center text-base"
                      max={50}
                      min={0}
                      type="number"
                      {...field}
                      onChange={(e) => {
                        const value = Number.parseInt(e.target.value, 10);
                        if (!Number.isNaN(value) && value >= 0 && value <= 50) {
                          field.onChange(value);
                        }
                      }}
                    />
                    <Button
                      className="flex-1"
                      disabled={bathrooms === 50}
                      onClick={() => handleIncrement("bathrooms")}
                      size="lg"
                      type="button"
                      variant="outline"
                    >
                      <Plus className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Total Area */}
      <FormField
        control={form.control}
        name="totalArea"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-base">Total Area (Optional)</FormLabel>
            <FormControl>
              <div className="relative">
                <Ruler className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-10 text-base"
                  min={1}
                  placeholder="e.g., 850"
                  step="any"
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
                  sq m
                </span>
              </div>
            </FormControl>
            <FormDescription className="text-xs md:text-sm">
              Enter the total area in square meters (e.g., 850 sq m)
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Property Condition */}
      <FormField
        control={form.control}
        name="condition"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-base">Property Condition *</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger className="text-base">
                  <SelectValue placeholder="Select property condition" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {CONDITION_OPTIONS.map((option) => (
                  <SelectItem
                    className="text-base"
                    key={option.value}
                    value={option.value}
                  >
                    <div className="flex items-center gap-2">
                      <span>{option.icon}</span>
                      <span className={cn("font-medium", option.color)}>
                        {option.label}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormDescription className="text-xs md:text-sm">
              Be honest about the property's current condition
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Summary Card */}
      <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
        <h3 className="mb-3 font-semibold text-base">Property Summary</h3>
        <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
          <div>
            <p className="text-muted-foreground">Bedrooms</p>
            <p className="font-semibold text-lg">{bedrooms}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Bathrooms</p>
            <p className="font-semibold text-lg">{bathrooms}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Area</p>
            <p className="font-semibold text-lg">
              {form.watch("totalArea")
                ? `${form.watch("totalArea")} m²`
                : "N/A"}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Condition</p>
            <p className="font-semibold text-lg">
              {CONDITION_OPTIONS.find(
                (o) => o.value === form.watch("condition")
              )?.icon || "—"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
