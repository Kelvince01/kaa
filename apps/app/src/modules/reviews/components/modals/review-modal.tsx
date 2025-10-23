"use client";

import { Alert, AlertDescription } from "@kaa/ui/components/alert";
import { Button } from "@kaa/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@kaa/ui/components/dialog";
import type React from "react";
import { useEffect, useState } from "react";
import { useUpdateReview } from "../../review.queries";
import type { Review, ReviewUpdateInput } from "../../review.type";
import { CreateReviewForm } from "../forms/create-review-form";
import { ReviewFormFields } from "../forms/review-form-fields";

type ReviewModalProps = {
  isOpen: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  propertyId?: string;
  landlordId?: string;
  bookingId?: string;
  review?: Review;
  onSuccess?: () => void;
};

type EditFormData = {
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

export function ReviewModal({
  isOpen,
  onClose,
  mode,
  propertyId,
  landlordId,
  bookingId,
  review,
  onSuccess,
}: ReviewModalProps) {
  const [editFormData, setEditFormData] = useState<EditFormData>({
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
  const updateReviewMutation = useUpdateReview();

  // Initialize edit form data when review changes
  useEffect(() => {
    if (mode === "edit" && review) {
      setEditFormData({
        rating: review.rating,
        title: review.title,
        comment: review.comment,
        propertyRating: review.propertyRating || 0,
        landlordRating: review.landlordRating || 0,
        cleanliness: review.cleanliness || 0,
        location: review.location || 0,
        valueForMoney: review.valueForMoney || 0,
        images: review.images || [],
      });
    }
  }, [mode, review]);

  const validateEditForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (editFormData.rating === 0) {
      newErrors.rating = "Please provide an overall rating";
    }

    if (!editFormData.title.trim()) {
      newErrors.title = "Please provide a review title";
    } else if (editFormData.title.trim().length < 5) {
      newErrors.title = "Title must be at least 5 characters long";
    }

    if (!editFormData.comment.trim()) {
      newErrors.comment = "Please write a review comment";
    } else if (editFormData.comment.trim().length < 20) {
      newErrors.comment = "Comment must be at least 20 characters long";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!(review && validateEditForm())) {
      return;
    }

    const updateData: ReviewUpdateInput = {
      rating: editFormData.rating,
      title: editFormData.title.trim(),
      comment: editFormData.comment.trim(),
      images: editFormData.images,
    };

    try {
      await updateReviewMutation.mutateAsync({
        id: review._id,
        data: updateData,
      });
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Error updating review:", error);
    }
  };

  const handleEditFormDataChange = (data: Partial<EditFormData>) => {
    setEditFormData((prev) => ({ ...prev, ...data }));

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
    // TODO: Implement image upload to your storage service
    // This is a placeholder implementation
    const uploadedImages = Array.from(files).map((file, index) => ({
      url: URL.createObjectURL(file), // Replace with actual upload URL
      caption: `Image ${editFormData.images.length + index + 1}`,
    }));

    setEditFormData((prev) => ({
      ...prev,
      images: [...prev.images, ...uploadedImages].slice(0, 5),
    }));
  };

  const handleImageRemove = (index: number) => {
    setEditFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleClose = () => {
    if (!updateReviewMutation.isPending) {
      onClose();
      // Reset form data when closing
      if (mode === "edit" && review) {
        setEditFormData({
          rating: review.rating,
          title: review.title,
          comment: review.comment,
          propertyRating: review.propertyRating || 0,
          landlordRating: review.landlordRating || 0,
          cleanliness: review.cleanliness || 0,
          location: review.location || 0,
          valueForMoney: review.valueForMoney || 0,
          images: review.images || [],
        });
      }
      setErrors({});
    }
  };

  const getModalTitle = () => {
    switch (mode) {
      case "create":
        return "Write a Review";
      case "edit":
        return "Edit Review";
      default:
        return "Review";
    }
  };

  return (
    <Dialog onOpenChange={handleClose} open={isOpen}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{getModalTitle()}</DialogTitle>
        </DialogHeader>

        {mode === "create" && propertyId && landlordId ? (
          <CreateReviewForm
            bookingId={bookingId}
            className="border-0 shadow-none"
            landlordId={landlordId}
            onCancel={handleClose}
            onSuccess={() => {
              onSuccess?.();
              onClose();
            }}
            property={propertyId}
          />
        ) : mode === "edit" && review ? (
          <form className="space-y-6" onSubmit={handleEditSubmit}>
            {updateReviewMutation.error && (
              <Alert variant="destructive">
                <AlertDescription>
                  Failed to update review. Please try again.
                </AlertDescription>
              </Alert>
            )}

            <ReviewFormFields
              allowImages
              data={editFormData}
              disabled={updateReviewMutation.isPending}
              errors={errors}
              onChange={handleEditFormDataChange}
              onImageRemove={handleImageRemove}
              onImageUpload={handleImageUpload}
              showDetailedRatings
            />

            <div className="flex gap-3">
              <Button
                disabled={
                  updateReviewMutation.isPending ||
                  editFormData.rating === 0 ||
                  !editFormData.title.trim() ||
                  !editFormData.comment.trim()
                }
                type="submit"
              >
                {updateReviewMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>

              <Button
                disabled={updateReviewMutation.isPending}
                onClick={handleClose}
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <div className="py-8 text-center">
            <p className="text-muted-foreground">Invalid review data.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
