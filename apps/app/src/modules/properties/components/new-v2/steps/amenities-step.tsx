"use client";

import { Badge } from "@kaa/ui/components/badge";
import { Checkbox } from "@kaa/ui/components/checkbox";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@kaa/ui/components/form";
import {
  Camera,
  Car,
  Droplets,
  Dumbbell,
  Home,
  Shield,
  Store,
  Sun,
  Trash2,
  Trees,
  Users,
  Waves,
  Wifi,
  Wind,
  Zap,
} from "lucide-react";
import { useFormContext } from "react-hook-form";
import type { PropertyFormData } from "../schema";

type AmenityOption = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  category: "essential" | "comfort" | "luxury" | "outdoor";
};

const AMENITY_OPTIONS: AmenityOption[] = [
  // Essential
  { id: "water", label: "Water Supply", icon: Droplets, category: "essential" },
  { id: "electricity", label: "Electricity", icon: Zap, category: "essential" },
  { id: "parking", label: "Parking", icon: Car, category: "essential" },
  {
    id: "security",
    label: "24/7 Security",
    icon: Shield,
    category: "essential",
  },
  {
    id: "internet",
    label: "Internet Ready",
    icon: Wifi,
    category: "essential",
  },

  // Comfort
  { id: "lift", label: "Elevator/Lift", icon: Wind, category: "comfort" },
  {
    id: "generator",
    label: "Backup Generator",
    icon: Zap,
    category: "comfort",
  },
  { id: "cctv", label: "CCTV Surveillance", icon: Camera, category: "comfort" },
  { id: "caretaker", label: "Caretaker", icon: Users, category: "comfort" },
  {
    id: "garbage",
    label: "Waste Collection",
    icon: Trash2,
    category: "comfort",
  },

  // Luxury
  {
    id: "gym",
    label: "Gym/Fitness Center",
    icon: Dumbbell,
    category: "luxury",
  },
  {
    id: "swimmingPool",
    label: "Swimming Pool",
    icon: Waves,
    category: "luxury",
  },
  { id: "solarPower", label: "Solar Power", icon: Sun, category: "luxury" },
  { id: "balcony", label: "Balcony", icon: Home, category: "luxury" },
  { id: "storeRoom", label: "Store Room", icon: Store, category: "luxury" },

  // Outdoor
  { id: "garden", label: "Garden", icon: Trees, category: "outdoor" },
  { id: "compound", label: "Compound", icon: Home, category: "outdoor" },
  { id: "borehole", label: "Borehole", icon: Droplets, category: "outdoor" },
];

const CATEGORY_LABELS = {
  essential: "Essential Amenities",
  comfort: "Comfort & Convenience",
  luxury: "Premium Features",
  outdoor: "Outdoor & Extras",
};

export function AmenitiesStep() {
  const form = useFormContext<PropertyFormData>();
  const selectedAmenities = form.watch("amenities") || [];

  const handleToggleAmenity = (amenityId: string) => {
    const current = selectedAmenities;
    const updated = current.includes(amenityId)
      ? current.filter((id) => id !== amenityId)
      : [...current, amenityId];

    form.setValue("amenities", updated, { shouldValidate: true });
  };

  const categorizedAmenities = AMENITY_OPTIONS.reduce(
    (acc, amenity) => {
      if (!acc[amenity.category]) {
        acc[amenity.category] = [];
      }
      acc[amenity.category]?.push(amenity);
      return acc;
    },
    {} as Record<string, AmenityOption[]>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-2 font-semibold text-2xl text-foreground">
          Amenities & Features
        </h2>
        <p className="text-muted-foreground text-sm">
          Select the amenities available at your property
        </p>
      </div>

      <FormField
        control={form.control}
        name="amenities"
        render={() => (
          <FormItem>
            <div className="space-y-6">
              {Object.entries(categorizedAmenities).map(
                ([category, amenities]) => (
                  <div className="space-y-4" key={category}>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground text-sm">
                        {
                          CATEGORY_LABELS[
                            category as keyof typeof CATEGORY_LABELS
                          ]
                        }
                      </h3>
                      <Badge className="text-xs" variant="outline">
                        {
                          amenities.filter((a) =>
                            selectedAmenities.includes(a.id)
                          ).length
                        }{" "}
                        / {amenities.length}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {amenities.map((amenity) => {
                        const Icon = amenity.icon;
                        const isSelected = selectedAmenities.includes(
                          amenity.id
                        );

                        return (
                          <FormItem
                            className={`flex cursor-pointer items-center space-x-3 space-y-0 rounded-lg border p-4 transition-all ${
                              isSelected
                                ? "border-primary bg-primary/10 shadow-sm"
                                : "hover:border-border hover:bg-accent/50"
                            }
                          `}
                            key={amenity.id}
                            onClick={() => handleToggleAmenity(amenity.id)}
                          >
                            <FormControl>
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() =>
                                  handleToggleAmenity(amenity.id)
                                }
                              />
                            </FormControl>
                            <Icon
                              className={`h-5 w-5 shrink-0 ${
                                isSelected
                                  ? "text-primary"
                                  : "text-muted-foreground"
                              }`}
                            />
                            <FormLabel className="flex-1 cursor-pointer font-normal">
                              {amenity.label}
                            </FormLabel>
                          </FormItem>
                        );
                      })}
                    </div>
                  </div>
                )
              )}
            </div>
            <FormDescription className="mt-4">
              Select all amenities that apply. More amenities help attract
              tenants.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {selectedAmenities.length > 0 && (
        <div className="rounded-lg bg-muted/50 p-4">
          <h3 className="mb-3 font-medium text-sm">
            Selected Amenities ({selectedAmenities.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {selectedAmenities.map((amenityId) => {
              const amenity = AMENITY_OPTIONS.find((a) => a.id === amenityId);
              if (!amenity) return null;
              const Icon = amenity.icon;

              return (
                <Badge
                  className="px-3 py-1.5 text-sm"
                  key={amenityId}
                  variant="secondary"
                >
                  <Icon className="mr-1.5 h-3 w-3" />
                  {amenity.label}
                </Badge>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
