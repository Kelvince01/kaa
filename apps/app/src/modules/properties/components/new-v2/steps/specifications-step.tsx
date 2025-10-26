"use client";

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@kaa/ui/components/form";
import { Input } from "@kaa/ui/components/input";
import { RadioGroup, RadioGroupItem } from "@kaa/ui/components/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@kaa/ui/components/select";
import { Bath, Bed, Home, Maximize } from "lucide-react";
import { useFormContext } from "react-hook-form";
import type { PropertyFormData } from "../schema";

const FURNISHED_OPTIONS = [
  { value: "unfurnished", label: "Unfurnished" },
  { value: "semi_furnished", label: "Semi-Furnished" },
  { value: "fully_furnished", label: "Fully Furnished" },
];

const CONDITION_OPTIONS = [
  {
    value: "new",
    label: "New/Never Lived In",
    description: "Brand new property",
  },
  {
    value: "excellent",
    label: "Excellent",
    description: "Recently renovated or well-maintained",
  },
  { value: "good", label: "Good", description: "Well-maintained, minor wear" },
  { value: "fair", label: "Fair", description: "Usable but needs some work" },
  {
    value: "needs_renovation",
    label: "Needs Renovation",
    description: "Requires significant work",
  },
];

export function SpecificationsStep() {
  const form = useFormContext<PropertyFormData>();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-2 font-semibold text-2xl text-foreground">
          Property Specifications
        </h2>
        <p className="text-muted-foreground text-sm">
          Provide detailed information about your property's features
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <FormField
          control={form.control}
          name="bedrooms"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bedrooms *</FormLabel>
              <FormControl>
                <div className="relative">
                  <Bed className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-10 text-base"
                    max={50}
                    min={0}
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

        <FormField
          control={form.control}
          name="bathrooms"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bathrooms *</FormLabel>
              <FormControl>
                <div className="relative">
                  <Bath className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-10 text-base"
                    max={50}
                    min={0}
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

        <FormField
          control={form.control}
          name="totalArea"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Total Area (m²) (Optional)</FormLabel>
              <FormControl>
                <div className="relative">
                  <Maximize className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-10 text-base"
                    min={0}
                    placeholder="e.g., 85.5"
                    step={0.1}
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
              <FormDescription>Square meters of usable space</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <FormField
          control={form.control}
          name="furnished"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Furnishing Status *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="text-base">
                    <Home className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Select furnishing status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {FURNISHED_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="condition"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Property Condition *</FormLabel>
              <RadioGroup
                className="space-y-3"
                onValueChange={field.onChange}
                value={field.value}
              >
                {CONDITION_OPTIONS.map((option) => (
                  <FormItem
                    className="flex items-start space-x-3 space-y-0 rounded-lg border p-4 transition-colors hover:bg-accent/50"
                    key={option.value}
                  >
                    <FormControl>
                      <RadioGroupItem value={option.value} />
                    </FormControl>
                    <div className="flex-1 space-y-1 leading-none">
                      <FormLabel className="cursor-pointer font-medium">
                        {option.label}
                      </FormLabel>
                      <FormDescription className="text-xs">
                        {option.description}
                      </FormDescription>
                    </div>
                  </FormItem>
                ))}
              </RadioGroup>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="space-y-2 rounded-lg bg-muted/50 p-4">
        <h3 className="flex items-center gap-2 font-medium text-sm">
          <Home className="h-4 w-4" />
          Specification Summary
        </h3>
        <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
          <div>
            <span className="text-muted-foreground">Bedrooms:</span>
            <span className="ml-2 font-medium">
              {form.watch("bedrooms") || 0}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Bathrooms:</span>
            <span className="ml-2 font-medium">
              {form.watch("bathrooms") || 0}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Area:</span>
            <span className="ml-2 font-medium">
              {form.watch("totalArea")
                ? `${form.watch("totalArea")} m²`
                : "Not specified"}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Condition:</span>
            <span className="ml-2 font-medium capitalize">
              {form.watch("condition")?.replace("_", " ") || "Not selected"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
