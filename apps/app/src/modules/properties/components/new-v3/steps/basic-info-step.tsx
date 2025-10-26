"use client";

import { Badge } from "@kaa/ui/components/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import {
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
import { Building2, FileText, Lightbulb, Tag } from "lucide-react";
import { useMemo, useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import type { PropertyFormData } from "../schema";

const PROPERTY_TYPES = [
  { value: "apartment", label: "🏢 Apartment", icon: "🏢" },
  { value: "house", label: "🏠 House", icon: "🏠" },
  { value: "villa", label: "🏡 Villa", icon: "🏡" },
  { value: "studio", label: "🏠 Studio", icon: "🏠" },
  { value: "bedsitter", label: "🛏️ Bedsitter", icon: "🛏️" },
  { value: "penthouse", label: "🌆 Penthouse", icon: "🌆" },
  { value: "maisonette", label: "🏘️ Maisonette", icon: "🏘️" },
  { value: "office", label: "🏢 Office", icon: "🏢" },
  { value: "shop", label: "🏪 Shop", icon: "🏪" },
  { value: "land", label: "🌍 Land", icon: "🌍" },
];

const TITLE_TEMPLATES = [
  "Modern {bedrooms}BR {type} in {location}",
  "Spacious {type} with {feature}",
  "Luxury {bedrooms}BR {type} - {location}",
  "Beautiful {type} with Stunning Views",
];

type BasicInfoStepProps = {
  form: UseFormReturn<PropertyFormData>;
};

export function BasicInfoStep({ form }: BasicInfoStepProps) {
  const [showTitleSuggestions, setShowTitleSuggestions] = useState(false);
  const [showDescriptionTemplates, setShowDescriptionTemplates] =
    useState(false);

  const watchedValues = form.watch();

  // Calculate title quality score
  const titleQuality = useMemo(() => {
    const title = watchedValues.title || "";
    let score = 0;
    const factors: string[] = [];

    if (title.length >= 20 && title.length <= 80) {
      score += 30;
      factors.push("✓ Good length");
    } else if (title.length > 0) {
      factors.push(title.length < 20 ? "⚠ Too short" : "⚠ Too long");
    }

    const keywords = ["bedroom", "BR", "modern", "spacious", "luxury"];
    if (keywords.some((k) => title.toLowerCase().includes(k.toLowerCase()))) {
      score += 25;
      factors.push("✓ Contains keywords");
    }

    const locations = ["Westlands", "Karen", "Kilimani", "Nairobi"];
    if (locations.some((l) => title.toLowerCase().includes(l.toLowerCase()))) {
      score += 25;
      factors.push("✓ Includes location");
    }

    if (title.split(" ").length >= 4) {
      score += 20;
      factors.push("✓ Descriptive");
    }

    return { score, factors };
  }, [watchedValues.title]);

  // Description quality indicators
  const descriptionQuality = useMemo(() => {
    const desc = watchedValues.description || "";
    // biome-ignore lint/performance/useTopLevelRegex: we need to use a top level regex
    const wordCount = desc.trim().split(/\s+/).length;
    const hasKeyFeatures = ["bedroom", "bathroom", "kitchen"].some((k) =>
      desc.toLowerCase().includes(k)
    );
    const hasLocation =
      desc.toLowerCase().includes("located") ||
      desc.toLowerCase().includes("near");

    return {
      wordCount,
      hasKeyFeatures,
      hasLocation,
      quality:
        wordCount >= 30 && hasKeyFeatures && hasLocation
          ? "excellent"
          : wordCount >= 20
            ? "good"
            : "needs_work",
    };
  }, [watchedValues.description]);

  return (
    <div className="space-y-6">
      {/* Property Title */}
      <FormField
        control={form.control}
        name="title"
        render={({ field }) => (
          <FormItem>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <FormLabel className="font-semibold text-base">
                Property Title <span className="text-red-500">*</span>
              </FormLabel>
              {field.value && field.value.length > 5 && (
                <div className="flex items-center gap-2">
                  <Progress className="h-2 w-20" value={titleQuality.score} />
                  <span
                    className={`font-medium text-xs ${
                      titleQuality.score >= 75
                        ? "text-green-600"
                        : titleQuality.score >= 50
                          ? "text-yellow-600"
                          : "text-red-600"
                    }`}
                  >
                    {titleQuality.score}%
                  </span>
                </div>
              )}
            </div>
            <FormDescription className="text-xs">
              Create an attractive title highlighting your property's best
              features
            </FormDescription>
            <FormControl>
              <Input
                className="text-base transition-all focus:ring-2"
                placeholder="e.g., Modern 2BR Apartment with City View in Westlands"
                {...field}
              />
            </FormControl>
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="text-muted-foreground">
                {field.value?.length || 0}/100 characters
              </span>
              {titleQuality.factors.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {titleQuality.factors.map((factor) => (
                    <Badge
                      className="text-xs"
                      key={factor}
                      variant={factor.startsWith("✓") ? "default" : "outline"}
                    >
                      {factor}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Property Type */}
      <FormField
        control={form.control}
        name="type"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-2 font-semibold text-base">
              <Building2 className="h-4 w-4" />
              Property Type <span className="text-red-500">*</span>
            </FormLabel>
            <FormDescription className="text-xs">
              Select the category that best describes your property
            </FormDescription>
            <Select defaultValue={field.value} onValueChange={field.onChange}>
              <FormControl>
                <SelectTrigger className="text-base">
                  <SelectValue placeholder="Choose property type" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {PROPERTY_TYPES.map((type) => (
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

      {/* Property Description */}
      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-2 font-semibold text-base">
              <FileText className="h-4 w-4" />
              Property Description <span className="text-red-500">*</span>
            </FormLabel>
            <FormDescription className="text-xs">
              Provide detailed information about your property, nearby
              amenities, and what makes it special
            </FormDescription>
            <FormControl>
              <Textarea
                className="min-h-[150px] resize-none text-base transition-all focus:ring-2 md:min-h-[120px]"
                placeholder="Describe your property in detail. Include layout, condition, unique features, nearby amenities, and neighborhood highlights..."
                {...field}
              />
            </FormControl>
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="text-muted-foreground">
                {field.value?.length || 0}/2000 characters •{" "}
                {descriptionQuality.wordCount} words
              </span>
              <div className="flex flex-wrap gap-1">
                <Badge
                  variant={
                    descriptionQuality.hasKeyFeatures ? "default" : "outline"
                  }
                >
                  {descriptionQuality.hasKeyFeatures ? "✓" : "○"} Key features
                </Badge>
                <Badge
                  variant={
                    descriptionQuality.hasLocation ? "default" : "outline"
                  }
                >
                  {descriptionQuality.hasLocation ? "✓" : "○"} Location info
                </Badge>
              </div>
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Tags (Optional) */}
      <FormField
        control={form.control}
        name="tags"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-2 font-semibold text-base">
              <Tag className="h-4 w-4" />
              Tags (Optional)
            </FormLabel>
            <FormDescription className="text-xs">
              Add keywords to help people find your property (comma-separated)
            </FormDescription>
            <FormControl>
              <Input
                onChange={(e) => {
                  const tags = e.target.value
                    .split(",")
                    .map((tag) => tag.trim())
                    .filter(Boolean);
                  field.onChange(tags);
                }}
                placeholder="e.g., pet-friendly, furnished, parking, secure"
                value={field.value?.join(", ") || ""}
              />
            </FormControl>
            {field.value && field.value.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {field.value.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Tips Card */}
      <Card className="border-blue-200 bg-linear-to-br from-blue-50 to-white dark:from-blue-950 dark:to-background">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Lightbulb className="h-5 w-5 text-blue-600" />
            <span>Tips for Better Listings</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-blue-600">•</span>
              <span>
                Use descriptive words: "spacious", "modern", "well-lit"
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600">•</span>
              <span>Mention the neighborhood and nearby landmarks</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600">•</span>
              <span>Highlight unique features: balcony, parking, view</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600">•</span>
              <span className="font-medium">
                Listings with detailed info get 40% more inquiries
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Preview Card */}
      {(watchedValues.title || watchedValues.description) && (
        <Card className="border-gray-200 bg-linear-to-br from-gray-50 to-white dark:from-gray-900 dark:to-background">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Preview</CardTitle>
            <CardDescription className="text-xs">
              How your listing will appear to potential tenants
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <h3 className="font-semibold text-lg leading-tight">
                {watchedValues.title || "Your property title will appear here"}
              </h3>
              {watchedValues.type && (
                <Badge className="capitalize" variant="secondary">
                  {watchedValues.type}
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {watchedValues.description ||
                "Your property description will appear here..."}
            </p>
            {watchedValues.tags && watchedValues.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-2">
                {watchedValues.tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
