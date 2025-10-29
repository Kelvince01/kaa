/**
 * Review Card Component
 * Displays a single review with all details
 */

"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@kaa/ui/components/avatar";
import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@kaa/ui/components/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@kaa/ui/components/dropdown-menu";
import { formatDistanceToNow } from "date-fns";
import {
  CheckCircle,
  Flag,
  MessageCircle,
  MoreVertical,
  Pencil,
  Star,
  ThumbsDown,
  ThumbsUp,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import type { ReviewWithUser } from "../review.type";

type ReviewCardProps = {
  review: ReviewWithUser;
  currentUserId?: string;
  onEdit?: (review: ReviewWithUser) => void;
  onDelete?: (reviewId: string) => void;
  onFlag?: (reviewId: string) => void;
  onRespond?: (reviewId: string) => void;
  onHelpful?: (reviewId: string) => void;
  onNotHelpful?: (reviewId: string) => void;
  showActions?: boolean;
};

export const ReviewCard = ({
  review,
  currentUserId,
  onEdit,
  onDelete,
  onFlag,
  onRespond,
  onHelpful,
  onNotHelpful,
  showActions = true,
}: ReviewCardProps) => {
  const [imageError, setImageError] = useState<Set<string>>(new Set());
  const isOwner = currentUserId === review.reviewerId;

  const handleImageError = (url: string) => {
    setImageError((prev) => new Set(prev).add(url));
  };

  // Render star rating
  const renderStars = (rating: number) => (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          className={`h-4 w-4 ${
            i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
          }`}
          key={`star-${i.toString()}`}
        />
      ))}
      <span className="ml-2 font-medium text-sm">{rating.toFixed(1)}</span>
    </div>
  );

  // Get status badge color
  const getStatusColor = () => {
    switch (review.status) {
      case "approved":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "rejected":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "flagged":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "hidden":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Get sentiment badge
  const getSentimentBadge = () => {
    if (!review.sentiment) return null;

    const sentimentConfig = {
      positive: { label: "Positive", color: "bg-green-100 text-green-800" },
      negative: { label: "Negative", color: "bg-red-100 text-red-800" },
      neutral: { label: "Neutral", color: "bg-gray-100 text-gray-800" },
      mixed: { label: "Mixed", color: "bg-blue-100 text-blue-800" },
    };

    const config =
      sentimentConfig[review.sentiment as keyof typeof sentimentConfig];
    if (!config) return null;

    return (
      <Badge className={config.color} variant="secondary">
        {config.label}
      </Badge>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage
                alt={`${review.reviewer?.profile?.firstName} ${review.reviewer?.profile?.lastName}`}
                src={review.reviewer?.profile?.avatar}
              />
              <AvatarFallback>
                {review.reviewer?.profile?.firstName?.[0]}
                {review.reviewer?.profile?.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-sm">
                  {review.isAnonymous
                    ? "Anonymous User"
                    : `${review.reviewer?.profile?.firstName} ${review.reviewer?.profile?.lastName}`}
                </h4>
                {review.reviewer?.verification?.emailVerifiedAt && (
                  <CheckCircle className="h-4 w-4 text-blue-500" />
                )}
                {review.reviewer?.verification?.emailVerifiedAt && (
                  <Badge className="text-xs" variant="secondary">
                    Verified User
                  </Badge>
                )}
              </div>
              <div className="mt-1 flex items-center gap-2">
                {renderStars(review.rating.overall)}
              </div>
              <p className="mt-1 text-muted-foreground text-xs">
                {formatDistanceToNow(new Date(review.createdAt), {
                  addSuffix: true,
                })}
              </p>
            </div>
          </div>

          {showActions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="h-8 w-8" size="icon" variant="ghost">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {isOwner && onEdit && (
                  <>
                    <DropdownMenuItem onClick={() => onEdit(review)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit Review
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={() => onDelete?.(review._id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Review
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                {!isOwner && onFlag && (
                  <DropdownMenuItem onClick={() => onFlag(review._id)}>
                    <Flag className="mr-2 h-4 w-4" />
                    Flag Review
                  </DropdownMenuItem>
                )}
                {onRespond && (
                  <DropdownMenuItem onClick={() => onRespond(review._id)}>
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Respond
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <div className="mt-3 flex items-center gap-2">
          <Badge className={getStatusColor()} variant="outline">
            {review.status}
          </Badge>
          {getSentimentBadge()}
          {review.language === "sw" && (
            <Badge variant="secondary">Swahili</Badge>
          )}
          {review.county && <Badge variant="outline">{review.county}</Badge>}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {review.title && (
          <h3 className="font-semibold text-lg">{review.title}</h3>
        )}
        <p className="whitespace-pre-wrap text-muted-foreground text-sm leading-relaxed">
          {review.content}
        </p>

        {/* Photos */}
        {review.photos && review.photos.length > 0 && (
          <div className="mt-3 grid grid-cols-3 gap-2">
            {review.photos
              .filter((photo: string) => !imageError.has(photo))
              .map((photo: string) => (
                <div
                  className="relative h-24 w-full overflow-hidden rounded-md"
                  key={photo}
                >
                  <Image
                    alt="Review attachment"
                    className="object-cover"
                    fill
                    onError={() => handleImageError(photo)}
                    src={photo}
                  />
                </div>
              ))}
          </div>
        )}

        {/* Tags */}
        {review.tags && review.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {review.tags.map((tag: string, index: number) => (
              <Badge
                className="text-xs"
                key={`tag-${index.toString()}`}
                variant="secondary"
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Response */}
        {review.response && (
          <Card className="bg-muted/50">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start gap-2">
                <MessageCircle className="mt-1 h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="mb-1 font-medium text-muted-foreground text-xs">
                    Response from owner
                  </p>
                  <p className="text-sm">{review.response.content}</p>
                  <p className="mt-2 text-muted-foreground text-xs">
                    {formatDistanceToNow(new Date(review.response.createdAt), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>

      <CardFooter className="flex items-center justify-between border-t pt-3">
        <div className="flex items-center gap-4">
          <Button
            className="gap-2"
            onClick={() => onHelpful?.(review._id)}
            size="sm"
            variant="ghost"
          >
            <ThumbsUp className="h-4 w-4" />
            <span className="text-xs">
              Helpful ({review.helpfulCount || 0})
            </span>
          </Button>
          <Button
            className="gap-2"
            onClick={() => onNotHelpful?.(review._id)}
            size="sm"
            variant="ghost"
          >
            <ThumbsDown className="h-4 w-4" />
            <span className="text-xs">
              Not Helpful ({review.notHelpfulCount || 0})
            </span>
          </Button>
        </div>

        {review.flagCount > 0 && (
          <Badge className="gap-1" variant="destructive">
            <Flag className="h-3 w-3" />
            {review.flagCount} flag{review.flagCount > 1 ? "s" : ""}
          </Badge>
        )}
      </CardFooter>
    </Card>
  );
};
