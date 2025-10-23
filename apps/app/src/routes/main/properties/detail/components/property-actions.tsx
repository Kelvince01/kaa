/**
 * Property actions component - favorites, share, etc
 */
"use client";

import { Button } from "@kaa/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@kaa/ui/components/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@kaa/ui/components/tooltip";
import { cn } from "@kaa/ui/lib/utils";
import {
  Bookmark,
  Calendar,
  Flag,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Printer,
  Share2,
} from "lucide-react";
import { toast } from "sonner";
import { useTogglePropertyFavorite } from "@/modules/properties/property.mutations";
import type { Property } from "@/modules/properties/property.type";

type PropertyActionsProps = {
  property: Property;
  onContactLandlord?: () => void;
  className?: string;
};

export function PropertyActions({
  property,
  onContactLandlord,
  className,
}: PropertyActionsProps) {
  const toggleFavorite = useTogglePropertyFavorite();

  const handleFavoriteClick = async () => {
    try {
      await toggleFavorite.mutateAsync(property._id);
      toast.success(
        property.isFavorited ? "Removed from favorites" : "Added to favorites"
      );
    } catch (error) {
      toast.error("Failed to update favorites");
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: property.title,
      text: `Check out this ${property.type} in ${property.location?.address.town}`,
      url: window.location.href,
    };

    try {
      if (navigator.share && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        // Fallback to copying URL
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Property link copied to clipboard");
      }
    } catch (error) {
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Property link copied to clipboard");
      } catch (clipboardError) {
        toast.error("Failed to share property");
      }
    }
  };

  /**
   * Handle print action
   */
  const handlePrint = (): void => {
    window.print();
  };

  const handleSaveSearch = () => {
    // Implement save search functionality
    toast.info("Save search feature coming soon");
  };

  const handleScheduleViewing = () => {
    // Implement schedule viewing functionality
    toast.info("Schedule viewing feature coming soon");
  };

  const handleReportProperty = () => {
    // Implement report property functionality
    toast.info("Report property feature coming soon");
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <TooltipProvider>
        {/* Contact Landlord - Primary Action */}
        <div className="flex gap-2 md:hidden">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button className="flex-1" onClick={onContactLandlord} size="sm">
                <MessageCircle className="mr-1 h-4 w-4" />
                Contact
              </Button>
            </TooltipTrigger>
            <TooltipContent>Contact landlord</TooltipContent>
          </Tooltip>
        </div>

        {/* Desktop Actions */}
        <div className="hidden gap-2 md:flex">
          <Button onClick={onContactLandlord} size="sm" variant="default">
            <MessageCircle className="mr-2 h-4 w-4" />
            Contact Landlord
          </Button>

          <Button onClick={handleScheduleViewing} size="sm" variant="outline">
            <Calendar className="mr-2 h-4 w-4" />
            Schedule Viewing
          </Button>
        </div>

        {/* Favorite Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className="shrink-0"
              disabled={toggleFavorite.isPending}
              onClick={handleFavoriteClick}
              size="icon"
              variant="outline"
            >
              <Heart
                className={cn(
                  "h-4 w-4 transition-colors",
                  property.isFavorited && "fill-red-500 text-red-500"
                )}
              />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {property.isFavorited
              ? "Remove from favorites"
              : "Add to favorites"}
          </TooltipContent>
        </Tooltip>

        {/* Share Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className="shrink-0"
              onClick={handleShare}
              size="icon"
              variant="outline"
            >
              <Share2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Share property</TooltipContent>
        </Tooltip>

        {/* Print Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className="shrink-0"
              onClick={handlePrint}
              size="icon"
              variant="outline"
            >
              <Printer className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Print property</TooltipContent>
        </Tooltip>

        {/* More Actions Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="shrink-0" size="icon" variant="outline">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={handleSaveSearch}>
              <Bookmark className="mr-2 h-4 w-4" />
              Save Search
            </DropdownMenuItem>
            <DropdownMenuItem
              className="md:hidden"
              onClick={handleScheduleViewing}
            >
              <Calendar className="mr-2 h-4 w-4" />
              Schedule Viewing
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleReportProperty}>
              <Flag className="mr-2 h-4 w-4" />
              Report Property
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TooltipProvider>
    </div>
  );
}
