"use client";

import { Alert, AlertDescription } from "@kaa/ui/components/alert";
import { Button } from "@kaa/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import type React from "react";
import { useState } from "react";
import type { User } from "@/modules/users/user.type";
import { useCreateReview } from "../../review.queries";
import type { ReviewCreateInput } from "../../review.type";
import { ReviewFormFields } from "./review-form-fields";

type CreateReviewFormProps = {
  property: string;
  landlordId: string;
  bookingId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  className?: string;
};

type FormData = {
  rating: number;
  title: string;
  comment: string;
  propertyRating: number;
  landlordRating: number;
  cleanliness: number;
  location: number;
  valueForMoney: number;
  images: Array<{
    url: string;
    caption?: string;
  }>;
};

export function CreateReviewForm({
  property,
  landlordId,
  bookingId,
  onSuccess,
  onCancel,
  className,
}: CreateReviewFormProps) {
  const [formData, setFormData] = useState<FormData>({
    rating: 0,
    title: "",
    comment: "",
    propertyRating: 0,
    landlordRating: 0,
    cleanliness: 0,
    location: 0,
    valueForMoney: 0,
    images: [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploadingImages, setUploadingImages] = useState(false);

  const createReviewMutation = useCreateReview();

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (formData.rating === 0) {
      newErrors.rating = "Please provide an overall rating";
    }

    if (!formData.title.trim()) {
      newErrors.title = "Please provide a review title";
    } else if (formData.title.trim().length < 5) {
      newErrors.title = "Title must be at least 5 characters long";
    }

    if (!formData.comment.trim()) {
      newErrors.comment = "Please write a review comment";
    } else if (formData.comment.trim().length < 20) {
      newErrors.comment = "Comment must be at least 20 characters long";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    console.log(landlordId);

    const reviewData: ReviewCreateInput = {
      property,
      landlord:
        typeof landlordId === "string" ? landlordId : (landlordId as User).id,
      rating: formData.rating,
      title: formData.title.trim(),
      comment: formData.comment.trim(),
      propertyRating: formData.propertyRating,
      landlordRating: formData.landlordRating,
      cleanliness: formData.cleanliness,
      location: formData.location,
      valueForMoney: formData.valueForMoney,
      isVerifiedStay: !!bookingId,
      booking: bookingId,
      images: formData.images,
    };

    try {
      await createReviewMutation.mutateAsync(reviewData);
      onSuccess?.();
    } catch (error) {
      console.error("Error creating review:", error);
    }
  };

  const handleFormDataChange = (data: Partial<FormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));

    // Clear errors for changed fields
    const changedFields = Object.keys(data);
    setErrors((prev) => {
      const newErrors = { ...prev };
      for (const field of changedFields) {
        delete newErrors[field];
      }
      return newErrors;
    });
  };

  const handleImageUpload = (files: FileList) => {
    setUploadingImages(true);

    try {
      // TODO: Implement image upload to your storage service
      // This is a placeholder implementation
      const uploadedImages = Array.from(files).map((file, index) => ({
        url: URL.createObjectURL(file), // Replace with actual upload URL
        caption: `Image ${formData.images.length + index + 1}`,
      }));

      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, ...uploadedImages].slice(0, 5),
      }));
    } catch (error) {
      console.error("Error uploading images:", error);
    } finally {
      setUploadingImages(false);
    }
  };

  const handleImageRemove = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Write a Review</CardTitle>
      </CardHeader>

      <CardContent>
        <form className="space-y-6" onSubmit={handleSubmit}>
          {createReviewMutation.error && (
            <Alert variant="destructive">
              <AlertDescription>
                Failed to submit review. Please try again.
              </AlertDescription>
            </Alert>
          )}

          <ReviewFormFields
            allowImages
            data={formData}
            disabled={createReviewMutation.isPending || uploadingImages}
            errors={errors}
            onChange={handleFormDataChange}
            onImageRemove={handleImageRemove}
            onImageUpload={handleImageUpload}
            showDetailedRatings
          />

          <div className="flex gap-3">
            <Button
              disabled={
                createReviewMutation.isPending ||
                uploadingImages ||
                formData.rating === 0 ||
                !formData.title.trim() ||
                !formData.comment.trim()
              }
              type="submit"
            >
              {createReviewMutation.isPending
                ? "Submitting..."
                : "Submit Review"}
            </Button>

            {onCancel && (
              <Button
                disabled={createReviewMutation.isPending}
                onClick={onCancel}
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
