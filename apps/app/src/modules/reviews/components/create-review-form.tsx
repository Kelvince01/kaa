/**
 * Create Review Form Component
 * Form for creating new reviews
 */

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { PropertyReviewCategory, UserReviewCategory } from "@kaa/models/types";
import { Button } from "@kaa/ui/components/button";
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
import { Switch } from "@kaa/ui/components/switch";
import { Textarea } from "@kaa/ui/components/textarea";
import { Loader2, Star } from "lucide-react";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useCreateReview } from "../review.mutations";
import {
  KENYA_COUNTIES,
  LANGUAGE_OPTIONS,
  type ReviewFormSchemaType,
  reviewFormSchema,
} from "../review.schema";

type CreateReviewFormProps = {
  targetId: string;
  type: string;
  applicationId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
};

// Category labels for display
const PROPERTY_CATEGORY_LABELS: Record<PropertyReviewCategory, string> = {
  [PropertyReviewCategory.LOCATION]: "Location",
  [PropertyReviewCategory.AMENITIES]: "Amenities",
  [PropertyReviewCategory.CONDITION]: "Property Condition",
  [PropertyReviewCategory.LANDLORD]: "Landlord",
  [PropertyReviewCategory.VALUE_FOR_MONEY]: "Value for Money",
  [PropertyReviewCategory.SAFETY]: "Safety",
  [PropertyReviewCategory.NEIGHBORS]: "Neighbors",
  [PropertyReviewCategory.MAINTENANCE]: "Maintenance",
};

const USER_CATEGORY_LABELS: Record<UserReviewCategory, string> = {
  [UserReviewCategory.COMMUNICATION]: "Communication",
  [UserReviewCategory.RELIABILITY]: "Reliability",
  [UserReviewCategory.CLEANLINESS]: "Cleanliness",
  [UserReviewCategory.RESPECT]: "Respect",
  [UserReviewCategory.PAYMENT_TIMELINESS]: "Payment Timeliness",
  [UserReviewCategory.PROPERTY_CARE]: "Property Care",
  [UserReviewCategory.RESPONSIVENESS]: "Responsiveness",
};

// Category Rating Component
type CategoryRatingProps = {
  category: string;
  label: string;
  currentRating: number;
  onRatingChange: (rating: number) => void;
};

const CategoryRating = ({
  category,
  label,
  currentRating,
  onRatingChange,
}: CategoryRatingProps) => {
  const [hoveredRating, setHoveredRating] = useState(0);

  return (
    <div className="space-y-2">
      <span className="font-medium text-sm">{label}</span>
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, i) => {
          const starValue = i + 1;
          return (
            <button
              className="transition-transform hover:scale-110 focus:outline-none"
              key={`${category}-star-${i.toString()}`}
              onClick={() => onRatingChange(starValue)}
              onMouseEnter={() => setHoveredRating(starValue)}
              onMouseLeave={() => setHoveredRating(0)}
              type="button"
            >
              <Star
                className={`h-5 w-5 ${
                  starValue <= (hoveredRating || currentRating)
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-300"
                }`}
              />
            </button>
          );
        })}
        {currentRating > 0 && (
          <span className="ml-2 text-muted-foreground text-xs">
            {currentRating}/5
          </span>
        )}
      </div>
    </div>
  );
};

export const CreateReviewForm = ({
  targetId,
  type,
  applicationId,
  onSuccess,
  onCancel,
}: CreateReviewFormProps) => {
  const [manualRating, setManualRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [categoryRatings, setCategoryRatings] = useState<
    Record<string, number>
  >({});
  const createReview = useCreateReview();

  // Determine which categories to show based on review type
  const isPropertyReview = type === "property";
  const categories = isPropertyReview
    ? Object.values(PropertyReviewCategory)
    : Object.values(UserReviewCategory);
  const categoryLabels = isPropertyReview
    ? PROPERTY_CATEGORY_LABELS
    : USER_CATEGORY_LABELS;

  // Calculate overall rating from category ratings
  const categoryRatingValues = Object.values(categoryRatings).filter(
    (rating) => rating > 0
  );
  const calculatedOverallRating =
    categoryRatingValues.length > 0
      ? Math.round(
          categoryRatingValues.reduce((sum, rating) => sum + rating, 0) /
            categoryRatingValues.length
        )
      : 0;

  // Use calculated rating if categories are rated, otherwise use manual rating
  const finalOverallRating = calculatedOverallRating || manualRating;

  const form = useForm<ReviewFormSchemaType>({
    resolver: zodResolver(reviewFormSchema),
    defaultValues: {
      type: type as any,
      targetId,
      applicationId,
      title: "",
      content: "",
      rating: {
        overall: 0,
        categories: {},
      },
      photos: [],
      videos: [],
      tags: [],
      language: "en",
      isAnonymous: false,
    },
  });

  // Update form value whenever finalOverallRating changes
  const { setValue } = form;

  // Sync rating with form state
  React.useEffect(() => {
    setValue("rating.overall", finalOverallRating);
    if (Object.keys(categoryRatings).length > 0) {
      setValue("rating.categories", categoryRatings);
    }
  }, [finalOverallRating, categoryRatings, setValue]);

  const onSubmit = (data: ReviewFormSchemaType) => {
    // Ensure rating data is included
    const submissionData = {
      ...data,
      rating: {
        overall: finalOverallRating,
        categories: categoryRatings,
      },
    };

    createReview.mutate(submissionData, {
      onSuccess: () => {
        form.reset();
        setManualRating(0);
        setCategoryRatings({});
        onSuccess?.();
      },
    });
  };
  console.log(form.getValues());
  console.log(form.formState.errors);
  return (
    <Form {...form}>
      <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
        {/* Overall Rating */}
        <FormField
          control={form.control}
          name="rating.overall"
          render={() => (
            <FormItem>
              <FormLabel>Overall Rating *</FormLabel>
              <FormControl>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {Array.from({ length: 5 }).map((_, i) => {
                      const starValue = i + 1;
                      const isDisabled = calculatedOverallRating > 0;
                      return (
                        <button
                          className={`transition-transform focus:outline-none ${
                            isDisabled
                              ? "cursor-not-allowed opacity-60"
                              : "hover:scale-110"
                          }`}
                          disabled={isDisabled}
                          key={`star-${i.toString()}`}
                          onClick={() =>
                            !isDisabled && setManualRating(starValue)
                          }
                          onMouseEnter={() =>
                            !isDisabled && setHoveredRating(starValue)
                          }
                          onMouseLeave={() =>
                            !isDisabled && setHoveredRating(0)
                          }
                          type="button"
                        >
                          <Star
                            className={`h-8 w-8 ${
                              starValue <= (hoveredRating || finalOverallRating)
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300"
                            }`}
                          />
                        </button>
                      );
                    })}
                    {finalOverallRating > 0 && (
                      <span className="ml-2 font-medium text-sm">
                        {finalOverallRating} / 5
                        {calculatedOverallRating > 0 && (
                          <span className="ml-2 text-muted-foreground text-xs">
                            (Auto-calculated)
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </FormControl>
              <FormDescription>
                {calculatedOverallRating > 0
                  ? "Automatically calculated from your category ratings below"
                  : "Rate your overall experience, or use detailed ratings below"}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Category Ratings */}
        <div className="space-y-4 rounded-lg border p-4">
          <div className="mb-2">
            <h3 className="font-medium text-sm">Detailed Ratings (Optional)</h3>
            <p className="text-muted-foreground text-xs">
              Rate specific aspects of your experience
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {categories.map((category) => (
              <CategoryRating
                category={category}
                currentRating={categoryRatings[category] || 0}
                key={category}
                label={categoryLabels[category as keyof typeof categoryLabels]}
                onRatingChange={(rating) =>
                  setCategoryRatings((prev) => ({
                    ...prev,
                    [category]: rating,
                  }))
                }
              />
            ))}
          </div>
        </div>

        {/* Title */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Review Title *</FormLabel>
              <FormControl>
                <Input placeholder="Summarize your experience" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Content */}
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Review Content *</FormLabel>
              <FormControl>
                <Textarea
                  className="min-h-[120px]"
                  placeholder="Tell us about your experience..."
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Minimum 10 characters, maximum 2000 characters
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 md:grid-cols-2">
          {/* Language */}
          <FormField
            control={form.control}
            name="language"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Language</FormLabel>
                <Select
                  defaultValue={field.value}
                  onValueChange={field.onChange}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {LANGUAGE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* County */}
          <FormField
            control={form.control}
            name="county"
            render={({ field }) => (
              <FormItem>
                <FormLabel>County</FormLabel>
                <Select
                  defaultValue={field.value}
                  onValueChange={field.onChange}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select county" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {KENYA_COUNTIES.map((county) => (
                      <SelectItem key={county} value={county}>
                        {county}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* City */}
        <FormField
          control={form.control}
          name="city"
          render={({ field }) => (
            <FormItem>
              <FormLabel>City/Town</FormLabel>
              <FormControl>
                <Input placeholder="Enter city or town" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Anonymous */}
        <FormField
          control={form.control}
          name="isAnonymous"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Post Anonymously</FormLabel>
                <FormDescription>
                  Your name will not be shown with this review
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          {onCancel && (
            <Button
              disabled={createReview.isPending}
              onClick={onCancel}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
          )}
          <Button
            disabled={createReview.isPending || finalOverallRating === 0}
            type="submit"
          >
            {createReview.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Submit Review
          </Button>
        </div>
      </form>
    </Form>
  );
};
