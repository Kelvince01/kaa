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
import { Tabs, TabsList, TabsTrigger } from "@kaa/ui/components/tabs";
import { Bath, Bed, Building, Filter, MapPin, Share2, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import type React from "react";
import { useEffect, useState } from "react";
import type { Property } from "../../property.type";
import { useRecentlyViewedStore } from "../../recently-viewed.store";
import { ComparisonChart } from "./comparison-chart";
import { ComparisonTable } from "./comparison-table";
import { PropertySelector } from "./property-selector";
import { SimilarProperties } from "./similar-properties";

export type PropertyCompareProps = {
  /** Initial properties to compare */
  initialProperties?: Property[];
  /** Maximum number of properties that can be compared */
  maxProperties?: number;
  /** Whether to show the property selector */
  showSelector?: boolean;
  /** Available properties for selection */
  availableProperties?: Property[];
  /** Callback when properties change */
  onPropertiesChange?: (properties: Property[]) => void;
  /** Callback when comparison is shared */
  onShare?: (properties: Property[]) => void;
  /** Custom comparison fields to show */
  customFields?: ComparisonField[];
  /** Whether to show similar properties */
  showSimilarProperties?: boolean;
};

export type ComparisonField = {
  key: string;
  label: string;
  category: string;
  type: "text" | "number" | "badge" | "boolean" | "price" | "list";
  format?: (value: any) => string;
  important?: boolean;
};

const DEFAULT_COMPARISON_FIELDS: ComparisonField[] = [
  // Basic Information
  {
    key: "title",
    label: "Property Title",
    category: "Basic",
    type: "text",
    important: true,
  },
  {
    key: "type",
    label: "Property Type",
    category: "Basic",
    type: "badge",
    important: true,
  },
  {
    key: "listingType",
    label: "Listing Type",
    category: "Basic",
    type: "badge",
    important: true,
  },
  {
    key: "status",
    label: "Status",
    category: "Basic",
    type: "badge",
    important: true,
  },

  // Pricing
  {
    key: "pricing.rentAmount",
    label: "Rent/Price",
    category: "Pricing",
    type: "price",
    important: true,
  },
  {
    key: "pricing.securityDeposit",
    label: "Security Deposit",
    category: "Pricing",
    type: "price",
  },
  {
    key: "pricing.serviceCharge",
    label: "Service Charge",
    category: "Pricing",
    type: "price",
  },
  {
    key: "pricing.negotiable",
    label: "Negotiable",
    category: "Pricing",
    type: "boolean",
  },

  // Location
  {
    key: "location.county",
    label: "County",
    category: "Location",
    type: "text",
    important: true,
  },
  {
    key: "location.constituency",
    label: "Constituency",
    category: "Location",
    type: "text",
  },
  {
    key: "location.neighborhood",
    label: "Neighborhood",
    category: "Location",
    type: "text",
  },

  // Details
  {
    key: "details.bedrooms",
    label: "Bedrooms",
    category: "Details",
    type: "number",
    important: true,
  },
  {
    key: "details.bathrooms",
    label: "Bathrooms",
    category: "Details",
    type: "number",
    important: true,
  },
  {
    key: "details.size",
    label: "Size (sq m)",
    category: "Details",
    type: "number",
    important: true,
  },
  {
    key: "details.furnished",
    label: "Furnished",
    category: "Details",
    type: "boolean",
  },
  {
    key: "details.parking",
    label: "Parking",
    category: "Details",
    type: "boolean",
  },
  {
    key: "details.garden",
    label: "Garden",
    category: "Details",
    type: "boolean",
  },
  {
    key: "details.yearBuilt",
    label: "Year Built",
    category: "Details",
    type: "number",
  },

  // Features
  { key: "amenities", label: "Amenities", category: "Features", type: "list" },
  { key: "features", label: "Features", category: "Features", type: "list" },

  // Utilities
  {
    key: "pricing.waterBill",
    label: "Water Bill",
    category: "Utilities",
    type: "text",
  },
  {
    key: "pricing.electricityBill",
    label: "Electricity Bill",
    category: "Utilities",
    type: "text",
  },
  {
    key: "details.generator",
    label: "Generator",
    category: "Utilities",
    type: "boolean",
  },
  {
    key: "details.borehole",
    label: "Borehole",
    category: "Utilities",
    type: "boolean",
  },

  // Availability
  {
    key: "available",
    label: "Available",
    category: "Availability",
    type: "boolean",
    important: true,
  },
  {
    key: "availableFrom",
    label: "Available From",
    category: "Availability",
    type: "text",
  },
  {
    key: "minTenancy",
    label: "Minimum Tenancy",
    category: "Availability",
    type: "text",
  },
];

export const PropertyCompare: React.FC<PropertyCompareProps> = ({
  initialProperties = [],
  maxProperties = 4,
  showSelector = true,
  availableProperties = [],
  onPropertiesChange,
  onShare,
  customFields,
  showSimilarProperties = true,
}) => {
  const [properties, setProperties] = useState<Property[]>(initialProperties);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([
    "Basic",
    "Pricing",
    "Location",
    "Details",
  ]);
  const [comparisonView, setComparisonView] = useState<
    "table" | "cards" | "chart"
  >("table");
  const [showFilters, setShowFilters] = useState(false);

  // Recently viewed store integration
  const { addToRecentlyViewed, recentlyViewed } = useRecentlyViewedStore();

  const comparisonFields = customFields || DEFAULT_COMPARISON_FIELDS;
  const categories = Array.from(
    new Set(comparisonFields.map((field) => field.category))
  );

  useEffect(() => {
    onPropertiesChange?.(properties);
  }, [properties, onPropertiesChange]);

  const addProperty = (property: Property) => {
    if (
      properties.length < maxProperties &&
      !properties.find((p) => p._id === property._id)
    ) {
      // Add to recently viewed when added to comparison
      addToRecentlyViewed(property);
      setProperties((prev) => [...prev, property]);
    }
  };

  const removeProperty = (propertyId: string) => {
    setProperties((prev) => prev.filter((p) => p._id !== propertyId));
  };

  const clearAll = () => {
    setProperties([]);
  };

  const getPropertyValue = (property: Property, fieldKey: string): any => {
    const keys = fieldKey.split(".");
    let value = property as any;

    for (const key of keys) {
      value = value?.[key];
    }

    return value;
  };

  const formatValue = (value: any, field: ComparisonField): string => {
    if (value === null || value === undefined) return "—";

    if (field.format) {
      return field.format(value);
    }

    switch (field.type) {
      case "price":
        return typeof value === "number"
          ? `KES ${value.toLocaleString()}`
          : "—";
      case "boolean":
        return value ? "Yes" : "No";
      case "list":
        return Array.isArray(value)
          ? value.length > 0
            ? value
                .slice(0, 3)
                .map((item) => (typeof item === "object" ? item.name : item))
                .join(", ") +
              (value.length > 3 ? ` +${value.length - 3} more` : "")
            : "None"
          : "—";
      case "number":
        return typeof value === "number" ? value.toString() : "—";
      default:
        return String(value);
    }
  };

  const getBadgeVariant = (value: any, field: ComparisonField) => {
    if (field.key === "status") {
      return value === "active"
        ? "default"
        : value === "rented"
          ? "destructive"
          : "secondary";
    }
    if (field.key === "listingType") {
      return value === "rent" ? "default" : "secondary";
    }
    return "default";
  };

  const filteredFields = comparisonFields.filter((field) =>
    selectedCategories.includes(field.category)
  );

  const importantFields = filteredFields.filter((field) => field.important);
  const regularFields = filteredFields.filter((field) => !field.important);

  if (properties.length === 0 && showSelector) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="mx-auto max-w-md text-center">
          <Building className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 font-medium text-gray-900 text-sm">
            No properties selected
          </h3>
          <p className="mt-1 text-gray-500 text-sm">
            Get started by selecting properties to compare their features,
            pricing, and amenities.
          </p>
          <div className="mt-6">
            <PropertySelector
              availableProperties={availableProperties}
              maxProperties={maxProperties}
              onSelect={addProperty}
              selectedProperties={properties}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-2xl tracking-tight">
            Property Comparison
          </h2>
          <p className="text-muted-foreground">
            Compare {properties.length}{" "}
            {properties.length === 1 ? "property" : "properties"} side by side
          </p>
        </div>
        <div className="flex items-center gap-2">
          {properties.length > 0 && (
            <>
              <Button
                onClick={() => onShare?.(properties)}
                size="sm"
                variant="outline"
              >
                <Share2 className="mr-1 h-4 w-4" />
                Share
              </Button>
              <Button
                onClick={() => setShowFilters(!showFilters)}
                size="sm"
                variant="outline"
              >
                <Filter className="mr-1 h-4 w-4" />
                Filters
              </Button>
              <Button onClick={clearAll} size="sm" variant="outline">
                Clear All
              </Button>
            </>
          )}
          {showSelector && (
            <PropertySelector
              availableProperties={availableProperties}
              maxProperties={maxProperties}
              onSelect={addProperty}
              selectedProperties={properties}
            />
          )}
        </div>
      </div>

      {/* Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            initial={{ opacity: 0, height: 0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Comparison Categories</CardTitle>
                <CardDescription>
                  Select which categories to include in the comparison
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <Badge
                      className="cursor-pointer"
                      key={category}
                      onClick={() => {
                        setSelectedCategories((prev) =>
                          prev.includes(category)
                            ? prev.filter((c) => c !== category)
                            : [...prev, category]
                        );
                      }}
                      variant={
                        selectedCategories.includes(category)
                          ? "default"
                          : "outline"
                      }
                    >
                      {category}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {properties.length > 0 && (
        <>
          {/* View Controls */}
          <div className="flex items-center justify-between">
            <Tabs
              onValueChange={(value: any) => setComparisonView(value)}
              value={comparisonView}
            >
              <TabsList>
                <TabsTrigger value="table">Table View</TabsTrigger>
                <TabsTrigger value="cards">Card View</TabsTrigger>
                <TabsTrigger value="chart">Chart View</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Comparison Content */}
          <AnimatePresence mode="wait">
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              initial={{ opacity: 0, y: 20 }}
              key={comparisonView}
              transition={{ duration: 0.2 }}
            >
              {comparisonView === "table" && (
                <ComparisonTable
                  fields={filteredFields}
                  formatValue={formatValue}
                  getBadgeVariant={getBadgeVariant}
                  getPropertyValue={getPropertyValue}
                  onRemoveProperty={removeProperty}
                  properties={properties}
                />
              )}

              {comparisonView === "cards" && (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {properties.map((property, index) => (
                    <motion.div
                      animate={{ opacity: 1, y: 0 }}
                      initial={{ opacity: 0, y: 20 }}
                      key={property._id}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className="relative">
                        <Button
                          className="absolute top-2 right-2 h-8 w-8 p-0"
                          onClick={() => removeProperty(property._id)}
                          size="sm"
                          variant="ghost"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        <CardHeader>
                          <div className="flex items-start gap-3">
                            {property.media?.images?.[0] && (
                              <Image
                                alt={property.title}
                                className="h-16 w-16 rounded-lg object-cover"
                                height={64}
                                src={property.media.images[0].url}
                                width={64}
                              />
                            )}
                            <div className="flex-1">
                              <CardTitle className="text-lg leading-tight">
                                {property.title}
                              </CardTitle>
                              <CardDescription className="mt-1 flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {property.location.county},{" "}
                                {property.location.constituency}
                              </CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {/* Key Details */}
                          <div className="grid grid-cols-2 gap-4">
                            <div className="text-center">
                              <div className="font-bold text-2xl text-green-600">
                                KES {property.pricing.rent.toLocaleString()}
                              </div>
                              <div className="text-muted-foreground text-xs">
                                {property.pricing.paymentFrequency}
                              </div>
                            </div>
                            <div className="flex items-center justify-center gap-3 text-sm">
                              <div className="flex items-center gap-1">
                                <Bed className="h-4 w-4" />
                                {property.specifications.bedrooms}
                              </div>
                              <div className="flex items-center gap-1">
                                <Bath className="h-4 w-4" />
                                {property.specifications.bathrooms}
                              </div>
                            </div>
                          </div>

                          <Separator />

                          {/* Important Fields */}
                          <div className="space-y-2">
                            {importantFields.slice(0, 5).map((field) => {
                              const value = getPropertyValue(
                                property,
                                field.key
                              );
                              if (value === null || value === undefined)
                                return null;

                              return (
                                <div
                                  className="flex justify-between text-sm"
                                  key={field.key}
                                >
                                  <span className="text-muted-foreground">
                                    {field.label}:
                                  </span>
                                  <span className="font-medium">
                                    {field.type === "badge" ? (
                                      <Badge
                                        className="text-xs"
                                        variant={getBadgeVariant(value, field)}
                                      >
                                        {formatValue(value, field)}
                                      </Badge>
                                    ) : (
                                      formatValue(value, field)
                                    )}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}

              {comparisonView === "chart" && (
                <ComparisonChart
                  fields={filteredFields.filter(
                    (f) => f.type === "number" || f.type === "price"
                  )}
                  getPropertyValue={getPropertyValue}
                  properties={properties}
                />
              )}
            </motion.div>
          </AnimatePresence>

          {/* Similar Properties */}
          {showSimilarProperties && properties.length > 0 && (
            <SimilarProperties
              availableProperties={availableProperties}
              baseProperties={properties}
              onAddProperty={addProperty}
            />
          )}
        </>
      )}
    </div>
  );
};

export default PropertyCompare;
