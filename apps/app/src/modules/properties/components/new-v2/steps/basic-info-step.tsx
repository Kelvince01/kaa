"use client";

import { PropertyType } from "@kaa/models/types";
import { Badge } from "@kaa/ui/components/badge";
import {
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
import { X } from "lucide-react";
import { useState } from "react";
import { useFormContext } from "react-hook-form";
import type { PropertyFormData } from "../schema";

const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  [PropertyType.APARTMENT]: "Apartment",
  [PropertyType.HOUSE]: "House",
  [PropertyType.FLAT]: "Flat",
  [PropertyType.STUDIO]: "Studio",
  [PropertyType.BEDSITTER]: "Bedsitter",
  [PropertyType.VILLA]: "Villa",
  [PropertyType.PENTHOUSE]: "Penthouse",
  [PropertyType.MAISONETTE]: "Maisonette",
  [PropertyType.LAND]: "Land",
  [PropertyType.SHOP]: "Shop",
  [PropertyType.OFFICE]: "Office",
  [PropertyType.WAREHOUSE]: "Warehouse",
  [PropertyType.COMMERCIAL]: "Commercial",
  [PropertyType.OTHER]: "Other",
};

export function BasicInfoStep() {
  const form = useFormContext<PropertyFormData>();
  const [tagInput, setTagInput] = useState("");
  const tags = form.watch("tags") || [];

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const newTag = tagInput.trim().toLowerCase();
      if (newTag && !tags.includes(newTag)) {
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-2 font-semibold text-2xl text-foreground">
          Basic Information
        </h2>
        <p className="text-muted-foreground text-sm">
          Start by providing the essential details about your property
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel>Property Title *</FormLabel>
              <FormControl>
                <Input
                  className="text-base"
                  placeholder="e.g., Modern 2BR Apartment in Kilimani"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Create an engaging title that highlights key features (
                {field.value?.length || 0}/100)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel>Property Type *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="text-base">
                    <SelectValue placeholder="Select property type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.entries(PROPERTY_TYPE_LABELS).map(
                    ([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
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
          name="description"
          render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel>Property Description *</FormLabel>
              <FormControl>
                <Textarea
                  className="min-h-[150px] resize-y text-base"
                  placeholder="Describe your property in detail. Include unique features, nearby amenities, and what makes it special..."
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Provide a comprehensive description ({field.value?.length || 0}
                /2000 characters)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="md:col-span-2">
          <FormLabel>Tags (Optional)</FormLabel>
          <div className="space-y-2">
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
            <FormDescription>
              Add keywords to help tenants find your property (e.g.,
              pet-friendly, gated, furnished)
            </FormDescription>
          </div>
        </div>
      </div>
    </div>
  );
}
