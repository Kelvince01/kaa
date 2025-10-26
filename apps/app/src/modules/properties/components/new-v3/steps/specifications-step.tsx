"use client";

import { Badge } from "@kaa/ui/components/badge";
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
import { Bath, Bed, Home, Maximize, Sparkles } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import type { PropertyFormData } from "../schema";

const FURNISHED_OPTIONS = [
  {
    value: "unfurnished",
    label: "Unfurnished",
    description: "Empty property, no furniture included",
    icon: "⬜",
  },
  {
    value: "semi_furnished",
    label: "Semi-Furnished",
    description: "Basic furniture and appliances",
    icon: "🛋️",
  },
  {
    value: "fully_furnished",
    label: "Fully Furnished",
    description: "Move-in ready with all furniture",
    icon: "🏡",
  },
];

const CONDITION_OPTIONS = [
  {
    value: "new",
    label: "Brand New",
    description: "Never occupied, pristine condition",
    icon: "✨",
    color: "text-green-600",
  },
  {
    value: "excellent",
    label: "Excellent",
    description: "Recently renovated, like new",
    icon: "⭐",
    color: "text-blue-600",
  },
  {
    value: "good",
    label: "Good",
    description: "Well-maintained, ready to occupy",
    icon: "👍",
    color: "text-yellow-600",
  },
  {
    value: "fair",
    label: "Fair",
    description: "Usable but may need minor repairs",
    icon: "🔧",
    color: "text-orange-600",
  },
  {
    value: "needs_renovation",
    label: "Needs Renovation",
    description: "Requires significant repairs",
    icon: "🛠️",
    color: "text-red-600",
  },
];

type SpecificationsStepProps = {
  form: UseFormReturn<PropertyFormData>;
};

export function SpecificationsStep({ form }: SpecificationsStepProps) {
  const watchedValues = form.watch();

  return (
    <div className="space-y-6">
      {/* Bedrooms and Bathrooms */}
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="bedrooms"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2 font-semibold text-base">
                <Bed className="h-4 w-4" />
                Bedrooms <span className="text-red-500">*</span>
              </FormLabel>
              <FormDescription className="text-xs">
                Number of bedrooms
              </FormDescription>
              <FormControl>
                <Input
                  min={0}
                  placeholder="0"
                  type="number"
                  {...field}
                  onChange={(e) =>
                    field.onChange(Number.parseInt(e.target.value, 10) || 0)
                  }
                />
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
              <FormLabel className="flex items-center gap-2 font-semibold text-base">
                <Bath className="h-4 w-4" />
                Bathrooms <span className="text-red-500">*</span>
              </FormLabel>
              <FormDescription className="text-xs">
                Number of bathrooms
              </FormDescription>
              <FormControl>
                <Input
                  min={0}
                  placeholder="0"
                  type="number"
                  {...field}
                  onChange={(e) =>
                    field.onChange(Number.parseInt(e.target.value, 10) || 0)
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Total Area (Optional) */}
      <FormField
        control={form.control}
        name="totalArea"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-2 font-semibold text-base">
              <Maximize className="h-4 w-4" />
              Total Area (Optional)
            </FormLabel>
            <FormDescription className="text-xs">
              Property size in square meters (m²)
            </FormDescription>
            <FormControl>
              <div className="relative">
                <Input
                  min={0}
                  placeholder="e.g., 120"
                  type="number"
                  {...field}
                  onChange={(e) =>
                    field.onChange(
                      e.target.value
                        ? Number.parseFloat(e.target.value)
                        : undefined
                    )
                  }
                  value={field.value || ""}
                />
                <span className="-translate-y-1/2 absolute top-1/2 right-3 text-muted-foreground text-sm">
                  m²
                </span>
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Furnished Status */}
      <FormField
        control={form.control}
        name="furnished"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-2 font-semibold text-base">
              <Home className="h-4 w-4" />
              Furnishing Status <span className="text-red-500">*</span>
            </FormLabel>
            <FormDescription className="text-xs">
              Level of furniture and appliances included
            </FormDescription>
            <Select defaultValue={field.value} onValueChange={field.onChange}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select furnishing status" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {FURNISHED_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <span>{option.icon}</span>
                      <div className="text-left">
                        <div className="font-medium">{option.label}</div>
                        <div className="text-muted-foreground text-xs">
                          {option.description}
                        </div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            <FormLabel className="flex items-center gap-2 font-semibold text-base">
              <Sparkles className="h-4 w-4" />
              Property Condition <span className="text-red-500">*</span>
            </FormLabel>
            <FormDescription className="text-xs">
              Current state of the property
            </FormDescription>
            <Select defaultValue={field.value} onValueChange={field.onChange}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select property condition" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {CONDITION_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <span>{option.icon}</span>
                      <div className="text-left">
                        <div className={`font-medium ${option.color}`}>
                          {option.label}
                        </div>
                        <div className="text-muted-foreground text-xs">
                          {option.description}
                        </div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Summary Card */}
      {(watchedValues.bedrooms ||
        watchedValues.bathrooms ||
        watchedValues.furnished ||
        watchedValues.condition) && (
        <Card className="border-gray-200 bg-linear-to-br from-gray-50 to-white dark:from-gray-900 dark:to-background">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Property Summary</CardTitle>
            <CardDescription className="text-xs">
              Quick overview of specifications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 text-sm sm:grid-cols-2">
              {watchedValues.bedrooms !== undefined && (
                <div className="flex items-center gap-2">
                  <Bed className="h-4 w-4 text-muted-foreground" />
                  <span>
                    <strong>{watchedValues.bedrooms}</strong> Bedroom
                    {watchedValues.bedrooms !== 1 ? "s" : ""}
                  </span>
                </div>
              )}
              {watchedValues.bathrooms !== undefined && (
                <div className="flex items-center gap-2">
                  <Bath className="h-4 w-4 text-muted-foreground" />
                  <span>
                    <strong>{watchedValues.bathrooms}</strong> Bathroom
                    {watchedValues.bathrooms !== 1 ? "s" : ""}
                  </span>
                </div>
              )}
              {watchedValues.totalArea && (
                <div className="flex items-center gap-2">
                  <Maximize className="h-4 w-4 text-muted-foreground" />
                  <span>
                    <strong>{watchedValues.totalArea}</strong> m²
                  </span>
                </div>
              )}
              {watchedValues.furnished && (
                <div className="flex items-center gap-2">
                  <Home className="h-4 w-4 text-muted-foreground" />
                  <Badge className="capitalize" variant="secondary">
                    {watchedValues.furnished.replace("_", " ")}
                  </Badge>
                </div>
              )}
              {watchedValues.condition && (
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-muted-foreground" />
                  <Badge className="capitalize" variant="outline">
                    {watchedValues.condition.replace("_", " ")}
                  </Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
