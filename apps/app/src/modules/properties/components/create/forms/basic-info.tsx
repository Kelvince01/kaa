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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@kaa/ui/components/select";
import { Textarea } from "@kaa/ui/components/textarea";
import { cn } from "@kaa/ui/lib/utils";
import { FileText, Home, Info, Sparkles, Tag } from "lucide-react";
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
  { value: "apartment", label: "Apartment", icon: "🏢" },
  { value: "house", label: "House", icon: "🏠" },
  { value: "studio", label: "Studio", icon: "🏠" },
  { value: "villa", label: "Villa", icon: "🏖️" },
  { value: "townhouse", label: "Townhouse", icon: "🏘️" },
  { value: "duplex", label: "Duplex", icon: "🏢" },
  { value: "penthouse", label: "Penthouse", icon: "🌆" },
  { value: "mansion", label: "Mansion", icon: "🏰" },
  { value: "cottage", label: "Cottage", icon: "🏡" },
  { value: "bungalow", label: "Bungalow", icon: "🏘️" },
];

const listingTypes = [
  { value: "rent", label: "For Rent" },
  { value: "sale", label: "For Sale" },
  { value: "lease", label: "For Lease" },
];

export function BasicInfoForm({
  defaultValues,
  onSubmit,
  onNext,
  className,
}: BasicInfoFormProps) {
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
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

  const handleSubmit = (data: BasicInfoFormData) => {
    onSubmit(data);
    onNext();
  };

  const handleGenerateDescription = async () => {
    const { type, title } = watchedValues;

    if (!(type && title)) {
      form.setError("title", {
        message: "Please fill in title and property type first",
      });
      return;
    }

    setIsGeneratingDescription(true);

    try {
      const description = await generateDescription(
        {
          basic: {
            title,
            type: type as any,
            description: "",
            listingType: "rent",
            availableFrom: new Date(),
            furnished: "unfurnished" as const,
            petPolicy: "not_allowed" as const,
            smokingPolicy: "not_allowed" as const,
            tags: [],
          },
          // Mock additional data for better generation
        },
        {
          tone: "professional",
          length: "medium",
          targetAudience: "general",
        }
      );

      form.setValue("description", description);

      // Analyze the generated content
      await analyzeContent(description);
    } catch (error) {
      console.error("Failed to generate description:", error);
    } finally {
      setIsGeneratingDescription(false);
    }
  };

  const handleAnalyzeDescription = async () => {
    const description = form.getValues("description");
    if (description && description.length > 10) {
      await analyzeContent(description);
    }
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
            Basic Information
          </CardTitle>
          <p className="text-gray-600 text-sm">
            Start with the essential details about your property
          </p>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form
              className="space-y-6"
              onSubmit={form.handleSubmit(handleSubmit)}
            >
              {/* Property Title */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Property Title *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Modern 2-Bedroom Apartment in Kilimani"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Create an engaging title that highlights key features
                    </FormDescription>
                    <FormMessage />
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
              </div>

              {/* Listing Type and Reference */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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

                <FormField
                  control={form.control}
                  name="reference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Property Reference</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., KAA-001-2024"
                          {...field}
                          value={field.value as string}
                        />
                      </FormControl>
                      <FormDescription>
                        Optional unique identifier for this property
                      </FormDescription>
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
                      tenants
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* AI Analysis Results */}
              {analysis && (
                <Card className="border-blue-200 bg-blue-50">
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
                          {analysis.suggestions.map((suggestion, index) => (
                            <li
                              className="flex items-start gap-2 text-gray-600 text-sm"
                              key={index.toString()}
                            >
                              <Tag className="mt-0.5 h-3 w-3 shrink-0 text-blue-500" />
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
                  Continue to Details
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
