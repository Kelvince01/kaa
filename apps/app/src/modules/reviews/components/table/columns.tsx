"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@kaa/ui/components/avatar";
import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import { Checkbox } from "@kaa/ui/components/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@kaa/ui/components/dropdown-menu";
import type { ColumnDef } from "@tanstack/react-table";
import { format, formatDistanceToNow } from "date-fns";
import {
  Edit2,
  Eye,
  Flag,
  MessageSquare,
  MoreHorizontal,
  Star,
  Trash2,
} from "lucide-react";
import { DataTableColumnHeader } from "@/components/ui/data-table";
import type { Review } from "../../review.type";

type ReviewTableActions = {
  onView?: (review: Review) => void;
  onEdit?: (review: Review) => void;
  onDelete?: (review: Review) => void;
  onRespond?: (review: Review) => void;
  onFlag?: (review: Review) => void;
  onApprove?: (review: Review) => void;
  onReject?: (review: Review) => void;
  canEdit?: boolean;
  canDelete?: boolean;
  canModerate?: boolean;
  canRespond?: boolean;
};

export const getReviewColumns = (
  actions: ReviewTableActions = {}
): ColumnDef<Review>[] => {
  const {
    onView,
    onEdit,
    onDelete,
    onRespond,
    onFlag,
    onApprove,
    onReject,
    canEdit = false,
    canDelete = false,
    canModerate = false,
    canRespond = false,
  } = actions;

  const getInitials = (name: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getUserName = (review: Review) => {
    if (typeof review.reviewer === "object" && review.reviewer) {
      return review.reviewer.name || review.reviewer.email || "Anonymous";
    }
    return "Anonymous";
  };

  const getUserAvatar = (review: Review) => {
    if (typeof review.reviewer === "object" && review.reviewer) {
      return review.reviewer.avatar;
    }
    return "";
  };

  const getPropertyName = (review: Review) => {
    if (typeof review.property === "object" && review.property) {
      return review.property.title || "Property";
    }
    return "Property";
  };

  const renderStars = (rating: number) => (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          className={`h-3 w-3 ${
            i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
          }`}
          key={i.toString()}
        />
      ))}
      <span className="ml-1 text-sm">{rating}</span>
    </div>
  );

  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          aria-label="Select all"
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          aria-label="Select row"
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "reviewer",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Reviewer" />
      ),
      cell: ({ row }) => {
        const review = row.original;
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage
                alt={getUserName(review)}
                src={getUserAvatar(review)}
              />
              <AvatarFallback className="text-xs">
                {getInitials(getUserName(review))}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium text-sm">{getUserName(review)}</div>
              {review.isVerifiedStay && (
                <Badge className="text-xs" variant="secondary">
                  Verified
                </Badge>
              )}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "property",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Property" />
      ),
      cell: ({ row }) => {
        const review = row.original;
        return (
          <div className="max-w-[200px]">
            <div className="truncate font-medium text-sm">
              {getPropertyName(review)}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "rating",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Rating" />
      ),
      cell: ({ row }) => {
        const review = row.original;
        return renderStars(review.rating);
      },
    },
    {
      accessorKey: "title",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Review" />
      ),
      cell: ({ row }) => {
        const review = row.original;
        return (
          <div className="max-w-[300px]">
            <div className="truncate font-medium text-sm">{review.title}</div>
            <div className="truncate text-muted-foreground text-xs">
              {review.comment}
            </div>
            {review.images && review.images.length > 0 && (
              <Badge className="mt-1 text-xs" variant="outline">
                {review.images.length} photo
                {review.images.length !== 1 ? "s" : ""}
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => {
        const review = row.original;
        const statusConfig = {
          pending: { variant: "outline" as const, label: "Pending" },
          approved: { variant: "default" as const, label: "Approved" },
          rejected: { variant: "destructive" as const, label: "Rejected" },
        };

        const config =
          statusConfig[review.status as keyof typeof statusConfig] ||
          statusConfig.pending;

        return (
          <div className="flex flex-col gap-1">
            <Badge className="w-fit" variant={config.variant}>
              {config.label}
            </Badge>
            {review.response && (
              <Badge className="w-fit text-xs" variant="secondary">
                <MessageSquare className="mr-1 h-3 w-3" />
                Responded
              </Badge>
            )}
          </div>
        );
      },
      filterFn: (row, id, value) => value.includes(row.getValue(id)),
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Date" />
      ),
      cell: ({ row }) => {
        const review = row.original;
        const date = new Date(review.createdAt || new Date());
        return (
          <div className="text-sm">
            <div>{format(date, "MMM d, yyyy")}</div>
            <div className="text-muted-foreground text-xs">
              {formatDistanceToNow(date, { addSuffix: true })}
            </div>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const review = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="h-8 w-8 p-0" variant="ghost">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onView && (
                <DropdownMenuItem onClick={() => onView(review)}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
              )}

              {canEdit && onEdit && (
                <DropdownMenuItem onClick={() => onEdit(review)}>
                  <Edit2 className="mr-2 h-4 w-4" />
                  Edit Review
                </DropdownMenuItem>
              )}

              {canRespond && onRespond && !review.response && (
                <DropdownMenuItem onClick={() => onRespond(review)}>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Add Response
                </DropdownMenuItem>
              )}

              {canRespond && onRespond && review.response && (
                <DropdownMenuItem onClick={() => onRespond(review)}>
                  <Edit2 className="mr-2 h-4 w-4" />
                  Edit Response
                </DropdownMenuItem>
              )}

              {onFlag && (
                <DropdownMenuItem onClick={() => onFlag(review)}>
                  <Flag className="mr-2 h-4 w-4" />
                  Flag Review
                </DropdownMenuItem>
              )}

              {canModerate && review.status === "pending" && (
                <>
                  <DropdownMenuSeparator />
                  {onApprove && (
                    <DropdownMenuItem
                      className="text-green-600"
                      onClick={() => onApprove(review)}
                    >
                      <Star className="mr-2 h-4 w-4" />
                      Approve
                    </DropdownMenuItem>
                  )}
                  {onReject && (
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={() => onReject(review)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Reject
                    </DropdownMenuItem>
                  )}
                </>
              )}

              {canDelete && onDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-red-600"
                    onClick={() => onDelete(review)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
};
