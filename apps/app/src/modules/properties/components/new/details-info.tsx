import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, AlertDescription } from "@kaa/ui/components/alert";
import { Button } from "@kaa/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
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
  AlertTriangle,
  Bath,
  Bed,
  CheckCircle,
  Home,
  Info,
  Ruler,
  TrendingUp,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { UseFormProps } from "react-hook-form";
import { useStepper } from "@/components/common/stepper";
import UnsavedBadge from "@/components/common/unsaved-badge";
import { SubmitButton } from "@/components/ui/submit-button";
import { useBeforeUnload } from "@/hooks/use-before-unload";
import { useFormWithDraft } from "@/hooks/use-draft-form";
import useHideElementsById from "@/hooks/use-hide-elements-by-id";
import type { Property } from "@/modules/properties/property.type";
import { type PropertyFormData, propertyFormSchema } from "./schema";

type DetailsInfoFormProps = {
  property: Property;
  sheet?: boolean;
  callback?: (property: Property) => void;
  hiddenFields?: string[];
  children?: React.ReactNode;
};

export const DetailsInfoForm = ({
  property,
  children,
  sheet: isSheet,
  callback,
  hiddenFields,
}: DetailsInfoFormProps) => {
  const t = useTranslations();
  const { nextStep } = useStepper();

  const isPending = false;
  const initialFormValues: PropertyFormData["details"] =
    property?.specifications
      ? property.specifications
      : {
          bedrooms: 0,
          bathrooms: 0,
          size: undefined,
        };

  // Hide fields if requested
  if (hiddenFields) {
    const fieldIds = hiddenFields.map(
      (field) => `${field}-form-item-container`
    );
    // biome-ignore lint/correctness/useHookAtTopLevel: we need to call this hook conditionally
    useHideElementsById(fieldIds);
  }

  const formOptions: UseFormProps<PropertyFormData["details"]> = useMemo(
    () => ({
      resolver: zodResolver(propertyFormSchema.shape.details),
      defaultValues: initialFormValues,
    }),
    [initialFormValues]
  );

  const form = useFormWithDraft<PropertyFormData["details"]>(
    "property-details-info",
    {
      formOptions,
      onUnsavedChanges: () => console.info("Unsaved changes detected!"),
    }
  );
  const watchedValues = form.watch();

  // Intelligent Features State
  const [marketAnalysis, setMarketAnalysis] = useState<any | null>(null);
  const [spaceSuggestions, setSpaceSuggestions] = useState<any | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [similarProperties, setSimilarProperties] = useState<any | null>(null);
  const [optimalConfiguration, setOptimalConfiguration] = useState<any | null>(
    null
  );

  // Calculate space efficiency and market appeal
  const spaceEfficiency = useMemo(() => {
    const { bedrooms, bathrooms, size } = watchedValues;
    if (!size || bedrooms === undefined || bathrooms === undefined) return null;

    const totalRooms = bedrooms + bathrooms;
    const sqftPerRoom = size / Math.max(totalRooms, 1);
    const bedroomRatio = bedrooms / Math.max(totalRooms, 1);

    let efficiency = "Good";
    let color = "text-green-600";
    let score = 75;

    if (sqftPerRoom < 150) {
      efficiency = "Cramped";
      color = "text-red-600";
      score = 40;
    } else if (sqftPerRoom > 300) {
      efficiency = "Spacious";
      color = "text-blue-600";
      score = 90;
    } else if (sqftPerRoom > 200) {
      efficiency = "Comfortable";
      color = "text-green-600";
      score = 80;
    }

    return {
      efficiency,
      color,
      score,
      sqftPerRoom: Math.round(sqftPerRoom),
      bedroomRatio: Math.round(bedroomRatio * 100),
      totalRooms,
    };
  }, [
    watchedValues.bedrooms,
    watchedValues.bathrooms,
    watchedValues.size,
    watchedValues,
  ]);

  // Generate market insights
  const generateMarketInsights = useCallback(() => {
    const { bedrooms, bathrooms } = watchedValues;
    if (bedrooms === undefined || bathrooms === undefined) return;

    setIsAnalyzing(true);

    setTimeout(() => {
      // Mock market analysis data
      const demandData = {
        "0": {
          demand: "High",
          avgRent: 35_000,
          percentage: 15,
          target: "Young professionals, students",
        },
        "1": {
          demand: "Very High",
          avgRent: 55_000,
          percentage: 35,
          target: "Singles, couples",
        },
        "2": {
          demand: "High",
          avgRent: 75_000,
          percentage: 30,
          target: "Small families, roommates",
        },
        "3": {
          demand: "Medium",
          avgRent: 95_000,
          percentage: 15,
          target: "Families",
        },
        "4+": {
          demand: "Low",
          avgRent: 120_000,
          percentage: 5,
          target: "Large families",
        },
      };

      const config = bedrooms >= 4 ? "4+" : bedrooms.toString();
      const analysis = demandData[config as keyof typeof demandData];

      setMarketAnalysis({
        bedrooms,
        bathrooms,
        ...analysis,
        bathroomRatio: bathrooms / Math.max(bedrooms, 1),
        optimalBathrooms:
          bedrooms === 0 ? 1 : Math.max(1, Math.ceil(bedrooms * 0.75)),
      });

      // Generate similar properties
      const similar = [
        {
          id: 1,
          bedrooms,
          bathrooms,
          size: bedrooms === 0 ? 450 : 500 + bedrooms * 200,
          rent: analysis.avgRent * 0.95,
          location: "Similar area",
          features: ["Modern", "Parking"],
        },
        {
          id: 2,
          bedrooms,
          bathrooms: Math.max(1, bathrooms - 1),
          size: bedrooms === 0 ? 400 : 450 + bedrooms * 180,
          rent: analysis.avgRent * 0.85,
          location: "Nearby",
          features: ["Security", "Garden"],
        },
      ];

      setSimilarProperties(similar);

      // Generate space suggestions
      const suggestions: {
        type: "warning" | "success" | "info";
        message: string;
        action: string;
      }[] = [];
      if (bedrooms > 0 && bathrooms / bedrooms < 0.5) {
        suggestions.push({
          type: "warning",
          message: "Consider adding more bathrooms for better tenant appeal",
          action: "Increase bathrooms",
        });
      }
      if (bedrooms >= 3 && bathrooms < 2) {
        suggestions.push({
          type: "info",
          message:
            "Family-sized properties typically need at least 2 bathrooms",
          action: "Consider renovation",
        });
      }
      if (bedrooms === 1 && bathrooms > 1) {
        suggestions.push({
          type: "success",
          message: "Extra bathroom adds premium value to 1BR units",
          action: "Great configuration!",
        });
      }

      setSpaceSuggestions(suggestions);

      // Generate optimal configuration
      setOptimalConfiguration({
        current: `${bedrooms}BR/${bathrooms}BA`,
        optimal: `${bedrooms}BR/${Math.max(1, Math.ceil(bedrooms * 0.75))}BA`,
        marketFit: analysis.percentage,
        rentPotential: analysis.avgRent,
      });

      setIsAnalyzing(false);
    }, 1200);
  }, [watchedValues.bedrooms, watchedValues.bathrooms, watchedValues]);

  // Auto-generate insights when configuration changes
  useEffect(() => {
    if (
      watchedValues.bedrooms !== undefined &&
      watchedValues.bathrooms !== undefined
    ) {
      generateMarketInsights();
    }
  }, [watchedValues.bedrooms, watchedValues.bathrooms, generateMarketInsights]);

  // Prevent data loss
  useBeforeUnload({
    when: form.formState.isDirty,
    message: "You have unsaved changes. Are you sure you want to leave?",
  });

  const onSubmit = (data: PropertyFormData["details"]) => {
    console.log(data);
    nextStep?.();
    callback?.(property);
  };

  return (
    <div>
      <Form {...form}>
        <form className="space-y-8" onSubmit={form.handleSubmit(onSubmit)}>
          {!isSheet && form.unsavedChanges && <UnsavedBadge />}

          {/* Property Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Home className="h-5 w-5" />
              <h3 className="font-semibold text-lg">Property Details</h3>
            </div>
            <p className="text-muted-foreground text-sm">
              Provide basic details about your property
            </p>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <FormField
                control={form.control}
                name="bedrooms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 font-semibold text-base">
                      <Bed className="h-4 w-4" />
                      Bedrooms *
                    </FormLabel>
                    <FormDescription>
                      Number of bedrooms in the property
                    </FormDescription>
                    <Select
                      defaultValue={field.value?.toString()}
                      onValueChange={(value) =>
                        field.onChange(Number.parseInt(value, 10))
                      }
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select bedrooms" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="0">Studio (0 bedrooms)</SelectItem>
                        <SelectItem value="1">1 Bedroom</SelectItem>
                        <SelectItem value="2">2 Bedrooms</SelectItem>
                        <SelectItem value="3">3 Bedrooms</SelectItem>
                        <SelectItem value="4">4 Bedrooms</SelectItem>
                        <SelectItem value="5">5 Bedrooms</SelectItem>
                        <SelectItem value="6">6+ Bedrooms</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bathrooms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 font-semibold text-base">
                      <Bath className="h-4 w-4" />
                      Bathrooms *
                    </FormLabel>
                    <FormDescription>
                      Number of bathrooms in the property
                    </FormDescription>
                    <Select
                      defaultValue={field.value?.toString()}
                      onValueChange={(value) =>
                        field.onChange(Number.parseInt(value, 10))
                      }
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select bathrooms" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="1">1 Bathroom</SelectItem>
                        <SelectItem value="2">2 Bathrooms</SelectItem>
                        <SelectItem value="3">3 Bathrooms</SelectItem>
                        <SelectItem value="4">4 Bathrooms</SelectItem>
                        <SelectItem value="5">5+ Bathrooms</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="size"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 font-semibold text-base">
                      <Ruler className="h-4 w-4" />
                      Size (sq ft)
                    </FormLabel>
                    <FormDescription>
                      Total area in square feet (optional)
                    </FormDescription>
                    <FormControl>
                      <Input
                        placeholder="e.g., 1200"
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

          {/* AI-Powered Market Insights */}
          {(marketAnalysis || spaceEfficiency) && (
            <Card className="border-purple-200 bg-linear-to-r from-purple-50 to-violet-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-purple-800">
                  <TrendingUp className="h-5 w-5" />
                  Market & Space Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Market Demand Analysis */}
                {marketAnalysis && (
                  <div className="space-y-3">
                    <h4 className="font-medium">
                      Market Demand for {marketAnalysis.bedrooms}BR Properties
                    </h4>
                    <div className="flex items-center gap-4">
                      <Progress
                        className="h-3"
                        value={marketAnalysis.percentage}
                      />
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-lg">
                          {marketAnalysis.demand}
                        </span>
                        <span className="text-muted-foreground text-sm">
                          ({marketAnalysis.percentage}% of market)
                        </span>
                      </div>
                    </div>
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        Your property targets the{" "}
                        <strong>{marketAnalysis.target}</strong> demographic.
                        Ensure your amenities and marketing match this audience.
                      </AlertDescription>
                    </Alert>
                  </div>
                )}

                {/* Space Efficiency Analysis */}
                {spaceEfficiency && (
                  <div className="space-y-3">
                    <h4 className="font-medium">Space Efficiency</h4>
                    <div className="flex items-center gap-4">
                      <Progress className="h-3" value={spaceEfficiency.score} />
                      <div className="flex items-center gap-2">
                        <span className={`font-bold ${spaceEfficiency.color}`}>
                          {spaceEfficiency.efficiency}
                        </span>
                        <span className="text-muted-foreground text-sm">
                          ({spaceEfficiency.sqftPerRoom} sq ft/room)
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Suggestions */}
                {spaceSuggestions && spaceSuggestions.length > 0 && (
                  <div className="space-y-2">
                    {spaceSuggestions.map((suggestion: any, index: number) => (
                      <Alert key={index.toString()} variant={suggestion.type}>
                        {suggestion.type === "warning" && (
                          <AlertTriangle className="h-4 w-4" />
                        )}
                        {suggestion.type === "success" && (
                          <CheckCircle className="h-4 w-4" />
                        )}
                        {suggestion.type === "info" && (
                          <Info className="h-4 w-4" />
                        )}
                        <AlertDescription>
                          {suggestion.message}
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

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
