import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import { ScrollArea } from "@kaa/ui/components/scroll-area";
import { cn } from "@kaa/ui/lib/utils";
import {
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  Eye,
  Heart,
  Info,
  MapPin,
  TrendingUp,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import Image from "next/image";
import type React from "react";
import type { Property } from "../../property.type";
import type { ComparisonField } from "./index";

type ComparisonTableProps = {
  properties: Property[];
  fields: ComparisonField[];
  onRemoveProperty: (propertyId: string) => void;
  getPropertyValue: (property: Property, fieldKey: string) => any;
  formatValue: (value: any, field: ComparisonField) => string;
  getBadgeVariant: (value: any, field: ComparisonField) => any;
};

export const ComparisonTable: React.FC<ComparisonTableProps> = ({
  properties,
  fields,
  onRemoveProperty,
  getPropertyValue,
  formatValue,
  getBadgeVariant,
}) => {
  // Group fields by category
  const fieldsByCategory = fields.reduce(
    (acc, field) => {
      if (!acc[field.category]) {
        acc[field.category] = [];
      }
      acc[field.category]?.push(field);
      return acc;
    },
    {} as Record<string, ComparisonField[]>
  );

  const categories = Object.keys(fieldsByCategory);

  const getComparisonStatus = (
    field: ComparisonField,
    propertyValues: any[]
  ) => {
    if (field.type === "price" || field.type === "number") {
      const numericValues = propertyValues
        .map((val) => (typeof val === "number" ? val : Number.parseFloat(val)))
        .filter((val) => !Number.isNaN(val));

      if (numericValues.length === 0) return null;

      const maxVal = Math.max(...numericValues);
      const minVal = Math.min(...numericValues);

      return {
        best: maxVal,
        worst: minVal,
        isBetterHigher: !field.key.includes("price"),
      };
    }
    return null;
  };

  const getCellHighlight = (
    field: ComparisonField,
    value: any,
    allValues: any[]
  ) => {
    const comparison = getComparisonStatus(field, allValues);
    if (!(comparison && value)) return "";

    const numericValue =
      typeof value === "number" ? value : Number.parseFloat(value);
    if (Number.isNaN(numericValue)) return "";

    if (comparison.isBetterHigher) {
      if (numericValue === comparison.best)
        return "bg-green-50 border-green-200";
      if (numericValue === comparison.worst) return "bg-red-50 border-red-200";
    } else {
      if (numericValue === comparison.best) return "bg-red-50 border-red-200";
      if (numericValue === comparison.worst)
        return "bg-green-50 border-green-200";
    }

    return "";
  };

  if (properties.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        No properties selected for comparison
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Property Headers */}
      <div
        className="grid gap-4"
        style={{
          gridTemplateColumns: `300px repeat(${properties.length}, 1fr)`,
        }}
      >
        <div />
        {properties.map((property, index) => (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            initial={{ opacity: 0, y: 20 }}
            key={property._id}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="relative">
              <Button
                className="absolute top-2 right-2 z-10 h-8 w-8 p-0"
                onClick={() => onRemoveProperty(property._id)}
                size="sm"
                variant="ghost"
              >
                <X className="h-4 w-4" />
              </Button>
              <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                  {property.media?.images?.[0] && (
                    <Image
                      alt={property.title}
                      className="h-12 w-12 shrink-0 rounded-lg object-cover"
                      height={48}
                      src={property.media.images[0].url}
                      width={48}
                    />
                  )}
                  <div className="min-w-0 flex-1 pr-8">
                    <CardTitle className="line-clamp-2 text-base leading-tight">
                      {property.title}
                    </CardTitle>
                    <div className="mt-1 flex items-center gap-1 text-muted-foreground text-xs">
                      <MapPin className="h-3 w-3" />
                      {property.location.county},{" "}
                      {property.location.constituency}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-center">
                  <div className="font-bold text-green-600 text-xl">
                    KES {property.pricing.rent.toLocaleString()}
                  </div>
                  <div className="text-muted-foreground text-xs">
                    {property.pricing.paymentFrequency}
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-center gap-2">
                  <Button className="h-8 px-2" size="sm" variant="ghost">
                    <Eye className="mr-1 h-3 w-3" />
                    View
                  </Button>
                  <Button className="h-8 px-2" size="sm" variant="ghost">
                    <Heart className="mr-1 h-3 w-3" />
                  </Button>
                  <Button className="h-8 px-2" size="sm" variant="ghost">
                    <ExternalLink className="mr-1 h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Comparison Table */}
      <Card>
        <ScrollArea className="w-full">
          <div className="min-w-full">
            {categories.map((category, categoryIndex) => (
              <div className={categoryIndex > 0 ? "mt-6" : ""} key={category}>
                {/* Category Header */}
                <div className="border-b bg-muted/50">
                  <div
                    className="grid h-12 items-center px-4 font-medium"
                    style={{
                      gridTemplateColumns: `300px repeat(${properties.length}, 1fr)`,
                    }}
                  >
                    <div className="flex items-center gap-2">
                      {category === "Basic" && <Info className="h-4 w-4" />}
                      {category === "Pricing" && (
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      )}
                      {category === "Details" && (
                        <CheckCircle className="h-4 w-4 text-blue-600" />
                      )}
                      {category === "Location" && (
                        <MapPin className="h-4 w-4 text-purple-600" />
                      )}
                      {category === "Features" && (
                        <AlertTriangle className="h-4 w-4 text-orange-600" />
                      )}
                      <span className="font-semibold text-sm">{category}</span>
                    </div>
                    {properties.map((property) => (
                      <div key={property._id} />
                    ))}
                  </div>
                </div>

                {/* Category Fields */}
                {fieldsByCategory[category]?.map((field, fieldIndex) => {
                  const allValues = properties.map((property) =>
                    getPropertyValue(property, field.key)
                  );

                  return (
                    <motion.div
                      animate={{ opacity: 1 }}
                      className={cn(
                        "grid min-h-[60px] items-center border-b transition-colors last:border-b-0 hover:bg-muted/20",
                        field.important && "bg-blue-50/30"
                      )}
                      initial={{ opacity: 0 }}
                      key={field.key}
                      style={{
                        gridTemplateColumns: `300px repeat(${properties.length}, 1fr)`,
                      }}
                      transition={{
                        delay: categoryIndex * 0.1 + fieldIndex * 0.05,
                      }}
                    >
                      {/* Field Label */}
                      <div className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "text-sm",
                              field.important ? "font-semibold" : "font-medium"
                            )}
                          >
                            {field.label}
                          </span>
                          {field.important && (
                            <Badge
                              className="px-1.5 py-0 text-xs"
                              variant="secondary"
                            >
                              Key
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Property Values */}
                      {properties.map((property) => {
                        const value = getPropertyValue(property, field.key);
                        const formattedValue = formatValue(value, field);
                        const highlightClass = getCellHighlight(
                          field,
                          value,
                          allValues
                        );

                        return (
                          <div
                            className={cn(
                              "border-l px-4 py-3 text-center",
                              highlightClass
                            )}
                            key={property._id}
                          >
                            {field.type === "badge" && value ? (
                              <Badge
                                className="text-xs"
                                variant={getBadgeVariant(value, field)}
                              >
                                {formattedValue}
                              </Badge>
                            ) : field.type === "boolean" ? (
                              <div className="flex items-center justify-center">
                                {value ? (
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                ) : (
                                  <X className="h-4 w-4 text-gray-400" />
                                )}
                              </div>
                            ) : field.type === "price" ? (
                              <div
                                className={cn(
                                  "font-semibold",
                                  field.key.includes("rentAmount")
                                    ? "text-green-600"
                                    : "text-gray-900"
                                )}
                              >
                                {formattedValue}
                              </div>
                            ) : field.type === "list" ? (
                              <div className="mx-auto max-w-[200px] text-xs leading-relaxed">
                                {formattedValue}
                              </div>
                            ) : (
                              <div className="text-sm">{formattedValue}</div>
                            )}
                          </div>
                        );
                      })}
                    </motion.div>
                  );
                })}
              </div>
            ))}
          </div>
        </ScrollArea>
      </Card>

      {/* Comparison Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5" />
            Comparison Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {/* Price Comparison */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Price Analysis</h4>
              <div className="space-y-1 text-muted-foreground text-sm">
                {(() => {
                  const prices = properties.map((p) => p.pricing.rent);
                  const maxPrice = Math.max(...prices);
                  const minPrice = Math.min(...prices);
                  const avgPrice =
                    prices.reduce((a, b) => a + b, 0) / prices.length;

                  const mostExpensive = properties.find(
                    (p) => p.pricing.rent === maxPrice
                  );
                  const cheapest = properties.find(
                    (p) => p.pricing.rent === minPrice
                  );

                  return (
                    <>
                      <p>
                        • Most expensive:{" "}
                        <span className="font-medium">
                          {mostExpensive?.title}
                        </span>{" "}
                        (KES {maxPrice.toLocaleString()})
                      </p>
                      <p>
                        • Most affordable:{" "}
                        <span className="font-medium">{cheapest?.title}</span>{" "}
                        (KES {minPrice.toLocaleString()})
                      </p>
                      <p>
                        • Average price:{" "}
                        <span className="font-medium">
                          KES {Math.round(avgPrice).toLocaleString()}
                        </span>
                      </p>
                      <p>
                        • Price difference:{" "}
                        <span className="font-medium">
                          KES {(maxPrice - minPrice).toLocaleString()}
                        </span>{" "}
                        ({Math.round(((maxPrice - minPrice) / minPrice) * 100)}
                        %)
                      </p>
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Size Comparison */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Size & Space</h4>
              <div className="space-y-1 text-muted-foreground text-sm">
                {(() => {
                  const sizes = properties
                    .map((p) => p.specifications.totalArea)
                    .filter(Boolean);
                  if (sizes.length === 0) {
                    return <p>• Size information not available</p>;
                  }

                  const maxSize = Math.max(...(sizes as number[])) || 0;
                  const minSize = Math.min(...(sizes as number[])) || 0;
                  const avgSize =
                    (sizes as number[]).reduce(
                      (a: number, b: number) => (a || 0) + (b || 0),
                      0
                    ) / sizes.length || 0;

                  const largest = properties.find(
                    (p) => p.specifications.totalArea === maxSize
                  );
                  const smallest = properties.find(
                    (p) => p.specifications.totalArea === minSize
                  );

                  return (
                    <>
                      <p>
                        • Largest:{" "}
                        <span className="font-medium">{largest?.title}</span> (
                        {maxSize} sq m)
                      </p>
                      <p>
                        • Smallest:{" "}
                        <span className="font-medium">{smallest?.title}</span> (
                        {minSize} sq m)
                      </p>
                      <p>
                        • Average size:{" "}
                        <span className="font-medium">
                          {Math.round(avgSize)} sq m
                        </span>
                      </p>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
