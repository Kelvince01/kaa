import { zodResolver } from "@hookform/resolvers/zod";
import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import {
  Form,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@kaa/ui/components/form";
import { Building2, Globe, Info, MapPin } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import type { UseFormProps } from "react-hook-form";
import InputFormField from "@/components/common/form-fields/input";
import SelectConstituency from "@/components/common/form-fields/select-constituency";
import SelectCountry from "@/components/common/form-fields/select-country";
import SelectCounty from "@/components/common/form-fields/select-county";
import { sheet } from "@/components/common/sheeter/state";
import { useStepper } from "@/components/common/stepper";
import UnsavedBadge from "@/components/common/unsaved-badge";
import { SubmitButton } from "@/components/ui/submit-button";
import { useBeforeUnload } from "@/hooks/use-before-unload";
import { useFormWithDraft } from "@/hooks/use-draft-form";
import counties from "@/json/counties.json" with { type: "json" };
import type { Property } from "@/modules/properties/property.type";
import type { NearbyAmenity } from "../../property.type";
import { EnhancedLocationPicker } from "../enhanced-location-picker";
import { type PropertyFormData, propertyFormSchema } from "./schema";

type LocationInfoFormProps = {
  property: Property;
  sheet?: boolean;
  callback?: (property: Property) => void;
  hiddenFields?: string[];
  children?: React.ReactNode;
};

export const LocationInfoForm = ({
  property,
  sheet: isSheet,
  callback,
  hiddenFields,
  children,
}: LocationInfoFormProps) => {
  const t = useTranslations();
  const { nextStep } = useStepper();
  const [showEnhancedPicker, setShowEnhancedPicker] = useState(false);
  const [nearbyAmenities, setNearbyAmenities] = useState<NearbyAmenity[]>([]);

  const isPending = false;

  const initialFormValues: PropertyFormData["location"] = property?.location
    ? {
        country: property.location.country || "KE",
        county: property.location.county || "",
        constituency: property.location.constituency || "",
        address: {
          line1: property.location.address?.line1 || "",
          line2: property.location.address?.line2 || "",
          town: property.location.address?.town || "",
          postalCode: property.location.address?.postalCode || "",
        },
        geolocation: {
          coordinates: property.geolocation?.coordinates || [0, 0],
        },
      }
    : {
        country: "KE",
        county: "",
        constituency: "",
        address: {
          line1: "",
          line2: "",
          town: "",
          postalCode: "",
        },
        geolocation: {
          coordinates: [0, 0],
        },
      };

  const formOptions: UseFormProps<PropertyFormData["location"]> = useMemo(
    () => ({
      resolver: zodResolver(propertyFormSchema.shape.location),
      defaultValues: initialFormValues,
    }),
    [initialFormValues]
  );

  const form = useFormWithDraft<PropertyFormData["location"]>(
    "property-location-info",
    {
      formOptions,
      onUnsavedChanges: () => console.info("Unsaved changes detected!"),
    }
  );

  // Watch for county changes to get county code for constituency filtering
  const watchedCounty = form.watch("county");

  // Find the county code for the selected county
  const selectedCountyCode = useMemo(() => {
    if (!watchedCounty) return;
    const county = counties.find((c) => c.name === watchedCounty);
    return county?.code;
  }, [watchedCounty]);

  // Reset constituency when county changes
  useEffect(() => {
    if (watchedCounty && form.getValues("constituency")) {
      form.setValue("constituency", "", { shouldValidate: true });
    }
  }, [watchedCounty, form]);

  // Prevent data loss
  useBeforeUnload({
    when: form.formState.isDirty,
    message: "You have unsaved changes. Are you sure you want to leave?",
  });

  const onSubmit = (data: PropertyFormData["location"]) => {
    console.log(data);

    if (isSheet) sheet.remove("new-property");
    nextStep?.();
    callback?.(property);
  };

  const handleLocationSelect = (location: {
    lat: number;
    lng: number;
    address: string;
  }) => {
    // Parse address and update form
    // This is a simplified example - you'd need to implement proper address parsing
    form.setValue("geolocation.coordinates.0", location.lat);
    form.setValue("geolocation.coordinates.1", location.lng);
  };

  const handleAmenitiesFound = (amenities: NearbyAmenity[]) => {
    setNearbyAmenities(amenities);
  };

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form className="space-y-8" onSubmit={form.handleSubmit(onSubmit)}>
          {!isSheet && form.unsavedChanges && <UnsavedBadge />}

          {/* Enhanced Location Picker Integration */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-lg">Property Location</h3>
              <Button
                onClick={() => setShowEnhancedPicker(!showEnhancedPicker)}
                size="sm"
                type="button"
                variant="outline"
              >
                <MapPin className="mr-2 h-4 w-4" />
                {showEnhancedPicker
                  ? "Hide Enhanced Picker"
                  : "Use Enhanced Picker"}
              </Button>
            </div>

            {showEnhancedPicker ? (
              <EnhancedLocationPicker
                onAmenitiesFound={handleAmenitiesFound}
                onLocationSelect={handleLocationSelect}
              />
            ) : (
              <>
                {/* Existing location form fields */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Globe className="h-3 w-3" />
                          {t("common.country")}
                        </FormLabel>
                        <SelectCountry
                          {...field}
                          defaultValue={initialFormValues.country}
                        />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="county"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Building2 className="h-3 w-3" />
                          {t("common.county")} *
                        </FormLabel>
                        <SelectCounty {...field} />
                        <FormDescription>
                          Select your county to filter available constituencies
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="constituency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <MapPin className="h-3 w-3" />
                          {t("common.constituency")}
                          {watchedCounty && (
                            <Badge className="ml-1 text-xs" variant="secondary">
                              Filtered
                            </Badge>
                          )}
                        </FormLabel>
                        <SelectConstituency
                          {...field}
                          countyCode={selectedCountyCode}
                        />
                        <FormDescription>
                          {watchedCounty
                            ? selectedCountyCode
                              ? `Showing constituencies in ${watchedCounty}`
                              : "No constituencies found for selected county"
                            : "Select a county first to see available constituencies"}
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-6 sm:grid-cols-2 sm:gap-4">
                  <InputFormField
                    control={form.control}
                    inputClassName="border"
                    label={t("common.address.line1")}
                    name="address.line1"
                    placeholder="Street address, building name, etc."
                    required
                  />
                  <InputFormField
                    control={form.control}
                    inputClassName="border"
                    label={t("common.address.line2")}
                    name="address.line2"
                    placeholder="Apartment, suite, floor (optional)"
                  />
                </div>

                <div className="grid gap-6 sm:grid-cols-2 sm:gap-4">
                  <InputFormField
                    control={form.control}
                    inputClassName="border"
                    label={t("common.address.town")}
                    name="address.town"
                    placeholder="City or town name"
                    required
                  />
                  <InputFormField
                    control={form.control}
                    inputClassName="border"
                    label={t("common.address.postal_code")}
                    name="address.postalCode"
                    placeholder="e.g., 00100"
                    required
                  />
                </div>
              </>
            )}

            {/* Nearby Amenities Display */}
            {nearbyAmenities.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium text-sm">Nearby Amenities Found</h4>
                <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                  {nearbyAmenities.slice(0, 8).map((amenity, index) => (
                    <div
                      className="flex items-center gap-2 rounded border p-2 text-xs"
                      key={index.toString()}
                    >
                      <span className="font-medium">{amenity.name}</span>
                      <span className="text-muted-foreground">
                        {Math.round(amenity.distance)}m
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Tips Card */}
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base text-blue-800">
                <Info className="h-4 w-4" />💡 Location Tips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-blue-700 text-sm">
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-blue-600">•</span>
                  Select your county first - this will automatically filter the
                  constituency options
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-blue-600">•</span>
                  Provide a clear street address to help tenants find the
                  property easily
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-blue-600">•</span>
                  Include building names, landmarks, or estate names in your
                  address
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-blue-600">•</span>
                  Accurate location details improve your listing's visibility in
                  search results
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
