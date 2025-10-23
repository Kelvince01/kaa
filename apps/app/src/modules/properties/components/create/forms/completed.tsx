import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import { cn } from "@kaa/ui/lib/utils";
import {
  AlertTriangle,
  ArrowLeft,
  Camera,
  CheckCircle,
  DollarSign,
  Download,
  Edit3,
  Eye,
  Home,
  Info,
  MapPin,
  Send,
  Share2,
  Star,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import type { PropertyFormData } from "../../../property.schema";

type CompletedFormProps = {
  data: PropertyFormData;
  onEdit: (step: string) => void;
  onSubmit: () => void;
  onPrevious: () => void;
  isSubmitting?: boolean;
  className?: string;
};

export function CompletedForm({
  data,
  onEdit,
  onSubmit,
  onPrevious,
  isSubmitting = false,
  className,
}: CompletedFormProps) {
  const [previewMode, setPreviewMode] = useState<"review" | "preview">(
    "review"
  );

  // Calculate completion score
  const calculateCompletionScore = () => {
    const sections = [
      { name: "basic", data: data.basic, weight: 20 },
      { name: "location", data: data.location, weight: 20 },
      { name: "details", data: data.details, weight: 15 },
      { name: "features", data: data.features, weight: 10 },
      { name: "media", data: data.media, weight: 15 },
      { name: "pricing", data: data.pricing, weight: 15 },
      { name: "availability", data: data.availability, weight: 3 },
      { name: "contact", data: data.contact, weight: 2 },
    ];

    let totalScore = 0;
    for (const section of sections) {
      if (section.data) {
        const fields = Object.keys(section.data);
        const filledFields = fields.filter((key) => {
          const value = section.data[key as keyof typeof section.data];
          return (
            value !== undefined &&
            value !== null &&
            value !== "" &&
            (Array.isArray(value) ? (value as any[]).length > 0 : true)
          );
        });
        const sectionScore =
          (filledFields.length / fields.length) * section.weight;
        totalScore += sectionScore;
      }
    }

    return Math.round(totalScore);
  };

  const completionScore = calculateCompletionScore();

  // Validation checks
  const validationIssues: string[] = [];
  const warnings: string[] = [];

  // Required field checks
  if (!data.basic?.title) validationIssues.push("Property title is required");
  if (!data.basic?.description)
    validationIssues.push("Property description is required");
  if (!data.basic?.type) validationIssues.push("Property type is required");
  if (!data.location?.street) validationIssues.push("Address is required");
  if (!data.pricing?.rentAmount)
    validationIssues.push("Rent amount is required");
  if (!data.media?.photos?.length)
    validationIssues.push("At least one photo is required");

  // Warning checks
  if (data.basic?.description && data.basic.description.length < 100) {
    warnings.push("Consider adding more details to your description");
  }
  if (!data.features?.amenities?.length) {
    warnings.push("Adding amenities can attract more tenants");
  }
  if (!data.media?.photos?.find((p) => p.isPrimary)) {
    warnings.push("Set a primary photo for better visibility");
  }

  const formatCurrency = (amount: number, currency = "KES") =>
    new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
    }).format(amount);

  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat("en-KE", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header with completion status */}
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h2 className="font-bold text-green-800 text-xl">
                  Property Ready for Review
                </h2>
                <p className="text-green-700">
                  Your property listing is {completionScore}% complete
                </p>
              </div>
            </div>
            <div className="text-center">
              <div className="font-bold text-3xl text-green-600">
                {completionScore}%
              </div>
              <div className="text-green-700 text-sm">Complete</div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="h-2 rounded-full bg-green-200">
              <div
                className="h-2 rounded-full bg-green-600 transition-all duration-500"
                style={{ width: `${completionScore}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Validation Issues */}
      {(validationIssues.length > 0 || warnings.length > 0) && (
        <Card
          className={
            validationIssues.length > 0 ? "border-red-200" : "border-yellow-200"
          }
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {validationIssues.length > 0 ? (
                <AlertTriangle className="h-5 w-5 text-red-500" />
              ) : (
                <Info className="h-5 w-5 text-yellow-500" />
              )}
              {validationIssues.length > 0 ? "Issues to Fix" : "Suggestions"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {validationIssues.length > 0 && (
              <div className="mb-4 space-y-2">
                <h4 className="font-medium text-red-700">Required Actions:</h4>
                {validationIssues.map((issue, index) => (
                  <div
                    className="flex items-center gap-2 text-red-600 text-sm"
                    key={index.toString()}
                  >
                    <AlertTriangle className="h-3 w-3" />
                    {issue}
                  </div>
                ))}
              </div>
            )}

            {warnings.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-yellow-700">Suggestions:</h4>
                {warnings.map((warning, index) => (
                  <div
                    className="flex items-center gap-2 text-sm text-yellow-600"
                    key={index.toString()}
                  >
                    <Info className="h-3 w-3" />
                    {warning}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* View Toggle */}
      <div className="flex items-center gap-2">
        <Button
          onClick={() => setPreviewMode("review")}
          size="sm"
          variant={previewMode === "review" ? "default" : "outline"}
        >
          <Edit3 className="mr-2 h-4 w-4" />
          Review Data
        </Button>
        <Button
          onClick={() => setPreviewMode("preview")}
          size="sm"
          variant={previewMode === "preview" ? "default" : "outline"}
        >
          <Eye className="mr-2 h-4 w-4" />
          Preview Listing
        </Button>
      </div>

      {previewMode === "review" ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Basic Information */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Home className="h-5 w-5" />
                Basic Information
              </CardTitle>
              <Button onClick={() => onEdit("basic")} size="sm" variant="ghost">
                <Edit3 className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-gray-500 text-xs uppercase">Title</Label>
                <p className="font-medium">{data.basic?.title || "Not set"}</p>
              </div>
              <div>
                <Label className="text-gray-500 text-xs uppercase">
                  Property Type
                </Label>
                <Badge className="capitalize" variant="secondary">
                  {data.basic?.type || "Not set"}
                </Badge>
              </div>
              <div>
                <Label className="text-gray-500 text-xs uppercase">
                  Description
                </Label>
                <p className="line-clamp-3 text-gray-700 text-sm">
                  {data.basic?.description || "No description provided"}
                </p>
              </div>
              {data.basic?.tags && data.basic.tags.length > 0 && (
                <div>
                  <Label className="text-gray-500 text-xs uppercase">
                    Tags
                  </Label>
                  <div className="flex flex-wrap gap-1">
                    {data.basic.tags.map((tag, index) => (
                      <Badge
                        className="text-xs"
                        key={index.toString()}
                        variant="outline"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Location */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <MapPin className="h-5 w-5" />
                Location
              </CardTitle>
              <Button
                onClick={() => onEdit("location")}
                size="sm"
                variant="ghost"
              >
                <Edit3 className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-gray-500 text-xs uppercase">
                  Address
                </Label>
                <p className="font-medium">
                  {[
                    data.location?.street,
                    data.location?.city,
                    data.location?.county,
                  ]
                    .filter(Boolean)
                    .join(", ") || "Not set"}
                </p>
              </div>
              {data.location?.neighborhood && (
                <div>
                  <Label className="text-gray-500 text-xs uppercase">
                    Neighborhood
                  </Label>
                  <p>{data.location.neighborhood}</p>
                </div>
              )}
              {data.location?.coordinates && (
                <div>
                  <Label className="text-gray-500 text-xs uppercase">
                    Coordinates
                  </Label>
                  <p className="text-sm">
                    {data.location.coordinates.lat.toFixed(6)},{" "}
                    {data.location.coordinates.lng.toFixed(6)}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Property Details */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Home className="h-5 w-5" />
                Property Details
              </CardTitle>
              <Button
                onClick={() => onEdit("details")}
                size="sm"
                variant="ghost"
              >
                <Edit3 className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500 text-xs uppercase">
                    Bedrooms
                  </Label>
                  <p className="font-medium">
                    {data.details?.bedrooms ?? "Not set"}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-500 text-xs uppercase">
                    Bathrooms
                  </Label>
                  <p className="font-medium">
                    {data.details?.bathrooms ?? "Not set"}
                  </p>
                </div>
              </div>
              {data.details?.area && (
                <div>
                  <Label className="text-gray-500 text-xs uppercase">
                    Area
                  </Label>
                  <p className="font-medium">
                    {data.details.area.value} {data.details.area.unit}
                  </p>
                </div>
              )}
              {data.details?.condition && (
                <div>
                  <Label className="text-gray-500 text-xs uppercase">
                    Condition
                  </Label>
                  <Badge className="capitalize" variant="secondary">
                    {data.details.condition}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <DollarSign className="h-5 w-5" />
                Pricing
              </CardTitle>
              <Button
                onClick={() => onEdit("pricing")}
                size="sm"
                variant="ghost"
              >
                <Edit3 className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-gray-500 text-xs uppercase">
                  Rent Amount
                </Label>
                <p className="font-bold text-green-600 text-xl">
                  {data.pricing?.rentAmount
                    ? formatCurrency(
                        data.pricing.rentAmount,
                        data.pricing.currency
                      )
                    : "Not set"}
                  {data.pricing?.paymentFrequency && (
                    <span className="ml-1 font-normal text-gray-500 text-sm">
                      /{data.pricing.paymentFrequency}
                    </span>
                  )}
                </p>
              </div>
              {data.pricing?.securityDeposit && (
                <div>
                  <Label className="text-gray-500 text-xs uppercase">
                    Security Deposit
                  </Label>
                  <p>
                    {formatCurrency(
                      data.pricing.securityDeposit,
                      data.pricing?.currency
                    )}
                  </p>
                </div>
              )}
              {data.pricing?.negotiable && (
                <Badge className="text-xs" variant="outline">
                  Negotiable
                </Badge>
              )}
            </CardContent>
          </Card>

          {/* Media */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Camera className="h-5 w-5" />
                Media ({data.media?.photos?.length || 0} photos)
              </CardTitle>
              <Button onClick={() => onEdit("media")} size="sm" variant="ghost">
                <Edit3 className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              {data.media?.photos && data.media.photos.length > 0 ? (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  {data.media.photos.slice(0, 8).map((photo, index) => (
                    <div className="relative" key={photo.id}>
                      <Image
                        alt={photo.alt || `Property photo ${index + 1}`}
                        className="aspect-square rounded-lg object-cover"
                        height={100}
                        src={photo.url}
                        width={100}
                      />
                      {photo.isPrimary && (
                        <Badge
                          className="absolute top-2 left-2"
                          variant="default"
                        >
                          <Star className="mr-1 h-3 w-3" />
                          Primary
                        </Badge>
                      )}
                    </div>
                  ))}
                  {data.media.photos.length > 8 && (
                    <div className="flex aspect-square items-center justify-center rounded-lg border-2 border-gray-300 border-dashed bg-gray-50">
                      <span className="text-gray-500 text-sm">
                        +{data.media.photos.length - 8} more
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-8 text-center text-gray-500">
                  <Camera className="mx-auto mb-2 h-8 w-8 opacity-50" />
                  <p>No photos uploaded</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Features */}
          {data.features && (
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Star className="h-5 w-5" />
                  Features & Amenities
                </CardTitle>
                <Button
                  onClick={() => onEdit("features")}
                  size="sm"
                  variant="ghost"
                >
                  <Edit3 className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {data.features.amenities &&
                    data.features.amenities.length > 0 && (
                      <div>
                        <Label className="mb-2 text-gray-500 text-xs uppercase">
                          Amenities
                        </Label>
                        <div className="flex flex-wrap gap-1">
                          {data.features.amenities.map((amenity, index) => (
                            <Badge
                              className="text-xs capitalize"
                              key={index.toString()}
                              variant="secondary"
                            >
                              {amenity.replace("_", " ")}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  {data.features.safety && data.features.safety.length > 0 && (
                    <div>
                      <Label className="mb-2 text-gray-500 text-xs uppercase">
                        Safety Features
                      </Label>
                      <div className="flex flex-wrap gap-1">
                        {data.features.safety.map((feature, index) => (
                          <Badge
                            className="text-xs capitalize"
                            key={index.toString()}
                            variant="outline"
                          >
                            {feature.replace("_", " ")}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        /* Preview Mode */
        <Card>
          <CardHeader>
            <CardTitle>Property Listing Preview</CardTitle>
            <p className="text-gray-600 text-sm">
              This is how your property will appear to potential tenants
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Header */}
              <div>
                <h1 className="mb-2 font-bold text-2xl">{data.basic?.title}</h1>
                <div className="flex items-center gap-4 text-gray-600">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {data.location?.city}, {data.location?.county}
                  </span>
                  <span className="flex items-center gap-1">
                    <Home className="h-4 w-4" />
                    {data.details?.bedrooms}BR/{data.details?.bathrooms}BA
                  </span>
                </div>
              </div>

              {/* Price */}
              <div className="rounded-lg border bg-green-50 p-4">
                <div className="font-bold text-3xl text-green-600">
                  {data.pricing?.rentAmount
                    ? formatCurrency(
                        data.pricing.rentAmount,
                        data.pricing.currency
                      )
                    : "Price not set"}
                  <span className="font-normal text-gray-500 text-lg">
                    /{data.pricing?.paymentFrequency || "month"}
                  </span>
                </div>
                {data.pricing?.negotiable && (
                  <Badge className="mt-2" variant="outline">
                    Negotiable
                  </Badge>
                )}
              </div>

              {/* Photos */}
              {data.media?.photos && data.media.photos.length > 0 && (
                <div>
                  <h3 className="mb-3 font-semibold">Photos</h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    {data.media.photos.slice(0, 6).map((photo, index) => (
                      <Image
                        alt={photo.alt || `Property photo ${index + 1}`}
                        className="aspect-video rounded-lg object-cover"
                        height={100}
                        key={photo.id}
                        src={photo.url}
                        width={100}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              <div>
                <h3 className="mb-3 font-semibold">Description</h3>
                <p className="text-gray-700 leading-relaxed">
                  {data.basic?.description || "No description provided"}
                </p>
              </div>

              {/* Features */}
              {data.features?.amenities &&
                data.features.amenities.length > 0 && (
                  <div>
                    <h3 className="mb-3 font-semibold">Amenities</h3>
                    <div className="flex flex-wrap gap-2">
                      {data.features.amenities.map((amenity, index) => (
                        <Badge
                          className="capitalize"
                          key={index.toString()}
                          variant="secondary"
                        >
                          {amenity.replace("_", " ")}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-between">
            <Button
              className="flex items-center gap-2"
              onClick={onPrevious}
              variant="outline"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Previous Step
            </Button>

            <div className="flex gap-2">
              <Button size="sm" variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Save Draft
              </Button>
              <Button size="sm" variant="outline">
                <Share2 className="mr-2 h-4 w-4" />
                Share Preview
              </Button>
              <Button
                className="min-w-32"
                disabled={validationIssues.length > 0 || isSubmitting}
                onClick={onSubmit}
              >
                {isSubmitting ? (
                  <>
                    <Send className="mr-2 h-4 w-4 animate-pulse" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Publish Property
                  </>
                )}
              </Button>
            </div>
          </div>

          {validationIssues.length > 0 && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3">
              <p className="text-red-700 text-sm">
                Please fix the validation issues above before publishing.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Label({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("font-medium text-gray-500 text-xs", className)}>
      {children}
    </div>
  );
}
