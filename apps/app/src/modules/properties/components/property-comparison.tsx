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
import { Separator } from "@kaa/ui/components/separator";
import {
  Bath,
  Bed,
  Car,
  CheckCircle,
  GitCompare,
  Loader2,
  MapPin,
  Plus,
  Square,
  Star,
  Wifi,
  X,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  useCompareProperties,
  useComparisonTemplate,
} from "../property.queries";
import { usePropertyStore } from "../property.store";
import type { Property } from "../property.type";

type PropertyComparisonProps = {
  className?: string;
};

export function PropertyComparison({ className }: PropertyComparisonProps) {
  const [isComparing, setIsComparing] = useState(false);

  const {
    comparisonProperties,
    comparisonData,
    addToComparison,
    removeFromComparison,
    clearComparison,
    setComparisonData,
  } = usePropertyStore();

  const comparison = useCompareProperties(
    comparisonProperties.map((p) => p._id)
  );
  const template = useComparisonTemplate();

  const handleAddToComparison = (property: Property) => {
    if (comparisonProperties.length >= 4) {
      toast.error("You can compare up to 4 properties at a time");
      return;
    }
    addToComparison(property);
    toast.success("Property added to comparison");
  };

  const handleRemoveFromComparison = (propertyId: string) => {
    removeFromComparison(propertyId);
    toast.success("Property removed from comparison");
  };

  const handleClearComparison = () => {
    clearComparison();
    toast.success("Comparison cleared");
  };

  const handleCompare = async () => {
    if (comparisonProperties.length < 2) {
      toast.error("Please select at least 2 properties to compare");
      return;
    }

    setIsComparing(true);
    try {
      const result = await comparison.refetch();
      if (result.data) {
        setComparisonData(result.data);
      }
    } catch (error) {
      toast.error("Failed to compare properties");
    } finally {
      setIsComparing(false);
    }
  };

  const getPropertyValue = (property: Property, field: string) => {
    switch (field) {
      case "title":
        return property.title;
      case "price":
        return `KES ${property.pricing.rent.toLocaleString()}`;
      case "type":
        return property.type;
      case "bedrooms":
        return property.specifications.bedrooms || "N/A";
      case "bathrooms":
        return property.specifications.bathrooms || "N/A";
      case "size":
        return `${property.specifications.totalArea} sqm`;
      case "location":
        return `${property.location.county}, ${property.location.constituency}`;
      case "furnished":
        return property.specifications.furnished ? "Yes" : "No";
      case "parking":
        return property.amenities.parking ? "Yes" : "No";
      case "security":
        return property.amenities.security ? "Yes" : "No";
      case "internet":
        return property.amenities.internet ? "Yes" : "No";
      case "petFriendly":
        return property.rules.petsAllowed ? "Yes" : "No";
      case "status":
        return property.status;
      case "featured":
        return property.featured ? "Yes" : "No";
      default:
        return "N/A";
    }
  };

  const getFieldIcon = (field: string) => {
    switch (field) {
      case "price":
        return <Star className="h-4 w-4" />;
      case "location":
        return <MapPin className="h-4 w-4" />;
      case "bedrooms":
        return <Bed className="h-4 w-4" />;
      case "bathrooms":
        return <Bath className="h-4 w-4" />;
      case "size":
        return <Square className="h-4 w-4" />;
      case "parking":
        return <Car className="h-4 w-4" />;
      case "internet":
        return <Wifi className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const comparisonFields = [
    { key: "title", label: "Property Name" },
    { key: "price", label: "Rent Price" },
    { key: "type", label: "Property Type" },
    { key: "bedrooms", label: "Bedrooms" },
    { key: "bathrooms", label: "Bathrooms" },
    { key: "size", label: "Size" },
    { key: "location", label: "Location" },
    { key: "furnished", label: "Furnished" },
    { key: "parking", label: "Parking" },
    { key: "security", label: "Security" },
    { key: "internet", label: "Internet Ready" },
    { key: "petFriendly", label: "Pet Friendly" },
    { key: "status", label: "Status" },
    { key: "featured", label: "Featured" },
  ];

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitCompare className="h-5 w-5 text-blue-500" />
            Property Comparison
          </CardTitle>
          <CardDescription>
            Compare up to 4 properties side by side
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Selected Properties */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm">
                Selected Properties ({comparisonProperties.length}/4)
              </h4>
              <div className="flex gap-2">
                <Button
                  disabled={comparisonProperties.length < 2 || isComparing}
                  onClick={handleCompare}
                  size="sm"
                >
                  {isComparing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Comparing...
                    </>
                  ) : (
                    <>
                      <GitCompare className="mr-2 h-4 w-4" />
                      Compare
                    </>
                  )}
                </Button>
                {comparisonProperties.length > 0 && (
                  <Button
                    onClick={handleClearComparison}
                    size="sm"
                    variant="outline"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Clear
                  </Button>
                )}
              </div>
            </div>

            {/* Property Cards */}
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
              {comparisonProperties.map((property) => (
                <div
                  className="relative space-y-2 rounded-lg border p-3"
                  key={property._id}
                >
                  <Button
                    className="absolute top-1 right-1 h-6 w-6 p-0"
                    onClick={() => handleRemoveFromComparison(property._id)}
                    size="sm"
                    variant="ghost"
                  >
                    <X className="h-3 w-3" />
                  </Button>

                  <div className="space-y-2">
                    <h5 className="line-clamp-2 font-medium text-sm">
                      {property.title}
                    </h5>
                    <p className="font-bold text-blue-600 text-lg">
                      KES {property.pricing.rent.toLocaleString()}
                    </p>
                    <div className="flex items-center gap-2 text-muted-foreground text-xs">
                      <Bed className="h-3 w-3" />
                      <span>{property.specifications.bedrooms || 0}</span>
                      <Bath className="h-3 w-3" />
                      <span>{property.specifications.bathrooms || 0}</span>
                      <Square className="h-3 w-3" />
                      <span>{property.specifications.totalArea} sqm</span>
                    </div>
                    <Badge className="text-xs" variant="outline">
                      {property.type}
                    </Badge>
                  </div>
                </div>
              ))}

              {/* Add Property Placeholder */}
              {comparisonProperties.length < 4 && (
                <div className="flex min-h-[120px] items-center justify-center rounded-lg border-2 border-gray-300 border-dashed p-3">
                  <div className="space-y-2 text-center">
                    <Plus className="mx-auto h-6 w-6 text-gray-400" />
                    <p className="text-gray-500 text-sm">Add Property</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Comparison Results */}
          {comparisonData && comparisonData.properties.length > 0 && (
            <div className="space-y-4">
              <Separator />
              <h4 className="font-semibold text-lg">Comparison Results</h4>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="p-2 text-left font-medium">Feature</th>
                      {comparisonData.properties.map((property, index) => (
                        <th
                          className="p-2 text-center font-medium"
                          key={index.toString()}
                        >
                          {property.title}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonFields.map((field) => (
                      <tr className="border-b" key={field.key}>
                        <td className="p-2 font-medium">
                          <div className="flex items-center gap-2">
                            {getFieldIcon(field.key)}
                            {field.label}
                          </div>
                        </td>
                        {comparisonData.properties.map((property, index) => (
                          <td
                            className="p-2 text-center"
                            key={index.toString()}
                          >
                            {getPropertyValue(property, field.key) === "Yes" ? (
                              <CheckCircle className="mx-auto h-4 w-4 text-green-500" />
                            ) : getPropertyValue(property, field.key) ===
                              "No" ? (
                              <XCircle className="mx-auto h-4 w-4 text-red-500" />
                            ) : (
                              <span className="text-sm">
                                {getPropertyValue(property, field.key)}
                              </span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Empty State */}
          {comparisonProperties.length === 0 && (
            <div className="py-8 text-center">
              <GitCompare className="mx-auto mb-4 h-12 w-12 text-gray-400" />
              <h3 className="mb-2 font-medium text-gray-900 text-lg">
                No Properties Selected
              </h3>
              <p className="mb-4 text-gray-500">
                Add properties to your comparison to see them side by side
              </p>
            </div>
          )}

          {/* Tips */}
          <div className="rounded-md bg-blue-50 p-3">
            <h4 className="mb-2 font-medium text-blue-900 text-sm">
              💡 Comparison Tips
            </h4>
            <ul className="space-y-1 text-blue-800 text-xs">
              <li>• Select 2-4 properties for detailed comparison</li>
              <li>• Compare similar property types for better insights</li>
              <li>
                • Focus on key factors like price, location, and amenities
              </li>
              <li>• Use the comparison to make informed decisions</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
