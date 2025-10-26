"use client";

import { PropertyType } from "@kaa/models/types";
import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
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
import { cn } from "@kaa/ui/lib/utils";
import { Info, Sparkles, TrendingUp, X } from "lucide-react";
import { useState } from "react";
import { useFormContext } from "react-hook-form";
import type { PropertyFormData } from "../schema";

const PROPERTY_TYPE_LABELS: Record<
  PropertyType,
  { label: string; icon: string }
> = {
  [PropertyType.APARTMENT]: { label: "Apartment", icon: "🏢" },
  [PropertyType.HOUSE]: { label: "House", icon: "🏠" },
  [PropertyType.FLAT]: { label: "Flat", icon: "🏢" },
  [PropertyType.STUDIO]: { label: "Studio", icon: "🏠" },
  [PropertyType.BEDSITTER]: { label: "Bedsitter", icon: "🛏️" },
  [PropertyType.VILLA]: { label: "Villa", icon: "🏖️" },
  [PropertyType.PENTHOUSE]: { label: "Penthouse", icon: "🌆" },
  [PropertyType.MAISONETTE]: { label: "Maisonette", icon: "🏘️" },
  [PropertyType.LAND]: { label: "Land", icon: "🌳" },
  [PropertyType.SHOP]: { label: "Shop", icon: "🏪" },
  [PropertyType.OFFICE]: { label: "Office", icon: "🏢" },
  [PropertyType.WAREHOUSE]: { label: "Warehouse", icon: "🏭" },
  [PropertyType.COMMERCIAL]: { label: "Commercial", icon: "🏗️" },
  [PropertyType.OTHER]: { label: "Other", icon: "🏛️" },
};

const FURNISHED_OPTIONS = [
  { value: "unfurnished", label: "Unfurnished" },
  { value: "semi_furnished", label: "Semi Furnished" },
  { value: "fully_furnished", label: "Fully Furnished" },
];

export function BasicInfoStep() {
  const form = useFormContext<PropertyFormData>();
  const [tagInput, setTagInput] = useState("");

  const title = form.watch("title") || "";
  const description = form.watch("description") || "";
  const tags = form.watch("tags") || [];

  // Title quality analysis
  const getTitleQuality = () => {
    let score = 0;
    const suggestions: string[] = [];

    if (title.length >= 30 && title.length <= 60) {
      score += 40;
    } else if (title.length >= 10 && title.length <= 80) {
      score += 20;
      if (title.length < 30)
        suggestions.push("Consider making title longer (30-60 chars optimal)");
    }

    // biome-ignore lint/performance/useTopLevelRegex: ignore
    if (/\d+/.test(title)) {
      score += 30;
    } else {
      suggestions.push("Include numbers (bedrooms, area, etc.)");
    }

    const hasLocation =
      // biome-ignore lint/performance/useTopLevelRegex: ignore
      /\b(kilimani|westlands|nairobi|karen|lavington|parklands)\b/i.test(title);
    if (hasLocation) {
      score += 30;
    } else {
      suggestions.push("Include location for better visibility");
    }

    return { score: Math.min(score, 100), suggestions };
  };

  // Description quality analysis
  const getDescriptionQuality = () => {
    let score = 0;
    const suggestions: string[] = [];

    if (description.length >= 150 && description.length <= 500) {
      score += 40;
    } else if (description.length >= 50) {
      score += 20;
      if (description.length < 150)
        suggestions.push("Add more details (150-500 chars optimal)");
    }

    const keyPhrases = [
      "bedroom",
      "bathroom",
      "parking",
      "security",
      "kitchen",
    ];
    const included = keyPhrases.filter((p) =>
      description.toLowerCase().includes(p)
    );
    score += (included.length / keyPhrases.length) * 40;

    if (included.length < 3) {
      suggestions.push(
        "Include details about bedrooms, bathrooms, and amenities"
      );
    }

    // biome-ignore lint/performance/useTopLevelRegex: ignore
    const hasCTA = /\b(contact|call|available|inquire)\b/i.test(description);
    if (hasCTA) {
      score += 20;
    } else {
      suggestions.push("Add a call-to-action");
    }

    return { score: Math.min(score, 100), suggestions };
  };

  const titleQuality = getTitleQuality();
  const descriptionQuality = getDescriptionQuality();

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const newTag = tagInput.trim().toLowerCase();
      if (newTag && !tags.includes(newTag) && tags.length < 10) {
        form.setValue("tags", [...tags, newTag], { shouldValidate: true });
        setTagInput("");
      }
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    form.setValue(
      "tags",
      tags.filter((tag) => tag !== tagToRemove),
      { shouldValidate: true }
    );
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h2 className="font-semibold text-2xl text-foreground md:text-3xl">
          Basic Information
        </h2>
        <p className="text-muted-foreground text-sm md:text-base">
          Start with the essentials - create a compelling title and description
        </p>
      </div>

      {/* Title Field */}
      <FormField
        control={form.control}
        name="title"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center justify-between">
              <span className="text-base">Property Title *</span>
              <Badge
                className={cn("text-xs", getScoreColor(titleQuality.score))}
                variant="outline"
              >
                {titleQuality.score}% Quality
              </Badge>
            </FormLabel>
            <FormControl>
              <Input
                className="text-base"
                placeholder="e.g., Modern 2BR Apartment in Kilimani with Parking"
                {...field}
              />
            </FormControl>
            <FormDescription className="text-xs md:text-sm">
              Create an engaging title that highlights key features (
              {field.value?.length || 0}/100)
            </FormDescription>
            <FormMessage />

            {/* Title Quality Progress */}
            <div className="mt-2 space-y-1">
              <Progress className="h-2" value={titleQuality.score} />
              <p className="text-gray-500 text-xs">
                Quality:{" "}
                {titleQuality.score >= 80
                  ? "Excellent ✨"
                  : titleQuality.score >= 60
                    ? "Good 👍"
                    : "Needs Work 📝"}
              </p>
            </div>

            {/* Title Suggestions */}
            {titleQuality.suggestions.length > 0 && (
              <div className="mt-2 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-900 dark:bg-blue-950/20">
                <div className="flex items-start gap-2">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
                  <div className="flex-1 space-y-1">
                    <p className="font-medium text-blue-900 text-sm dark:text-blue-100">
                      Tips to improve your title:
                    </p>
                    <ul className="space-y-1 text-blue-700 text-xs dark:text-blue-300">
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

      {/* Property Type and Furnished Status */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base">Property Type *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="text-base">
                    <SelectValue placeholder="Select property type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="max-h-[300px]">
                  {Object.entries(PROPERTY_TYPE_LABELS).map(
                    ([value, { label, icon }]) => (
                      <SelectItem
                        className="text-base"
                        key={value}
                        value={value}
                      >
                        <div className="flex items-center gap-2">
                          <span>{icon}</span>
                          <span>{label}</span>
                        </div>
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="furnished"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base">Furnished Status *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="text-base">
                    <SelectValue placeholder="Select furnished status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {FURNISHED_OPTIONS.map((option) => (
                    <SelectItem
                      className="text-base"
                      key={option.value}
                      value={option.value}
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Description Field */}
      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center justify-between">
              <span className="text-base">Property Description *</span>
              <div className="flex items-center gap-2">
                <Button
                  className="h-7 text-xs"
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  <Sparkles className="mr-1 h-3 w-3" />
                  AI Generate
                </Button>
                <Badge
                  className={cn(
                    "text-xs",
                    getScoreColor(descriptionQuality.score)
                  )}
                  variant="outline"
                >
                  {descriptionQuality.score}%
                </Badge>
              </div>
            </FormLabel>
            <FormControl>
              <Textarea
                className="min-h-[120px] resize-y text-base md:min-h-[150px]"
                placeholder="Describe your property in detail. Include unique features, nearby amenities, and what makes it special..."
                {...field}
              />
            </FormControl>
            <FormDescription className="text-xs md:text-sm">
              Write a compelling description ({field.value?.length || 0}/2000
              characters)
            </FormDescription>
            <FormMessage />

            {/* Description Quality */}
            <div className="mt-2 space-y-1">
              <Progress className="h-2" value={descriptionQuality.score} />
              <p className="text-gray-500 text-xs">
                Quality:{" "}
                {descriptionQuality.score >= 80
                  ? "Excellent ✨"
                  : descriptionQuality.score >= 60
                    ? "Good 👍"
                    : "Needs Work 📝"}
              </p>
            </div>

            {/* Description Suggestions */}
            {descriptionQuality.suggestions.length > 0 && (
              <div className="mt-2 rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-900 dark:bg-green-950/20">
                <div className="flex items-start gap-2">
                  <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-green-600 dark:text-green-400" />
                  <div className="flex-1 space-y-1">
                    <p className="font-medium text-green-900 text-sm dark:text-green-100">
                      Tips to improve your description:
                    </p>
                    <ul className="space-y-1 text-green-700 text-xs dark:text-green-300">
                      {descriptionQuality.suggestions.map((suggestion) => (
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

      {/* Tags */}
      <div className="space-y-2">
        <FormLabel className="text-base">Tags (Optional)</FormLabel>
        <Input
          className="text-base"
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={handleAddTag}
          placeholder="Add tags (press Enter or comma to add)"
          value={tagInput}
        />
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Badge
                className="px-3 py-1 text-sm"
                key={tag}
                variant="secondary"
              >
                {tag}
                <button
                  className="ml-2 hover:text-destructive"
                  onClick={() => handleRemoveTag(tag)}
                  type="button"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
        <FormDescription className="text-xs md:text-sm">
          Add keywords to help tenants find your property (e.g., pet-friendly,
          gated, gym)
        </FormDescription>
      </div>
    </div>
  );
}
