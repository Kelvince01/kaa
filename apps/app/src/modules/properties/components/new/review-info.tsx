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
import { cn } from "@kaa/ui/lib/utils";
import { format } from "date-fns";
import {
  AlertCircle,
  Calendar,
  Camera,
  CheckCircle2,
  DollarSign,
  Eye,
  Home,
  MapPin,
  Star,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import type { UseFormProps } from "react-hook-form";
import { useStepper } from "@/components/common/stepper";
import UnsavedBadge from "@/components/common/unsaved-badge";
import { SubmitButton } from "@/components/ui/submit-button";
import { useFormWithDraft } from "@/hooks/use-draft-form";
import type { Amenity, Property } from "@/modules/properties/property.type";
import { useDraftStore } from "@/shared/stores/draft.store";
import { useNewPropertyStore } from "../../property.store";
import type { PropertyFormData } from "./schema";

type ReviewInfoProps = {
  property?: Property;
  sheet?: boolean;
  callback?: (property: Property) => void;
  hiddenFields?: string[];
  children?: React.ReactNode;
};

export const ReviewInfo = ({
  property,
  sheet: isSheet,
  callback,
  children,
}: ReviewInfoProps) => {
  const t = useTranslations();
  const { nextStep } = useStepper();
  const { forms } = useDraftStore();
  const { setFinishedCreating } = useNewPropertyStore();

  // Get draft data from all sections
  const basicData = forms["property-basic-info"] as PropertyFormData["basic"];
  const detailsData = forms[
    "property-details-info"
  ] as PropertyFormData["details"];
  const locationData = forms[
    "property-location-info"
  ] as PropertyFormData["location"];
  const pricingData = forms[
    "property-pricing-info"
  ] as PropertyFormData["pricing"];
  const featuresData = forms[
    "property-features-info"
  ] as PropertyFormData["features"];
  const availabilityData = forms[
    "property-availability-info"
  ] as PropertyFormData["availability"];
  const mediaData = forms["property-media-info"] as PropertyFormData["media"];

  const isPending = false;
  const initialFormValues = {
    published: false,
  };

  const formOptions: UseFormProps<{ published: boolean }> = useMemo(
    () => ({
      defaultValues: initialFormValues,
    }),
    []
  );

  const form = useFormWithDraft<{ published: boolean }>("property-review", {
    formOptions,
    onUnsavedChanges: () => console.info("Unsaved changes detected!"),
  });

  const onSubmit = (data: { published: boolean }) => {
    // Compile all data and submit
    const propertyData = {
      ...basicData,
      ...detailsData,
      ...locationData,
      ...pricingData,
      ...featuresData,
      ...availabilityData,
      ...mediaData,
      ...data,
    };

    // const obj = {
    // 	"utilitiesIncluded": [
    // 		"electricity",
    // 		"cable",
    // 		"water"
    // 	],
    // 	"features": [
    // 		"balcony",
    // 		"parking",
    // 		"wifi"
    // 	],
    // 	"amenities": [
    // 		{
    // 			"name": "Children's Playground"
    // 		}
    // 	],
    // 	"furnished": true,
    // 	"parking": true,
    // 	"published": true
    // }

    // const newProperty: Property = {
    // 	title: propertyData.title,
    // 	description: propertyData.description,
    // 	type: propertyData.type as "flat" | "house" | "apartment" | "studio" | "other" | "villa" | "office" | "land",
    // 	listingType: propertyData.listingType,
    // 	details: {
    // 		bedrooms: propertyData.bedrooms,
    // 		bathrooms: propertyData.bathrooms,
    // 		size: propertyData.size || 0,
    // 		furnished: propertyData.furnished || false,
    // 		furnishedStatus: propertyData.furnishedStatus || "unfurnished",
    // 		parking: propertyData.parking || false,
    // 		rooms: propertyData.rooms || 0,
    // 	},
    // 	location: {
    // 		country: propertyData.country || "KE",
    // 		county: propertyData.county,
    // 		constituency: propertyData.constituency || "",
    // 		address: propertyData.address,
    // 	},
    // 	geolocation: propertyData.geolocation || { type: "Point", coordinates: [0, 0] },
    // 	pricing: {
    // 		rentAmount: propertyData.rentAmount,
    // 		securityDeposit: propertyData.securityDeposit,
    // 		serviceCharge: propertyData.serviceCharge,
    // 		utilitiesIncluded: propertyData.utilitiesIncluded,
    // 		negotiable: propertyData.negotiable,
    // 		currency: propertyData.currency,
    // 		paymentFrequency: propertyData.paymentFrequency,
    // 	},
    // 	features: {
    // 		features: obj.features,
    // 		amenities: obj.amenities,
    // 		furnished: obj.furnished,
    // 		parking: obj.parking,
    // 	},
    // 	amenities: propertyData.amenities,
    // }

    console.log("Submitting complete property data:", propertyData);

    // Here you would typically call your API to create the property
    // await createProperty(propertyData);

    setFinishedCreating();
    // Move to next step or show success message
    nextStep?.();
    callback?.(property as Property);
  };

  return (
    <div>
      <Form {...form}>
        <form className="space-y-8" onSubmit={form.handleSubmit(onSubmit)}>
          {!isSheet && form.unsavedChanges && <UnsavedBadge />}

          {/* Header */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              <h3 className="font-semibold text-lg">
                Review Your Property Listing
              </h3>
            </div>
            <p className="text-muted-foreground text-sm">
              Review all information before publishing your property listing
            </p>
          </div>

          {/* Progress Overview */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="text-center">
              <div
                className={cn(
                  "mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full",
                  basicData
                    ? "bg-green-100 text-green-600"
                    : "bg-gray-100 text-gray-400"
                )}
              >
                <Home className="h-4 w-4" />
              </div>
              <p className="font-medium text-xs">Basic Info</p>
              {basicData && (
                <CheckCircle2 className="mx-auto mt-1 h-3 w-3 text-green-600" />
              )}
            </div>

            <div className="text-center">
              <div
                className={cn(
                  "mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full",
                  locationData
                    ? "bg-green-100 text-green-600"
                    : "bg-gray-100 text-gray-400"
                )}
              >
                <MapPin className="h-4 w-4" />
              </div>
              <p className="font-medium text-xs">Location</p>
              {locationData && (
                <CheckCircle2 className="mx-auto mt-1 h-3 w-3 text-green-600" />
              )}
            </div>

            <div className="text-center">
              <div
                className={cn(
                  "mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full",
                  pricingData
                    ? "bg-green-100 text-green-600"
                    : "bg-gray-100 text-gray-400"
                )}
              >
                <DollarSign className="h-4 w-4" />
              </div>
              <p className="font-medium text-xs">Pricing</p>
              {pricingData && (
                <CheckCircle2 className="mx-auto mt-1 h-3 w-3 text-green-600" />
              )}
            </div>

            <div className="text-center">
              <div
                className={cn(
                  "mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full",
                  mediaData
                    ? "bg-green-100 text-green-600"
                    : "bg-gray-100 text-gray-400"
                )}
              >
                <Camera className="h-4 w-4" />
              </div>
              <p className="font-medium text-xs">Media</p>
              {mediaData && (
                <CheckCircle2 className="mx-auto mt-1 h-3 w-3 text-green-600" />
              )}
            </div>
          </div>

          {/* Section Summaries */}
          <div className="space-y-6">
            {/* Basic Information */}
            <SectionSummary
              data={basicData}
              icon={Home}
              title="Basic Information"
            >
              {basicData ? (
                <div className="space-y-2">
                  <div>
                    <p className="font-medium">{basicData.title}</p>
                    <p className="text-muted-foreground text-sm">
                      {basicData.description}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="secondary">{basicData.type}</Badge>
                    <Badge variant="outline">For {basicData.listingType}</Badge>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">
                  Basic information not completed
                </p>
              )}
            </SectionSummary>

            {/* Location */}
            <SectionSummary data={locationData} icon={MapPin} title="Location">
              {locationData ? (
                <div className="space-y-1">
                  <p className="font-medium">{locationData.address?.line1}</p>
                  <p className="text-muted-foreground text-sm">
                    {locationData.address?.town}, {locationData.county}
                  </p>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">
                  Location information not completed
                </p>
              )}
            </SectionSummary>

            {/* Pricing */}
            <SectionSummary
              data={pricingData}
              icon={DollarSign}
              title="Pricing"
            >
              {pricingData ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg">
                      {pricingData.currency}{" "}
                      {pricingData.rentAmount?.toLocaleString()}
                    </span>
                    <span className="text-muted-foreground text-sm">
                      /{pricingData.paymentFrequency}
                    </span>
                  </div>
                  <div className="space-y-1 text-sm">
                    <p>
                      Security Deposit: {pricingData.currency}{" "}
                      {pricingData.securityDeposit?.toLocaleString()}
                    </p>
                    {pricingData.serviceCharge && (
                      <p>
                        Service Charge: {pricingData.currency}{" "}
                        {pricingData.serviceCharge?.toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">
                  Pricing information not completed
                </p>
              )}
            </SectionSummary>

            {/* Features */}
            {featuresData && (
              <SectionSummary
                data={featuresData}
                icon={Star}
                title="Features & Amenities"
              >
                <div className="space-y-3">
                  {featuresData.features &&
                    featuresData.features.length > 0 && (
                      <div>
                        <p className="mb-2 font-medium text-sm">
                          Property Features
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {featuresData.features.map((feature: string) => (
                            <Badge
                              className="text-xs"
                              key={feature}
                              variant="secondary"
                            >
                              {feature}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  {featuresData.amenities &&
                    featuresData.amenities.length > 0 && (
                      <div>
                        <p className="mb-2 font-medium text-sm">
                          Building Amenities
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {featuresData.amenities.map((amenity: Amenity) => (
                            <Badge
                              className="text-xs"
                              key={amenity.name}
                              variant="outline"
                            >
                              {amenity.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
              </SectionSummary>
            )}

            {/* Availability */}
            {availabilityData && (
              <SectionSummary
                data={availabilityData}
                icon={Calendar}
                title="Availability"
              >
                <div className="space-y-2">
                  {availabilityData.availableFrom && (
                    <p className="text-sm">
                      <span className="font-medium">Available from:</span>{" "}
                      {format(new Date(availabilityData.availableFrom), "PPP")}
                    </p>
                  )}
                  {availabilityData.noticePeriod && (
                    <p className="text-sm">
                      <span className="font-medium">Notice Period:</span>{" "}
                      {availabilityData.noticePeriod} days
                    </p>
                  )}
                </div>
              </SectionSummary>
            )}
          </div>

          {/* Publishing Options */}
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-800">
                <CheckCircle2 className="h-5 w-5" />
                Ready to Publish
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="published"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-green-700">
                        Publish this property listing immediately
                      </FormLabel>
                      <FormDescription className="text-green-600">
                        Your property will be visible to potential tenants right
                        away. You can always edit or unpublish later.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex flex-col gap-2 sm:flex-row">
            {children}
            <SubmitButton
              className="bg-green-600 hover:bg-green-700"
              disabled={
                !(basicData && locationData && pricingData) ||
                Object.keys(form.formState.errors).length > 0
              }
              loading={isPending}
            >
              🎉 Create Property Listing
            </SubmitButton>
            {!children && (
              <Button
                onClick={() => window.history.back()}
                type="button"
                variant="secondary"
              >
                Go Back
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
};

const SectionSummary = ({
  title,
  icon: Icon,
  data,
  children,
}: {
  title: string;
  icon: any;
  data?: any;
  children: React.ReactNode;
}) => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="flex items-center gap-2 text-base">
        <Icon className="h-4 w-4" />
        {title}
        {data ? (
          <CheckCircle2 className="h-4 w-4 text-green-600" />
        ) : (
          <AlertCircle className="h-4 w-4 text-orange-500" />
        )}
      </CardTitle>
    </CardHeader>
    <CardContent className="pt-0">{children}</CardContent>
  </Card>
);
