"use client";

import { Button } from "@kaa/ui/components/button";
import { Input } from "@kaa/ui/components/input";
import { Label } from "@kaa/ui/components/label";
import { Textarea } from "@kaa/ui/components/textarea";
import { Upload, X } from "lucide-react";
import type React from "react";
import { ReviewRatingInput } from "./review-rating-input";

type ReviewFormData = {
  rating: number;
  title: string;
  comment: string;
  propertyRating?: number;
  landlordRating?: number;
  cleanliness?: number;
  location?: number;
  valueForMoney?: number;
  images?: Array<{
    url: string;
    caption?: string;
  }>;
};

type ReviewFormFieldsProps = {
  data: ReviewFormData;
  onChange: (data: Partial<ReviewFormData>) => void;
  errors?: Record<string, string>;
  showDetailedRatings?: boolean;
  allowImages?: boolean;
  onImageUpload?: (files: FileList) => void;
  onImageRemove?: (index: number) => void;
  disabled?: boolean;
};

export function ReviewFormFields({
  data,
  onChange,
  errors = {},
  showDetailedRatings = true,
  allowImages = true,
  onImageUpload,
  onImageRemove,
  disabled = false,
}: ReviewFormFieldsProps) {
  const handleImageInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && onImageUpload) {
      onImageUpload(files);
    }
  };

  return (
    <div className="space-y-6">
      {/* Overall Rating */}
      <div>
        <ReviewRatingInput
          disabled={disabled}
          label="Overall Rating"
          onChange={(rating) => onChange({ rating })}
          required
          value={data.rating}
        />
        {errors.rating && (
          <p className="mt-1 text-destructive text-sm">{errors.rating}</p>
        )}
      </div>

      {/* Review Title */}
      <div>
        <Label className="font-medium text-sm" htmlFor="title">
          Review Title <span className="text-red-500">*</span>
        </Label>
        <Input
          className="mt-1"
          disabled={disabled}
          id="title"
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="Summarize your experience"
          value={data.title}
        />
        {errors.title && (
          <p className="mt-1 text-destructive text-sm">{errors.title}</p>
        )}
      </div>

      {/* Review Comment */}
      <div>
        <Label className="font-medium text-sm" htmlFor="comment">
          Your Review <span className="text-red-500">*</span>
        </Label>
        <Textarea
          className="mt-1"
          disabled={disabled}
          id="comment"
          onChange={(e) => onChange({ comment: e.target.value })}
          placeholder="Share your experience with this property..."
          rows={4}
          value={data.comment}
        />
        {errors.comment && (
          <p className="mt-1 text-destructive text-sm">{errors.comment}</p>
        )}
      </div>

      {/* Detailed Ratings */}
      {showDetailedRatings && (
        <div className="space-y-4">
          <h4 className="font-medium text-sm">Detailed Ratings</h4>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <ReviewRatingInput
                disabled={disabled}
                label="Property Quality"
                onChange={(propertyRating) => onChange({ propertyRating })}
                size="sm"
                value={data.propertyRating || 0}
              />
            </div>

            <div>
              <ReviewRatingInput
                disabled={disabled}
                label="Landlord Communication"
                onChange={(landlordRating) => onChange({ landlordRating })}
                size="sm"
                value={data.landlordRating || 0}
              />
            </div>

            <div>
              <ReviewRatingInput
                disabled={disabled}
                label="Cleanliness"
                onChange={(cleanliness) => onChange({ cleanliness })}
                size="sm"
                value={data.cleanliness || 0}
              />
            </div>

            <div>
              <ReviewRatingInput
                disabled={disabled}
                label="Location"
                onChange={(location) => onChange({ location })}
                size="sm"
                value={data.location || 0}
              />
            </div>

            <div className="sm:col-span-2">
              <ReviewRatingInput
                disabled={disabled}
                label="Value for Money"
                onChange={(valueForMoney) => onChange({ valueForMoney })}
                size="sm"
                value={data.valueForMoney || 0}
              />
            </div>
          </div>
        </div>
      )}

      {/* Image Upload */}
      {allowImages && (
        <div>
          <Label className="font-medium text-sm">Photos (Optional)</Label>
          <p className="mb-2 text-muted-foreground text-sm">
            Add up to 5 photos to support your review
          </p>

          {/* Existing Images */}
          {data.images && data.images.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {data.images.map((image, index) => (
                <div className="relative" key={image.url}>
                  {/** biome-ignore lint/performance/noImgElement: by author */}
                  {/** biome-ignore lint/nursery/useImageSize: by author */}
                  <img
                    alt={image.caption || `Review image ${index + 1}`}
                    className="h-20 w-20 rounded-lg object-cover"
                    src={image.url}
                  />
                  {onImageRemove && (
                    <Button
                      className="-right-2 -top-2 absolute h-6 w-6 rounded-full p-0"
                      disabled={disabled}
                      onClick={() => onImageRemove(index)}
                      size="sm"
                      type="button"
                      variant="destructive"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Upload Button */}
          {(!data.images || data.images.length < 5) && (
            <div className="flex items-center gap-2">
              <input
                accept="image/*"
                className="hidden"
                disabled={disabled}
                id="image-upload"
                multiple
                onChange={handleImageInput}
                type="file"
              />
              <Label
                className={`inline-flex cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground ${
                  disabled ? "pointer-events-none opacity-50" : ""
                }`}
                htmlFor="image-upload"
              >
                <Upload className="h-4 w-4" />
                Add Photos
              </Label>
            </div>
          )}

          {errors.images && (
            <p className="mt-1 text-destructive text-sm">{errors.images}</p>
          )}
        </div>
      )}
    </div>
  );
}
