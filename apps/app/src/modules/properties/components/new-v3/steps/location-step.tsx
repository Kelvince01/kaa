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
  Building,
  Compass,
  Hash,
  MapPin,
  Navigation,
  Plus,
  X,
} from "lucide-react";
import { useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import type { PropertyFormData } from "../schema";

const KENYA_COUNTIES = [
  "Nairobi",
  "Mombasa",
  "Kisumu",
  "Nakuru",
  "Kiambu",
  "Machakos",
  "Kajiado",
  "Uasin Gishu",
  "Kilifi",
  "Nyeri",
  "Meru",
  "Bungoma",
  "Kakamega",
  "Trans Nzoia",
  "Kericho",
];

const COMMON_AMENITIES = [
  "Shopping Mall",
  "Supermarket",
  "Hospital",
  "School",
  "Bank",
  "Restaurant",
  "Gym",
  "Park",
  "Bus Stop",
  "Matatu Stage",
  "Church",
  "Mosque",
  "Police Station",
  "Petrol Station",
];

type LocationStepProps = {
  form: UseFormReturn<PropertyFormData>;
};

export function LocationStep({ form }: LocationStepProps) {
  const [newAmenity, setNewAmenity] = useState("");
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  const watchedValues = form.watch();

  const handleGetCurrentLocation = () => {
    setIsLoadingLocation(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          form.setValue("coordinates", {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          setIsLoadingLocation(false);
        },
        (error) => {
          console.error("Error getting location:", error);
          setIsLoadingLocation(false);
        }
      );
    } else {
      setIsLoadingLocation(false);
    }
  };

  const addAmenity = (amenity: string) => {
    const current = watchedValues.nearbyAmenities || [];
    if (!current.includes(amenity)) {
      form.setValue("nearbyAmenities", [...current, amenity]);
    }
  };

  const removeAmenity = (amenity: string) => {
    const current = watchedValues.nearbyAmenities || [];
    form.setValue(
      "nearbyAmenities",
      current.filter((a) => a !== amenity)
    );
  };

  const addCustomAmenity = () => {
    if (newAmenity.trim()) {
      addAmenity(newAmenity.trim());
      setNewAmenity("");
    }
  };

  return (
    <div className="space-y-6">
      {/* County */}
      <FormField
        control={form.control}
        name="county"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-2 font-semibold text-base">
              <MapPin className="h-4 w-4" />
              County <span className="text-red-500">*</span>
            </FormLabel>
            <FormDescription className="text-xs">
              Select the county where your property is located
            </FormDescription>
            <FormControl>
              <div className="relative">
                <Input
                  className="text-base"
                  list="counties"
                  placeholder="Select or type county name"
                  {...field}
                />
                <datalist id="counties">
                  {KENYA_COUNTIES.map((county) => (
                    <option key={county} value={county}>
                      {county}
                    </option>
                  ))}
                </datalist>
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Estate and Address Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          control={form.control}
          name="estate"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-semibold text-sm">
                Estate/Area <span className="text-red-500">*</span>
              </FormLabel>
              <FormDescription className="text-xs">
                Neighborhood or estate name
              </FormDescription>
              <FormControl>
                <Input placeholder="e.g., Kilimani, Westlands" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-semibold text-sm">
                Street Address <span className="text-red-500">*</span>
              </FormLabel>
              <FormDescription className="text-xs">
                Full street address
              </FormDescription>
              <FormControl>
                <Input
                  placeholder="e.g., Ngong Road, Next to ABC Mall"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Optional Details Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          control={form.control}
          name="buildingName"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2 font-semibold text-sm">
                <Building className="h-3.5 w-3.5" />
                Building Name (Optional)
              </FormLabel>
              <FormControl>
                <Input placeholder="e.g., Kilimani Heights" {...field} />
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
              <FormLabel className="flex items-center gap-2 font-semibold text-sm">
                <Hash className="h-3.5 w-3.5" />
                Plot Number (Optional)
              </FormLabel>
              <FormControl>
                <Input placeholder="e.g., LR No. 123/456" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* GPS Coordinates */}
      <Card className="border-blue-200 bg-linear-to-br from-blue-50 to-white dark:from-blue-950 dark:to-background">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Compass className="h-5 w-5 text-blue-600" />
            GPS Coordinates <span className="text-red-500 text-sm">*</span>
          </CardTitle>
          <CardDescription className="text-xs">
            Precise location helps tenants find your property easily
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="coordinates.latitude"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">Latitude</FormLabel>
                  <FormControl>
                    <Input
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
            className="w-full sm:w-auto"
            disabled={isLoadingLocation}
            onClick={handleGetCurrentLocation}
            size="sm"
            type="button"
            variant="outline"
          >
            <Navigation className="mr-2 h-4 w-4" />
            {isLoadingLocation ? "Getting location..." : "Use Current Location"}
          </Button>
        </CardContent>
      </Card>

      {/* Nearby Amenities */}
      <div className="space-y-3">
        <div>
          <h3 className="font-semibold text-sm">Nearby Amenities (Optional)</h3>
          <p className="text-muted-foreground text-xs">
            What facilities are close to your property?
          </p>
        </div>

        {/* Selected Amenities */}
        {watchedValues.nearbyAmenities &&
          watchedValues.nearbyAmenities.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {watchedValues.nearbyAmenities.map((amenity) => (
                <Badge
                  className="cursor-pointer"
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

        {/* Quick Select Amenities */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {COMMON_AMENITIES.filter(
            (a) => !(watchedValues.nearbyAmenities || []).includes(a)
          )
            .slice(0, 8)
            .map((amenity) => (
              <Button
                className="h-auto justify-start whitespace-normal text-left text-xs"
                key={amenity}
                onClick={() => addAmenity(amenity)}
                size="sm"
                type="button"
                variant="outline"
              >
                <Plus className="mr-1 h-3 w-3 shrink-0" />
                {amenity}
              </Button>
            ))}
        </div>

        {/* Add Custom Amenity */}
        <div className="flex gap-2">
          <Input
            className="text-sm"
            onChange={(e) => setNewAmenity(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCustomAmenity();
              }
            }}
            placeholder="Add custom amenity..."
            value={newAmenity}
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
      </div>

      {/* Location Summary */}
      {(watchedValues.county || watchedValues.estate) && (
        <Card className="border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Location Summary</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p className="text-muted-foreground">
              {watchedValues.address && <>{watchedValues.address}, </>}
              {watchedValues.estate && <>{watchedValues.estate}, </>}
              {watchedValues.county}
            </p>
            {watchedValues.coordinates?.latitude &&
              watchedValues.coordinates.longitude && (
                <p className="mt-2 font-mono text-muted-foreground text-xs">
                  📍 {watchedValues.coordinates.latitude.toFixed(6)},{" "}
                  {watchedValues.coordinates.longitude.toFixed(6)}
                </p>
              )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
