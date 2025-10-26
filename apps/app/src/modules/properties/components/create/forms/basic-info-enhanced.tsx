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
import { Textarea } from "@kaa/ui/components/textarea";
import { cn } from "@kaa/ui/lib/utils";
import {
  FileText,
  Home,
  Info,
  Sparkles,
  Tag,
  Target,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { stepSchemas } from "../../../property.schema";
import { useAIAssistant } from "../hooks/use-ai-assistant";

type BasicInfoFormData = {
  title: string;
  description: string;
  type:
    | "apartment"
    | "house"
    | "studio"
    | "villa"
    | "condo"
    | "townhouse"
    | "loft"
    | "penthouse"
    | "duplex"
    | "maisonette"
    | "bedsitter"
    | "single_room";
  listingType: "rent" | "sale" | "lease";
  availableFrom: Date;
  availableUntil?: Date;
  furnished: "unfurnished" | "semi_furnished" | "fully_furnished";
  petPolicy: "allowed" | "not_allowed" | "negotiable";
  smokingPolicy: "allowed" | "not_allowed" | "outside_only";
  tags: string[];
  reference?: string;
};

type BasicInfoFormProps = {
  defaultValues?: Partial<BasicInfoFormData>;
  onSubmit: (data: BasicInfoFormData) => void;
  onNext: () => void;
  className?: string;
};

const propertyTypes = [
  {
    value: "apartment",
    label: "Apartment",
    icon: "🏢",
    keywords: ["apartment", "flat", "unit"],
  },
  {
    value: "house",
    label: "House",
    icon: "🏠",
    keywords: ["house", "home", "residence"],
  },
  {
    value: "studio",
    label: "Studio",
    icon: "🏠",
    keywords: ["studio", "bachelor", "efficiency"],
  },
  {
    value: "villa",
    label: "Villa",
    icon: "🏖️",
    keywords: ["villa", "luxury", "mansion"],
  },
  {
    value: "townhouse",
    label: "Townhouse",
    icon: "🏘️",
    keywords: ["townhouse", "townhome", "rowhouse"],
  },
  {
    value: "duplex",
    label: "Duplex",
    icon: "🏢",
    keywords: ["duplex", "two-family", "multi-unit"],
  },
  {
    value: "penthouse",
    label: "Penthouse",
    icon: "🌆",
    keywords: ["penthouse", "top-floor", "luxury"],
  },
  {
    value: "condo",
    label: "Condo",
    icon: "🏢",
    keywords: ["condo", "condominium", "strata"],
  },
  {
    value: "loft",
    label: "Loft",
    icon: "🏭",
    keywords: ["loft", "industrial", "converted"],
  },
  {
    value: "maisonette",
    label: "Maisonette",
    icon: "🏠",
    keywords: ["maisonette", "duplex", "split-level"],
  },
  {
    value: "bedsitter",
    label: "Bedsitter",
    icon: "🛏️",
    keywords: ["bedsitter", "studio", "single-room"],
  },
  {
    value: "single_room",
    label: "Single Room",
    icon: "🛏️",
    keywords: ["room", "single", "shared"],
  },
];

const listingTypes = [
  { value: "rent", label: "For Rent" },
  { value: "sale", label: "For Sale" },
  { value: "lease", label: "For Lease" },
];

export function EnhancedBasicInfoForm({
  defaultValues,
  onSubmit,
  onNext,
  className,
}: BasicInfoFormProps) {
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { generateDescription, analyzeContent, analysis } = useAIAssistant();

  const form = useForm<BasicInfoFormData>({
    resolver: zodResolver(stepSchemas.basic),
    defaultValues: {
      title: "",
      description: "",
      type: "apartment" as any,
      listingType: "rent",
      availableFrom: new Date(),
      furnished: "unfurnished" as const,
      petPolicy: "not_allowed" as const,
      smokingPolicy: "not_allowed" as const,
      tags: [],
      ...defaultValues,
    },
  });

  const watchedValues = form.watch();
  const title = watchedValues.title || "";
  const description = watchedValues.description || "";

  // Title quality analysis
  const analyzeTitleQuality = () => {
    let score = 0;
    const suggestions: string[] = [];

    // Length check (30-60 characters is optimal)
    if (title.length >= 30 && title.length <= 60) {
      score += 30;
    } else if (title.length >= 20 && title.length <= 80) {
      score += 20;
      if (title.length < 30)
        suggestions.push("Consider making title longer for better SEO");
      if (title.length > 60)
        suggestions.push("Title might be too long for mobile displays");
    } else {
      if (title.length < 20)
        suggestions.push("Title is too short - aim for 30-60 characters");
      if (title.length > 80)
        suggestions.push("Title is too long - keep under 80 characters");
    }

    // Property type inclusion
    const selectedType = propertyTypes.find(
      (t) => t.value === watchedValues.type
    );
    const hasPropertyType = selectedType?.keywords.some((keyword) =>
      title.toLowerCase().includes(keyword)
    );
    if (hasPropertyType) {
      score += 25;
    } else {
      suggestions.push(
        `Include property type (${selectedType?.label}) in title`
      );
    }

    // Numbers and specifics
    // biome-ignore lint/performance/useTopLevelRegex: we need to test the title for numbers
    const hasNumbers = /\d+/.test(title);
    if (hasNumbers) {
      score += 20;
    } else {
      suggestions.push(
        "Include bedroom/bathroom count or size for specificity"
      );
    }

    // Location mentions
    const hasLocationKeywords =
      // biome-ignore lint/performance/useTopLevelRegex: we need to test the title for location keywords
      /\b(kilimani|westlands|parklands|nairobi|kenya)\b/i.test(title);
    if (hasLocationKeywords) {
      score += 15;
    } else {
      suggestions.push("Consider including location for better targeting");
    }

    // Appeal words
    const appealWords = [
      "modern",
      "luxury",
      "spacious",
      "beautiful",
      "cozy",
      "charming",
    ];
    const hasAppealWords = appealWords.some((word) =>
      title.toLowerCase().includes(word)
    );
    if (hasAppealWords) {
      score += 10;
    }

    return { score: Math.min(score, 100), suggestions };
  };

  // Smart title suggestions
  const generateTitleSuggestions = () => {
    const selectedType = propertyTypes.find(
      (t) => t.value === watchedValues.type
    );
    const baseSuggestions = [
      `${selectedType?.label} in [Location] - Perfect for [Target Audience]`,
      `Beautiful ${selectedType?.label} Available for ${watchedValues.listingType}`,
      `Spacious ${selectedType?.label} - Move-in Ready`,
      `Luxury ${selectedType?.label} with Modern Amenities`,
      `${selectedType?.label} - Prime Location, Great Value`,
    ];

    return baseSuggestions;
  };

  // Description quality analysis
  const analyzeDescriptionQuality = () => {
    let score = 0;
    const suggestions: string[] = [];

    // Length check (150-300 characters is optimal)
    if (description.length >= 150 && description.length <= 300) {
      score += 30;
    } else if (description.length >= 100 && description.length <= 400) {
      score += 20;
      if (description.length < 150)
        suggestions.push("Description could be more detailed");
      if (description.length > 300)
        suggestions.push("Consider breaking long descriptions into paragraphs");
    } else {
      if (description.length < 100)
        suggestions.push(
          "Description is too short - aim for 150-300 characters"
        );
      if (description.length > 400)
        suggestions.push("Description is too long - keep under 400 characters");
    }

    // Key information inclusion
    const keyPhrases = [
      "bedroom",
      "bathroom",
      "parking",
      "security",
      "location",
    ];
    const includedPhrases = keyPhrases.filter((phrase) =>
      description.toLowerCase().includes(phrase)
    );
    score += (includedPhrases.length / keyPhrases.length) * 25;

    if (includedPhrases.length < 3) {
      suggestions.push(
        "Include more details about bedrooms, bathrooms, parking, and amenities"
      );
    }

    // Readability check
    const sentences = description
      // biome-ignore lint/performance/useTopLevelRegex: we need to split the description into sentences
      .split(/[.!?]+/)
      .filter((s) => s.trim().length > 0);
    const avgSentenceLength = description.length / sentences.length;
    if (avgSentenceLength > 20) {
      score += 15;
    } else {
      suggestions.push("Use varied sentence lengths for better readability");
    }

    // Call-to-action
    // biome-ignore lint/performance/useTopLevelRegex: we need to test the description for call-to-action
    const hasCTA = /\b(contact|call|message|inquire|available)\b/i.test(
      description
    );
    if (hasCTA) {
      score += 15;
    } else {
      suggestions.push("Add a call-to-action to encourage inquiries");
    }

    // Unique selling points
    const uspWords = [
      "unique",
      "rare",
      "exclusive",
      "prime",
      "best",
      "perfect",
    ];
    const hasUSP = uspWords.some((word) =>
      description.toLowerCase().includes(word)
    );
    if (hasUSP) {
      score += 15;
    }

    return { score: Math.min(score, 100), suggestions };
  };

  const titleQuality = analyzeTitleQuality();
  const descriptionQuality = analyzeDescriptionQuality();

  const handleSubmit = (data: BasicInfoFormData) => {
    onSubmit(data);
    onNext();
  };

  const handleGenerateDescription = async () => {
    const { type, title: currentTitle } = watchedValues;

    if (!(type && currentTitle)) {
      form.setError("title", {
        message: "Please fill in title and property type first",
      });
      return;
    }

    setIsGeneratingDescription(true);

    try {
      const generatedDescription = await generateDescription(
        {
          basic: {
            title: currentTitle,
            type: type as any,
            description: "",
            listingType: "rent",
            availableFrom: new Date(),
            furnished: "unfurnished" as const,
            petPolicy: "not_allowed" as const,
            smokingPolicy: "not_allowed" as const,
            tags: [],
          },
        },
        {
          tone: "professional",
          length: "medium",
          targetAudience: "general",
        }
      );

      form.setValue("description", generatedDescription);

      // Analyze the generated content
      await analyzeContent(generatedDescription);
    } catch (error) {
      console.error("Failed to generate description:", error);
    } finally {
      setIsGeneratingDescription(false);
    }
  };

  const handleAnalyzeDescription = async () => {
    const currentDescription = form.getValues("description");
    if (currentDescription && currentDescription.length > 10) {
      await analyzeContent(currentDescription);
    }
  };

  const applyTitleSuggestion = (suggestion: string) => {
    form.setValue("title", suggestion);
    setShowSuggestions(false);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className={cn("space-y-6", className)}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="h-5 w-5" />
            Enhanced Basic Information
          </CardTitle>
          <p className="text-gray-600 text-sm">
            Create compelling titles and descriptions with AI-powered
            optimization
          </p>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form
              className="space-y-6"
              onSubmit={form.handleSubmit(handleSubmit)}
            >
              {/* Title with Quality Analysis */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center justify-between">
                      <span>Property Title *</span>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => setShowSuggestions(!showSuggestions)}
                          size="sm"
                          type="button"
                          variant="outline"
                        >
                          <Sparkles className="mr-1 h-3 w-3" />
                          Suggestions
                        </Button>
                        <Badge
                          className={cn(
                            "text-xs",
                            getScoreColor(titleQuality.score)
                          )}
                          variant="outline"
                        >
                          {titleQuality.score}% Quality
                        </Badge>
                      </div>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Modern 2-Bedroom Apartment in Kilimani"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Create an engaging title that highlights key features.{" "}
                      {title.length}/80 characters
                    </FormDescription>
                    <FormMessage />

                    {/* Title Quality Progress */}
                    <div className="mt-2">
                      <Progress className="h-2" value={titleQuality.score} />
                      <div className="mt-1 text-gray-500 text-xs">
                        Title Quality:{" "}
                        {titleQuality.score >= 80
                          ? "Excellent"
                          : titleQuality.score >= 60
                            ? "Good"
                            : "Needs Improvement"}
                      </div>
                    </div>

                    {/* Title Suggestions */}
                    {showSuggestions && (
                      <Card className="mt-3">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm">
                            Smart Title Suggestions
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="space-y-2">
                            {generateTitleSuggestions().map((suggestion) => (
                              <Button
                                className="h-auto w-full justify-start p-3 text-left"
                                key={suggestion}
                                onClick={() => applyTitleSuggestion(suggestion)}
                                size="sm"
                                type="button"
                                variant="outline"
                              >
                                <Target className="mr-2 h-3 w-3" />
                                {suggestion}
                              </Button>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Title Quality Suggestions */}
                    {titleQuality.suggestions.length > 0 && (
                      <div className="mt-3 rounded-lg bg-blue-50 p-3">
                        <div className="flex items-start gap-2">
                          <Info className="mt-0.5 h-3 w-3 text-blue-600" />
                          <div>
                            <div className="font-medium text-blue-800 text-sm">
                              Title Tips:
                            </div>
                            <ul className="mt-1 space-y-1 text-blue-700 text-xs">
                              {titleQuality.suggestions.map((suggestion) => (
                                <li key={suggestion}>• {suggestion}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}
                  </FormItem>
                )}
              />

              {/* Property Type and Category */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Property Type *</FormLabel>
                      <Select
                        defaultValue={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select property type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {propertyTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              <div className="flex items-center gap-2">
                                <span>{type.icon}</span>
                                {type.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="listingType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Listing Type *</FormLabel>
                      <Select
                        defaultValue={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select listing type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {listingTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Description with AI Enhancement */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center justify-between">
                      <span>Property Description *</span>
                      <div className="flex gap-2">
                        <Button
                          disabled={
                            isGeneratingDescription || !watchedValues.type
                          }
                          onClick={handleGenerateDescription}
                          size="sm"
                          type="button"
                          variant="outline"
                        >
                          {isGeneratingDescription ? (
                            <>
                              <Sparkles className="mr-1 h-3 w-3 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Sparkles className="mr-1 h-3 w-3" />
                              AI Generate
                            </>
                          )}
                        </Button>

                        {field.value && field.value.length > 10 && (
                          <Button
                            onClick={handleAnalyzeDescription}
                            size="sm"
                            type="button"
                            variant="outline"
                          >
                            <FileText className="mr-1 h-3 w-3" />
                            Analyze
                          </Button>
                        )}

                        <Badge
                          className={cn(
                            "text-xs",
                            getScoreColor(descriptionQuality.score)
                          )}
                          variant="outline"
                        >
                          {descriptionQuality.score}% Quality
                        </Badge>
                      </div>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe your property in detail. Include features, amenities, and what makes it special..."
                        rows={6}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Write a compelling description that attracts potential
                      tenants. {description.length}/400 characters
                    </FormDescription>
                    <FormMessage />

                    {/* Description Quality Progress */}
                    <div className="mt-2">
                      <Progress
                        className="h-2"
                        value={descriptionQuality.score}
                      />
                      <div className="mt-1 text-gray-500 text-xs">
                        Description Quality:{" "}
                        {descriptionQuality.score >= 80
                          ? "Excellent"
                          : descriptionQuality.score >= 60
                            ? "Good"
                            : "Needs Improvement"}
                      </div>
                    </div>

                    {/* Description Quality Suggestions */}
                    {descriptionQuality.suggestions.length > 0 && (
                      <div className="mt-3 rounded-lg bg-green-50 p-3">
                        <div className="flex items-start gap-2">
                          <TrendingUp className="mt-0.5 h-3 w-3 text-green-600" />
                          <div>
                            <div className="font-medium text-green-800 text-sm">
                              Description Tips:
                            </div>
                            <ul className="mt-1 space-y-1 text-green-700 text-xs">
                              {descriptionQuality.suggestions.map(
                                (suggestion) => (
                                  <li key={suggestion}>• {suggestion}</li>
                                )
                              )}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}
                  </FormItem>
                )}
              />

              {/* AI Analysis Results */}
              {analysis && (
                <Card className="border-purple-200 bg-purple-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <Info className="h-4 w-4" />
                      Content Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="mb-4 grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <div
                          className={cn(
                            "font-bold text-lg",
                            getScoreColor(analysis.score)
                          )}
                        >
                          {analysis.score}%
                        </div>
                        <div className="text-gray-600 text-xs">
                          Overall Score
                        </div>
                      </div>
                      <div className="text-center">
                        <div
                          className={cn(
                            "font-bold text-lg",
                            getScoreColor(analysis.readabilityScore)
                          )}
                        >
                          {analysis.readabilityScore}%
                        </div>
                        <div className="text-gray-600 text-xs">Readability</div>
                      </div>
                      <div className="text-center">
                        <div
                          className={cn(
                            "font-bold text-lg",
                            getScoreColor(analysis.seoScore)
                          )}
                        >
                          {analysis.seoScore}%
                        </div>
                        <div className="text-gray-600 text-xs">SEO Score</div>
                      </div>
                    </div>

                    {analysis.suggestions.length > 0 && (
                      <div>
                        <h4 className="mb-2 font-medium text-sm">
                          Suggestions:
                        </h4>
                        <ul className="space-y-1">
                          {analysis.suggestions.map((suggestion) => (
                            <li
                              className="flex items-start gap-1 text-gray-600 text-sm"
                              key={suggestion}
                            >
                              <Tag className="mt-0.5 h-3 w-3 shrink-0 text-purple-500" />
                              {suggestion}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="mt-3">
                      <Badge variant="outline">
                        Sentiment: {analysis.sentiment}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Form Actions */}
              <div className="flex justify-end">
                <Button
                  className="min-w-32"
                  disabled={!form.formState.isValid}
                  type="submit"
                >
                  Continue to Location
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
