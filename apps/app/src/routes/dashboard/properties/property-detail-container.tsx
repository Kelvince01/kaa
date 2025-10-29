"use client";

import { Alert, AlertDescription } from "@kaa/ui/components/alert";
import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@kaa/ui/components/dropdown-menu";
import { Skeleton } from "@kaa/ui/components/skeleton";
import {
  AlertCircle,
  Bath,
  Bed,
  Car,
  DollarSign,
  Edit,
  Eye,
  Heart,
  Home,
  MapPin,
  Maximize,
  MoreVertical,
  Star,
  Trash,
  TrendingUp,
  Users,
} from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import {
  useDeleteProperty,
  useTogglePropertyFavorite,
  useTogglePropertyFeatured,
  useUpdatePropertyStatus,
} from "@/modules/properties/property.mutations";
import { useProperty } from "@/modules/properties/property.queries";
import { formatCurrency } from "@/shared/utils/format.util";

type PropertyDetailContainerProps = {
  propertyId: string;
};

export function PropertyDetailContainer({
  propertyId,
}: PropertyDetailContainerProps) {
  const { data: property, isLoading, error, refetch } = useProperty(propertyId);
  const { mutate: deleteProperty, isPending: isDeleting } = useDeleteProperty();
  const { mutate: updateStatus, isPending: isUpdatingStatus } =
    useUpdatePropertyStatus();
  const { mutate: toggleFeatured, isPending: isTogglingFeatured } =
    useTogglePropertyFeatured();
  const { mutate: toggleFavorite, isPending: isTogglingFavorite } =
    useTogglePropertyFavorite();

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-64 w-full" />
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  // Error state
  if (error || !property) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load property details. Please try again.
        </AlertDescription>
      </Alert>
    );
  }

  const handleDelete = () => {
    // biome-ignore lint/suspicious/noAlert: user confirmation needed
    if (confirm("Are you sure you want to delete this property?")) {
      deleteProperty(propertyId, {
        onSuccess: () => {
          toast.success("Property deleted successfully");
          window.location.href = "/dashboard/properties";
        },
        onError: () => {
          toast.error("Failed to delete property");
        },
      });
    }
  };

  const handleStatusChange = (status: string) => {
    updateStatus(
      { id: propertyId, status },
      {
        onSuccess: () => {
          toast.success(`Property status updated to ${status}`);
          refetch();
        },
        onError: () => {
          toast.error("Failed to update property status");
        },
      }
    );
  };

  const handleToggleFeatured = () => {
    toggleFeatured(
      { id: propertyId, featured: !property.featured },
      {
        onSuccess: () => {
          toast.success(
            property.featured
              ? "Property removed from featured"
              : "Property added to featured"
          );
          refetch();
        },
        onError: () => {
          toast.error("Failed to toggle featured status");
        },
      }
    );
  };

  const handleToggleFavorite = () => {
    toggleFavorite(propertyId, {
      onSuccess: () => {
        toast.success(
          property.isFavorited ? "Removed from favorites" : "Added to favorites"
        );
        refetch();
      },
      onError: () => {
        toast.error("Failed to toggle favorite");
      },
    });
  };

  const statusVariants: Record<string, string> = {
    available: "bg-green-100 text-green-800",
    occupied: "bg-blue-100 text-blue-800",
    maintenance: "bg-yellow-100 text-yellow-800",
    unavailable: "bg-gray-100 text-gray-800",
  };

  const keyFeatures = [
    ...(property.specifications.bedrooms
      ? [
          {
            icon: Bed,
            label: `${property.specifications.bedrooms} ${property.specifications.bedrooms === 1 ? "Bedroom" : "Bedrooms"}`,
          },
        ]
      : []),
    ...(property.specifications.bathrooms
      ? [
          {
            icon: Bath,
            label: `${property.specifications.bathrooms} ${property.specifications.bathrooms === 1 ? "Bathroom" : "Bathrooms"}`,
          },
        ]
      : []),
    ...(property.specifications.totalArea
      ? [
          {
            icon: Maximize,
            label: `${property.specifications.totalArea} sqft`,
          },
        ]
      : []),
    ...(property.amenities.parking
      ? [{ icon: Car, label: "Parking Available" }]
      : []),
  ];

  const mainImage = property.media.images.find((img) => img.isPrimary);

  return (
    <div className="space-y-6">
      {/* Property Header Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-6 md:flex-row">
            {/* Property Image */}
            {mainImage && (
              <div className="relative h-48 w-full overflow-hidden rounded-lg md:h-64 md:w-64">
                <Image
                  alt={property.title}
                  className="h-full w-full object-cover"
                  fill
                  src={mainImage.url}
                />
                {property.featured && (
                  <Badge className="absolute top-2 right-2 bg-yellow-500">
                    <Star className="mr-1 h-3 w-3" />
                    Featured
                  </Badge>
                )}
              </div>
            )}

            {/* Property Info */}
            <div className="flex-1 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <h1 className="font-bold text-2xl">{property.title}</h1>
                    <Badge
                      className={statusVariants[property.status] || ""}
                      variant="outline"
                    >
                      {property.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span className="text-sm">
                      {property.location.address.line1},{" "}
                      {property.location.address.town},{" "}
                      {property.location.county}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Home className="h-4 w-4" />
                    <span className="text-sm capitalize">{property.type}</span>
                  </div>
                </div>

                {/* Actions Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="icon" variant="ghost">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => {
                        window.location.href = `/dashboard/properties/${propertyId}/edit`;
                      }}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Property
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      disabled={isTogglingFeatured}
                      onClick={handleToggleFeatured}
                    >
                      <Star className="mr-2 h-4 w-4" />
                      {property.featured
                        ? "Remove from Featured"
                        : "Mark as Featured"}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      disabled={isTogglingFavorite}
                      onClick={handleToggleFavorite}
                    >
                      <Heart className="mr-2 h-4 w-4" />
                      {property.isFavorited
                        ? "Remove from Favorites"
                        : "Add to Favorites"}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => handleStatusChange("available")}
                    >
                      Set as Available
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleStatusChange("occupied")}
                    >
                      Set as Occupied
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleStatusChange("maintenance")}
                    >
                      Set as Maintenance
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive"
                      disabled={isDeleting}
                      onClick={handleDelete}
                    >
                      <Trash className="mr-2 h-4 w-4" />
                      Delete Property
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Pricing */}
              <div className="flex items-baseline gap-2">
                <span className="font-bold text-3xl text-primary">
                  {formatCurrency(
                    property.pricing.rent,
                    property.pricing.currency
                  )}
                </span>
                <span className="text-muted-foreground text-sm">
                  /{property.pricing.paymentFrequency}
                </span>
              </div>

              {/* Key Features */}
              <div className="flex flex-wrap gap-4">
                {keyFeatures.map((feature) => (
                  <div
                    className="flex items-center gap-2 text-muted-foreground"
                    key={feature.label}
                  >
                    <feature.icon className="h-4 w-4" />
                    <span className="text-sm">{feature.label}</span>
                  </div>
                ))}
              </div>

              {/* Description */}
              <p className="line-clamp-2 text-muted-foreground text-sm">
                {property.description}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              {property.stats.views || 0}
            </div>
            <p className="text-muted-foreground text-xs">Property views</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Inquiries</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              {property.stats.inquiries || 0}
            </div>
            <p className="text-muted-foreground text-xs">Total inquiries</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              {property.stats.averageRating?.toFixed(1) || "N/A"}
            </div>
            <p className="text-muted-foreground text-xs">
              {property.stats.totalReviews || 0} reviews
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Applications</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              {property.stats.applications || 0}
            </div>
            <p className="text-muted-foreground text-xs">Total applications</p>
          </CardContent>
        </Card>
      </div>

      {/* Additional Details */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Location Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Location Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">County:</span>
                <p className="font-medium">{property.location.county}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Town:</span>
                <p className="font-medium">{property.location.address.town}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Postal Code:</span>
                <p className="font-medium">
                  {property.location.address.postalCode}
                </p>
              </div>
              {property.location.constituency && (
                <div>
                  <span className="text-muted-foreground">Constituency:</span>
                  <p className="font-medium">
                    {property.location.constituency}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pricing Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Pricing Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Rent:</span>
                <p className="font-medium">
                  {formatCurrency(
                    property.pricing.rent,
                    property.pricing.currency
                  )}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Security Deposit:</span>
                <p className="font-medium">
                  {formatCurrency(
                    property.pricing.deposit,
                    property.pricing.currency
                  )}
                </p>
              </div>
              {property.pricing.serviceFee && (
                <div>
                  <span className="text-muted-foreground">Service Charge:</span>
                  <p className="font-medium">
                    {formatCurrency(
                      property.pricing.serviceFee,
                      property.pricing.currency
                    )}
                  </p>
                </div>
              )}
              <div>
                <span className="text-muted-foreground">Negotiable:</span>
                <p className="font-medium">
                  {property.pricing.negotiable ? "Yes" : "No"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
