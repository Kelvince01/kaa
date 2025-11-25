import { Badge } from "@kaa/ui/components/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import { Separator } from "@kaa/ui/components/separator";

type MarketInsightsProps = {
  averageRent: number;
  thisProperty: number;
  priceDifference: number;
  priceDifferencePercentage: number;
};

export const MarketInsights = () => (
  <Card>
    <CardHeader>
      <CardTitle className="text-emerald-700">Market Insights</CardTitle>
    </CardHeader>
    <CardContent className="px-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-sm">
            Average Rent in Area
          </span>
          <span className="font-semibold text-emerald-600">KSh 78,000</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-sm">This Property</span>
          <span className="font-semibold text-emerald-600">KSh 85,000</span>
        </div>
        <Separator />
        <div className="flex items-center justify-between">
          <span className="font-medium text-emerald-700 text-sm">
            Price Difference
          </span>
          <Badge
            className="bg-emerald-100 text-emerald-700"
            variant="secondary"
          >
            +9% Premium
          </Badge>
        </div>
        <div className="text-muted-foreground text-xs">
          This property is priced 9% above market average due to premium
          location and amenities.
        </div>
      </div>
    </CardContent>
  </Card>
);
