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
import { cn } from "@kaa/ui/lib/utils";
import { MapPin, Navigation, Search } from "lucide-react";
import { useState } from "react";
import { useFormContext } from "react-hook-form";
import type { PropertyFormData } from "../schema";

const KENYAN_COUNTIES = [
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
  "Nyeri",
  "Meru",
  "Kiambu",
  "Machakos",
  "Kajiado",
  "Murang'a",
  "Kirinyaga",
  "Embu",
  "Narok",
  "Laikipia",
].sort();

const POPULAR_ESTATES: Record<string, string[]> = {
  Nairobi: [
    "Kilimani",
    "Westlands",
    "Lavington",
    "Kileleshwa",
    "Karen",
    "Runda",
    "Parklands",
    "Ruaka",
    "Kitisuru",
    "Spring Valley",
    "Muthaiga",
    "Rosslyn",
    "Ridgeways",
    "Upperhill",
    "Hurlingham",
    "South B",
    "South C",
    "Embakasi",
    "Kasarani",
    "Roysambu",
    "Thome",
    "Kahawa",
  ].sort(),
  Mombasa: [
    "Nyali",
    "Bamburi",
    "Shanzu",
    "Mtwapa",
    "Diani",
    "Likoni",
    "CBD",
    "Tudor",
  ].sort(),
};

export function LocationStep() {
  const form = useFormContext<PropertyFormData>();
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [nearbyInput, setNearbyInput] = useState("");

  const county = form.watch("county");
  const nearbyAmenities = form.watch("nearbyAmenities") || [];

  const handleGetCurrentLocation = async () => {
    if (!navigator.geolocation) {
      return;
    }

    setIsLoadingLocation(true);

    try {
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        }
      );

      form.setValue(
        "coordinates",
        {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        },
        { shouldValidate: true }
      );
    } catch (error) {
      console.error("Error getting location:", error);
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const handleAddNearbyAmenity = () => {
    const amenity = nearbyInput.trim();
    if (amenity && !nearbyAmenities.includes(amenity)) {
      form.setValue("nearbyAmenities", [...nearbyAmenities, amenity], {
        shouldValidate: true,
      });
      setNearbyInput("");
    }
  };

  const handleRemoveAmenity = (amenity: string) => {
    form.setValue(
      "nearbyAmenities",
      nearbyAmenities.filter((a) => a !== amenity),
      { shouldValidate: true }
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h2 className="font-semibold text-2xl text-foreground md:text-3xl">
          Location Details
        </h2>
        <p className="text-muted-foreground text-sm md:text-base">
          Help tenants find your property with accurate location information
        </p>
      </div>

      {/* County Field */}
      <FormField
        control={form.control}
        name="county"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-base">County *</FormLabel>
            <FormControl>
              <div className="relative">
                <Search className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-10 text-base"
                  list="counties-list"
                  placeholder="Select or type your county"
                  {...field}
                />
                <datalist id="counties-list">
                  {KENYAN_COUNTIES.map((county) => (
                    <option key={county} value={county} />
                  ))}
                </datalist>
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Estate/Neighborhood */}
      <FormField
        control={form.control}
        name="estate"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-base">Estate / Neighborhood *</FormLabel>
            <FormControl>
              <div className="relative">
                <MapPin className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-10 text-base"
                  list={
                    county && POPULAR_ESTATES[county]
                      ? "estates-list"
                      : undefined
                  }
                  placeholder="e.g., Kilimani, Westlands"
                  {...field}
                />
                {county && POPULAR_ESTATES[county] && (
                  <datalist id="estates-list">
                    {POPULAR_ESTATES[county].map((estate) => (
                      <option key={estate} value={estate} />
                    ))}
                  </datalist>
                )}
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Address */}
      <FormField
        control={form.control}
        name="address"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-base">Street Address *</FormLabel>
            <FormControl>
              <Input
                className="text-base"
                placeholder="e.g., 123 Moi Avenue, Building A"
                {...field}
              />
            </FormControl>
            <FormDescription className="text-xs md:text-sm">
              Provide the specific street address or directions
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Plot Number and Building Name */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FormField
          control={form.control}
          name="plotNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base">
                Plot Number (Optional)
              </FormLabel>
              <FormControl>
                <Input
                  className="text-base"
                  placeholder="e.g., LR 209/1234"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="buildingName"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base">
                Building Name (Optional)
              </FormLabel>
              <FormControl>
                <Input
                  className="text-base"
                  placeholder="e.g., Sunset Apartments"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Coordinates */}
      <div className="space-y-3">
        <FormLabel className="text-base">GPS Coordinates *</FormLabel>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="coordinates.latitude"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm">Latitude</FormLabel>
                <FormControl>
                  <Input
                    className="text-base"
                    placeholder="-1.286389"
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
                <FormLabel className="text-sm">Longitude</FormLabel>
                <FormControl>
                  <Input
                    className="text-base"
                    placeholder="36.817223"
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

        <Button
          className="w-full md:w-auto"
          disabled={isLoadingLocation}
          onClick={handleGetCurrentLocation}
          size="sm"
          type="button"
          variant="outline"
        >
          <Navigation
            className={cn("mr-2 h-4 w-4", isLoadingLocation && "animate-spin")}
          />
          {isLoadingLocation ? "Getting Location..." : "Use Current Location"}
        </Button>
      </div>

      {/* Nearby Amenities */}
      <div className="space-y-3">
        <FormLabel className="text-base">Nearby Amenities (Optional)</FormLabel>
        <div className="flex gap-2">
          <Input
            className="flex-1 text-base"
            onChange={(e) => setNearbyInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddNearbyAmenity();
              }
            }}
            placeholder="e.g., Sarit Centre, Yaya Centre, ABC Place"
            value={nearbyInput}
          />
          <Button
            onClick={handleAddNearbyAmenity}
            size="sm"
            type="button"
            variant="outline"
          >
            Add
          </Button>
        </div>

        {nearbyAmenities.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {nearbyAmenities.map((amenity) => (
              <div
                className="flex items-center gap-2 rounded-md bg-secondary px-3 py-1.5 text-sm"
                key={amenity}
              >
                <span>{amenity}</span>
                <button
                  className="hover:text-destructive"
                  onClick={() => handleRemoveAmenity(amenity)}
                  type="button"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        <FormDescription className="text-xs md:text-sm">
          Add nearby schools, hospitals, shopping centers, and transport hubs
        </FormDescription>
      </div>
    </div>
  );
}
