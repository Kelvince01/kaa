import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, AlertDescription } from "@kaa/ui/components/alert";
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
import { Separator } from "@kaa/ui/components/separator";
import { cn } from "@kaa/ui/lib/utils";
import {
  BarChart3,
  CheckCircle,
  DollarSign,
  Info,
  Lightbulb,
  Target,
  TrendingUp,
} from "lucide-react";
import { useTranslations } from "next-intl";
import {
  isValidElement,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { UseFormProps } from "react-hook-form";
import { sheet } from "@/components/common/sheeter/state";
import { useStepper } from "@/components/common/stepper";
import UnsavedBadge from "@/components/common/unsaved-badge";
import { SubmitButton } from "@/components/ui/submit-button";
import { useBeforeUnload } from "@/hooks/use-before-unload";
import { useFormWithDraft } from "@/hooks/use-draft-form";
import useHideElementsById from "@/hooks/use-hide-elements-by-id";
import type { Property } from "@/modules/properties/property.type";
import { type PropertyFormData, propertyFormSchema } from "./schema";

type PricingInfoFormProps = {
  property: Property;
  sheet?: boolean;
  callback?: (property: Property) => void;
  hiddenFields?: string[];
  children?: React.ReactNode;
};

export const PricingInfoForm = ({
  property,
  children,
  sheet: isSheet,
  callback,
  hiddenFields,
}: PricingInfoFormProps) => {
  const t = useTranslations();
  const { nextStep } = useStepper();

  const isPending = false;
  const initialFormValues: PropertyFormData["pricing"] = {
    rentAmount: property?.pricing?.rent || 0,
    securityDeposit: property?.pricing?.deposit || 0,
    serviceCharge: property?.pricing?.serviceFee,
    utilitiesIncluded:
      Object.keys(property?.pricing?.utilitiesIncluded || {}) || [],
    negotiable: property?.pricing?.negotiable,
    currency: property?.pricing?.currency || "KES",
    paymentFrequency: property?.pricing?.paymentFrequency || "monthly",
  };

  // Hide fields if requested
  if (hiddenFields) {
    const fieldIds = hiddenFields.map(
      (field) => `${field}-form-item-container`
    );
    // biome-ignore lint/correctness/useHookAtTopLevel: we need to call this hook conditionally
    useHideElementsById(fieldIds);
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: ignore
  const formOptions: UseFormProps<PropertyFormData["pricing"]> = useMemo(
    () => ({
      resolver: zodResolver(propertyFormSchema.shape.pricing),
      defaultValues: initialFormValues,
    }),
    []
  );

  const form = useFormWithDraft<PropertyFormData["pricing"]>(
    "property-pricing-info",
    {
      formOptions,
      onUnsavedChanges: () => console.info("Unsaved changes detected!"),
    }
  );

  const sheetTitleUpdate = () => {
    const targetSheet = sheet.get("new-property");
    // Check if the title's type is a function (React component) and not a string
    if (
      !targetSheet ||
      (isValidElement(targetSheet.title) &&
        targetSheet.title.type === UnsavedBadge)
    )
      return;

    sheet.update("new-property", {
      title: <UnsavedBadge title={targetSheet?.title} />,
    });
  };

  // Prevent data loss
  useBeforeUnload({
    when: form.formState.isDirty,
    message: "You have unsaved changes. Are you sure you want to leave?",
  });

  const onSubmit = (data: PropertyFormData["pricing"]) => {
    console.log(data);

    if (isSheet) sheet.remove("new-property");
    nextStep?.();
    callback?.(property);
  };

  const watchedValues = form.watch();

  // AI Pricing Intelligence State
  const [pricingInsights, setPricingInsights] = useState<any | null>(null);
  const [marketComparisons, setMarketComparisons] = useState<any[]>([]);
  const [priceRecommendations, setPriceRecommendations] = useState<any | null>(
    null
  );
  const [showMarketAnalysis, setShowMarketAnalysis] = useState(false);
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  const [competitivenessScore, setCompetitivenessScore] = useState<any | null>(
    null
  );

  // Mock data for pricing intelligence (would be replaced with real API calls)
  const mockMarketData = {
    westlands: { avg: 75_000, min: 45_000, max: 120_000, count: 67 },
    kilimani: { avg: 65_000, min: 40_000, max: 100_000, count: 45 },
    karen: { avg: 85_000, min: 55_000, max: 150_000, count: 34 },
    runda: { avg: 95_000, min: 65_000, max: 180_000, count: 23 },
  };

  // Generate pricing insights based on property type and rent amount
  const generatePricingInsights = useCallback(() => {
    if (!watchedValues.rentAmount || watchedValues.rentAmount <= 0) return;

    setIsGeneratingInsights(true);

    // Simulate API call delay
    setTimeout(() => {
      const propertyType = property?.type || "apartment";
      const location =
        property?.location?.constituency?.toLowerCase() || "westlands";
      const marketData =
        mockMarketData[location as keyof typeof mockMarketData] ||
        mockMarketData.westlands;

      // Calculate competitiveness score
      const rentAmount = watchedValues.rentAmount;
      const avgMarketPrice = marketData.avg;
      const priceRatio = rentAmount / avgMarketPrice;

      let scoreData = {
        score: 0,
        label: "",
        color: "",
        recommendation: "",
      };

      if (priceRatio <= 0.85) {
        scoreData = {
          score: 95,
          label: "Highly Competitive",
          color: "text-green-600",
          recommendation:
            "Your price is very attractive and likely to get quick interest!",
        };
      } else if (priceRatio <= 1.0) {
        scoreData = {
          score: 80,
          label: "Competitive",
          color: "text-green-600",
          recommendation:
            "Good pricing that aligns well with market expectations.",
        };
      } else if (priceRatio <= 1.15) {
        scoreData = {
          score: 65,
          label: "Above Average",
          color: "text-yellow-600",
          recommendation:
            "Consider highlighting premium features to justify the higher price.",
        };
      } else {
        scoreData = {
          score: 40,
          label: "Above Market Rate",
          color: "text-red-600",
          recommendation:
            "Price is significantly above market. Consider reducing or adding premium amenities.",
        };
      }

      setCompetitivenessScore(scoreData);

      // Generate price recommendations
      const recommendations = {
        optimal: Math.round(avgMarketPrice * 0.95),
        competitive: Math.round(avgMarketPrice * 0.88),
        premium: Math.round(avgMarketPrice * 1.08),
        market: avgMarketPrice,
      };

      setPriceRecommendations(recommendations);

      // Generate market comparisons
      const comparisons = [
        {
          id: 1,
          address: `Similar ${propertyType} in ${location}`,
          price: marketData.avg,
          bedrooms: 2,
          amenities: ["Parking", "Security", "Water"],
          distance: "0.8km away",
        },
        {
          id: 2,
          address: `New ${propertyType} nearby`,
          price: marketData.avg * 1.1,
          bedrooms: 2,
          amenities: ["Gym", "Pool", "Security", "Parking"],
          distance: "1.2km away",
        },
        {
          id: 3,
          address: `Budget ${propertyType}`,
          price: marketData.avg * 0.8,
          bedrooms: 1,
          amenities: ["Water", "Security"],
          distance: "1.5km away",
        },
      ];

      setMarketComparisons(comparisons);

      // Generate pricing insights
      const insights = {
        marketAverage: avgMarketPrice,
        priceRange: `${watchedValues.currency} ${marketData.min.toLocaleString()} - ${marketData.max.toLocaleString()}`,
        propertiesAvailable: marketData.count,
        yourPriceVsMarket: ((rentAmount / avgMarketPrice - 1) * 100).toFixed(1),
        demandLevel:
          rentAmount < avgMarketPrice
            ? "High"
            : rentAmount > avgMarketPrice * 1.1
              ? "Low"
              : "Medium",
        estimatedDaysToRent:
          rentAmount < avgMarketPrice
            ? "7-14 days"
            : rentAmount > avgMarketPrice * 1.1
              ? "30-45 days"
              : "14-21 days",
      };

      setPricingInsights(insights);
      setIsGeneratingInsights(false);
    }, 1500);
  }, [watchedValues.rentAmount, watchedValues.currency, property]);

  // Auto-generate insights when rent amount changes
  useEffect(() => {
    if (watchedValues.rentAmount && watchedValues.rentAmount > 10_000) {
      generatePricingInsights();
    }
  }, [watchedValues.rentAmount, generatePricingInsights]);

  // Calculate total monthly cost
  const totalMonthlyCost = useMemo(() => {
    const base = watchedValues.rentAmount || 0;
    const service = watchedValues.serviceCharge || 0;
    return base + service;
  }, [watchedValues.rentAmount, watchedValues.serviceCharge]);

  return (
    <div>
      <Form {...form}>
        <form className="space-y-8" onSubmit={form.handleSubmit(onSubmit)}>
          {!isSheet && form.unsavedChanges && <UnsavedBadge />}

          {/* Main Pricing */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              <h3 className="font-semibold text-lg">Rental Pricing</h3>
            </div>
            <p className="text-muted-foreground text-sm">
              Set your rental amount and payment details
            </p>

            <div className="grid gap-6 sm:grid-cols-3 sm:gap-4">
              <FormField
                control={form.control}
                name="rentAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold text-base">
                      Rent Amount *
                    </FormLabel>
                    <FormDescription>Monthly rental amount</FormDescription>
                    <FormControl>
                      <Input
                        placeholder="e.g., 50000"
                        type="number"
                        {...field}
                        onChange={(e) =>
                          field.onChange(Number.parseFloat(e.target.value) || 0)
                        }
                      />
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
                    <FormLabel className="font-semibold text-base">
                      Currency *
                    </FormLabel>
                    <FormDescription>Payment currency</FormDescription>
                    <Select
                      defaultValue={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="KES">
                          🇰🇪 KES - Kenyan Shilling
                        </SelectItem>
                        <SelectItem value="USD">🇺🇸 USD - US Dollar</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="paymentFrequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold text-base">
                      Payment Frequency *
                    </FormLabel>
                    <FormDescription>How often rent is paid</FormDescription>
                    <Select
                      defaultValue={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="annually">Annually</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Deposits and Fees */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">
              Deposits & Additional Charges
            </h3>

            <div className="grid gap-6 sm:grid-cols-2 sm:gap-4">
              <FormField
                control={form.control}
                name="securityDeposit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold text-base">
                      Security Deposit *
                    </FormLabel>
                    <FormDescription>
                      Refundable security deposit
                    </FormDescription>
                    <FormControl>
                      <Input
                        placeholder="e.g., 50000"
                        type="number"
                        {...field}
                        onChange={(e) =>
                          field.onChange(Number.parseFloat(e.target.value) || 0)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="serviceCharge"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold text-base">
                      Service Charge
                    </FormLabel>
                    <FormDescription>
                      Monthly service/maintenance charge (optional)
                    </FormDescription>
                    <FormControl>
                      <Input
                        placeholder="e.g., 5000"
                        type="number"
                        {...field}
                        onChange={(e) =>
                          field.onChange(
                            Number.parseFloat(e.target.value) || undefined
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Utilities and Options */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">
              Utilities & Additional Options
            </h3>

            <FormField
              control={form.control}
              name="utilitiesIncluded"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold text-base">
                    Utilities Included
                  </FormLabel>
                  <FormDescription>
                    Select which utilities are included in the rent
                  </FormDescription>
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    {[
                      { id: "electricity", label: "Electricity" },
                      { id: "water", label: "Water" },
                      { id: "gas", label: "Gas" },
                      { id: "internet", label: "Internet" },
                      { id: "cable", label: "Cable TV" },
                      { id: "garbage", label: "Garbage Collection" },
                      { id: "security", label: "Security" },
                      { id: "maintenance", label: "Maintenance" },
                    ].map((utility) => {
                      const isSelected = (field.value as string[])?.includes(
                        utility.id
                      );
                      return (
                        <div
                          className={cn(
                            "flex cursor-pointer items-center gap-2 rounded-lg border p-3 transition-colors",
                            isSelected
                              ? "border-primary bg-primary/5 text-primary"
                              : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                          )}
                          key={utility.id}
                          onClick={() => {
                            const currentArray =
                              (field.value as string[]) || [];
                            const updated = currentArray.includes(utility.id)
                              ? currentArray.filter((i) => i !== utility.id)
                              : [...currentArray, utility.id];
                            field.onChange(updated);
                          }}
                        >
                          <span className="font-medium text-sm">
                            {utility.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="negotiable"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="font-semibold">
                      Price is Negotiable
                    </FormLabel>
                    <FormDescription>
                      Check this if you're willing to negotiate on the rental
                      price
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
          </div>

          {/* AI Pricing Intelligence */}
          {watchedValues.rentAmount && watchedValues.rentAmount > 10_000 && (
            <div className="space-y-6">
              {/* Competitiveness Score */}
              {competitivenessScore && (
                <Card className="border-blue-200 bg-linear-to-r from-blue-50 to-indigo-50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <TrendingUp className="h-5 w-5" />
                      Price Competitiveness
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Progress
                            className="h-3 w-24"
                            value={competitivenessScore.score}
                          />
                          <span
                            className={`font-semibold ${competitivenessScore.color}`}
                          >
                            {competitivenessScore.score}% -{" "}
                            {competitivenessScore.label}
                          </span>
                        </div>
                      </div>
                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                          {competitivenessScore.recommendation}
                        </AlertDescription>
                      </Alert>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Pricing Insights */}
              {pricingInsights && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Market Insights
                      {isGeneratingInsights && (
                        <div className="ml-auto flex items-center gap-2 text-muted-foreground text-sm">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                          Analyzing...
                        </div>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                      <div className="space-y-1">
                        <p className="text-muted-foreground text-sm">
                          Market Average
                        </p>
                        <p className="font-semibold">
                          {watchedValues.currency}{" "}
                          {pricingInsights.marketAverage.toLocaleString()}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-muted-foreground text-sm">
                          Price Range
                        </p>
                        <p className="font-semibold text-xs">
                          {pricingInsights.priceRange}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-muted-foreground text-sm">
                          vs Market
                        </p>
                        <p
                          className={`font-semibold ${
                            +pricingInsights.yourPriceVsMarket > 0
                              ? "text-red-600"
                              : "text-green-600"
                          }`}
                        >
                          {+pricingInsights.yourPriceVsMarket > 0 ? "+" : ""}
                          {pricingInsights.yourPriceVsMarket}%
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-muted-foreground text-sm">
                          Est. Days to Rent
                        </p>
                        <p className="font-semibold">
                          {pricingInsights.estimatedDaysToRent}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Price Recommendations */}
              {priceRecommendations && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Pricing Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                      {[
                        {
                          key: "competitive",
                          label: "Competitive",
                          icon: "🎯",
                          color: "text-green-600",
                        },
                        {
                          key: "optimal",
                          label: "Optimal",
                          icon: "⭐",
                          color: "text-blue-600",
                        },
                        {
                          key: "market",
                          label: "Market Avg",
                          icon: "📊",
                          color: "text-gray-600",
                        },
                        {
                          key: "premium",
                          label: "Premium",
                          icon: "💎",
                          color: "text-purple-600",
                        },
                      ].map((rec) => (
                        <Button
                          className="h-auto p-3 text-left"
                          key={rec.key}
                          onClick={() =>
                            form.setValue(
                              "rentAmount",
                              priceRecommendations[rec.key]
                            )
                          }
                          size="sm"
                          type="button"
                          variant="outline"
                        >
                          <div className="flex flex-col items-center space-y-1">
                            <span className="text-lg">{rec.icon}</span>
                            <span className="font-medium text-xs">
                              {rec.label}
                            </span>
                            <span
                              className={`font-semibold text-xs ${rec.color}`}
                            >
                              {watchedValues.currency}{" "}
                              {priceRecommendations[rec.key].toLocaleString()}
                            </span>
                          </div>
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Market Comparisons */}
              {marketComparisons.length > 0 && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Similar Properties
                      </CardTitle>
                      <Button
                        onClick={() =>
                          setShowMarketAnalysis(!showMarketAnalysis)
                        }
                        size="sm"
                        type="button"
                        variant="ghost"
                      >
                        {showMarketAnalysis ? "Hide" : "Show"} Details
                      </Button>
                    </div>
                  </CardHeader>
                  {showMarketAnalysis && (
                    <CardContent>
                      <div className="space-y-3">
                        {marketComparisons.map((comparison) => (
                          <div
                            className="flex items-center justify-between rounded-lg border p-3"
                            key={comparison.id}
                          >
                            <div className="space-y-1">
                              <p className="font-medium text-sm">
                                {comparison.address}
                              </p>
                              <p className="text-muted-foreground text-xs">
                                {comparison.bedrooms} BR • {comparison.distance}
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {comparison.amenities.map(
                                  (amenity: any, idx: number) => (
                                    <Badge
                                      className="text-xs"
                                      key={idx.toString()}
                                      variant="outline"
                                    >
                                      {amenity}
                                    </Badge>
                                  )
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">
                                {watchedValues.currency}{" "}
                                {comparison.price.toLocaleString()}
                              </p>
                              <p
                                className={`text-xs ${
                                  comparison.price < watchedValues.rentAmount
                                    ? "text-red-600"
                                    : "text-green-600"
                                }`}
                              >
                                {comparison.price < watchedValues.rentAmount
                                  ? "Lower"
                                  : "Higher"}{" "}
                                than yours
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  )}
                </Card>
              )}
            </div>
          )}

          {/* Enhanced Pricing Summary */}
          {(watchedValues.rentAmount || watchedValues.securityDeposit) && (
            <Card className="border-green-200 bg-linear-to-r from-green-50 to-emerald-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-800 text-lg">
                  <DollarSign className="h-5 w-5" />
                  Pricing Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {watchedValues.rentAmount && (
                    <div className="flex items-center justify-between border-green-200 border-b py-2">
                      <span className="font-medium">Monthly Rent:</span>
                      <span className="font-bold text-lg">
                        {watchedValues.currency}{" "}
                        {watchedValues.rentAmount?.toLocaleString()}
                        {watchedValues.negotiable && (
                          <Badge className="ml-2 text-xs" variant="outline">
                            Negotiable
                          </Badge>
                        )}
                      </span>
                    </div>
                  )}
                  {watchedValues.securityDeposit && (
                    <div className="flex items-center justify-between py-2">
                      <span>Security Deposit:</span>
                      <span className="font-semibold">
                        {watchedValues.currency}{" "}
                        {watchedValues.securityDeposit?.toLocaleString()}
                      </span>
                    </div>
                  )}
                  {watchedValues.serviceCharge && (
                    <div className="flex items-center justify-between py-2">
                      <span>Service Charge:</span>
                      <span className="font-semibold">
                        {watchedValues.currency}{" "}
                        {watchedValues.serviceCharge?.toLocaleString()}
                        /month
                      </span>
                    </div>
                  )}
                  {totalMonthlyCost > (watchedValues.rentAmount || 0) && (
                    <>
                      <Separator className="my-2" />
                      <div className="flex items-center justify-between py-2 font-semibold">
                        <span>Total Monthly Cost:</span>
                        <span className="text-lg">
                          {watchedValues.currency}{" "}
                          {totalMonthlyCost.toLocaleString()}
                        </span>
                      </div>
                    </>
                  )}
                  {watchedValues.utilitiesIncluded &&
                    watchedValues.utilitiesIncluded.length > 0 && (
                      <div className="border-green-200 border-t pt-3">
                        <p className="mb-2 font-medium text-sm">
                          Utilities Included:
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {watchedValues.utilitiesIncluded.map(
                            (utility, index) => (
                              <Badge
                                className="text-xs capitalize"
                                key={index.toString()}
                                variant="secondary"
                              >
                                {utility.replace("-", " ")}
                              </Badge>
                            )
                          )}
                        </div>
                      </div>
                    )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Pricing Tips */}
          <Card className="border-amber-200 bg-amber-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-800 text-lg">
                <Lightbulb className="h-5 w-5" />
                Pricing Tips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-amber-700 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 text-amber-600" />
                  Price competitively to attract quality tenants quickly
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 text-amber-600" />
                  Consider including utilities to justify higher rent
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 text-amber-600" />
                  Security deposits are typically 1-2 months' rent
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 text-amber-600" />
                  Marketing as "negotiable" can increase inquiry rates by 25%
                </li>
              </ul>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-2 sm:flex-row">
            {children}
            <SubmitButton
              disabled={
                !(hiddenFields?.length || form.formState.isDirty) ||
                Object.keys(form.formState.errors).length > 0
              }
              loading={isPending}
            >
              {t(
                `common.${hiddenFields?.length ? "continue" : "save_changes"}`
              )}
            </SubmitButton>
            {!children && (
              <Button
                className={form.formState.isDirty ? "" : "invisible"}
                onClick={() => form.reset()}
                type="reset"
                variant="secondary"
              >
                {t("common.cancel")}
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
};
