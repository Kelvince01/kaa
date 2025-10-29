/**
 * Property details page container
 */
"use client";

import { Alert, AlertDescription } from "@kaa/ui/components/alert";
import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import { Separator } from "@kaa/ui/components/separator";
import { Skeleton } from "@kaa/ui/components/skeleton";
import { AlertCircle, ArrowLeft, DollarSign, Home, MapPin } from "lucide-react";
import { notFound, useRouter } from "next/navigation";
import { useState } from "react";
// Hooks and types
import { useProperty } from "@/modules/properties/property.queries";
import { formatCurrency } from "@/shared/utils/format.util";
import { ContactFormModal } from "./components/contact-form-modal";
import { NeighborhoodAnalytics } from "./components/neighborhood-analytics";
import { PropertyActions } from "./components/property-actions";
import { PropertyAnalytics } from "./components/property-analytics";
import { PropertyComparison } from "./components/property-comparison";
import { PropertyDescription } from "./components/property-description";
import { PropertyFeatures } from "./components/property-features";
// Property components
import { PropertyGallery } from "./components/property-gallery";
import { PropertyLandlord } from "./components/property-landlord";
import { PropertyLocation } from "./components/property-location";
import { PropertyOverview } from "./components/property-overview";
import { PropertyPricingSidebar } from "./components/property-pricing-sidebar";
import { PropertyReviews } from "./components/property-reviews";
import { SimilarProperties } from "./components/similar-properties";
import { ViewingScheduler } from "./components/viewing-scheduler";
import { VirtualTour } from "./components/virtual-tour";

type PropertyDetailsContainerProps = {
  propertyId: string;
  searchParams?: { [key: string]: string | string[] | undefined };
};

export default function PropertyDetailsContainer({
  propertyId,
}: PropertyDetailsContainerProps) {
  const router = useRouter();
  const [contactFormOpen, setContactFormOpen] = useState(false);

  // Fetch property data
  const { data: property, isLoading, error, refetch } = useProperty(propertyId);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header skeleton */}
        <div className="border-b bg-white">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded" />
              <Skeleton className="h-6 w-32" />
            </div>
          </div>
        </div>

        {/* Content skeleton */}
        <div className="container mx-auto px-4 py-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main content */}
            <div className="space-y-6 lg:col-span-2">
              {/* Image gallery skeleton */}
              <Skeleton className="h-96 w-full rounded-lg" />

              {/* Overview skeleton */}
              <div className="space-y-4">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-20 w-full" />
              </div>

              {/* Details skeleton */}
              <div className="space-y-4">
                <Skeleton className="h-6 w-32" />
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton className="h-16 w-full" key={i.toString()} />
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar skeleton */}
            <div className="space-y-6">
              <div className="space-y-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col items-center justify-center space-y-4">
            <AlertCircle className="h-12 w-12 text-muted-foreground" />
            <h2 className="font-semibold text-gray-900 text-xl">
              Failed to load property
            </h2>
            <p className="text-center text-muted-foreground">
              {/* We couldn't load this property. Please try again. */}
              {error instanceof Error
                ? error.message
                : "The property you're looking for doesn't exist or may have been removed."}
            </p>
            <div className="flex gap-2">
              <Button onClick={() => router.back()} variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Browse Properties
              </Button>
              <Button onClick={() => refetch()}>Try Again</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Property not found
  if (!property) {
    notFound();
  }

  const handleContactLandlord = () => {
    setContactFormOpen(true);
  };

  // Check if property is available
  const isAvailable = property.status === ("active" as any);
  const availableFrom = property.availability.availableFrom
    ? new Date(property.availability.availableFrom)
    : null;

  const isAvailableNow = !availableFrom || availableFrom <= new Date();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with back button */}
      <div className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                className="flex items-center gap-2"
                onClick={() => router.back()}
                size="sm"
                variant="ghost"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Properties
              </Button>
              <Separator className="h-5" orientation="vertical" />
              <div className="flex items-center gap-2">
                <Badge
                  className={isAvailable ? "bg-green-100 text-green-800" : ""}
                  variant={isAvailable ? "default" : "secondary"}
                >
                  {property.status}
                </Badge>
                {property.type && (
                  <Badge className="capitalize" variant="outline">
                    {property.type.replace(/([A-Z])/g, " $1").trim()}
                  </Badge>
                )}
              </div>
            </div>

            <PropertyActions
              onContactLandlord={handleContactLandlord}
              property={property}
            />
          </div>

          {/* Property Header Summary */}
          <div className="mt-3 space-y-2">
            <h1 className="font-bold text-xl">{property.title}</h1>
            <div className="flex items-center gap-4 text-muted-foreground text-sm">
              {property.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {property.location.address.line1},{" "}
                  {property.location.address.town}
                </div>
              )}
              {property.pricing?.rent && (
                <div className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  {formatCurrency(property.pricing.rent, "KES")}/
                  {property.pricing.paymentFrequency || "month"}
                </div>
              )}
              {(property.specifications.bedrooms ||
                property.specifications.bathrooms) && (
                <div className="flex items-center gap-1">
                  <Home className="h-3 w-3" />
                  {property.specifications.bedrooms}bd{" "}
                  {property.specifications.bathrooms}ba
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="container mx-auto px-4 py-6">
        {/* Availability Alert */}
        {!isAvailable && (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This property is currently {property.status.toLowerCase()}.
              {availableFrom && (
                <>
                  {" "}
                  It will be available from {availableFrom.toLocaleDateString()}
                  .
                </>
              )}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 xl:grid-cols-4">
          {/* Main content - left column */}
          <div className="space-y-6 lg:col-span-2 xl:col-span-3">
            {/* Image Gallery */}
            <PropertyGallery property={property} />

            {/* Property Overview */}
            <PropertyOverview property={property} />

            {/* Property Details */}
            <PropertyDescription property={property} />

            {/* Features & Amenities */}
            <PropertyFeatures property={property} />

            {/* Virtual Tour */}
            <VirtualTour property={property} />

            {/* Location & Map */}
            <PropertyLocation property={property} />

            {/* Neighborhood Analytics */}
            <NeighborhoodAnalytics property={property} />

            {/* Reviews & Ratings */}
            <PropertyReviews propertyId={property._id} />

            {/* Property Analytics (visible to property owners) */}
            {/* TODO: Add role-based visibility */}
            <PropertyAnalytics property={property} />
          </div>

          {/* Sidebar - right column */}
          <div className="space-y-6 xl:col-span-1">
            {/* Pricing */}
            <PropertyPricingSidebar
              onContactLandlord={handleContactLandlord}
              property={property}
            />

            {/* Viewing Scheduler */}
            <ViewingScheduler property={property} />

            {/* Landlord Info */}
            <PropertyLandlord
              onContactLandlord={handleContactLandlord}
              property={property}
            />

            {/* Property Comparison */}
            <PropertyComparison currentProperty={property} />
          </div>
        </div>

        {/* Similar Properties */}
        <div className="mt-12">
          <SimilarProperties
            currentProperty={property}
            currentPropertyId={property._id}
            properties={[]}
          />
        </div>
      </div>

      {/* Contact Form Modal */}
      <ContactFormModal
        isOpen={contactFormOpen}
        onClose={() => setContactFormOpen(false)}
        property={property}
      />
    </div>
  );
}
