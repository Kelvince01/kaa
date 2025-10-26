"use client";

import { Badge } from "@kaa/ui/components/badge";
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
import { MapPin, Plus, X } from "lucide-react";
import { useState } from "react";
import { useFormContext } from "react-hook-form";
import type { PropertyFormData } from "../schema";

// Kenya counties for autocomplete
const KENYA_COUNTIES = [
  "Nairobi",
  "Mombasa",
  "Kisumu",
  "Nakuru",
  "Eldoret",
  "Thika",
  "Malindi",
  "Kitale",
  "Garissa",
  "Kakamega",
  "Machakos",
  "Meru",
  "Nyeri",
  "Kiambu",
].sort();

export function LocationStep() {
  const form = useFormContext<PropertyFormData>();
  const [amenityInput, setAmenityInput] = useState("");
  const nearbyAmenities = form.watch("nearbyAmenities") || [];

  const handleAddAmenity = () => {
    const newAmenity = amenityInput.trim();
    if (newAmenity && !nearbyAmenities.includes(newAmenity)) {
      form.setValue("nearbyAmenities", [...nearbyAmenities, newAmenity], {
        shouldValidate: true,
      });
      setAmenityInput("");
    }
  };

  const handleRemoveAmenity = (amenity: string) => {
    form.setValue(
      "nearbyAmenities",
      nearbyAmenities.filter((a) => a !== amenity),
      { shouldValidate: true }
    );
  };

  const handleUseCurrentLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          form.setValue("coordinates", {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-2 font-semibold text-2xl text-foreground">
          Location Details
        </h2>
        <p className="text-muted-foreground text-sm">
          Help tenants find your property with accurate location information
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <FormField
          control={form.control}
          name="county"
          render={({ field }) => (
            <FormItem>
              <FormLabel>County *</FormLabel>
              <FormControl>
                <Input
                  className="text-base"
                  list="counties"
                  placeholder="e.g., Nairobi"
                  {...field}
                />
              </FormControl>
              <datalist id="counties">
                {KENYA_COUNTIES.map((county) => (
                  <option key={county} value={county} />
                ))}
              </datalist>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="estate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Estate/Neighborhood *</FormLabel>
              <FormControl>
                <Input
                  className="text-base"
                  placeholder="e.g., Kilimani, Westlands"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel>Street Address *</FormLabel>
              <FormControl>
                <Input
                  className="text-base"
                  placeholder="e.g., Argwings Kodhek Road, Building 12"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Provide the full street address or directions
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="buildingName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Building Name (Optional)</FormLabel>
              <FormControl>
                <Input
                  className="text-base"
                  placeholder="e.g., Sunrise Apartments"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="plotNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Plot Number (Optional)</FormLabel>
              <FormControl>
                <Input
                  className="text-base"
                  placeholder="e.g., LR No. 209/12345"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4 md:col-span-2">
          <div className="flex items-center justify-between">
            <FormLabel>GPS Coordinates *</FormLabel>
            <Button
              className="text-xs"
              onClick={handleUseCurrentLocation}
              size="sm"
              type="button"
              variant="outline"
            >
              <MapPin className="mr-1 h-3 w-3" />
              Use Current Location
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="coordinates.latitude"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Latitude</FormLabel>
                  <FormControl>
                    <Input
                      className="text-base"
                      placeholder="-1.2864"
                      step="any"
                      type="number"
                      {...field}
                      onChange={(e) =>
                        field.onChange(Number.parseFloat(e.target.value))
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="coordinates.longitude"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Longitude</FormLabel>
                  <FormControl>
                    <Input
                      className="text-base"
                      placeholder="36.8172"
                      step="any"
                      type="number"
                      {...field}
                      onChange={(e) =>
                        field.onChange(Number.parseFloat(e.target.value))
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormDescription>
            Accurate coordinates help tenants find your property on the map
          </FormDescription>
        </div>

        <div className="md:col-span-2">
          <FormLabel>Nearby Amenities (Optional)</FormLabel>
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                className="flex-1 text-base"
                onChange={(e) => setAmenityInput(e.target.value)}
                onKeyDown={(e) =>
                  // biome-ignore lint/complexity/noCommaOperator: ignore
                  e.key === "Enter" && (e.preventDefault(), handleAddAmenity())
                }
                placeholder="e.g., Westgate Mall, Aga Khan Hospital"
                value={amenityInput}
              />
              <Button
                onClick={handleAddAmenity}
                size="icon"
                type="button"
                variant="outline"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {nearbyAmenities.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {nearbyAmenities.map((amenity) => (
                  <Badge
                    className="px-3 py-1.5 text-sm"
                    key={amenity}
                    variant="secondary"
                  >
                    {amenity}
                    <button
                      className="ml-2 hover:text-destructive"
                      onClick={() => handleRemoveAmenity(amenity)}
                      type="button"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            <FormDescription>
              List nearby schools, hospitals, shopping centers, or transport
              hubs
            </FormDescription>
          </div>
        </div>
      </div>
    </div>
  );
}
