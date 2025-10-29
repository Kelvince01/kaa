/**
 * Moderation Panel Component
 * Interface for moderating reviews
 */

"use client";

import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import { Checkbox } from "@kaa/ui/components/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@kaa/ui/components/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@kaa/ui/components/tabs";
import { Textarea } from "@kaa/ui/components/textarea";
import { Check, EyeOff, Loader2, X } from "lucide-react";
import { useState } from "react";
import {
  useApproveReview,
  useBulkModerate,
  useHideReview,
  useRejectReview,
} from "../review.mutations";
import { useFlaggedReviews, usePendingReviews } from "../review.queries";
import { useReviewStore } from "../review.store";
import { ReviewCard } from "./review-card";

export const ModerationPanel = () => {
  const [activeTab, setActiveTab] = useState<"pending" | "flagged">("pending");
  const [moderationDialogOpen, setModerationDialogOpen] = useState(false);
  const [moderationAction, setModerationAction] = useState<
    "approve" | "reject" | "hide" | null
  >(null);
  const [moderationReason, setModerationReason] = useState("");
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null);

  const { selectedReviews, setSelectedReviews, clearSelection } =
    useReviewStore();

  const { data: pendingData, isLoading: pendingLoading } = usePendingReviews();
  const { data: flaggedData, isLoading: flaggedLoading } = useFlaggedReviews();

  const approveReview = useApproveReview();
  const rejectReview = useRejectReview();
  const hideReview = useHideReview();
  const bulkModerate = useBulkModerate();

  const currentData = activeTab === "pending" ? pendingData : flaggedData;
  const isLoading = activeTab === "pending" ? pendingLoading : flaggedLoading;

  const handleModerationAction = (
    action: "approve" | "reject" | "hide",
    reviewId: string
  ) => {
    setModerationAction(action);
    setSelectedReviewId(reviewId);
    setModerationDialogOpen(true);
  };

  const handleConfirmModeration = () => {
    if (!(selectedReviewId && moderationAction)) return;

    const data = {
      reviewId: selectedReviewId,
      action: moderationAction,
      reason: moderationReason,
    };

    switch (moderationAction) {
      case "approve":
        approveReview.mutate(data, {
          onSuccess: () => {
            setModerationDialogOpen(false);
            setModerationReason("");
          },
        });
        break;
      case "reject":
        rejectReview.mutate(data, {
          onSuccess: () => {
            setModerationDialogOpen(false);
            setModerationReason("");
          },
        });
        break;
      case "hide":
        hideReview.mutate(data, {
          onSuccess: () => {
            setModerationDialogOpen(false);
            setModerationReason("");
          },
        });
        break;
      default:
        break;
    }
  };

  const handleBulkAction = (action: "approve" | "reject" | "hide") => {
    if (selectedReviews.length === 0) return;

    bulkModerate.mutate(
      {
        reviewIds: selectedReviews,
        action,
        reason: `Bulk ${action}`,
      },
      {
        onSuccess: () => {
          clearSelection();
        },
      }
    );
  };

  const toggleReviewSelection = (reviewId: string) => {
    setSelectedReviews(
      selectedReviews.includes(reviewId)
        ? selectedReviews.filter((id) => id !== reviewId)
        : [...selectedReviews, reviewId]
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Review Moderation</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs onValueChange={(v) => setActiveTab(v as any)} value={activeTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger className="gap-2" value="pending">
                Pending
                {pendingData?.pagination.total && (
                  <Badge variant="secondary">
                    {pendingData.pagination.total}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger className="gap-2" value="flagged">
                Flagged
                {flaggedData?.pagination.total && (
                  <Badge variant="destructive">
                    {flaggedData.pagination.total}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Bulk Actions */}
            {selectedReviews.length > 0 && (
              <div className="mt-4 rounded-lg bg-muted p-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm">
                    {selectedReviews.length} review
                    {selectedReviews.length > 1 ? "s" : ""} selected
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      disabled={bulkModerate.isPending}
                      onClick={() => handleBulkAction("approve")}
                      size="sm"
                      variant="outline"
                    >
                      <Check className="mr-1 h-4 w-4" />
                      Approve All
                    </Button>
                    <Button
                      disabled={bulkModerate.isPending}
                      onClick={() => handleBulkAction("reject")}
                      size="sm"
                      variant="outline"
                    >
                      <X className="mr-1 h-4 w-4" />
                      Reject All
                    </Button>
                    <Button
                      disabled={bulkModerate.isPending}
                      onClick={() => handleBulkAction("hide")}
                      size="sm"
                      variant="outline"
                    >
                      <EyeOff className="mr-1 h-4 w-4" />
                      Hide All
                    </Button>
                    <Button onClick={clearSelection} size="sm" variant="ghost">
                      Clear
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <TabsContent className="mt-6" value="pending">
              {isLoading ? (
                <div className="py-8 text-center">
                  <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : !currentData?.reviews || currentData.reviews.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  No pending reviews
                </div>
              ) : (
                <div className="space-y-4">
                  {currentData.reviews.map((review: any) => (
                    <div className="flex gap-3" key={review._id}>
                      <Checkbox
                        checked={selectedReviews.includes(review._id)}
                        className="mt-6"
                        onCheckedChange={() =>
                          toggleReviewSelection(review._id)
                        }
                      />
                      <div className="flex-1">
                        <ReviewCard review={review} showActions={false} />
                        <div className="mt-3 flex items-center gap-2">
                          <Button
                            onClick={() =>
                              handleModerationAction("approve", review._id)
                            }
                            size="sm"
                            variant="default"
                          >
                            <Check className="mr-1 h-4 w-4" />
                            Approve
                          </Button>
                          <Button
                            onClick={() =>
                              handleModerationAction("reject", review._id)
                            }
                            size="sm"
                            variant="destructive"
                          >
                            <X className="mr-1 h-4 w-4" />
                            Reject
                          </Button>
                          <Button
                            onClick={() =>
                              handleModerationAction("hide", review._id)
                            }
                            size="sm"
                            variant="outline"
                          >
                            <EyeOff className="mr-1 h-4 w-4" />
                            Hide
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent className="mt-6" value="flagged">
              {isLoading ? (
                <div className="py-8 text-center">
                  <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : !currentData?.reviews || currentData.reviews.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  No flagged reviews
                </div>
              ) : (
                <div className="space-y-4">
                  {currentData.reviews.map((review: any) => (
                    <div className="flex gap-3" key={review._id}>
                      <Checkbox
                        checked={selectedReviews.includes(review._id)}
                        className="mt-6"
                        onCheckedChange={() =>
                          toggleReviewSelection(review._id)
                        }
                      />
                      <div className="flex-1">
                        <ReviewCard review={review} showActions={false} />
                        <div className="mt-3 flex items-center gap-2">
                          <Button
                            onClick={() =>
                              handleModerationAction("approve", review._id)
                            }
                            size="sm"
                            variant="default"
                          >
                            <Check className="mr-1 h-4 w-4" />
                            Approve
                          </Button>
                          <Button
                            onClick={() =>
                              handleModerationAction("reject", review._id)
                            }
                            size="sm"
                            variant="destructive"
                          >
                            <X className="mr-1 h-4 w-4" />
                            Reject
                          </Button>
                          <Button
                            onClick={() =>
                              handleModerationAction("hide", review._id)
                            }
                            size="sm"
                            variant="outline"
                          >
                            <EyeOff className="mr-1 h-4 w-4" />
                            Hide
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Moderation Confirmation Dialog */}
      <Dialog
        onOpenChange={setModerationDialogOpen}
        open={moderationDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {moderationAction === "approve" && "Approve Review"}
              {moderationAction === "reject" && "Reject Review"}
              {moderationAction === "hide" && "Hide Review"}
            </DialogTitle>
            <DialogDescription>
              {moderationAction === "approve" &&
                "This review will be published and visible to everyone."}
              {moderationAction === "reject" &&
                "This review will be rejected and the reviewer will be notified."}
              {moderationAction === "hide" &&
                "This review will be hidden from public view."}
            </DialogDescription>
          </DialogHeader>

          {(moderationAction === "reject" || moderationAction === "hide") && (
            <div className="space-y-2">
              <label
                className="font-medium text-sm"
                htmlFor="moderation-reason"
              >
                Reason (required for rejection/hiding)
              </label>
              <Textarea
                className="min-h-[100px]"
                id="moderation-reason"
                onChange={(e) => setModerationReason(e.target.value)}
                placeholder="Explain why you're taking this action..."
                value={moderationReason}
              />
            </div>
          )}

          <DialogFooter>
            <Button
              onClick={() => setModerationDialogOpen(false)}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              disabled={
                (moderationAction === "reject" ||
                  moderationAction === "hide") &&
                !moderationReason
              }
              onClick={handleConfirmModeration}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
