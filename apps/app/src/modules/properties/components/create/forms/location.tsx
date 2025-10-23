import { zodResolver } from "@hookform/resolvers/zod";
import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import {
  Form,
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
import { Textarea } from "@kaa/ui/components/textarea";
import { cn } from "@kaa/ui/lib/utils";
import {
  ArrowLeft,
  Building,
  CheckCircle,
  Globe,
  Loader2,
  Mail,
  MapIcon,
  MapPin,
  Navigation,
  Rows2 as Road,
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { SmartAddressInput } from "../components/smart-address-input";

const locationSchema = z.object({
  // Address
  addressLine1: z.string().min(1, "Address line 1 is required"),
  addressLine2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  county: z.string().min(1, "County is required"),
  constituency: z.string().optional(),
  postalCode: z.string().min(1, "Postal code is required"),
  country: z.string(),

  // Coordinates
  latitude: z.number().optional(),
  longitude: z.number().optional(),

  // Neighborhood details
  neighborhood: z.string().optional(),
  landmark: z.string().optional(),
  directions: z.string().optional(),

  // Accessibility
  publicTransport: z.string().optional(),
  nearbyAmenities: z.array(z.string()),
  distanceToCity: z.number().optional(), // in km

  // Property specific location
  buildingName: z.string().optional(),
  unitNumber: z.string().optional(),
  floorDescription: z.string().optional(),
});

type LocationFormData = z.infer<typeof locationSchema>;

type LocationFormProps = {
  defaultValues?: Partial<LocationFormData>;
  onSubmit: (data: LocationFormData) => void;
  onNext: () => void;
  onPrevious: () => void;
  className?: string;
};

const kenyanCounties = [
  "Baringo",
  "Bomet",
  "Bungoma",
  "Busia",
  "Elgeyo-Marakwet",
  "Embu",
  "Garissa",
  "Homa Bay",
  "Isiolo",
  "Kajiado",
  "Kakamega",
  "Kericho",
  "Kiambu",
  "Kilifi",
  "Kirinyaga",
  "Kisii",
  "Kisumu",
  "Kitui",
  "Kwale",
  "Laikipia",
  "Lamu",
  "Machakos",
  "Makueni",
  "Mandera",
  "Marsabit",
  "Meru",
  "Migori",
  "Mombasa",
  "Murang'a",
  "Nairobi",
  "Nakuru",
  "Nandi",
  "Narok",
  "Nyamira",
  "Nyandarua",
  "Nyeri",
  "Samburu",
  "Siaya",
  "Taita-Taveta",
  "Tana River",
  "Tharaka-Nithi",
  "Trans Nzoia",
  "Turkana",
  "Uasin Gishu",
  "Vihiga",
  "Wajir",
  "West Pokot",
];

const nearbyAmenitiesOptions = [
  "Hospital",
  "School",
  "Shopping Mall",
  "Market",
  "Bank",
  "ATM",
  "Restaurant",
  "Pharmacy",
  "Petrol Station",
  "Church",
  "Mosque",
  "Park",
  "Beach",
  "Airport",
  "Bus Station",
  "Train Station",
  "University",
  "Police Station",
  "Post Office",
];

export function LocationForm({
  defaultValues,
  onSubmit,
  onNext,
  onPrevious,
  className,
}: LocationFormProps) {
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const form = useForm<LocationFormData>({
    resolver: zodResolver(locationSchema),
    defaultValues: {
      country: "Kenya",
      nearbyAmenities: [],
      ...defaultValues,
    },
  });

  const watchedValues = form.watch();

  const handleSubmit = (data: LocationFormData) => {
    onSubmit(data);
    onNext();
  };

  const getCurrentLocation = async () => {
    setIsGettingLocation(true);

    try {
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10_000,
            maximumAge: 300_000, // 5 minutes
          });
        }
      );

      const { latitude, longitude } = position.coords;

      form.setValue("latitude", latitude);
      form.setValue("longitude", longitude);

      // Mock reverse geocoding - in real app, use actual service
      try {
        const response = await fetch(
          `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=YOUR_API_KEY&language=en&pretty=1`
        );

        if (response.ok) {
          const data = await response.json();
          const result = data.results[0];

          if (result) {
            const components = result.components;
            form.setValue("addressLine1", components.road || "");
            form.setValue("city", components.city || components.town || "");
            form.setValue(
              "county",
              components.county || components.state || ""
            );
            form.setValue("postalCode", components.postcode || "");
            form.setValue(
              "neighborhood",
              components.neighbourhood || components.suburb || ""
            );
          }
        }
      } catch (geocodeError) {
        console.error("Reverse geocoding failed:", geocodeError);
        // Continue with just coordinates
      }
    } catch (error) {
      console.error("Geolocation failed:", error);
      toast.error(
        "Unable to get your location. Please enter the address manually."
      );
    } finally {
      setIsGettingLocation(false);
    }
  };

  const handleAddressSelect = (address: any) => {
    form.setValue("addressLine1", address.line1);
    form.setValue("addressLine2", address.line2 || "");
    form.setValue("city", address.town);
    form.setValue("county", address.county);
    form.setValue("constituency", address.constituency || "");
    form.setValue("postalCode", address.postalCode);
    form.setValue("country", address.country);

    if (address.coordinates) {
      form.setValue("latitude", address.coordinates.lat);
      form.setValue("longitude", address.coordinates.lng);
    }
  };

  const toggleAmenity = (amenity: string) => {
    const current = form.getValues("nearbyAmenities");
    const updated = current.includes(amenity)
      ? current.filter((a) => a !== amenity)
      : [...current, amenity];
    form.setValue("nearbyAmenities", updated);
  };

  return (
    <div className={cn("space-y-6", className)}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Property Location
          </CardTitle>
          <p className="text-gray-600 text-sm">
            Provide the exact location details for your property
          </p>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form
              className="space-y-6"
              onSubmit={form.handleSubmit(handleSubmit)}
            >
              {/* Smart Address Input */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-lg">Address</h3>
                  <Button
                    disabled={isGettingLocation}
                    onClick={getCurrentLocation}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    {isGettingLocation ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Getting Location...
                      </>
                    ) : (
                      <>
                        <Navigation className="mr-2 h-4 w-4" />
                        Use Current Location
                      </>
                    )}
                  </Button>
                </div>

                <SmartAddressInput
                  onChange={handleAddressSelect}
                  placeholder="Start typing an address..."
                  value={watchedValues.addressLine1}
                />
              </div>

              {/* Manual Address Fields */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="addressLine1"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Road className="h-4 w-4" />
                        Address Line 1 *
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Street address, P.O. Box, etc."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="addressLine2"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address Line 2</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Apartment, suite, unit, etc."
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        City/Town *
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Nairobi" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="county"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>County *</FormLabel>
                      <Select
                        defaultValue={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select county" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {kenyanCounties.map((county) => (
                            <SelectItem key={county} value={county}>
                              {county}
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
                  name="postalCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Postal Code *
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 00100" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="constituency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Constituency</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Westlands" {...field} />
                      </FormControl>
                      <FormDescription>
                        Optional - helps with local search
                      </FormDescription>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        Country
                      </FormLabel>
                      <FormControl>
                        <Input {...field} disabled />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              {/* Coordinates Display */}
              {(watchedValues.latitude || watchedValues.longitude) && (
                <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-green-800 text-sm">
                      Location Coordinates
                    </span>
                  </div>
                  <div className="text-green-700 text-sm">
                    Latitude: {watchedValues.latitude?.toFixed(6)}, Longitude:{" "}
                    {watchedValues.longitude?.toFixed(6)}
                  </div>
                </div>
              )}

              {/* Neighborhood & Landmarks */}
              <div className="space-y-4">
                <h3 className="flex items-center gap-2 font-medium text-lg">
                  <MapIcon className="h-4 w-4" />
                  Neighborhood Details
                </h3>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="neighborhood"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Neighborhood/Estate</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Kilimani, Karen"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Specific area or estate name
                        </FormDescription>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="landmark"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nearby Landmark</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Near Yaya Centre"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Well-known nearby location
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="directions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Directions</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Provide additional directions to help visitors find the property..."
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Helpful directions from major roads or landmarks
                      </FormDescription>
                    </FormItem>
                  )}
                />
              </div>

              {/* Building Specific Details */}
              <div className="space-y-4">
                <h3 className="flex items-center gap-2 font-medium text-lg">
                  <Building className="h-4 w-4" />
                  Building Details
                </h3>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="buildingName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Building Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Skyline Apartments"
                            {...field}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="unitNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unit/Apartment Number</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., A12, 3B" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="floorDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Floor Description</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 3rd Floor" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Nearby Amenities */}
              <div className="space-y-4">
                <h3 className="font-medium text-lg">Nearby Amenities</h3>
                <p className="text-gray-600 text-sm">
                  Select amenities within walking distance (select all that
                  apply)
                </p>

                <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                  {nearbyAmenitiesOptions.map((amenity) => (
                    <Badge
                      className="cursor-pointer justify-center py-2"
                      key={amenity}
                      onClick={() => toggleAmenity(amenity)}
                      variant={
                        watchedValues.nearbyAmenities.includes(amenity)
                          ? "default"
                          : "outline"
                      }
                    >
                      {amenity}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Transportation */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="publicTransport"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Public Transport Access</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe nearby matatu routes, bus stops, train stations..."
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="distanceToCity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Distance to City Center (km)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., 15"
                          type="number"
                          {...field}
                          onChange={(e) =>
                            field.onChange(
                              Number.parseFloat(e.target.value) || undefined
                            )
                          }
                        />
                      </FormControl>
                      <FormDescription>
                        Approximate distance to main city center
                      </FormDescription>
                    </FormItem>
                  )}
                />
              </div>

              {/* Form Actions */}
              <div className="flex justify-between">
                <Button
                  className="flex items-center gap-2"
                  onClick={onPrevious}
                  type="button"
                  variant="outline"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Details
                </Button>

                <Button className="min-w-32" type="submit">
                  Continue to Pricing
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
