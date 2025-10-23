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
} from "@kaa/ui/components/form";
import { Input } from "@kaa/ui/components/input";
import { Progress } from "@kaa/ui/components/progress";
import { Separator } from "@kaa/ui/components/separator";
import { cn } from "@kaa/ui/lib/utils";
import {
  ArrowUp,
  BarChart3,
  Car,
  CheckCircle,
  Droplets,
  Dumbbell,
  Home,
  Info,
  Lightbulb,
  Plus,
  Shield,
  Star,
  Target,
  Trees,
  TrendingUp,
  Wifi,
  Wind,
  X,
  Zap,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useMemo, useState } from "react";
import type { UseFormProps } from "react-hook-form";
import { sheet } from "@/components/common/sheeter/state";
import { useStepper } from "@/components/common/stepper";
import UnsavedBadge from "@/components/common/unsaved-badge";
import { SubmitButton } from "@/components/ui/submit-button";
import { useBeforeUnload } from "@/hooks/use-before-unload";
import { useFormWithDraft } from "@/hooks/use-draft-form";
import useHideElementsById from "@/hooks/use-hide-elements-by-id";
import type { Amenity, Property } from "@/modules/properties/property.type";
import { type PropertyFormData, propertyFormSchema } from "./schema";

type BuildingAmenity = {
  id: string;
  label: string;
  icon: React.ElementType;
};

type FeaturesInfoFormProps = {
  property: Property;
  sheet?: boolean;
  callback?: (property: Property) => void;
  hiddenFields?: string[];
  children?: React.ReactNode;
};

// Property Features Options
const propertyFeaturesOptions: BuildingAmenity[] = [
  { id: "balcony", label: "Balcony", icon: Home },
  { id: "garden", label: "Garden", icon: Trees },
  { id: "terrace", label: "Terrace", icon: Home },
  { id: "parking", label: "Parking", icon: Car },
  { id: "gym", label: "Gym", icon: Dumbbell },
  { id: "pool", label: "Swimming Pool", icon: Droplets },
  { id: "wifi", label: "WiFi", icon: Wifi },
  { id: "generator", label: "Backup Generator", icon: Zap },
  { id: "security", label: "24/7 Security", icon: Shield },
  { id: "air-conditioning", label: "Air Conditioning", icon: Wind },
];

// Building Amenities Options

const buildingAmenitiesOptions: BuildingAmenity[] = [
  { id: "elevator", label: "Elevator", icon: Home },
  { id: "cctv", label: "CCTV Surveillance", icon: Shield },
  { id: "water-backup", label: "Water Backup", icon: Droplets },
  { id: "rooftop", label: "Rooftop Access", icon: Home },
  { id: "playground", label: "Children's Playground", icon: Trees },
];

export const FeaturesInfoForm = ({
  property,
  sheet: isSheet,
  callback,
  hiddenFields,
  children,
}: FeaturesInfoFormProps) => {
  const t = useTranslations();
  const { nextStep } = useStepper();
  const [newCustomFeature, setNewCustomFeature] = useState("");
  const [newCustomAmenity, setNewCustomAmenity] = useState("");

  const isPending = false;
  const initialFormValues: PropertyFormData["features"] = property
    ? {
        features: Object.keys(property.amenities) || [],
        amenities: (Object.keys(property.amenities) as any) || [],
        furnished: !!property.specifications.furnished,
        parking: !!property.amenities.parking,
      }
    : {
        features: [],
        amenities: [],
        furnished: false,
        parking: false,
      };

  // Hide fields if requested
  if (hiddenFields) {
    const fieldIds = hiddenFields.map(
      (field) => `${field}-form-item-container`
    );
    // biome-ignore lint/correctness/useHookAtTopLevel: we need to call this hook conditionally
    useHideElementsById(fieldIds);
  }

  const formOptions: UseFormProps<PropertyFormData["features"]> = useMemo(
    () => ({
      resolver: zodResolver(propertyFormSchema.shape.features),
      defaultValues: initialFormValues,
    }),
    [initialFormValues]
  );

  const form = useFormWithDraft<PropertyFormData["features"]>(
    "property-features-info",
    {
      formOptions,
      onUnsavedChanges: () => console.info("Unsaved changes detected!"),
    }
  );
  const watchedValues = form.watch();

  // Prevent data loss
  useBeforeUnload({
    when: form.formState.isDirty,
    message: "You have unsaved changes. Are you sure you want to leave?",
  });

  const onSubmit = (data: PropertyFormData["features"]) => {
    console.log("features-info", data);

    if (isSheet) sheet.remove("new-property");
    nextStep?.();
    callback?.(property);
  };

  const toggleArrayItem = (
    fieldName: "features" | "amenities",
    item: string
  ) => {
    if (fieldName === "features") {
      const currentArray = form.getValues(fieldName) as string[];
      const updated = currentArray.includes(item)
        ? currentArray.filter((i) => i !== item)
        : [...currentArray, item];
      form.setValue(fieldName, updated);
    } else if (fieldName === "amenities") {
      const currentArray = form.getValues(fieldName) as Amenity[];
      const existingIndex = currentArray.findIndex(
        (amenity) => amenity.name === item
      );
      const updated =
        existingIndex >= 0
          ? currentArray.filter((_, index) => index !== existingIndex)
          : [...currentArray, { name: item }];
      form.setValue(fieldName, updated);
    }
  };

  const addCustomFeature = () => {
    if (newCustomFeature.trim()) {
      const current = form.getValues("features") as string[];
      form.setValue("features", [...current, newCustomFeature.trim()]);
      setNewCustomFeature("");
    }
  };

  const removeCustomFeature = (feature: string) => {
    const current = form.getValues("features") as string[];
    form.setValue(
      "features",
      current.filter((f) => f !== feature)
    );
  };

  const addCustomAmenity = () => {
    if (newCustomAmenity.trim()) {
      const current = form.getValues("amenities") as Amenity[];
      form.setValue("amenities", [
        ...current,
        { name: newCustomAmenity.trim() },
      ]);
      setNewCustomAmenity("");
    }
  };

  const removeCustomAmenity = (amenityName: string) => {
    const current = form.getValues("amenities") as Amenity[];
    form.setValue(
      "amenities",
      current.filter((amenity) => amenity.name !== amenityName)
    );
  };

  // AI-Powered Feature Analysis
  const generateFeatureAnalysis = useCallback(() => {
    const features = (watchedValues.features as string[]) || [];
    const amenities = (watchedValues.amenities as Amenity[]) || [];
    const furnished = !!watchedValues.furnished;
    const parking = !!watchedValues.parking;

    const totalFeatures =
      features.length +
      amenities.length +
      (furnished ? 1 : 0) +
      (parking ? 1 : 0);

    // Premium features analysis
    const premiumFeatures = [
      "pool",
      "gym",
      "security",
      "air-conditioning",
      "elevator",
      "generator",
    ];
    const hasPremiumFeatures =
      features.some((f) => premiumFeatures.includes(f)) ||
      amenities.some((a) =>
        premiumFeatures.some((pf) => a.name.toLowerCase().includes(pf))
      );

    // Essential features
    const essentialFeatures = ["parking", "wifi", "security", "water-backup"];
    const essentialCount =
      features.filter((f) => essentialFeatures.includes(f)).length +
      amenities.filter((a) =>
        essentialFeatures.some((ef) => a.name.toLowerCase().includes(ef))
      ).length +
      (parking ? 1 : 0);

    // Market appeal calculation
    let marketAppeal = "Basic";
    let appealColor = "text-gray-600";
    const appealScore = Math.min((totalFeatures / 8) * 100, 100);

    if (totalFeatures >= 8 && hasPremiumFeatures) {
      marketAppeal = "Luxury";
      appealColor = "text-purple-600";
    } else if (totalFeatures >= 5 && essentialCount >= 2) {
      marketAppeal = "Premium";
      appealColor = "text-blue-600";
    } else if (totalFeatures >= 3) {
      marketAppeal = "Standard";
      appealColor = "text-green-600";
    }

    // Value impact analysis
    const valueImpacts: {
      feature: string;
      impact: string;
      type: "positive" | "negative";
    }[] = [];
    if (
      features.includes("pool") ||
      amenities.some((a) => a.name.toLowerCase().includes("pool"))
    ) {
      valueImpacts.push({
        feature: "Swimming Pool",
        impact: "+15-25%",
        type: "positive",
      });
    }
    if (
      features.includes("gym") ||
      amenities.some((a) => a.name.toLowerCase().includes("gym"))
    ) {
      valueImpacts.push({
        feature: "Gym/Fitness",
        impact: "+10-15%",
        type: "positive",
      });
    }
    if (
      features.includes("security") ||
      amenities.some((a) => a.name.toLowerCase().includes("security"))
    ) {
      valueImpacts.push({
        feature: "24/7 Security",
        impact: "+8-12%",
        type: "positive",
      });
    }
    if (furnished) {
      valueImpacts.push({
        feature: "Furnished",
        impact: "+20-30%",
        type: "positive",
      });
    }
    if (parking || features.includes("parking")) {
      valueImpacts.push({
        feature: "Parking",
        impact: "+5-10%",
        type: "positive",
      });
    }

    // Recommendations
    const recommendations: {
      type: "missing" | "security" | "positive" | "moderate";
      message: string;
    }[] = [];
    if (!(parking || features.includes("parking"))) {
      recommendations.push({
        type: "missing",
        message:
          "Consider adding parking - it significantly increases tenant appeal and rental value.",
      });
    }
    if (
      !(
        features.includes("wifi") ||
        amenities.some((a) => a.name.toLowerCase().includes("wifi"))
      )
    ) {
      recommendations.push({
        type: "missing",
        message:
          "WiFi is now considered essential by most tenants. Consider including it.",
      });
    }
    if (features.includes("pool") && !features.includes("security")) {
      recommendations.push({
        type: "security",
        message:
          "Properties with pools should have security for safety and liability reasons.",
      });
    }
    if (totalFeatures >= 6) {
      recommendations.push({
        type: "positive",
        message:
          "Excellent feature set! This property will appeal to premium tenants.",
      });
    } else if (totalFeatures >= 3) {
      recommendations.push({
        type: "moderate",
        message:
          "Good foundation of features. Consider adding 1-2 more amenities to increase appeal.",
      });
    }

    // Target tenant profiles
    const targetProfiles: string[] = [];
    if (
      furnished &&
      (features.includes("wifi") ||
        amenities.some((a) => a.name.toLowerCase().includes("wifi")))
    ) {
      targetProfiles.push("Digital Nomads & Expatriates");
    }
    if (features.includes("gym") || features.includes("pool")) {
      targetProfiles.push("Health & Wellness Focused");
    }
    if (features.includes("security") && parking) {
      targetProfiles.push("Security-Conscious Professionals");
    }
    if (features.includes("garden") || features.includes("playground")) {
      targetProfiles.push("Families with Children");
    }
    if (totalFeatures >= 6) {
      targetProfiles.push("Luxury Lifestyle Seekers");
    }
    if (targetProfiles.length === 0) {
      targetProfiles.push("Budget-Conscious Tenants");
    }

    return {
      totalFeatures,
      marketAppeal,
      appealColor,
      appealScore,
      valueImpacts,
      recommendations,
      targetProfiles,
      essentialCount,
    };
  }, [watchedValues]);

  const analysis = useMemo(
    () => generateFeatureAnalysis(),
    [generateFeatureAnalysis]
  );

  return (
    <div>
      <Form {...form}>
        <form className="space-y-8" onSubmit={form.handleSubmit(onSubmit)}>
          {!isSheet && form.unsavedChanges && <UnsavedBadge />}

          {/* AI-Powered Feature Analysis */}
          {analysis.totalFeatures > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-lg">
                  Feature Analysis & Market Insights
                </h3>
              </div>

              {/* Market Appeal Score */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 font-medium text-sm">
                      <Target className="h-4 w-4" />
                      Market Appeal
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      <div
                        className={`font-semibold text-lg ${analysis.appealColor}`}
                      >
                        {analysis.marketAppeal}
                      </div>
                      <Progress className="h-2" value={analysis.appealScore} />
                      <div className="text-muted-foreground text-xs">
                        {Math.round(analysis.appealScore)}% Feature Completeness
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 font-medium text-sm">
                      <CheckCircle className="h-4 w-4" />
                      Feature Count
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-1">
                      <div className="font-semibold text-blue-600 text-lg">
                        {analysis.totalFeatures}
                      </div>
                      <div className="text-muted-foreground text-xs">
                        Total Features & Amenities
                      </div>
                      <div className="text-green-600 text-xs">
                        {analysis.essentialCount}/4 Essentials
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 font-medium text-sm">
                      <TrendingUp className="h-4 w-4" />
                      Rent Potential
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-1">
                      <div className="font-semibold text-green-600 text-lg">
                        {analysis.marketAppeal === "Luxury"
                          ? "Premium+"
                          : analysis.marketAppeal === "Premium"
                            ? "Above Market"
                            : analysis.marketAppeal === "Standard"
                              ? "Market Rate"
                              : "Basic"}
                      </div>
                      <div className="text-muted-foreground text-xs">
                        Expected Pricing Tier
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Value Impact Analysis */}
              {analysis.valueImpacts.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 font-medium text-sm">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      Value Impact Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                      {analysis.valueImpacts.map((impact, index) => (
                        <div
                          className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 p-3"
                          key={index.toString()}
                        >
                          <div className="flex items-center gap-2">
                            <ArrowUp className="h-4 w-4 text-green-600" />
                            <span className="font-medium text-sm">
                              {impact.feature}
                            </span>
                          </div>
                          <Badge
                            className="bg-green-100 text-green-700"
                            variant="secondary"
                          >
                            {impact.impact}
                          </Badge>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 text-muted-foreground text-xs">
                      Potential rent increase compared to basic properties
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Target Tenant Profiles */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-medium text-sm">
                    <Target className="h-4 w-4 text-blue-600" />
                    Target Tenant Profiles
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {analysis.targetProfiles.map((profile, index) => (
                      <Badge
                        className="border-blue-200 bg-blue-50 text-blue-700"
                        key={index.toString()}
                        variant="outline"
                      >
                        {profile}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Smart Recommendations */}
              {analysis.recommendations.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-amber-600" />
                    <h4 className="font-medium text-sm">
                      Smart Recommendations
                    </h4>
                  </div>
                  {analysis.recommendations.map((rec, index) => {
                    const alertVariant =
                      rec.type === "missing"
                        ? "destructive"
                        : rec.type === "security"
                          ? "default"
                          : rec.type === "positive"
                            ? "default"
                            : "default";
                    const alertIcon =
                      rec.type === "missing"
                        ? Info
                        : rec.type === "positive"
                          ? CheckCircle
                          : Lightbulb;
                    const AlertIcon = alertIcon;
                    return (
                      <Alert key={index.toString()} variant={alertVariant}>
                        <AlertIcon className="h-4 w-4" />
                        <AlertDescription className="text-sm">
                          {rec.message}
                        </AlertDescription>
                      </Alert>
                    );
                  })}
                </div>
              )}

              <Separator />
            </div>
          )}

          {/* Property Features */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              <h3 className="font-semibold text-lg">Property Features</h3>
            </div>
            <p className="text-muted-foreground text-sm">
              Select features that are part of your property
            </p>

            <FeatureGrid
              fieldName="features"
              options={propertyFeaturesOptions}
              selectedItems={(watchedValues.features as string[]) || []}
              toggleArrayItem={toggleArrayItem}
            />

            {/* Custom Features */}
            <div className="space-y-3">
              <h4 className="font-medium">Custom Features</h4>
              <div className="flex gap-2">
                <Input
                  onChange={(e) => setNewCustomFeature(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addCustomFeature()}
                  onKeyPress={(e) => e.key === "Enter" && addCustomFeature()}
                  placeholder="Add a custom feature..."
                  value={newCustomFeature}
                />
                <Button
                  onClick={addCustomFeature}
                  type="button"
                  variant="outline"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {((watchedValues.features as string[]) || []).filter(
                (f) => !propertyFeaturesOptions.find((opt) => opt.id === f)
              ).length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {((watchedValues.features as string[]) || [])
                    .filter(
                      (f) =>
                        !propertyFeaturesOptions.find((opt) => opt.id === f)
                    )
                    .map((feature, index) => (
                      <Badge
                        className="flex items-center gap-1"
                        key={index.toString()}
                        variant="secondary"
                      >
                        {feature}
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => removeCustomFeature(feature)}
                        />
                      </Badge>
                    ))}
                </div>
              )}
            </div>
          </div>

          {/* Building Amenities */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Building Amenities</h3>
            <p className="text-muted-foreground text-sm">
              Select amenities available in your building
            </p>

            <AmenitiesGrid
              fieldName="amenities"
              options={buildingAmenitiesOptions}
              selectedItems={(watchedValues.amenities as Amenity[]) || []}
              toggleArrayItem={toggleArrayItem}
            />

            {/* Custom Amenities */}
            <div className="space-y-3">
              <h4 className="font-medium">Custom Amenities</h4>
              <div className="flex gap-2">
                <Input
                  onChange={(e) => setNewCustomAmenity(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addCustomAmenity()}
                  placeholder="Add a custom amenity..."
                  value={newCustomAmenity}
                />
                <Button
                  onClick={addCustomAmenity}
                  type="button"
                  variant="outline"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {((watchedValues.amenities as Amenity[]) || []).filter(
                (amenity) =>
                  !buildingAmenitiesOptions.find(
                    (opt) => opt.label === amenity.name
                  )
              ).length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {((watchedValues.amenities as Amenity[]) || [])
                    .filter(
                      (amenity) =>
                        !buildingAmenitiesOptions.find(
                          (opt) => opt.label === amenity.name
                        )
                    )
                    .map((amenity, index) => (
                      <Badge
                        className="flex items-center gap-1"
                        key={index.toString()}
                        variant="secondary"
                      >
                        {amenity.name}
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => removeCustomAmenity(amenity.name)}
                        />
                      </Badge>
                    ))}
                </div>
              )}
            </div>
          </div>

          {/* Additional Options */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="furnished"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Furnished</FormLabel>
                    <FormDescription>
                      Property comes with furniture
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="parking"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Parking Available</FormLabel>
                    <FormDescription>
                      Dedicated parking space included
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
          </div>

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

const FeatureGrid = ({
  options,
  fieldName,
  selectedItems,
  toggleArrayItem,
}: {
  options: BuildingAmenity[];
  fieldName: "features";
  selectedItems: string[];
  toggleArrayItem: (fieldName: "features", item: string) => void;
}) => (
  <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
    {options.map((option) => {
      const isSelected = selectedItems.includes(option.id);
      return (
        <div
          className={cn(
            "flex cursor-pointer items-center gap-2 rounded-lg border p-3 transition-colors",
            isSelected
              ? "border-primary bg-primary/5 text-primary"
              : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
          )}
          key={option.id}
          onClick={() => toggleArrayItem(fieldName, option.id)}
        >
          <option.icon className="h-4 w-4" />
          <span className="font-medium text-sm">{option.label}</span>
        </div>
      );
    })}
  </div>
);

const AmenitiesGrid = ({
  options,
  fieldName,
  selectedItems,
  toggleArrayItem,
}: {
  options: BuildingAmenity[];
  fieldName: "amenities";
  selectedItems: Amenity[];
  toggleArrayItem: (fieldName: "amenities", item: string) => void;
}) => (
  <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
    {options.map((option) => {
      const isSelected = selectedItems.some(
        (item) => item.name === option.label
      );
      return (
        <div
          className={cn(
            "flex cursor-pointer items-center gap-2 rounded-lg border p-3 transition-colors",
            isSelected
              ? "border-primary bg-primary/5 text-primary"
              : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
          )}
          key={option.id}
          onClick={() => toggleArrayItem(fieldName, option.label)}
        >
          <option.icon className="h-4 w-4" />
          <span className="font-medium text-sm">{option.label}</span>
        </div>
      );
    })}
  </div>
);
