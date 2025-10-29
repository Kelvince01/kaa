"use client";

import { Alert, AlertDescription, AlertTitle } from "@kaa/ui/components/alert";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@kaa/ui/components/dialog";
import { Label } from "@kaa/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@kaa/ui/components/select";
import { Skeleton } from "@kaa/ui/components/skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@kaa/ui/components/tabs";
import { Textarea } from "@kaa/ui/components/textarea";
import {
  AlertCircle,
  AlertTriangle,
  Calendar,
  DollarSign,
  Home,
  Percent,
  TrendingUp,
} from "lucide-react";
import type React from "react";
import { useState } from "react";
import {
  useCreateValuation,
  useGenerateAutomatedValuation,
  useMarketAnalysis,
  usePropertyValueTrends,
  useRentalEstimate,
  useValuationAlerts,
  useValuations,
  ValuationType,
} from "@/modules/properties/valuation";

type PropertyValuationDashboardProps = {
  propertyId: string;
};

type ValuationFormData = {
  valuationType: string;
  purpose: string;
  urgency: string;
  notes: string;
};

export const PropertyValuationDashboard: React.FC<
  PropertyValuationDashboardProps
> = ({ propertyId }) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState<ValuationFormData>({
    valuationType: "",
    purpose: "",
    urgency: "standard",
    notes: "",
  });

  const {
    data: valuationsData,
    isLoading: loadingValuations,
    error: valuationsError,
    refetch: refetchValuations,
  } = useValuations({ property: propertyId });

  const { data: trendsData, isLoading: loadingTrends } = usePropertyValueTrends(
    propertyId,
    "1y"
  );

  const { data: marketData, isLoading: loadingMarket } =
    useMarketAnalysis(propertyId);

  const { data: rentalData, isLoading: loadingRental } =
    useRentalEstimate(propertyId);

  const { data: alertsData } = useValuationAlerts(propertyId);

  const { mutate: createValuation, isPending: creatingValuation } =
    useCreateValuation();

  const { mutate: generateAutomatedValuation, isPending: generatingValuation } =
    useGenerateAutomatedValuation();

  const handleCreateValuation = (e: React.FormEvent) => {
    e.preventDefault();
    const valuationType =
      formData.valuationType === "professional"
        ? ValuationType.PROFESSIONAL
        : formData.valuationType === "automated"
          ? ValuationType.AUTOMATED
          : ValuationType.MARKET_ANALYSIS;

    createValuation(
      {
        propertyId,
        type: valuationType,
        purpose: formData.purpose,
        requestedBy: "current-user-id", // This should come from user context
        notes: formData.notes,
      },
      {
        onSuccess: () => {
          setShowCreateForm(false);
          setFormData({
            valuationType: "",
            purpose: "",
            urgency: "standard",
            notes: "",
          });
          refetchValuations();
        },
      }
    );
  };

  const handleGenerateAutomatedValuation = () => {
    generateAutomatedValuation(
      {
        propertyId,
        requestedBy: "current-user-id",
      },
      {
        onSuccess: () => {
          refetchValuations();
        },
      }
    );
  };

  const latestValuation = valuationsData?.data?.valuations?.[0];
  const valuations = valuationsData?.data?.valuations || [];
  const alerts = alertsData?.alerts || [];

  if (loadingValuations) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (valuationsError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load valuation data. Please try again.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-2xl tracking-tight">
            Property Valuation
          </h2>
          <p className="text-muted-foreground">
            Track property value, market trends, and rental potential
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            disabled={generatingValuation}
            onClick={handleGenerateAutomatedValuation}
            variant="outline"
          >
            {generatingValuation ? "Generating..." : "Auto Valuation"}
          </Button>
          <Button onClick={() => setShowCreateForm(true)}>
            Request Valuation
          </Button>
        </div>
      </div>

      {/* Current Value Summary */}
      {latestValuation && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="font-medium text-sm">
                Current Value
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="font-bold text-2xl">
                ${latestValuation.estimatedValue?.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="font-medium text-sm">Confidence</CardTitle>
              <Percent className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="font-bold text-2xl">
                {latestValuation.accuracy}%
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="font-medium text-sm">
                Last Updated
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="font-semibold text-sm">
                {new Date(latestValuation.createdAt).toLocaleDateString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="font-medium text-sm">Alerts</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="font-bold text-2xl">{alerts.length}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Alerts */}
      {alerts.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Valuation Alerts</AlertTitle>
          <AlertDescription>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
              {alerts.slice(0, 3).map((alert) => (
                <li key={alert._id}>
                  {alert.property ||
                    `${alert.alertType} alert for this property`}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Tabs */}
      <Tabs className="w-full" defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">
            <Home className="mr-2 h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="trends">
            <TrendingUp className="mr-2 h-4 w-4" />
            Value Trends
          </TabsTrigger>
          <TabsTrigger value="market">
            <Home className="mr-2 h-4 w-4" />
            Market Analysis
          </TabsTrigger>
          <TabsTrigger value="rental">
            <DollarSign className="mr-2 h-4 w-4" />
            Rental Estimate
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent className="mt-6 space-y-4" value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Valuation History</CardTitle>
              <CardDescription>
                Track your property valuations over time
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {valuations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <DollarSign className="mb-4 h-12 w-12 text-muted-foreground" />
                  <p className="text-center text-muted-foreground text-sm">
                    No valuations yet. Request a valuation to get started.
                  </p>
                </div>
              ) : (
                valuations.map((valuation) => (
                  <Card key={valuation._id}>
                    <CardContent className="flex items-start justify-between pt-6">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-lg">
                            ${valuation.estimatedValue?.toLocaleString()}
                          </h4>
                          <Badge
                            variant={
                              valuation.type === "automated"
                                ? "default"
                                : valuation.type === "professional"
                                  ? "secondary"
                                  : "outline"
                            }
                          >
                            {valuation.type}
                          </Badge>
                          <span className="text-muted-foreground text-sm">
                            Confidence: {valuation.accuracy}%
                          </span>
                        </div>
                        <p className="text-muted-foreground text-sm">
                          {valuation.methodology}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {new Date(valuation.createdAt).toLocaleDateString()}{" "}
                          by {valuation.requestedBy || "System"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-muted-foreground text-sm">
                          Valid until
                        </p>
                        <p className="font-medium text-sm">
                          {new Date(
                            valuation.expiryDate as string
                          ).toLocaleDateString()}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent className="mt-6 space-y-4" value="trends">
          <Card>
            <CardHeader>
              <CardTitle>Value Trends (12 Months)</CardTitle>
              <CardDescription>
                Track how your property value has changed over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingTrends ? (
                <Skeleton className="h-64 w-full" />
              ) : trendsData ? (
                <div className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardDescription>Total Change</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p
                          className={`font-bold text-2xl ${
                            trendsData.summary.totalChange >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          ${trendsData.summary.totalChange?.toLocaleString()}
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardDescription>Percentage Change</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p
                          className={`font-bold text-2xl ${
                            trendsData.summary.totalChangePercentage >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {trendsData.summary.totalChangePercentage?.toFixed(1)}
                          %
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardDescription>Avg Monthly Change</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="font-bold text-2xl">
                          $
                          {trendsData.summary.averageMonthlyChange?.toLocaleString()}
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardDescription>Volatility</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="font-bold text-2xl">
                          {trendsData.summary.volatility?.toFixed(1)}%
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="space-y-2">
                    {trendsData.trends?.slice(0, 6).map((trend) => (
                      <div
                        className="flex items-center justify-between border-b py-2"
                        key={trend.date}
                      >
                        <span className="text-sm">
                          {new Date(trend.date).toLocaleDateString()}
                        </span>
                        <div className="flex items-center gap-4">
                          <span className="font-medium">
                            ${trend.value?.toLocaleString()}
                          </span>
                          {trend.changePercentage !== undefined && (
                            <span
                              className={`text-sm ${
                                trend.changePercentage >= 0
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                            >
                              {trend.changePercentage > 0 ? "+" : ""}
                              {trend.changePercentage.toFixed(1)}%
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="py-8 text-center text-muted-foreground">
                  No trend data available
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Market Analysis Tab */}
        <TabsContent className="mt-6 space-y-4" value="market">
          <Card>
            <CardHeader>
              <CardTitle>Market Analysis</CardTitle>
              <CardDescription>
                Compare your property with market trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingMarket ? (
                <Skeleton className="h-64 w-full" />
              ) : marketData ? (
                <div className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-3">
                    <Card className="bg-muted/50">
                      <CardHeader>
                        <CardTitle className="text-base">
                          Average Price
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="font-bold text-2xl">
                          ${marketData.analysis.averagePrice?.toLocaleString()}
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="bg-muted/50">
                      <CardHeader>
                        <CardTitle className="text-base">
                          Price per Sq Ft
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="font-bold text-2xl">
                          $
                          {marketData.analysis.pricePerSquareFoot?.toLocaleString()}
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="bg-muted/50">
                      <CardHeader>
                        <CardTitle className="text-base">
                          Market Trend
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p
                          className={`font-bold text-2xl ${
                            marketData.analysis.trend === "rising"
                              ? "text-green-600"
                              : marketData.analysis.trend === "declining"
                                ? "text-red-600"
                                : "text-gray-600"
                          }`}
                        >
                          {marketData.analysis.trend === "rising"
                            ? "↗️ Rising"
                            : marketData.analysis.trend === "declining"
                              ? "↘️ Falling"
                              : "➡️ Stable"}
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {marketData.analysis.insights && (
                    <div>
                      <h4 className="mb-3 font-semibold">Market Insights</h4>
                      <ul className="space-y-2">
                        {marketData.analysis.insights.map((insight) => (
                          <li className="flex items-start" key={insight}>
                            <span className="mr-2 text-primary">•</span>
                            <span className="text-sm">{insight}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <p className="py-8 text-center text-muted-foreground">
                  No market analysis available
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rental Estimate Tab */}
        <TabsContent className="mt-6 space-y-4" value="rental">
          <Card>
            <CardHeader>
              <CardTitle>Rental Estimate</CardTitle>
              <CardDescription>
                Estimate rental income potential for your property
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingRental ? (
                <Skeleton className="h-64 w-full" />
              ) : rentalData ? (
                <div className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-3">
                    <Card className="bg-green-50">
                      <CardHeader>
                        <CardTitle className="text-base text-green-900">
                          Monthly Rent
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="font-bold text-3xl text-green-900">
                          ${rentalData.estimate.monthlyRent?.toLocaleString()}
                        </p>
                        <p className="mt-1 text-green-700 text-sm">
                          Range: $
                          {rentalData.estimate.rentRange?.low?.toLocaleString()}{" "}
                          - $
                          {rentalData.estimate.rentRange?.high?.toLocaleString()}
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="bg-blue-50">
                      <CardHeader>
                        <CardTitle className="text-base text-blue-900">
                          Gross Yield
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="font-bold text-3xl text-blue-900">
                          {rentalData.estimate.grossYield?.toFixed(1)}%
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="bg-purple-50">
                      <CardHeader>
                        <CardTitle className="text-base text-purple-900">
                          Net Yield
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="font-bold text-3xl text-purple-900">
                          {rentalData.estimate.netYield?.toFixed(1) || "N/A"}%
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {rentalData.estimate.comparables &&
                    rentalData.estimate.comparables.length > 0 && (
                      <div>
                        <h4 className="mb-3 font-semibold">
                          Rental Comparables
                        </h4>
                        <div className="space-y-3">
                          {rentalData.estimate.comparables
                            .slice(0, 5)
                            .map((comp) => (
                              <Card key={comp.address}>
                                <CardContent className="flex items-center justify-between pt-6">
                                  <div>
                                    <p className="font-medium">
                                      {comp.address}
                                    </p>
                                    <p className="text-muted-foreground text-sm">
                                      {comp.bedrooms} bed, {comp.bathrooms} bath
                                      • {comp.squareFootage} sq ft
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-bold">
                                      ${comp.monthlyRent?.toLocaleString()}/mo
                                    </p>
                                    <p className="text-muted-foreground text-sm">
                                      $
                                      {(
                                        comp.monthlyRent / comp.squareFootage
                                      ).toFixed(2)}
                                      /sq ft
                                    </p>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                        </div>
                      </div>
                    )}
                </div>
              ) : (
                <p className="py-8 text-center text-muted-foreground">
                  No rental estimate available
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Valuation Dialog */}
      <Dialog onOpenChange={setShowCreateForm} open={showCreateForm}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Request Property Valuation</DialogTitle>
            <DialogDescription>
              Submit a request for property valuation
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateValuation}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="valuationType">Valuation Type</Label>
                <Select
                  onValueChange={(value) =>
                    setFormData({ ...formData, valuationType: value })
                  }
                  value={formData.valuationType}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">
                      Professional Appraisal
                    </SelectItem>
                    <SelectItem value="automated">
                      Automated Valuation
                    </SelectItem>
                    <SelectItem value="comparative">
                      Comparative Market Analysis
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="purpose">Purpose</Label>
                <Select
                  onValueChange={(value) =>
                    setFormData({ ...formData, purpose: value })
                  }
                  value={formData.purpose}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select purpose" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sale">Sale</SelectItem>
                    <SelectItem value="refinance">Refinance</SelectItem>
                    <SelectItem value="insurance">Insurance</SelectItem>
                    <SelectItem value="investment">
                      Investment Analysis
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="urgency">Urgency</Label>
                <Select
                  onValueChange={(value) =>
                    setFormData({ ...formData, urgency: value })
                  }
                  value={formData.urgency}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">
                      Standard (5-7 days)
                    </SelectItem>
                    <SelectItem value="rush">Rush (2-3 days)</SelectItem>
                    <SelectItem value="urgent">Urgent (24 hours)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder="Any specific requirements or information..."
                  rows={3}
                  value={formData.notes}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                onClick={() => setShowCreateForm(false)}
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
              <Button disabled={creatingValuation} type="submit">
                {creatingValuation ? "Requesting..." : "Request Valuation"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
