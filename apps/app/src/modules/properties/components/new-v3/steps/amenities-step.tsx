"use client";

import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import { FormField, FormItem, FormMessage } from "@kaa/ui/components/form";
import { Input } from "@kaa/ui/components/input";
import { CheckCircle2, Plus, X } from "lucide-react";
import { useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import type { PropertyFormData } from "../schema";

const AMENITY_CATEGORIES = [
  {
    name: "Essential",
    amenities: [
      { id: "water", label: "Water Supply", icon: "💧" },
      { id: "electricity", label: "Electricity", icon: "⚡" },
      { id: "security", label: "Security", icon: "🔒" },
      { id: "parking", label: "Parking", icon: "🅿️" },
    ],
  },
  {
    name: "Comfort",
    amenities: [
      { id: "wifi", label: "Wi-Fi/Internet", icon: "📶" },
      { id: "balcony", label: "Balcony", icon: "🏖️" },
      { id: "ac", label: "Air Conditioning", icon: "❄️" },
      { id: "heating", label: "Heating", icon: "🔥" },
      { id: "elevator", label: "Elevator/Lift", icon: "🛗" },
    ],
  },
  {
    name: "Luxury",
    amenities: [
      { id: "gym", label: "Gym/Fitness Center", icon: "💪" },
      { id: "pool", label: "Swimming Pool", icon: "🏊" },
      { id: "garden", label: "Garden", icon: "🌳" },
      { id: "playground", label: "Playground", icon: "🎠" },
      { id: "clubhouse", label: "Clubhouse", icon: "🏛️" },
    ],
  },
  {
    name: "Appliances",
    amenities: [
      { id: "washer", label: "Washing Machine", icon: "🧺" },
      { id: "dryer", label: "Dryer", icon: "🌀" },
      { id: "fridge", label: "Refrigerator", icon: "🧊" },
      { id: "microwave", label: "Microwave", icon: "📻" },
      { id: "oven", label: "Oven/Stove", icon: "🍳" },
    ],
  },
  {
    name: "Outdoor",
    amenities: [
      { id: "bbq", label: "BBQ Area", icon: "🍖" },
      { id: "terrace", label: "Terrace", icon: "🏞️" },
      { id: "garage", label: "Garage", icon: "🚗" },
      { id: "storage", label: "Storage Room", icon: "📦" },
      { id: "compound", label: "Private Compound", icon: "🏘️" },
    ],
  },
];

type AmenitiesStepProps = {
  form: UseFormReturn<PropertyFormData>;
};

export function AmenitiesStep({ form }: AmenitiesStepProps) {
  const [customAmenity, setCustomAmenity] = useState("");

  const watchedAmenities = form.watch("amenities") || [];

  const toggleAmenity = (amenityId: string) => {
    const current = watchedAmenities;
    if (current.includes(amenityId)) {
      form.setValue(
        "amenities",
        current.filter((a) => a !== amenityId)
      );
    } else {
      form.setValue("amenities", [...current, amenityId]);
    }
  };

  const addCustomAmenity = () => {
    if (
      customAmenity.trim() &&
      !watchedAmenities.includes(customAmenity.trim())
    ) {
      form.setValue("amenities", [...watchedAmenities, customAmenity.trim()]);
      setCustomAmenity("");
    }
  };

  const removeAmenity = (amenityId: string) => {
    form.setValue(
      "amenities",
      watchedAmenities.filter((a) => a !== amenityId)
    );
  };

  // Get custom amenities (those not in predefined list)
  const allPredefinedIds = AMENITY_CATEGORIES.flatMap((cat) =>
    cat.amenities.map((a) => a.id)
  );
  const customAmenities = watchedAmenities.filter(
    (a) => !allPredefinedIds.includes(a)
  );

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-base">
          Property Amenities & Features <span className="text-red-500">*</span>
        </h3>
        <p className="text-muted-foreground text-sm">
          Select all amenities available in your property
        </p>
      </div>

      {/* Amenity Categories */}
      {AMENITY_CATEGORIES.map((category) => (
        <Card className="border-gray-200" key={category.name}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">{category.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
              {category.amenities.map((amenity) => {
                const isSelected = watchedAmenities.includes(amenity.id);
                return (
                  <Button
                    className={`h-auto justify-start gap-2 whitespace-normal border-2 py-3 text-left transition-all ${
                      isSelected
                        ? "border-primary bg-primary/10"
                        : "border-gray-200 hover:border-primary/50"
                    }`}
                    key={amenity.id}
                    onClick={() => toggleAmenity(amenity.id)}
                    type="button"
                    variant="outline"
                  >
                    <span className="text-lg">{amenity.icon}</span>
                    <span className="flex-1 text-xs">{amenity.label}</span>
                    {isSelected && (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                    )}
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Custom Amenities */}
      <Card className="border-blue-200 bg-linear-to-br from-blue-50 to-white dark:from-blue-950 dark:to-background">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Custom Amenities</CardTitle>
          <CardDescription className="text-xs">
            Add any additional features not listed above
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              className="text-sm"
              onChange={(e) => setCustomAmenity(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCustomAmenity();
                }
              }}
              placeholder="Enter custom amenity..."
              value={customAmenity}
            />
            <Button
              onClick={addCustomAmenity}
              size="sm"
              type="button"
              variant="secondary"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {customAmenities.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {customAmenities.map((amenity) => (
                <Badge
                  className="cursor-pointer py-1"
                  key={amenity}
                  onClick={() => removeAmenity(amenity)}
                  variant="secondary"
                >
                  {amenity}
                  <X className="ml-1 h-3 w-3" />
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Selected Amenities Summary */}
      <FormField
        control={form.control}
        name="amenities"
        render={() => (
          <FormItem>
            {watchedAmenities.length > 0 ? (
              <Card className="border-green-200 bg-linear-to-br from-green-50 to-white dark:from-green-950 dark:to-background">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    Selected Amenities ({watchedAmenities.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {watchedAmenities.map((amenityId) => {
                      const found = AMENITY_CATEGORIES.flatMap(
                        (cat) => cat.amenities
                      ).find((a) => a.id === amenityId);
                      return (
                        <Badge
                          className="cursor-pointer py-1"
                          key={amenityId}
                          onClick={() => removeAmenity(amenityId)}
                          variant="default"
                        >
                          {found ? (
                            <>
                              <span className="mr-1">{found.icon}</span>
                              {found.label}
                            </>
                          ) : (
                            amenityId
                          )}
                          <X className="ml-1 h-3 w-3" />
                        </Badge>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="rounded-lg border border-gray-300 border-dashed bg-gray-50 p-8 text-center dark:bg-gray-900">
                <p className="text-muted-foreground text-sm">
                  No amenities selected yet. Select at least one amenity to
                  continue.
                </p>
              </div>
            )}
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
