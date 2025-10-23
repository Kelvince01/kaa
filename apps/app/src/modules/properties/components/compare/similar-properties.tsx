import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import { ScrollArea } from "@kaa/ui/components/scroll-area";
import {
  Bath,
  Bed,
  Home,
  Lightbulb,
  MapPin,
  Plus,
  Star,
  Target,
} from "lucide-react";
import { motion } from "motion/react";
import Image from "next/image";
import type React from "react";
import { useMemo } from "react";
import type { Property } from "../../property.type";

type SimilarPropertiesProps = {
  baseProperties: Property[];
  availableProperties: Property[];
  onAddProperty: (property: Property) => void;
};

export const SimilarProperties: React.FC<SimilarPropertiesProps> = ({
  baseProperties,
  availableProperties,
  onAddProperty,
}) => {
  const similarProperties = useMemo(() => {
    if (baseProperties.length === 0) return [];

    // Get average characteristics of base properties
    const avgPrice =
      baseProperties.reduce((sum, prop) => sum + prop.pricing.rent, 0) /
      baseProperties.length;
    const avgBedrooms =
      baseProperties.reduce(
        (sum, prop) => sum + (prop.specifications.bedrooms || 0),
        0
      ) / baseProperties.length;
    const avgSize =
      baseProperties.reduce(
        (sum, prop) => sum + (prop.specifications.totalArea || 0),
        0
      ) / baseProperties.length;

    // Get most common property types and counties
    const typeCounts = baseProperties.reduce(
      (acc, prop) => {
        acc[prop.type] = (acc[prop.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
    const mostCommonType = Object.entries(typeCounts).sort(
      ([, a], [, b]) => b - a
    )[0]?.[0];

    const countyCounts = baseProperties.reduce(
      (acc, prop) => {
        acc[prop.location.county] = (acc[prop.location.county] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
    const mostCommonCounty = Object.entries(countyCounts).sort(
      ([, a], [, b]) => b - a
    )[0]?.[0];

    // Get IDs of base properties to exclude
    const basePropertyIds = new Set(baseProperties.map((prop) => prop._id));

    // Calculate similarity scores
    const scoredProperties = availableProperties
      .filter((prop) => !basePropertyIds.has(prop._id))
      .map((prop) => {
        let score = 0;
        const reasons: string[] = [];

        // Price similarity (30% weight)
        const priceDiff = Math.abs(prop.pricing.rent - avgPrice) / avgPrice;
        const priceScore = Math.max(0, 1 - priceDiff) * 30;
        score += priceScore;
        if (priceDiff < 0.2) reasons.push("Similar price range");

        // Bedrooms similarity (20% weight)
        const bedroomDiff = Math.abs(
          (prop.specifications.bedrooms || 0) - avgBedrooms
        );
        const bedroomScore = Math.max(0, 1 - bedroomDiff / 3) * 20;
        score += bedroomScore;
        if (bedroomDiff <= 1) reasons.push("Similar bedroom count");

        // Size similarity (15% weight)
        if (prop.specifications.totalArea && avgSize > 0) {
          const sizeDiff =
            Math.abs(prop.specifications.totalArea - avgSize) / avgSize;
          const sizeScore = Math.max(0, 1 - sizeDiff) * 15;
          score += sizeScore;
          if (sizeDiff < 0.3) reasons.push("Similar size");
        }

        // Property type match (20% weight)
        if (prop.type === mostCommonType) {
          score += 20;
          reasons.push(`Same type (${mostCommonType})`);
        }

        // Location similarity (15% weight)
        if (prop.location.county === mostCommonCounty) {
          score += 15;
          reasons.push(`Same county (${mostCommonCounty})`);
        }

        // Check for constituency matches
        const constituencies = baseProperties.map(
          (p) => p.location.constituency
        );
        if (constituencies.includes(prop.location.constituency)) {
          score += 10;
          reasons.push("Same constituency");
        }

        // Feature overlap bonus
        const baseFeatures = new Set(
          baseProperties.flatMap((p) => Object.keys(p.amenities) || [])
        );
        const propFeatures = new Set(Object.keys(prop.amenities) || []);
        const featureOverlap = [...baseFeatures].filter((f) =>
          propFeatures.has(f)
        ).length;
        if (featureOverlap > 0) {
          score += featureOverlap * 2;
          reasons.push(`${featureOverlap} shared features`);
        }

        // Amenity overlap bonus
        const baseAmenities = new Set(
          baseProperties.flatMap((p) => Object.keys(p.amenities) || [])
        );
        const propAmenities = new Set(Object.keys(prop.amenities) || []);
        const amenityOverlap = [...baseAmenities].filter((a) =>
          propAmenities.has(a)
        ).length;
        if (amenityOverlap > 0) {
          score += amenityOverlap * 1.5;
          reasons.push(`${amenityOverlap} shared amenities`);
        }

        return {
          property: prop,
          score: Math.min(100, score),
          reasons: reasons.slice(0, 3), // Keep only top 3 reasons
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 8); // Keep top 8 similar properties

    return scoredProperties.filter((item) => item.score > 20); // Only show reasonably similar properties
  }, [baseProperties, availableProperties]);

  if (similarProperties.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5" />
          Similar Properties You Might Like
        </CardTitle>
        <CardDescription>
          Based on your current comparison, here are other properties that might
          interest you
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="w-full">
          <div className="flex gap-4 pb-4">
            {similarProperties.map((item, index) => (
              <motion.div
                animate={{ opacity: 1, x: 0 }}
                className="w-80 shrink-0"
                initial={{ opacity: 0, x: 50 }}
                key={item.property._id}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full transition-shadow hover:shadow-md">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <CardTitle className="line-clamp-2 text-base leading-tight">
                          {item.property.title}
                        </CardTitle>
                        <div className="mt-1 flex items-center gap-1 text-muted-foreground text-xs">
                          <MapPin className="h-3 w-3" />
                          {item.property.location.county},{" "}
                          {item.property.location.constituency}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-xs">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">
                          {Math.round(item.score)}
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Property Image */}
                    {item.property.media?.images?.[0] && (
                      <Image
                        alt={item.property.title}
                        className="h-32 w-full rounded-lg object-cover"
                        height={128}
                        src={item.property.media.images[0].url}
                        width={128}
                      />
                    )}

                    {/* Key Details */}
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-green-600">
                        KES {item.property.pricing.rent.toLocaleString()}
                      </div>
                      <div className="flex items-center gap-3 text-muted-foreground text-sm">
                        <div className="flex items-center gap-1">
                          <Bed className="h-3 w-3" />
                          {item.property.specifications.bedrooms || 0}
                        </div>
                        <div className="flex items-center gap-1">
                          <Bath className="h-3 w-3" />
                          {item.property.specifications.bathrooms || 0}
                        </div>
                        {item.property.specifications.totalArea && (
                          <div className="flex items-center gap-1">
                            <Home className="h-3 w-3" />
                            {item.property.specifications.totalArea} sq m
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Similarity Reasons */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-1 font-medium text-muted-foreground text-xs">
                        <Target className="h-3 w-3" />
                        Why it's similar:
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {item.reasons.map((reason, idx) => (
                          <Badge
                            className="px-2 py-0.5 text-xs"
                            key={idx.toString()}
                            variant="secondary"
                          >
                            {reason}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Add Button */}
                    <Button
                      className="w-full"
                      onClick={() => onAddProperty(item.property)}
                      size="sm"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add to Comparison
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </ScrollArea>

        {/* Summary Statistics */}
        <div className="mt-4 rounded-lg bg-muted/50 p-4">
          <div className="grid grid-cols-2 gap-4 text-center md:grid-cols-4">
            <div>
              <div className="font-bold text-2xl text-primary">
                {similarProperties.length}
              </div>
              <div className="text-muted-foreground text-xs">
                Similar Properties
              </div>
            </div>
            <div>
              <div className="font-bold text-2xl text-green-600">
                {Math.round(
                  similarProperties.reduce((sum, item) => sum + item.score, 0) /
                    similarProperties.length
                )}
              </div>
              <div className="text-muted-foreground text-xs">
                Avg. Match Score
              </div>
            </div>
            <div>
              <div className="font-bold text-2xl text-blue-600">
                {Math.round(
                  similarProperties.reduce(
                    (sum, item) => sum + item.property.pricing.rent,
                    0
                  ) /
                    similarProperties.length /
                    1000
                )}
                K
              </div>
              <div className="text-muted-foreground text-xs">
                Avg. Price (KES)
              </div>
            </div>
            <div>
              <div className="font-bold text-2xl text-purple-600">
                {
                  new Set(
                    similarProperties.map(
                      (item) => item.property.location.county
                    )
                  ).size
                }
              </div>
              <div className="text-muted-foreground text-xs">Counties</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
