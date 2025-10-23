"use client";

import { Badge } from "@kaa/ui/components/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import { Progress } from "@kaa/ui/components/progress";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@kaa/ui/components/tabs";
import {
  BarChart3,
  Bus,
  Coffee,
  Hospital,
  Info,
  MapPin,
  School,
  ShoppingCart,
  Star,
  TrendingUp,
  Users,
} from "lucide-react";
import { useState } from "react";
import type { Property } from "@/modules/properties/property.type";
import { formatCurrency } from "@/shared/utils/format.util";

type NeighborhoodAnalyticsProps = {
  property: Property;
};

type SafetyMetric = {
  category: string;
  score: number;
  trend: "up" | "down" | "stable";
  description: string;
};

type SchoolData = {
  name: string;
  type: "Primary" | "Secondary" | "University";
  rating: number;
  distance: string;
  students?: number;
};

type MarketTrend = {
  period: string;
  averageRent: number;
  change: number;
  occupancyRate: number;
};

export function NeighborhoodAnalytics({
  property,
}: NeighborhoodAnalyticsProps) {
  const [activeTab, setActiveTab] = useState("overview");

  // Mock neighborhood data (would come from API)
  const neighborhoodData = {
    name: property.location.neighborhood || "Unknown",
    overallScore: 8.2,
    safetyMetrics: [
      {
        category: "Crime Rate",
        score: 7.5,
        trend: "down" as const,
        description: "Lower than city average",
      },
      {
        category: "Street Lighting",
        score: 8.5,
        trend: "up" as const,
        description: "Well-lit streets",
      },
      {
        category: "Emergency Response",
        score: 7.8,
        trend: "stable" as const,
        description: "Good response times",
      },
    ] as SafetyMetric[],
    demographics: {
      averageAge: 32,
      familyHouseholds: 45,
      youngProfessionals: 35,
      students: 20,
      walkScore: 78,
      transitScore: 82,
    },
    schools: [
      {
        name: "Kilimani Primary School",
        type: "Primary" as const,
        rating: 4.2,
        distance: "0.3 km",
        students: 450,
      },
      {
        name: "Nairobi Academy",
        type: "Secondary" as const,
        rating: 4.5,
        distance: "0.8 km",
        students: 650,
      },
      {
        name: "University of Nairobi",
        type: "University" as const,
        rating: 4.1,
        distance: "2.1 km",
        students: 45_000,
      },
    ] as SchoolData[],
    marketTrends: [
      {
        period: "Last 3 months",
        averageRent: 85_000,
        change: 5.2,
        occupancyRate: 92,
      },
      {
        period: "Last 6 months",
        averageRent: 82_000,
        change: 3.1,
        occupancyRate: 89,
      },
      {
        period: "Last year",
        averageRent: 78_000,
        change: 8.9,
        occupancyRate: 87,
      },
    ] as MarketTrend[],
    amenities: [
      { name: "Supermarkets", count: 8, icon: ShoppingCart, rating: 4.3 },
      { name: "Restaurants", count: 25, icon: Coffee, rating: 4.1 },
      { name: "Healthcare", count: 4, icon: Hospital, rating: 4.0 },
      { name: "Transport", count: 12, icon: Bus, rating: 3.8 },
    ],
  };

  const renderStars = (rating: number) =>
    Array.from({ length: 5 }).map((_, i) => (
      <Star
        className={`h-4 w-4 ${
          i < Math.floor(rating)
            ? "fill-yellow-400 text-yellow-400"
            : i < rating
              ? "fill-yellow-200 text-yellow-400"
              : "text-gray-300"
        }`}
        key={i.toString()}
      />
    ));

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-green-600";
    if (score >= 6) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 8) return "bg-green-50 border-green-200";
    if (score >= 6) return "bg-yellow-50 border-yellow-200";
    return "bg-red-50 border-red-200";
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Neighborhood Insights: {neighborhoodData.name}
        </CardTitle>
      </CardHeader>

      <CardContent>
        <Tabs className="w-full" onValueChange={setActiveTab} value={activeTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="safety">Safety</TabsTrigger>
            <TabsTrigger value="schools">Schools</TabsTrigger>
            <TabsTrigger value="market">Market</TabsTrigger>
          </TabsList>

          <TabsContent className="mt-6 space-y-6" value="overview">
            {/* Overall Score */}
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-6 text-center">
              <div className="mb-2 font-bold text-3xl text-blue-600">
                {neighborhoodData.overallScore}/10
              </div>
              <p className="font-medium text-blue-700">
                Overall Neighborhood Score
              </p>
              <p className="mt-1 text-blue-600 text-sm">
                Based on safety, amenities, and market data
              </p>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="rounded-lg bg-gray-50 p-4 text-center">
                <div className="font-bold text-2xl">
                  {neighborhoodData.demographics.walkScore}
                </div>
                <div className="text-muted-foreground text-sm">Walk Score</div>
              </div>
              <div className="rounded-lg bg-gray-50 p-4 text-center">
                <div className="font-bold text-2xl">
                  {neighborhoodData.demographics.transitScore}
                </div>
                <div className="text-muted-foreground text-sm">
                  Transit Score
                </div>
              </div>
              <div className="rounded-lg bg-gray-50 p-4 text-center">
                <div className="font-bold text-2xl">
                  {neighborhoodData.demographics.averageAge}
                </div>
                <div className="text-muted-foreground text-sm">Avg Age</div>
              </div>
              <div className="rounded-lg bg-gray-50 p-4 text-center">
                <div className="font-bold text-2xl">
                  {neighborhoodData.demographics.familyHouseholds}%
                </div>
                <div className="text-muted-foreground text-sm">Families</div>
              </div>
            </div>

            {/* Nearby Amenities */}
            <div>
              <h4 className="mb-4 font-medium">Nearby Amenities</h4>
              <div className="grid grid-cols-2 gap-4">
                {neighborhoodData.amenities.map((amenity) => (
                  <div
                    className="flex items-center gap-3 rounded-lg bg-gray-50 p-3"
                    key={amenity.name}
                  >
                    <amenity.icon className="h-5 w-5 text-blue-600" />
                    <div className="flex-1">
                      <div className="font-medium text-sm">{amenity.name}</div>
                      <div className="text-muted-foreground text-xs">
                        {amenity.count} nearby
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-xs">{amenity.rating}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent className="mt-6 space-y-6" value="safety">
            <div className="space-y-4">
              {neighborhoodData.safetyMetrics.map((metric) => (
                <Card
                  className={getScoreBgColor(metric.score)}
                  key={metric.category}
                >
                  <CardContent className="p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <h4 className="font-medium">{metric.category}</h4>
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-bold ${getScoreColor(metric.score)}`}
                        >
                          {metric.score}/10
                        </span>
                        <TrendingUp
                          className={`h-4 w-4 ${
                            metric.trend === "up"
                              ? "text-green-600"
                              : metric.trend === "down"
                                ? "rotate-180 text-red-600"
                                : "text-gray-400"
                          }`}
                        />
                      </div>
                    </div>
                    <Progress className="mb-2" value={metric.score * 10} />
                    <p className="text-muted-foreground text-sm">
                      {metric.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <div className="flex items-start gap-2">
                <Info className="mt-0.5 h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-700 text-sm">
                    Safety Information
                  </p>
                  <p className="mt-1 text-blue-600 text-xs">
                    Safety scores are based on crime statistics, community
                    feedback, and infrastructure quality. Data is updated
                    monthly from official sources.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent className="mt-6 space-y-6" value="schools">
            <div className="space-y-4">
              {neighborhoodData.schools.map((school) => (
                <Card className="border border-gray-200" key={school.name}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="mb-2 flex items-center gap-2">
                          <School className="h-5 w-5 text-blue-600" />
                          <h4 className="font-medium">{school.name}</h4>
                          <Badge variant="outline">{school.type}</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-muted-foreground text-sm">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            <span>{school.distance}</span>
                          </div>
                          {school.students && (
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              <span>
                                {school.students.toLocaleString()} students
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          {renderStars(school.rating)}
                        </div>
                        <span className="font-medium text-sm">
                          {school.rating}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent className="mt-6 space-y-6" value="market">
            <div className="space-y-4">
              <h4 className="font-medium">Rental Market Trends</h4>
              {neighborhoodData.marketTrends.map((trend) => (
                <Card className="border border-gray-200" key={trend.period}>
                  <CardContent className="p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <h5 className="font-medium">{trend.period}</h5>
                      <div className="flex items-center gap-2">
                        <TrendingUp
                          className={`h-4 w-4 ${trend.change > 0 ? "text-green-600" : "text-red-600"}`}
                        />
                        <span
                          className={`font-medium text-sm ${trend.change > 0 ? "text-green-600" : "text-red-600"}`}
                        >
                          {trend.change > 0 ? "+" : ""}
                          {trend.change}%
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-muted-foreground text-sm">
                          Average Rent
                        </div>
                        <div className="font-semibold">
                          {formatCurrency(trend.averageRent, "KES")}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-sm">
                          Occupancy Rate
                        </div>
                        <div className="font-semibold">
                          {trend.occupancyRate}%
                        </div>
                      </div>
                    </div>

                    <Progress className="mt-2" value={trend.occupancyRate} />
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
              <div className="flex items-start gap-2">
                <TrendingUp className="mt-0.5 h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-700 text-sm">
                    Market Outlook
                  </p>
                  <p className="mt-1 text-green-600 text-xs">
                    The {neighborhoodData.name} area shows strong rental demand
                    with consistent price appreciation. High occupancy rates
                    indicate good investment potential.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
