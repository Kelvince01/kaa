import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import { Checkbox } from "@kaa/ui/components/checkbox";
import { Progress } from "@kaa/ui/components/progress";
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
  Camera,
  CheckCircle,
  DollarSign,
  Download,
  Edit3,
  Eye,
  Home,
  Info,
  MapPin,
  Search,
  Send,
  Share2,
  Smartphone,
  Star,
  Target,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import type { PropertyFormData } from "../schema";

type CompletedFormProps = {
  data: PropertyFormData;
  onEdit: (step: string) => void;
  onSubmit: () => void;
  onPrevious: () => void;
  isSubmitting?: boolean;
  className?: string;
};

export function EnhancedCompletedForm({
  data,
  onEdit,
  onSubmit,
  onPrevious,
  isSubmitting = false,
  className,
}: CompletedFormProps) {
  const [activeTab, setActiveTab] = useState("review");
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">(
    "desktop"
  );
  const [showChecklist, setShowChecklist] = useState(false);

  // Enhanced completion scoring with detailed analysis
  const calculateDetailedCompletion = () => {
    const sections = [
      {
        name: "basic",
        data: data.basic,
        weight: 20,
        fields: ["title", "description", "type", "listingType"],
        qualityChecks: {
          titleLength: data.basic?.title?.length >= 20,
          descriptionLength: data.basic?.description?.length >= 100,
          hasTags: data.basic?.tags?.length > 0,
        },
      },
      {
        name: "location",
        data: data.location,
        weight: 20,
        fields: ["county", "address", "coordinates"],
        qualityChecks: {
          hasCoordinates: !!data.location?.coordinates,
          hasNeighborhood: !!data.location?.neighborhood,
          hasConstituency: !!data.location?.constituency,
        },
      },
      {
        name: "details",
        data: data.details,
        weight: 15,
        fields: ["bedrooms", "bathrooms", "size", "condition"],
        qualityChecks: {
          hasSize: !!data.details?.size,
          hasYearBuilt: !!data.details?.yearBuilt,
          hasView: data.details?.view?.length > 0,
        },
      },
      {
        name: "features",
        data: data.features,
        weight: 10,
        fields: ["amenities", "safety", "utilities"],
        qualityChecks: {
          hasAmenities: data.features?.amenities?.length > 0,
          hasSafety: data.features?.safety?.length > 0,
          hasUtilities: data.features?.utilities,
        },
      },
      {
        name: "media",
        data: data.media,
        weight: 15,
        fields: ["photos"],
        qualityChecks: {
          hasPrimaryPhoto: data.media?.photos?.some((p) => p.isPrimary),
          hasMultiplePhotos: data.media?.photos?.length >= 5,
          hasCaptions: data.media?.photos?.some((p) => p.caption),
        },
      },
      {
        name: "pricing",
        data: data.pricing,
        weight: 15,
        fields: ["rentAmount", "currency", "paymentFrequency"],
        qualityChecks: {
          hasSecurityDeposit: !!data.pricing?.securityDeposit,
          hasUtilitiesIncluded: data.pricing?.utilitiesIncluded?.length > 0,
          isNegotiable: data.pricing?.negotiable,
        },
      },
      {
        name: "availability",
        data: data.availability,
        weight: 3,
        fields: ["status"],
        qualityChecks: {
          hasSchedule: !!data.availability?.showingSchedule,
          instantBooking: data.availability?.instantBooking,
        },
      },
      {
        name: "contact",
        data: data.contact,
        weight: 2,
        fields: ["phoneNumber"],
        qualityChecks: {
          hasWhatsapp: !!data.contact?.whatsappNumber,
          hasLanguages: (data.contact?.languages?.length || 0) > 0,
        },
      },
    ];

    let totalScore = 0;
    let qualityScore = 0;
    const sectionScores: {
      name: string;
      score: number;
      qualityScore: number;
      maxScore: number;
    }[] = [];
    const qualityChecks: { section: string; check: string }[] = [];

    for (const section of sections) {
      if (section.data) {
        const fields = Object.keys(section.data);
        const filledFields = fields.filter((key) => {
          const value = section.data?.[key as keyof typeof section.data];
          return (
            value !== undefined &&
            value !== null &&
            value !== "" &&
            (Array.isArray(value) ? (value as unknown[]).length > 0 : true)
          );
        });
        const sectionScore = section.data
          ? (filledFields.length / fields.length) * section.weight
          : 0;
        totalScore += sectionScore;

        // Quality score calculation
        const qualityFields = Object.values(section.qualityChecks);
        const qualityRatio =
          qualityFields.filter(Boolean).length / qualityFields.length;
        qualityScore += qualityRatio * section.weight;

        sectionScores.push({
          name: section.name,
          score: Math.round(sectionScore),
          qualityScore: Math.round(qualityRatio * section.weight),
          maxScore: section.weight,
        });

        qualityChecks.push(
          ...Object.entries(section.qualityChecks)
            .filter(([_, passed]) => !passed)
            .map(([check, _]) => ({ section: section.name, check }))
        );
      }
    }

    return {
      overallScore: Math.round(totalScore),
      qualityScore: Math.round(qualityScore),
      sectionScores,
      qualityChecks,
    };
  };

  // SEO Analysis
  const analyzeSEO = () => {
    const title = data.basic?.title || "";
    const description = data.basic?.description || "";
    const features = data.features?.amenities || [];

    const seoScore = {
      title: {
        score:
          title.length >= 30 && title.length <= 60
            ? 100
            : title.length >= 20 && title.length <= 80
              ? 75
              : 50,
        suggestions: [] as string[],
      },
      description: {
        score:
          description.length >= 150 && description.length <= 300
            ? 100
            : description.length >= 100 && description.length <= 400
              ? 75
              : 50,
        suggestions: [] as string[],
      },
      keywords: {
        score: 0,
        suggestions: [] as string[],
      },
    };

    // Title analysis
    if (title.length < 30)
      seoScore.title.suggestions.push(
        "Title too short - aim for 30-60 characters"
      );
    if (title.length > 80)
      seoScore.title.suggestions.push(
        "Title too long - keep under 80 characters"
      );
    if (!title.toLowerCase().includes(data.basic?.type || "")) {
      seoScore.title.suggestions.push("Include property type in title");
    }

    // Description analysis
    if (description.length < 150)
      seoScore.description.suggestions.push(
        "Description too short - aim for 150-300 characters"
      );
    if (description.length > 400)
      seoScore.description.suggestions.push(
        "Description too long - keep under 400 characters"
      );

    // Keywords analysis
    const propertyKeywords = [
      "apartment",
      "house",
      "bedroom",
      "bathroom",
      "rent",
      "lease",
    ];
    const foundKeywords = propertyKeywords.filter(
      (keyword) =>
        title.toLowerCase().includes(keyword) ||
        description.toLowerCase().includes(keyword)
    );
    seoScore.keywords.score = Math.min(foundKeywords.length * 20, 100);
    if (foundKeywords.length < 3) {
      seoScore.keywords.suggestions.push("Add more property-related keywords");
    }

    const totalScore = Math.round(
      (seoScore.title.score +
        seoScore.description.score +
        seoScore.keywords.score) /
        3
    );

    return { ...seoScore, totalScore };
  };

  // Publication Checklist
  const getPublicationChecklist = () => [
    {
      category: "Legal Compliance",
      items: [
        {
          text: "Property ownership documents verified",
          required: true,
          completed: false,
        },
        {
          text: "Rental license obtained (if required)",
          required: true,
          completed: false,
        },
        {
          text: "Property tax compliance confirmed",
          required: true,
          completed: false,
        },
        {
          text: "Insurance coverage in place",
          required: false,
          completed: false,
        },
      ],
    },
    {
      category: "Property Details",
      items: [
        {
          text: "All required fields completed",
          required: true,
          completed: calculateDetailedCompletion().overallScore >= 80,
        },
        {
          text: "High-quality photos uploaded",
          required: true,
          completed: (data.media?.photos?.length || 0) >= 5,
        },
        {
          text: "Accurate property measurements",
          required: false,
          completed: !!data.details?.size,
        },
        {
          text: "Current market pricing",
          required: true,
          completed: !!data.pricing?.rentAmount,
        },
      ],
    },
    {
      category: "Marketing Optimization",
      items: [
        {
          text: "SEO-optimized title and description",
          required: false,
          completed: analyzeSEO().totalScore >= 70,
        },
        {
          text: "Amenities and features highlighted",
          required: false,
          completed: (data.features?.amenities?.length || 0) > 0,
        },
        {
          text: "Contact information provided",
          required: true,
          completed: !!data.contact?.phoneNumber,
        },
        {
          text: "Viewing schedule set",
          required: false,
          completed: !!data.availability?.showingSchedule,
        },
      ],
    },
  ];

  const completion = calculateDetailedCompletion();
  const seoAnalysis = analyzeSEO();
  const checklist = getPublicationChecklist();

  // Validation checks
  const validationIssues: string[] = [];
  const warnings: string[] = [];

  if (!data.basic?.title) validationIssues.push("Property title is required");
  if (!data.basic?.description)
    validationIssues.push("Property description is required");
  if (!data.basic?.type) validationIssues.push("Property type is required");
  if (!data.location?.address?.line1)
    validationIssues.push("Address is required");
  if (!data.pricing?.rentAmount)
    validationIssues.push("Rent amount is required");
  if (!data.media?.photos?.length)
    validationIssues.push("At least one photo is required");

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

  return (
    <div className={cn("space-y-6", className)}>
      {/* Enhanced Header with Detailed Scoring */}
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
                  Overall: {completion.overallScore}% • Quality:{" "}
                  {completion.qualityScore}%
                </p>
              </div>
            </div>
            <div className="text-center">
              <div className="font-bold text-3xl text-green-600">
                {completion.overallScore}%
              </div>
              <div className="text-green-700 text-sm">Complete</div>
            </div>
          </div>

          {/* Detailed Progress Bars */}
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Overall Completion</span>
              <span>{completion.overallScore}%</span>
            </div>
            <Progress className="h-2" value={completion.overallScore} />

            <div className="flex justify-between text-sm">
              <span>Quality Score</span>
              <span>{completion.qualityScore}%</span>
            </div>
            <Progress className="h-2" value={completion.qualityScore} />

            <div className="flex justify-between text-sm">
              <span>SEO Score</span>
              <span>{seoAnalysis.totalScore}%</span>
            </div>
            <Progress className="h-2" value={seoAnalysis.totalScore} />
          </div>

          {/* Section Scores */}
          <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4">
            {completion.sectionScores.map((section) => (
              <div className="text-center" key={section.name}>
                <div className="font-medium text-sm capitalize">
                  {section.name}
                </div>
                <div className="font-bold text-green-600 text-lg">
                  {section.score}%
                </div>
                <div className="text-gray-500 text-xs">
                  of {section.maxScore}%
                </div>
              </div>
            ))}
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

      {/* Main Content Tabs */}
      <Tabs className="w-full" onValueChange={setActiveTab} value={activeTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="review">Review Data</TabsTrigger>
          <TabsTrigger value="preview">Live Preview</TabsTrigger>
          <TabsTrigger value="seo">SEO Analysis</TabsTrigger>
          <TabsTrigger value="checklist">Publication Checklist</TabsTrigger>
        </TabsList>

        <TabsContent className="space-y-6" value="review">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Basic Information */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Home className="h-5 w-5" />
                  Basic Information
                </CardTitle>
                <Button
                  onClick={() => onEdit("basic")}
                  size="sm"
                  variant="ghost"
                >
                  <Edit3 className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-gray-500 text-xs uppercase">
                    Title
                  </Label>
                  <p className="font-medium">
                    {data.basic?.title || "Not set"}
                  </p>
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
                      data.location?.address?.line1,
                      data.location?.address?.town,
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
                {data.details?.size && (
                  <div>
                    <Label className="text-gray-500 text-xs uppercase">
                      Area
                    </Label>
                    <p className="font-medium">{data.details.size} sq ft</p>
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
                <Button
                  onClick={() => onEdit("media")}
                  size="sm"
                  variant="ghost"
                >
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
                    {data.features.safety &&
                      data.features.safety.length > 0 && (
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
        </TabsContent>

        <TabsContent className="space-y-6" value="preview">
          {/* Preview Mode Toggle */}
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setPreviewMode("desktop")}
              size="sm"
              variant={previewMode === "desktop" ? "default" : "outline"}
            >
              <Eye className="mr-2 h-4 w-4" />
              Desktop View
            </Button>
            <Button
              onClick={() => setPreviewMode("mobile")}
              size="sm"
              variant={previewMode === "mobile" ? "default" : "outline"}
            >
              <Smartphone className="mr-2 h-4 w-4" />
              Mobile View
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Property Listing Preview</CardTitle>
              <p className="text-gray-600 text-sm">
                This is how your property will appear to potential tenants
              </p>
            </CardHeader>
            <CardContent>
              <div
                className={cn(
                  "space-y-6",
                  previewMode === "mobile" && "mx-auto max-w-sm"
                )}
              >
                {/* Header */}
                <div>
                  <h1
                    className={cn(
                      "mb-2 font-bold",
                      previewMode === "mobile" ? "text-xl" : "text-2xl"
                    )}
                  >
                    {data.basic?.title}
                  </h1>
                  <div className="flex items-center gap-4 text-gray-600">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {data.location?.address?.town}, {data.location?.county}
                    </span>
                    <span className="flex items-center gap-1">
                      <Home className="h-4 w-4" />
                      {data.details?.bedrooms}BR/{data.details?.bathrooms}BA
                    </span>
                  </div>
                </div>

                {/* Price */}
                <div className="rounded-lg border bg-green-50 p-4">
                  <div
                    className={cn(
                      "font-bold text-green-600",
                      previewMode === "mobile" ? "text-2xl" : "text-3xl"
                    )}
                  >
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
                    <div
                      className={cn(
                        "grid gap-4",
                        previewMode === "mobile" ? "grid-cols-1" : "grid-cols-3"
                      )}
                    >
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
        </TabsContent>

        <TabsContent className="space-y-6" value="seo">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                SEO Analysis & Optimization
              </CardTitle>
              <p className="text-gray-600 text-sm">
                Optimize your listing for better search visibility
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* SEO Scores */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-lg border p-4 text-center">
                  <div
                    className={cn(
                      "font-bold text-lg",
                      seoAnalysis.title.score >= 80
                        ? "text-green-600"
                        : seoAnalysis.title.score >= 60
                          ? "text-yellow-600"
                          : "text-red-600"
                    )}
                  >
                    {seoAnalysis.title.score}%
                  </div>
                  <div className="text-gray-600 text-sm">Title Score</div>
                  <Progress className="mt-2" value={seoAnalysis.title.score} />
                </div>

                <div className="rounded-lg border p-4 text-center">
                  <div
                    className={cn(
                      "font-bold text-lg",
                      seoAnalysis.description.score >= 80
                        ? "text-green-600"
                        : seoAnalysis.description.score >= 60
                          ? "text-yellow-600"
                          : "text-red-600"
                    )}
                  >
                    {seoAnalysis.description.score}%
                  </div>
                  <div className="text-gray-600 text-sm">Description Score</div>
                  <Progress
                    className="mt-2"
                    value={seoAnalysis.description.score}
                  />
                </div>

                <div className="rounded-lg border p-4 text-center">
                  <div
                    className={cn(
                      "font-bold text-lg",
                      seoAnalysis.keywords.score >= 80
                        ? "text-green-600"
                        : seoAnalysis.keywords.score >= 60
                          ? "text-yellow-600"
                          : "text-red-600"
                    )}
                  >
                    {seoAnalysis.keywords.score}%
                  </div>
                  <div className="text-gray-600 text-sm">Keywords Score</div>
                  <Progress
                    className="mt-2"
                    value={seoAnalysis.keywords.score}
                  />
                </div>
              </div>

              {/* SEO Suggestions */}
              <div className="space-y-4">
                <h4 className="font-medium">Optimization Suggestions</h4>

                {seoAnalysis.title.suggestions.length > 0 && (
                  <div className="rounded-lg border p-4">
                    <h5 className="mb-2 font-medium text-sm">
                      Title Improvements
                    </h5>
                    <ul className="space-y-1">
                      {seoAnalysis.title.suggestions.map((suggestion) => (
                        <li
                          className="flex items-start gap-2 text-gray-600 text-sm"
                          key={suggestion}
                        >
                          <Target className="mt-0.5 h-3 w-3 text-blue-500" />
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {seoAnalysis.description.suggestions.length > 0 && (
                  <div className="rounded-lg border p-4">
                    <h5 className="mb-2 font-medium text-sm">
                      Description Improvements
                    </h5>
                    <ul className="space-y-1">
                      {seoAnalysis.description.suggestions.map((suggestion) => (
                        <li
                          className="flex items-start gap-2 text-gray-600 text-sm"
                          key={suggestion}
                        >
                          <Target className="mt-0.5 h-3 w-3 text-blue-500" />
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {seoAnalysis.keywords.suggestions.length > 0 && (
                  <div className="rounded-lg border p-4">
                    <h5 className="mb-2 font-medium text-sm">
                      Keyword Optimization
                    </h5>
                    <ul className="space-y-1">
                      {seoAnalysis.keywords.suggestions.map((suggestion) => (
                        <li
                          className="flex items-start gap-2 text-gray-600 text-sm"
                          key={suggestion}
                        >
                          <Target className="mt-0.5 h-3 w-3 text-blue-500" />
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent className="space-y-6" value="checklist">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Publication Checklist
              </CardTitle>
              <p className="text-gray-600 text-sm">
                Ensure your listing meets all requirements before publishing
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {checklist.map((category) => (
                <div className="space-y-3" key={category.category}>
                  <h4 className="font-medium text-lg">{category.category}</h4>
                  <div className="space-y-2">
                    {category.items.map((item) => (
                      <div
                        className="flex items-start gap-3 rounded-lg border p-3"
                        key={item.text}
                      >
                        <Checkbox
                          checked={item.completed}
                          className="mt-0.5"
                          disabled
                        />
                        <div className="flex-1">
                          <span
                            className={cn(
                              "text-sm",
                              item.completed
                                ? "text-green-700"
                                : "text-gray-700"
                            )}
                          >
                            {item.text}
                          </span>
                          {item.required && (
                            <Badge className="ml-2 text-xs" variant="outline">
                              Required
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <div className="mt-6 rounded-lg bg-blue-50 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Info className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-sm">Ready to Publish?</span>
                </div>
                <p className="text-blue-700 text-sm">
                  Complete all required items before publishing your listing.
                  Optional items will help improve your listing's visibility and
                  appeal.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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
