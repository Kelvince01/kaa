"use client";

import { Alert, AlertDescription } from "@kaa/ui/components/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@kaa/ui/components/avatar";
import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@kaa/ui/components/dialog";
import { Label } from "@kaa/ui/components/label";
import { Textarea } from "@kaa/ui/components/textarea";
import { formatDistanceToNow } from "date-fns";
import { MessageSquare, Star } from "lucide-react";
import type React from "react";
import { useState } from "react";
import type { Review } from "../../review.type";

type ReviewResponseModalProps = {
  isOpen: boolean;
  onClose: () => void;
  review: Review | null;
  onSaveResponse: (reviewId: string, response: string) => void;
  loading?: boolean;
};

export function ReviewResponseModal({
  isOpen,
  onClose,
  review,
  onSaveResponse,
  loading = false,
}: ReviewResponseModalProps) {
  const [response, setResponse] = useState("");
  const [error, setError] = useState("");

  if (!review) {
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!response.trim()) {
      setError("Please write a response");
      return;
    }

    if (response.trim().length < 10) {
      setError("Response must be at least 10 characters long");
      return;
    }

    setError("");
    onSaveResponse(review._id, response.trim());
  };

  const handleClose = () => {
    if (!loading) {
      setResponse("");
      setError("");
      onClose();
    }
  };

  const getInitials = (name: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const renderStars = (rating: number) =>
    Array.from({ length: 5 }).map((_, i) => (
      <Star
        className={`h-4 w-4 ${i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
        key={i.toString()}
      />
    ));

  const getUserName = () => {
    if (typeof review.reviewer === "object" && review.reviewer) {
      return review.reviewer.name || review.reviewer.email || "Anonymous";
    }
    return "Anonymous";
  };

  const getUserAvatar = () => {
    if (typeof review.reviewer === "object" && review.reviewer) {
      return review.reviewer.avatar;
    }
    return "";
  };

  return (
    <Dialog onOpenChange={handleClose} open={isOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Respond to Review
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Review Summary */}
          <div className="rounded-lg border p-4">
            <div className="flex items-start gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage alt={getUserName()} src={getUserAvatar()} />
                <AvatarFallback>{getInitials(getUserName())}</AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium">{getUserName()}</h4>
                  {review.isVerifiedStay && (
                    <Badge className="text-xs" variant="secondary">
                      Verified Stay
                    </Badge>
                  )}
                </div>

                <div className="mt-1 flex items-center gap-2">
                  <div className="flex items-center">
                    {renderStars(review.rating)}
                  </div>
                  <span className="text-muted-foreground text-sm">
                    {formatDistanceToNow(
                      new Date(review.createdAt || new Date()),
                      {
                        addSuffix: true,
                      }
                    )}
                  </span>
                </div>

                <h5 className="mt-2 font-medium">{review.title}</h5>
                <p className="mt-1 text-muted-foreground text-sm">
                  {review.comment.length > 150
                    ? `${review.comment.slice(0, 150)}...`
                    : review.comment}
                </p>
              </div>
            </div>
          </div>

          {/* Response Form */}
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <Label className="font-medium text-sm" htmlFor="response">
                Your Response <span className="text-red-500">*</span>
              </Label>
              <p className="mb-2 text-muted-foreground text-sm">
                Write a professional response to this review. This will be
                visible to all users.
              </p>
              <Textarea
                className="resize-none"
                disabled={loading}
                id="response"
                onChange={(e) => {
                  setResponse(e.target.value);
                  setError("");
                }}
                placeholder="Thank you for your review. We appreciate your feedback..."
                rows={5}
                value={response}
              />
              {error && (
                <p className="mt-1 text-destructive text-sm">{error}</p>
              )}
            </div>

            {/* Guidelines */}
            <div className="rounded-lg bg-blue-50 p-3">
              <h4 className="font-medium text-blue-900 text-sm">
                Response Guidelines
              </h4>
              <ul className="mt-1 list-inside list-disc text-blue-800 text-sm">
                <li>Be professional and courteous</li>
                <li>Address specific concerns raised in the review</li>
                <li>Avoid defensive language</li>
                <li>Thank the reviewer for their feedback</li>
                <li>Offer solutions if applicable</li>
              </ul>
            </div>

            {/* Character Count */}
            <div className="text-right">
              <span
                className={`text-sm ${
                  response.length > 500
                    ? "text-red-600"
                    : "text-muted-foreground"
                }`}
              >
                {response.length}/500 characters
              </span>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                disabled={
                  loading ||
                  !response.trim() ||
                  response.trim().length < 10 ||
                  response.length > 500
                }
                type="submit"
              >
                {loading ? "Posting Response..." : "Post Response"}
              </Button>

              <Button
                disabled={loading}
                onClick={handleClose}
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
            </div>
          </form>

          {/* Warning for existing response */}
          {review.response && (
            <Alert>
              <AlertDescription>
                This review already has a response. Posting a new response will
                replace the existing one.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
