"use client";

import { Badge } from "@kaa/ui/components/badge";
import {
  FormDescription,
  FormField,
  FormItem,
  FormMessage,
} from "@kaa/ui/components/form";
import { cn } from "@kaa/ui/lib/utils";
import { Check } from "lucide-react";
import { useFormContext } from "react-hook-form";
import type { PropertyFormData } from "../schema";

const AMENITY_CATEGORIES = [
  {
    title: "Basic Amenities",
    icon: "🏠",
    amenities: [
      { value: "water", label: "Water Supply", icon: "💧" },
      { value: "electricity", label: "Electricity", icon: "⚡" },
      { value: "internet", label: "Internet/WiFi", icon: "📶" },
      { value: "parking", label: "Parking", icon: "🅿️" },
    ],
  },
  {
    title: "Security",
    icon: "🔒",
    amenities: [
      { value: "security", label: "24/7 Security", icon: "👮" },
      { value: "cctv", label: "CCTV Cameras", icon: "📹" },
      { value: "gated", label: "Gated Community", icon: "🚧" },
      { value: "intercom", label: "Intercom System", icon: "📞" },
    ],
  },
  {
    title: "Premium Features",
    icon: "⭐",
    amenities: [
      { value: "gym", label: "Gymnasium", icon: "🏋️" },
      { value: "pool", label: "Swimming Pool", icon: "🏊" },
      { value: "garden", label: "Garden/Green Space", icon: "🌳" },
      { value: "playground", label: "Children's Playground", icon: "🎪" },
      { value: "lift", label: "Elevator/Lift", icon: "🛗" },
    ],
  },
  {
    title: "Utilities & Services",
    icon: "🔧",
    amenities: [
      { value: "generator", label: "Backup Generator", icon: "🔌" },
      { value: "borehole", label: "Borehole/Water Tank", icon: "🚰" },
      { value: "garbage", label: "Garbage Collection", icon: "🗑️" },
      { value: "laundry", label: "Laundry Services", icon: "👕" },
      { value: "caretaker", label: "On-site Caretaker", icon: "👨‍🔧" },
    ],
  },
];

export function AmenitiesStep() {
  const form = useFormContext<PropertyFormData>();
  const selectedAmenities = form.watch("amenities") || [];

  const toggleAmenity = (value: string) => {
    const currentAmenities = form.getValues("amenities") || [];

    if (currentAmenities.includes(value)) {
      form.setValue(
        "amenities",
        currentAmenities.filter((a) => a !== value),
        { shouldValidate: true }
      );
    } else {
      form.setValue("amenities", [...currentAmenities, value], {
        shouldValidate: true,
      });
    }
  };

  const isSelected = (value: string) => selectedAmenities.includes(value);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h2 className="font-semibold text-2xl text-foreground md:text-3xl">
          Amenities & Features
        </h2>
        <p className="text-muted-foreground text-sm md:text-base">
          Select all amenities available at your property
        </p>
      </div>

      {/* Selection Counter */}
      <div className="flex items-center gap-2">
        <Badge className="text-sm" variant="secondary">
          {selectedAmenities.length} Selected
        </Badge>
        {selectedAmenities.length === 0 && (
          <p className="text-muted-foreground text-sm">
            Select at least one amenity
          </p>
        )}
      </div>

      {/* Amenity Categories */}
      <FormField
        control={form.control}
        name="amenities"
        render={() => (
          <FormItem>
            <div className="space-y-6">
              {AMENITY_CATEGORIES.map((category) => (
                <div className="space-y-3" key={category.title}>
                  {/* Category Header */}
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{category.icon}</span>
                    <h3 className="font-semibold text-base md:text-lg">
                      {category.title}
                    </h3>
                  </div>

                  {/* Amenity Grid */}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {category.amenities.map((amenity) => (
                      <button
                        className={cn(
                          "flex items-center gap-3 rounded-lg border-2 p-4 text-left transition-all",
                          "hover:border-primary/50 hover:bg-primary/5",
                          "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                          isSelected(amenity.value)
                            ? "border-primary bg-primary/10"
                            : "border-border"
                        )}
                        key={amenity.value}
                        onClick={() => toggleAmenity(amenity.value)}
                        type="button"
                      >
                        {/* Icon */}
                        <div
                          className={cn(
                            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-xl transition-colors",
                            isSelected(amenity.value)
                              ? "bg-primary/20"
                              : "bg-muted"
                          )}
                        >
                          {amenity.icon}
                        </div>

                        {/* Label */}
                        <div className="flex-1">
                          <p
                            className={cn(
                              "font-medium text-sm",
                              isSelected(amenity.value) && "text-primary"
                            )}
                          >
                            {amenity.label}
                          </p>
                        </div>

                        {/* Check Mark */}
                        {isSelected(amenity.value) && (
                          <div className="shrink-0">
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                              <Check className="h-4 w-4" />
                            </div>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <FormDescription className="mt-4 text-xs md:text-sm">
              Select all that apply. The more amenities you add, the more
              attractive your listing becomes.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Summary */}
      {selectedAmenities.length > 0 && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
          <h4 className="mb-2 font-semibold text-sm">Selected Amenities</h4>
          <div className="flex flex-wrap gap-2">
            {selectedAmenities.map((amenityValue) => {
              const amenity = AMENITY_CATEGORIES.flatMap(
                (c) => c.amenities
              ).find((a) => a.value === amenityValue);
              return amenity ? (
                <div
                  className="flex items-center gap-1 rounded-md bg-background px-2 py-1 text-xs"
                  key={amenityValue}
                >
                  <span>{amenity.icon}</span>
                  <span>{amenity.label}</span>
                </div>
              ) : null;
            })}
          </div>
        </div>
      )}
    </div>
  );
}
