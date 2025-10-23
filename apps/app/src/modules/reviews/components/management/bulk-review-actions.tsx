"use client";

import { Alert, AlertDescription } from "@kaa/ui/components/alert";
import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import { Checkbox } from "@kaa/ui/components/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@kaa/ui/components/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@kaa/ui/components/dropdown-menu";
import { Label } from "@kaa/ui/components/label";
import { Textarea } from "@kaa/ui/components/textarea";
import { Check, Download, X } from "lucide-react";
import { useState } from "react";
import { useUpdateReview } from "../../review.queries";
import { useReviewStore } from "../../review.store";
import type { Review } from "../../review.type";

type BulkReviewActionsProps = {
  reviews: Review[];
  onReviewsUpdate?: () => void;
};

export function BulkReviewActions({
  reviews,
  onReviewsUpdate,
}: BulkReviewActionsProps) {
  const {
    selectedReviews,
    setSelectedReviews,
    toggleReviewSelection,
    clearSelectedReviews,
    hasSelectedReviews,
    selectedCount,
  } = useReviewStore();

  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  const updateReviewMutation = useUpdateReview();

  const selectedReviewsData = reviews.filter((review) =>
    selectedReviews.includes(review._id)
  );

  const handleSelectAll = () => {
    const allReviewIds = reviews.map((review) => review._id);
    const isAllSelected = allReviewIds.every((id) =>
      selectedReviews.includes(id)
    );

    if (isAllSelected) {
      clearSelectedReviews();
    } else {
      setSelectedReviews(allReviewIds);
    }
  };

  const handleBulkApprove = async () => {
    setBulkActionLoading(true);
    try {
      const promises = selectedReviews.map((reviewId) =>
        updateReviewMutation.mutateAsync({
          id: reviewId,
          data: { status: "approved" },
        })
      );
      await Promise.all(promises);
      clearSelectedReviews();
      onReviewsUpdate?.();
    } catch (error) {
      console.error("Error approving reviews:", error);
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkReject = async () => {
    if (!rejectionReason.trim()) return;

    setBulkActionLoading(true);
    try {
      const promises = selectedReviews.map((reviewId) =>
        updateReviewMutation.mutateAsync({
          id: reviewId,
          data: {
            status: "rejected",
            rejectionReason: rejectionReason.trim(),
          },
        })
      );
      await Promise.all(promises);
      clearSelectedReviews();
      setShowRejectDialog(false);
      setRejectionReason("");
      onReviewsUpdate?.();
    } catch (error) {
      console.error("Error rejecting reviews:", error);
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleExportSelected = () => {
    const exportData = selectedReviewsData.map((review) => ({
      id: review._id,
      rating: review.rating,
      title: review.title,
      comment: review.comment,
      reviewer:
        typeof review.reviewer === "object"
          ? review.reviewer?.name || review.reviewer?.email
          : review.reviewer,
      property:
        typeof review.property === "object"
          ? review.property?.title
          : review.property,
      status: review.status,
      createdAt: review.createdAt,
      isVerifiedStay: review.isVerifiedStay,
    }));

    const csvContent = [
      Object.keys(exportData[0] as object).join(","),
      ...exportData.map((row) =>
        Object.values(row)
          .map((value) =>
            typeof value === "string" && value.includes(",")
              ? `"${value}"`
              : value
          )
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `reviews-export-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const isAllSelected =
    reviews.length > 0 &&
    reviews.every((review) => selectedReviews.includes(review._id));
  const isIndeterminate = hasSelectedReviews() && !isAllSelected;

  return (
    <>
      <div className="flex items-center justify-between border-b bg-muted/50 p-4">
        <div className="flex items-center gap-4">
          <Checkbox
            aria-label="Select all reviews"
            checked={isAllSelected}
            onCheckedChange={handleSelectAll}
            ref={(ref) => {
              // TODO: fix typing
              if (ref) (ref as any).indeterminate = isIndeterminate;
            }}
          />

          <span className="text-sm">
            {hasSelectedReviews() ? (
              <>
                <Badge className="mr-2" variant="secondary">
                  {selectedCount()}
                </Badge>
                selected
              </>
            ) : (
              `${reviews.length} reviews`
            )}
          </span>
        </div>

        {hasSelectedReviews() && (
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline">
                  Bulk Actions
                  <Badge className="ml-2" variant="secondary">
                    {selectedCount()}
                  </Badge>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  disabled={bulkActionLoading}
                  onClick={handleBulkApprove}
                >
                  <Check className="mr-2 h-4 w-4" />
                  Approve Selected
                </DropdownMenuItem>

                <DropdownMenuItem
                  disabled={bulkActionLoading}
                  onClick={() => setShowRejectDialog(true)}
                >
                  <X className="mr-2 h-4 w-4" />
                  Reject Selected
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  disabled={bulkActionLoading}
                  onClick={handleExportSelected}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export Selected
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  disabled={bulkActionLoading}
                  onClick={clearSelectedReviews}
                >
                  Clear Selection
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              disabled={bulkActionLoading}
              onClick={clearSelectedReviews}
              size="sm"
              variant="outline"
            >
              Cancel
            </Button>
          </div>
        )}
      </div>

      {/* Individual Review Selection */}
      <div className="space-y-2">
        {reviews.map((review) => (
          <div
            className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${
              selectedReviews.includes(review._id)
                ? "border-primary bg-primary/5"
                : "hover:bg-muted/50"
            }`}
            key={review._id}
          >
            <Checkbox
              aria-label={`Select review by ${
                typeof review.reviewer === "object"
                  ? review.reviewer?.name || "Anonymous"
                  : "Anonymous"
              }`}
              checked={selectedReviews.includes(review._id)}
              onCheckedChange={() => toggleReviewSelection(review._id)}
            />

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h4 className="truncate font-medium text-sm">{review.title}</h4>
                <Badge
                  className="text-xs"
                  variant={
                    review.status === "approved"
                      ? "default"
                      : review.status === "rejected"
                        ? "destructive"
                        : "outline"
                  }
                >
                  {review.status}
                </Badge>
              </div>
              <p className="truncate text-muted-foreground text-sm">
                By{" "}
                {typeof review.reviewer === "object"
                  ? review.reviewer?.name || "Anonymous"
                  : "Anonymous"}{" "}
                • {review.rating} stars
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Bulk Reject Dialog */}
      <Dialog onOpenChange={setShowRejectDialog} open={showRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Selected Reviews</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Alert>
              <AlertDescription>
                You are about to reject {selectedCount()} review(s). This action
                cannot be undone.
              </AlertDescription>
            </Alert>

            <div>
              <Label htmlFor="bulk-rejection-reason">
                Rejection Reason (required)
              </Label>
              <Textarea
                id="bulk-rejection-reason"
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Please provide a reason for rejecting these reviews..."
                rows={3}
                value={rejectionReason}
              />
            </div>

            <div className="flex gap-2">
              <Button
                disabled={!rejectionReason.trim() || bulkActionLoading}
                onClick={handleBulkReject}
                variant="destructive"
              >
                {bulkActionLoading
                  ? "Rejecting..."
                  : `Reject ${selectedCount()} Reviews`}
              </Button>
              <Button
                disabled={bulkActionLoading}
                onClick={() => {
                  setShowRejectDialog(false);
                  setRejectionReason("");
                }}
                variant="outline"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
