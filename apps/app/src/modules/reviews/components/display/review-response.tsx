"use client";

import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import { Card, CardContent } from "@kaa/ui/components/card";
import { Textarea } from "@kaa/ui/components/textarea";
import { formatDistanceToNow } from "date-fns";
import { CheckCircle, Edit2, MessageSquare, Trash2 } from "lucide-react";
import { useState } from "react";
import type { Review } from "../../review.type";

type ReviewResponseProps = {
  review: Review;
  onSaveResponse?: (reviewId: string, response: string) => void;
  onEditResponse?: (reviewId: string, response: string) => void;
  onDeleteResponse?: (reviewId: string) => void;
  canManageResponse?: boolean;
  loading?: boolean;
};

export function ReviewResponse({
  review,
  onSaveResponse,
  onEditResponse,
  onDeleteResponse,
  canManageResponse = false,
  loading = false,
}: ReviewResponseProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [responseText, setResponseText] = useState(
    review.response?.comment || ""
  );

  const handleSave = () => {
    if (!responseText.trim()) return;

    if (review.response && onEditResponse) {
      onEditResponse(review._id, responseText);
    } else if (onSaveResponse) {
      onSaveResponse(review._id, responseText);
    }

    setIsEditing(false);
    setIsAdding(false);
  };

  const handleCancel = () => {
    setResponseText(review.response?.comment || "");
    setIsEditing(false);
    setIsAdding(false);
  };

  const handleDelete = () => {
    if (onDeleteResponse) {
      onDeleteResponse(review._id);
    }
  };

  // If there's no response and user can't manage, don't show anything
  if (!(review.response || canManageResponse)) {
    return null;
  }

  // If there's no response but user can manage, show add response option
  if (!review.response && canManageResponse) {
    if (!isAdding) {
      return (
        <div className="mt-4">
          <Button
            className="text-xs"
            onClick={() => setIsAdding(true)}
            size="sm"
            variant="outline"
          >
            <MessageSquare className="mr-1 h-3 w-3" />
            Add Response
          </Button>
        </div>
      );
    }

    return (
      <Card className="mt-4 border border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="mb-2 flex items-center gap-2">
            <Badge className="text-xs" variant="outline">
              Add Response
            </Badge>
          </div>
          <Textarea
            className="mb-3 bg-white"
            onChange={(e) => setResponseText(e.target.value)}
            placeholder="Write your response to this review..."
            rows={3}
            value={responseText}
          />
          <div className="flex gap-2">
            <Button
              disabled={!responseText.trim() || loading}
              onClick={handleSave}
              size="sm"
            >
              {loading ? "Saving..." : "Save Response"}
            </Button>
            <Button onClick={handleCancel} size="sm" variant="outline">
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show existing response
  if (review.response && !isEditing) {
    return (
      <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge className="text-xs" variant="outline">
              <CheckCircle className="mr-1 h-3 w-3" />
              Response from landlord
            </Badge>
            <span className="text-muted-foreground text-xs">
              {formatDistanceToNow(new Date(review.response.createdAt), {
                addSuffix: true,
              })}
            </span>
          </div>
          {canManageResponse && (
            <div className="flex gap-1">
              <Button
                className="h-6 w-6 p-0"
                onClick={() => {
                  setResponseText(review.response?.comment ?? "");
                  setIsEditing(true);
                }}
                size="sm"
                variant="ghost"
              >
                <Edit2 className="h-3 w-3" />
              </Button>
              <Button
                className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                onClick={handleDelete}
                size="sm"
                variant="ghost"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
        <p className="text-sm">{review.response.comment}</p>
      </div>
    );
  }

  // Show editing mode
  if (isEditing) {
    return (
      <Card className="mt-4 border border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="mb-2 flex items-center gap-2">
            <Badge className="text-xs" variant="outline">
              Edit Response
            </Badge>
          </div>
          <Textarea
            className="mb-3 bg-white"
            onChange={(e) => setResponseText(e.target.value)}
            placeholder="Edit your response..."
            rows={3}
            value={responseText}
          />
          <div className="flex gap-2">
            <Button
              disabled={!responseText.trim() || loading}
              onClick={handleSave}
              size="sm"
            >
              {loading ? "Saving..." : "Save Changes"}
            </Button>
            <Button onClick={handleCancel} size="sm" variant="outline">
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}
