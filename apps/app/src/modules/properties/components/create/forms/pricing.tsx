import { zodResolver } from "@hookform/resolvers/zod";
import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import { Checkbox } from "@kaa/ui/components/checkbox";
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
import { Progress } from "@kaa/ui/components/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@kaa/ui/components/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@kaa/ui/components/tabs";
import { cn } from "@kaa/ui/lib/utils";
import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  Calculator,
  Calendar,
  DollarSign,
  Info,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useMarketIntelligence } from "../hooks/use-market-intelligence";

const pricingSchema = z.object({
  // Main pricing
  rentAmount: z.number().positive("Rent amount must be greater than 0"),
  currency: z.enum(["KES", "USD"]),
  paymentFrequency: z.enum([
    "daily",
    "weekly",
    "monthly",
    "quarterly",
    "annually",
  ]),

  // Deposits and fees
  securityDeposit: z.number().min(0, "Security deposit cannot be negative"),
  securityDepositMonths: z.number().min(0).max(12),

  // Optional fees
  serviceCharge: z.number().min(0).optional(),
  serviceChargeFrequency: z.enum(["monthly", "quarterly", "annually"]),
  maintenanceFee: z.number().min(0).optional(),
  parkingFee: z.number().min(0).optional(),
  utilityDeposit: z.number().min(0).optional(),

  // Utility inclusions
  utilitiesIncluded: z.array(z.string()),

  // Pricing strategy
  negotiable: z.boolean(),
  minimumPrice: z.number().optional(),
  discountForLongTerm: z.boolean(),
  longTermDiscount: z.number().min(0).max(50).optional(), // percentage

  // Payment terms
  paymentMethods: z.array(z.string()),
  advancePayment: z.number().min(0), // months in advance

  // Additional costs
  commissionRate: z.number().min(0).max(100).optional(), // percentage
  brokerageFee: z.number().min(0).optional(),
  legalFees: z.number().min(0).optional(),

  // Market positioning
  priceJustification: z.string().optional(),
  competitiveAdvantage: z.string().optional(),
});

type PricingFormData = z.infer<typeof pricingSchema>;

type PricingFormProps = {
  defaultValues?: Partial<PricingFormData>;
  propertyData?: any; // For market intelligence
  onSubmit: (data: PricingFormData) => void;
  onNext: () => void;
  onPrevious: () => void;
  className?: string;
};

const currencies = [
  { value: "KES", label: "KES (Kenyan Shilling)", symbol: "KES" },
  { value: "USD", label: "USD (US Dollar)", symbol: "$" },
];

const paymentFrequencies = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "annually", label: "Annually" },
];

const utilitiesOptions = [
  "Electricity",
  "Water",
  "Gas",
  "Internet",
  "Cable TV",
  "Waste Collection",
  "Security",
  "Parking",
  "Garden Maintenance",
  "Pool Maintenance",
];

const paymentMethodsOptions = [
  "Bank Transfer",
  "Mobile Money (M-Pesa)",
  "Cash",
  "Check",
  "Online Payment",
  "Standing Order",
  "Direct Debit",
];

export function EnhancedPricingForm({
  defaultValues,
  propertyData,
  onSubmit,
  onNext,
  onPrevious,
  className,
}: PricingFormProps) {
  const [activeTab, setActiveTab] = useState("pricing");
  const [showMarketData, setShowMarketData] = useState(false);
  const [aiEstimation, setAiEstimation] = useState<any>(null);

  const {
    getMarketData,
    getComparables,
    getInsights,
    getForecast,
    getRentalTrends,
    marketData,
    comparables,
    insights,
    forecast,
    rentalTrends,
    isLoadingMarketData,
    isLoadingComparables,
    isLoadingInsights,
    isLoadingForecast,
    isLoadingRentalTrends,
  } = useMarketIntelligence();

  const form = useForm<PricingFormData>({
    resolver: zodResolver(pricingSchema),
    defaultValues: {
      currency: "KES",
      paymentFrequency: "monthly",
      securityDepositMonths: 1,
      serviceChargeFrequency: "monthly",
      utilitiesIncluded: [],
      paymentMethods: [],
      negotiable: false,
      discountForLongTerm: false,
      advancePayment: 1,
      ...defaultValues,
    },
  });

  const watchedValues = form.watch();

  const handleSubmit = (data: PricingFormData) => {
    onSubmit(data);
    onNext();
  };

  const getCurrencySymbol = (currency: string) =>
    currencies.find((c) => c.value === currency)?.symbol || "";

  const calculateMonthlyEquivalent = (amount: number, frequency: string) => {
    const multipliers = {
      daily: 30,
      weekly: 4.33,
      monthly: 1,
      quarterly: 1 / 3,
      annually: 1 / 12,
    };
    return amount * (multipliers[frequency as keyof typeof multipliers] || 1);
  };

  const handleGetMarketInsights = async () => {
    if (!(propertyData?.location?.county && propertyData?.details?.bedrooms)) {
      return;
    }

    setShowMarketData(true);

    try {
      await Promise.all([
        getMarketData(
          propertyData.location.county,
          propertyData.basic?.type || "apartment"
        ),
        getComparables(
          propertyData.location.county,
          propertyData.details.bedrooms,
          propertyData.details.bathrooms || 1,
          propertyData.details.size
        ),
        getInsights(propertyData),
        getForecast(propertyData.location.county),
        getRentalTrends(
          propertyData.location.county,
          propertyData.basic?.type || "apartment"
        ),
      ]);
    } catch (error) {
      console.error("Failed to get market insights:", error);
    }
  };

  // AI-powered rent estimation
  const getAIRentEstimation = () => {
    if (!propertyData) return null;

    try {
      // Simulate AI estimation based on property features
      const basePrice = marketData?.averagePrice || 50_000;
      const bedroomMultiplier = propertyData.details?.bedrooms || 1;
      const bathroomMultiplier = (propertyData.details?.bathrooms || 1) * 0.5;
      const sizeMultiplier = (propertyData.details?.size || 1000) / 1000;
      const locationMultiplier =
        marketData?.demandLevel === "high"
          ? 1.2
          : marketData?.demandLevel === "medium"
            ? 1.0
            : 0.8;

      const estimatedPrice =
        basePrice *
        bedroomMultiplier *
        (1 + bathroomMultiplier) *
        sizeMultiplier *
        locationMultiplier;

      const estimation = {
        estimatedRent: Math.round(estimatedPrice),
        confidence: 85,
        factors: {
          basePrice,
          bedroomMultiplier,
          bathroomMultiplier,
          sizeMultiplier,
          locationMultiplier,
        },
        reasoning: `Based on ${bedroomMultiplier} bedroom(s), ${propertyData.details?.bathrooms || 1} bathroom(s), and ${propertyData.details?.size || 1000} sq ft in ${propertyData.location?.county} with ${marketData?.demandLevel || "medium"} demand.`,
      };

      setAiEstimation(estimation);
      return estimation;
    } catch (error) {
      console.error("AI rent estimation failed:", error);
      return null;
    }
  };

  // ROI Calculator
  const calculateROI = () => {
    const rentAmount = watchedValues.rentAmount;
    const purchasePrice =
      propertyData?.pricing?.purchasePrice || rentAmount * 120; // Estimate purchase price
    const annualRent = rentAmount * 12;
    const expenses = {
      maintenance: annualRent * 0.1,
      propertyTax: purchasePrice * 0.02,
      insurance: purchasePrice * 0.005,
      vacancy: annualRent * 0.05,
      management: annualRent * 0.08,
    };

    const totalExpenses = Object.values(expenses).reduce(
      (sum, exp) => sum + exp,
      0
    );
    const netIncome = annualRent - totalExpenses;
    const roi = (netIncome / purchasePrice) * 100;

    return {
      annualRent,
      totalExpenses,
      netIncome,
      roi,
      expenses,
      capRate: (netIncome / purchasePrice) * 100,
    };
  };

  const applyMarketSuggestion = (price: number) => {
    form.setValue("rentAmount", price);

    // Auto-calculate suggested deposits and fees
    form.setValue(
      "securityDeposit",
      price * watchedValues.securityDepositMonths
    );
    if (!watchedValues.serviceCharge) {
      form.setValue("serviceCharge", Math.round(price * 0.1)); // 10% of rent
    }
  };

  const validatePricing = () => {
    const warnings: string[] = [];
    const monthlyRent = calculateMonthlyEquivalent(
      watchedValues.rentAmount,
      watchedValues.paymentFrequency
    );

    if (watchedValues.securityDeposit > monthlyRent * 3) {
      warnings.push("Security deposit seems high (>3x monthly rent)");
    }

    if (
      watchedValues.serviceCharge &&
      watchedValues.serviceCharge > monthlyRent * 0.3
    ) {
      warnings.push("Service charge is unusually high (>30% of rent)");
    }

    if (marketData && monthlyRent > marketData.priceRange.max) {
      warnings.push("Price is above market range for this area");
    }

    if (marketData && monthlyRent < marketData.priceRange.min) {
      warnings.push(
        "Price is below market range - consider if this is intentional"
      );
    }

    return warnings;
  };

  const pricingWarnings = validatePricing();
  const roiData = calculateROI();

  return (
    <div className={cn("space-y-6", className)}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Enhanced Pricing & Payment Terms
            </div>
            <div className="flex gap-2">
              <Button
                disabled={isLoadingMarketData}
                onClick={handleGetMarketInsights}
                size="sm"
                type="button"
                variant="outline"
              >
                {isLoadingMarketData ? (
                  <>
                    <TrendingUp className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Market Analysis
                  </>
                )}
              </Button>
              <Button
                onClick={getAIRentEstimation}
                size="sm"
                type="button"
                variant="outline"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                AI Estimate
              </Button>
            </div>
          </CardTitle>
          <p className="text-gray-600 text-sm">
            Set competitive pricing with AI-powered market insights and ROI
            analysis
          </p>
        </CardHeader>

        <CardContent>
          <Tabs
            className="w-full"
            onValueChange={setActiveTab}
            value={activeTab}
          >
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="pricing">Pricing</TabsTrigger>
              <TabsTrigger value="market">Market Analysis</TabsTrigger>
              <TabsTrigger value="roi">ROI Calculator</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>

            <TabsContent className="space-y-6" value="pricing">
              <Form {...form}>
                <form
                  className="space-y-6"
                  onSubmit={form.handleSubmit(handleSubmit)}
                >
                  {/* AI Estimation Panel */}
                  {aiEstimation && (
                    <Card className="border-purple-200 bg-purple-50">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-sm">
                          <Sparkles className="h-4 w-4" />
                          AI Rent Estimation
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                          <div className="text-center">
                            <div className="font-bold text-lg text-purple-600">
                              {getCurrencySymbol(watchedValues.currency)}
                              {aiEstimation.estimatedRent.toLocaleString()}
                            </div>
                            <div className="text-gray-600 text-xs">
                              AI Estimated Rent
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="font-bold text-lg text-purple-600">
                              {aiEstimation.confidence}%
                            </div>
                            <div className="text-gray-600 text-xs">
                              Confidence Level
                            </div>
                          </div>
                          <div className="text-center">
                            <Progress
                              className="mx-auto w-16"
                              value={aiEstimation.confidence}
                            />
                          </div>
                        </div>

                        <div className="mb-4">
                          <p className="text-gray-700 text-sm">
                            {aiEstimation.reasoning}
                          </p>
                        </div>

                        <Button
                          className="w-full"
                          onClick={() =>
                            applyMarketSuggestion(aiEstimation.estimatedRent)
                          }
                          size="sm"
                          type="button"
                        >
                          <Zap className="mr-2 h-3 w-3" />
                          Apply AI Suggestion
                        </Button>
                      </CardContent>
                    </Card>
                  )}

                  {/* Pricing Warnings */}
                  {pricingWarnings.length > 0 && (
                    <Card className="border-amber-200 bg-amber-50">
                      <CardContent className="pt-4">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-600" />
                          <div>
                            <h4 className="font-medium text-amber-800 text-sm">
                              Pricing Considerations
                            </h4>
                            <ul className="mt-2 space-y-1">
                              {pricingWarnings.map((warning, index) => (
                                <li
                                  className="text-amber-700 text-sm"
                                  key={index.toString()}
                                >
                                  • {warning}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Main Pricing */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-lg">Main Pricing</h3>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <FormField
                        control={form.control}
                        name="rentAmount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Rent Amount *</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <span className="-translate-y-1/2 absolute top-1/2 left-3 transform text-gray-500">
                                  {getCurrencySymbol(watchedValues.currency)}
                                </span>
                                <Input
                                  className="pl-12"
                                  placeholder="e.g., 50000"
                                  type="number"
                                  {...field}
                                  onChange={(e) =>
                                    field.onChange(
                                      Number.parseFloat(e.target.value) || 0
                                    )
                                  }
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="currency"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Currency</FormLabel>
                            <Select
                              defaultValue={field.value}
                              onValueChange={field.onChange}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {currencies.map((currency) => (
                                  <SelectItem
                                    key={currency.value}
                                    value={currency.value}
                                  >
                                    {currency.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="paymentFrequency"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              Payment Frequency
                            </FormLabel>
                            <Select
                              defaultValue={field.value}
                              onValueChange={field.onChange}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {paymentFrequencies.map((freq) => (
                                  <SelectItem
                                    key={freq.value}
                                    value={freq.value}
                                  >
                                    {freq.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Monthly Equivalent Display */}
                    {watchedValues.paymentFrequency !== "monthly" &&
                      watchedValues.rentAmount > 0 && (
                        <div className="rounded-lg bg-gray-50 p-3">
                          <span className="text-gray-600 text-sm">
                            Monthly equivalent:{" "}
                            {getCurrencySymbol(watchedValues.currency)}
                            {calculateMonthlyEquivalent(
                              watchedValues.rentAmount,
                              watchedValues.paymentFrequency
                            ).toLocaleString()}
                          </span>
                        </div>
                      )}
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
                      Back to Media
                    </Button>

                    <Button className="min-w-32" type="submit">
                      Continue to Availability
                    </Button>
                  </div>
                </form>
              </Form>
            </TabsContent>

            <TabsContent className="space-y-6" value="market">
              {showMarketData && marketData && (
                <Card className="border-blue-200 bg-blue-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <Target className="h-4 w-4" />
                      Market Intelligence
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                      <div className="text-center">
                        <div className="font-bold text-blue-600 text-lg">
                          {getCurrencySymbol(watchedValues.currency)}
                          {marketData.averagePrice.toLocaleString()}
                        </div>
                        <div className="text-gray-600 text-xs">
                          Average Market Price
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-blue-600 text-lg">
                          {marketData.demandLevel.toUpperCase()}
                        </div>
                        <div className="text-gray-600 text-xs">
                          Demand Level
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-blue-600 text-lg">
                          {marketData.averageDaysOnMarket} days
                        </div>
                        <div className="text-gray-600 text-xs">
                          Average Days on Market
                        </div>
                      </div>
                    </div>

                    <div className="mb-4 flex flex-wrap gap-2">
                      <Badge variant="outline">
                        Range: {getCurrencySymbol(watchedValues.currency)}
                        {marketData.priceRange.min.toLocaleString()} -{" "}
                        {getCurrencySymbol(watchedValues.currency)}
                        {marketData.priceRange.max.toLocaleString()}
                      </Badge>
                      <Badge variant="outline">
                        {marketData.competitorCount} similar properties
                      </Badge>
                    </div>

                    <Button
                      className="w-full"
                      onClick={() =>
                        applyMarketSuggestion(marketData.averagePrice)
                      }
                      size="sm"
                      type="button"
                    >
                      <Sparkles className="mr-2 h-3 w-3" />
                      Apply Market-Based Pricing
                    </Button>
                  </CardContent>
                </Card>
              )}

              {comparables && comparables.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <BarChart3 className="h-4 w-4" />
                      Comparable Properties
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {comparables.slice(0, 5).map((comp) => (
                        <div
                          className="flex items-center justify-between rounded-lg border p-3"
                          key={comp.id}
                        >
                          <div>
                            <div className="font-medium text-sm">
                              {comp.bedrooms}BR • {comp.bathrooms}BA •{" "}
                              {comp.size} sq ft
                            </div>
                            <div className="text-gray-600 text-xs">
                              {comp.distance}km away • Listed recently
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-sm">
                              {getCurrencySymbol(watchedValues.currency)}
                              {comp.price.toLocaleString()}
                            </div>
                            <div className="text-gray-600 text-xs">
                              {getCurrencySymbol(watchedValues.currency)}
                              {(comp.price / (comp.size || 1)).toFixed(0)}/sq ft
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent className="space-y-6" value="roi">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Calculator className="h-4 w-4" />
                    ROI Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="space-y-4">
                      <div className="rounded-lg border p-4">
                        <div className="font-bold text-2xl text-green-600">
                          {roiData.roi.toFixed(1)}%
                        </div>
                        <div className="text-gray-600 text-sm">Annual ROI</div>
                      </div>

                      <div className="rounded-lg border p-4">
                        <div className="font-bold text-2xl text-blue-600">
                          {roiData.capRate.toFixed(1)}%
                        </div>
                        <div className="text-gray-600 text-sm">Cap Rate</div>
                      </div>

                      <div className="rounded-lg border p-4">
                        <div className="font-bold text-2xl text-purple-600">
                          {getCurrencySymbol(watchedValues.currency)}
                          {roiData.netIncome.toLocaleString()}
                        </div>
                        <div className="text-gray-600 text-sm">
                          Annual Net Income
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-medium">Expense Breakdown</h4>
                      <div className="space-y-2">
                        {Object.entries(roiData.expenses).map(
                          ([key, value]) => (
                            <div
                              className="flex justify-between text-sm"
                              key={key}
                            >
                              <span className="capitalize">
                                {key.replace(/([A-Z])/g, " $1")}
                              </span>
                              <span>
                                {getCurrencySymbol(watchedValues.currency)}
                                {value.toLocaleString()}
                              </span>
                            </div>
                          )
                        )}
                        <div className="flex justify-between border-t pt-2 font-medium">
                          <span>Total Expenses</span>
                          <span>
                            {getCurrencySymbol(watchedValues.currency)}
                            {roiData.totalExpenses.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 rounded-lg bg-gray-50 p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <Info className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-sm">
                        Investment Insights
                      </span>
                    </div>
                    <ul className="space-y-1 text-gray-600 text-sm">
                      <li>
                        • Break-even period:{" "}
                        {Math.ceil(
                          (roiData.expenses.maintenance * 12) /
                            roiData.netIncome
                        )}{" "}
                        months
                      </li>
                      <li>
                        • Cash-on-cash return:{" "}
                        {(
                          (roiData.netIncome /
                            (roiData.expenses.maintenance * 12)) *
                          100
                        ).toFixed(1)}
                        %
                      </li>
                      <li>
                        • Monthly cash flow:{" "}
                        {getCurrencySymbol(watchedValues.currency)}
                        {(roiData.netIncome / 12).toLocaleString()}
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent className="space-y-6" value="advanced">
              <Form {...form}>
                <form className="space-y-6">
                  {/* Deposits and Security */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-lg">Deposits & Security</h3>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <FormField
                          control={form.control}
                          name="securityDepositMonths"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Security Deposit (Months)</FormLabel>
                              <Select
                                defaultValue={field.value.toString()}
                                onValueChange={(value) => {
                                  const months = Number.parseInt(value, 10);
                                  field.onChange(months);
                                  // Auto-calculate deposit amount
                                  form.setValue(
                                    "securityDeposit",
                                    watchedValues.rentAmount * months
                                  );
                                }}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {[1, 2, 3, 6, 12].map((months) => (
                                    <SelectItem
                                      key={months}
                                      value={months.toString()}
                                    >
                                      {months} month{months > 1 ? "s" : ""}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="securityDeposit"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Security Deposit Amount</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <span className="-translate-y-1/2 absolute top-1/2 left-3 transform text-gray-500">
                                    {getCurrencySymbol(watchedValues.currency)}
                                  </span>
                                  <Input
                                    className="pl-12"
                                    defaultValue={10_000}
                                    placeholder="e.g., 10000"
                                    type="number"
                                    {...field}
                                    onChange={(e) =>
                                      field.onChange(
                                        Number.parseFloat(e.target.value) || 0
                                      )
                                    }
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="utilityDeposit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Utility Deposit</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <span className="-translate-y-1/2 absolute top-1/2 left-3 transform text-gray-500">
                                  {getCurrencySymbol(watchedValues.currency)}
                                </span>
                                <Input
                                  className="pl-12"
                                  placeholder="5000"
                                  type="number"
                                  {...field}
                                  onChange={(e) =>
                                    field.onChange(
                                      Number.parseFloat(e.target.value) ||
                                        undefined
                                    )
                                  }
                                />
                              </div>
                            </FormControl>
                            <FormDescription>
                              Optional deposit for utilities
                            </FormDescription>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Additional Fees */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-lg">Additional Fees</h3>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <FormField
                          control={form.control}
                          name="serviceCharge"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Service Charge</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <span className="-translate-y-1/2 absolute top-1/2 left-3 transform text-gray-500">
                                    {getCurrencySymbol(watchedValues.currency)}
                                  </span>
                                  <Input
                                    className="pl-12"
                                    placeholder="5000"
                                    type="number"
                                    {...field}
                                    onChange={(e) =>
                                      field.onChange(
                                        Number.parseFloat(e.target.value) ||
                                          undefined
                                      )
                                    }
                                  />
                                </div>
                              </FormControl>
                              <FormDescription>
                                Management and maintenance fees
                              </FormDescription>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="serviceChargeFrequency"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Service Charge Frequency</FormLabel>
                              <Select
                                defaultValue={field.value}
                                onValueChange={field.onChange}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="monthly">
                                    Monthly
                                  </SelectItem>
                                  <SelectItem value="quarterly">
                                    Quarterly
                                  </SelectItem>
                                  <SelectItem value="annually">
                                    Annually
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="maintenanceFee"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Maintenance Fee</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <span className="-translate-y-1/2 absolute top-1/2 left-3 transform text-gray-500">
                                    {getCurrencySymbol(watchedValues.currency)}
                                  </span>
                                  <Input
                                    className="pl-12"
                                    placeholder="2000"
                                    type="number"
                                    {...field}
                                    onChange={(e) =>
                                      field.onChange(
                                        Number.parseFloat(e.target.value) ||
                                          undefined
                                      )
                                    }
                                  />
                                </div>
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="parkingFee"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Parking Fee</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <span className="-translate-y-1/2 absolute top-1/2 left-3 transform text-gray-500">
                                    {getCurrencySymbol(watchedValues.currency)}
                                  </span>
                                  <Input
                                    className="pl-12"
                                    placeholder="3000"
                                    type="number"
                                    {...field}
                                    onChange={(e) =>
                                      field.onChange(
                                        Number.parseFloat(e.target.value) ||
                                          undefined
                                      )
                                    }
                                  />
                                </div>
                              </FormControl>
                              <FormDescription>
                                Per parking space
                              </FormDescription>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Payment Terms */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-lg">Payment Terms</h3>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="advancePayment"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Advance Payment Required</FormLabel>
                            <Select
                              defaultValue={field.value.toString()}
                              onValueChange={(value) =>
                                field.onChange(Number.parseInt(value, 10))
                              }
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {[1, 2, 3, 6, 12].map((months) => (
                                  <SelectItem
                                    key={months}
                                    value={months.toString()}
                                  >
                                    {months} month{months > 1 ? "s" : ""} in
                                    advance
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              How many months rent required upfront
                            </FormDescription>
                          </FormItem>
                        )}
                      />

                      <div className="space-y-2">
                        <FormField
                          control={form.control}
                          name="negotiable"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>Price is negotiable</FormLabel>
                                <FormDescription>
                                  Allow potential tenants to negotiate
                                </FormDescription>
                              </div>
                            </FormItem>
                          )}
                        />

                        {watchedValues.negotiable && (
                          <FormField
                            control={form.control}
                            name="minimumPrice"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Minimum Acceptable Price</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <span className="-translate-y-1/2 absolute top-1/2 left-3 transform text-gray-500">
                                      {getCurrencySymbol(
                                        watchedValues.currency
                                      )}
                                    </span>
                                    <Input
                                      className="pl-12"
                                      type="number"
                                      {...field}
                                      onChange={(e) =>
                                        field.onChange(
                                          Number.parseFloat(e.target.value) ||
                                            undefined
                                        )
                                      }
                                    />
                                  </div>
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        )}
                      </div>
                    </div>

                    {/* Payment Methods */}
                    <div>
                      <FormLabel>Accepted Payment Methods</FormLabel>
                      <div className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-3">
                        {paymentMethodsOptions.map((method) => (
                          <FormField
                            control={form.control}
                            key={method}
                            name="paymentMethods"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value.includes(method)}
                                    onCheckedChange={(checked) => {
                                      const updated = checked
                                        ? [...field.value, method]
                                        : field.value.filter(
                                            (m) => m !== method
                                          );
                                      field.onChange(updated);
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal text-sm">
                                  {method}
                                </FormLabel>
                              </FormItem>
                            )}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
