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
import { Input } from "@kaa/ui/components/input";
import { Separator } from "@kaa/ui/components/separator";
import {
  AlertTriangle,
  Banknote as Bank,
  Building2,
  Car,
  CheckCircle,
  Hospital,
  Loader2,
  MapPin,
  Navigation,
  RollerCoaster as Park,
  School,
  Search,
  ShoppingBag,
  UtensilsCrossed,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useNearbyAmenities, useValidateAddress } from "../property.queries";
import type { AddressValidationResult, NearbyAmenity } from "../property.type";

type EnhancedLocationPickerProps = {
  onLocationSelect: (location: {
    lat: number;
    lng: number;
    address: string;
  }) => void;
  onAmenitiesFound: (amenities: NearbyAmenity[]) => void;
  className?: string;
};

export function EnhancedLocationPicker({
  onLocationSelect,
  onAmenitiesFound,
  className,
}: EnhancedLocationPickerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number;
    lng: number;
    address: string;
  } | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [validationResult, setValidationResult] =
    useState<AddressValidationResult | null>(null);

  const validateAddress = useValidateAddress();
  const nearbyAmenities = useNearbyAmenities(
    selectedLocation?.lat || 0,
    selectedLocation?.lng || 0,
    2000,
    !!selectedLocation
  );

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error("Please enter a location to search");
      return;
    }

    setIsSearching(true);
    try {
      const result = await validateAddress.mutateAsync({
        address: searchQuery,
      });

      if (result.isValid) {
        setSelectedLocation({
          lat: result.coordinates[0],
          lng: result.coordinates[1],
          address: result.formattedAddress,
        });
        setValidationResult(result);
        onLocationSelect({
          lat: result.coordinates[0],
          lng: result.coordinates[1],
          address: result.formattedAddress,
        });
        toast.success("Location found and validated!");
      } else {
        toast.error("Invalid address. Please check and try again.");
      }
    } catch (error) {
      toast.error("Failed to validate address");
      console.error("Error validating address:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setSelectedLocation({
            lat: latitude,
            lng: longitude,
            address: "Current Location",
          });
          onLocationSelect({
            lat: latitude,
            lng: longitude,
            address: "Current Location",
          });
          toast.success("Current location detected!");
        },
        (error) => {
          toast.error("Failed to get current location");
          console.error("Geolocation error:", error);
        }
      );
    } else {
      toast.error("Geolocation is not supported by this browser");
    }
  };

  const getAmenityIcon = (type: string) => {
    switch (type) {
      case "school":
        return <School className="h-4 w-4" />;
      case "hospital":
        return <Hospital className="h-4 w-4" />;
      case "transport":
        return <Car className="h-4 w-4" />;
      case "shopping":
        return <ShoppingBag className="h-4 w-4" />;
      case "restaurant":
        return <UtensilsCrossed className="h-4 w-4" />;
      case "park":
        return <Park className="h-4 w-4" />;
      case "bank":
        return <Bank className="h-4 w-4" />;
      default:
        return <Building2 className="h-4 w-4" />;
    }
  };

  const getAmenityColor = (type: string) => {
    switch (type) {
      case "school":
        return "bg-blue-100 text-blue-800";
      case "hospital":
        return "bg-red-100 text-red-800";
      case "transport":
        return "bg-green-100 text-green-800";
      case "shopping":
        return "bg-purple-100 text-purple-800";
      case "restaurant":
        return "bg-orange-100 text-orange-800";
      case "park":
        return "bg-emerald-100 text-emerald-800";
      case "bank":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  useEffect(() => {
    if (nearbyAmenities.data) {
      onAmenitiesFound(nearbyAmenities.data);
    }
  }, [nearbyAmenities.data, onAmenitiesFound]);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-blue-500" />
          Enhanced Location Picker
        </CardTitle>
        <CardDescription>
          Search for locations, validate addresses, and discover nearby
          amenities
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Section */}
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              className="flex-1"
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Enter address, landmark, or area..."
              value={searchQuery}
            />
            <Button
              disabled={isSearching || !searchQuery.trim()}
              onClick={handleSearch}
              size="sm"
            >
              {isSearching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
            <Button
              onClick={handleUseCurrentLocation}
              size="sm"
              variant="outline"
            >
              <Navigation className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Selected Location */}
        {selectedLocation && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 rounded-lg border bg-green-50 p-3">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div className="flex-1">
                <p className="font-medium text-green-900 text-sm">
                  Location Selected
                </p>
                <p className="text-green-700 text-xs">
                  {selectedLocation.address}
                </p>
                <p className="text-green-600 text-xs">
                  {selectedLocation.lat.toFixed(6)},{" "}
                  {selectedLocation.lng.toFixed(6)}
                </p>
              </div>
            </div>

            {/* Address Validation Results */}
            {validationResult && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Address Validation</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        validationResult.confidence > 0.8
                          ? "default"
                          : "secondary"
                      }
                    >
                      Confidence:{" "}
                      {Math.round(validationResult.confidence * 100)}%
                    </Badge>
                  </div>

                  {validationResult.suggestions.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-muted-foreground text-xs">
                        Suggestions:
                      </p>
                      {validationResult.suggestions.map((suggestion, index) => (
                        <p
                          className="text-blue-600 text-xs"
                          key={index.toString()}
                        >
                          • {suggestion}
                        </p>
                      ))}
                    </div>
                  )}

                  {validationResult.issues.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-muted-foreground text-xs">Issues:</p>
                      {validationResult.issues.map((issue, index) => (
                        <div
                          className="flex items-center gap-2 text-red-600 text-xs"
                          key={index.toString()}
                        >
                          <AlertTriangle className="h-3 w-3" />
                          {issue}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Nearby Amenities */}
        {nearbyAmenities.data && nearbyAmenities.data.length > 0 && (
          <div className="space-y-3">
            <Separator />
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm">Nearby Amenities</h4>
              <Badge className="text-xs" variant="outline">
                {nearbyAmenities.data.length} found
              </Badge>
            </div>

            <div className="grid max-h-60 grid-cols-1 gap-2 overflow-y-auto">
              {nearbyAmenities.data.map((amenity, index) => (
                <div
                  className="flex items-center justify-between rounded-lg border p-2"
                  key={index.toString()}
                >
                  <div className="flex items-center gap-2">
                    {getAmenityIcon(amenity.type)}
                    <div>
                      <p className="font-medium text-sm">{amenity.name}</p>
                      <p className="text-muted-foreground text-xs">
                        {Math.round(amenity.distance)}m away
                      </p>
                    </div>
                  </div>
                  <Badge className={getAmenityColor(amenity.type)}>
                    {amenity.type}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Loading State */}
        {nearbyAmenities.isLoading && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            <span className="text-muted-foreground text-sm">
              Finding nearby amenities...
            </span>
          </div>
        )}

        {/* Error State */}
        {validateAddress.isError && (
          <div className="rounded-md bg-red-50 p-3">
            <p className="text-red-600 text-sm">
              Failed to validate address. Please try again.
            </p>
          </div>
        )}

        {/* Tips */}
        <div className="rounded-md bg-blue-50 p-3">
          <h4 className="mb-2 font-medium text-blue-900 text-sm">
            📍 Location Tips
          </h4>
          <ul className="space-y-1 text-blue-800 text-xs">
            <li>• Use specific addresses for better accuracy</li>
            <li>• Include street names and numbers when possible</li>
            <li>• Use landmarks or popular areas as reference points</li>
            <li>• Allow location access for automatic detection</li>
            <li>• Nearby amenities help with property valuation</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
