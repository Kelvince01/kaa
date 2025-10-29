"use client";

import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import { Skeleton } from "@kaa/ui/components/skeleton";
import {
  AlertTriangle,
  Calendar,
  DollarSign,
  Lightbulb,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useMarketInsights } from "../../analytics.queries";

type MarketInsightsPanelProps = {
  propertyId?: string;
  location?: string;
};

export function MarketInsightsPanel({
  propertyId,
  location,
}: MarketInsightsPanelProps) {
  const {
    data: insights,
    isLoading,
    error,
  } = useMarketInsights(propertyId, location);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i.toString()}>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-16" />
              </div>
            </CardHeader>
            <CardContent>
              <Skeleton className="mb-2 h-4 w-full" />
              <Skeleton className="mb-4 h-4 w-3/4" />
              <div className="space-y-1">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error || !insights) {
    return (
      <div className="py-8 text-center">
        <p className="text-muted-foreground">Failed to load market insights</p>
      </div>
    );
  }

  const getInsightIcon = (type: string) => {
    switch (type) {
      case "pricing":
        return DollarSign;
      case "demand":
        return TrendingUp;
      case "timing":
        return Calendar;
      case "features":
        return Zap;
      default:
        return Lightbulb;
    }
  };

  const getImpactBadgeVariant = (
    impact: string
  ): "default" | "secondary" | "destructive" => {
    switch (impact) {
      case "high":
        return "destructive";
      case "medium":
        return "default";
      case "low":
        return "secondary";
      default:
        return "secondary";
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return "text-green-600";
    if (confidence >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  if (insights.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Lightbulb className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">No market insights available</p>
          <p className="mt-1 text-muted-foreground text-sm">
            Try selecting a property or location to get insights
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {insights.map((insight, index) => {
        const Icon = getInsightIcon(insight.type);

        return (
          <Card
            className={insight.actionRequired ? "border-orange-200" : ""}
            key={index.toString()}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Icon className="h-4 w-4 text-primary" />
                  <CardTitle className="text-base">{insight.title}</CardTitle>
                  <Badge variant={getImpactBadgeVariant(insight.impact)}>
                    {insight.impact} impact
                  </Badge>
                </div>
                <div className="flex items-center space-x-2">
                  {insight.actionRequired && (
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                  )}
                  <span
                    className={`font-medium text-xs ${getConfidenceColor(insight.confidence)}`}
                  >
                    {insight.confidence}% confidence
                  </span>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <p className="text-muted-foreground text-sm">
                {insight.description}
              </p>

              {insight.recommendations.length > 0 && (
                <div>
                  <h4 className="mb-2 flex items-center font-medium text-sm">
                    <Lightbulb className="mr-1 h-3 w-3" />
                    Recommendations
                  </h4>
                  <ul className="space-y-1">
                    {insight.recommendations.map((recommendation, recIndex) => (
                      <li
                        className="flex items-start text-muted-foreground text-xs"
                        key={recIndex.toString()}
                      >
                        <span className="mr-2 text-primary">•</span>
                        {recommendation}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {insight.actionRequired && (
                <div className="flex items-center justify-between border-t pt-2">
                  <span className="font-medium text-orange-600 text-xs">
                    Action Required
                  </span>
                  <Button size="sm" variant="outline">
                    Take Action
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      {/* Summary Card */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="flex items-center text-sm">
            <TrendingUp className="mr-2 h-4 w-4" />
            Market Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="font-bold text-2xl text-green-600">
                {
                  insights.filter(
                    (i) => i.impact === "high" && i.confidence > 70
                  ).length
                }
              </p>
              <p className="text-muted-foreground text-xs">
                High-confidence opportunities
              </p>
            </div>
            <div>
              <p className="font-bold text-2xl text-orange-600">
                {insights.filter((i) => i.actionRequired).length}
              </p>
              <p className="text-muted-foreground text-xs">Actions needed</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
