/**
 * Property overview component showing key details and summary
 */
"use client";

import { Badge } from "@kaa/ui/components/badge";
import { Card, CardContent } from "@kaa/ui/components/card";
import { Separator } from "@kaa/ui/components/separator";
import {
  Bath,
  Bed,
  Calendar,
  Car,
  MapPin,
  Maximize,
  Shield,
  Tag,
  Users,
  Wifi,
} from "lucide-react";
import type { Property } from "@/modules/properties/property.type";
import { formatCurrency } from "@/shared/utils/format.util";

type PropertyOverviewProps = {
  property: Property;
  className?: string;
};

export function PropertyOverview({
  property,
  className,
}: PropertyOverviewProps) {
  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const getPropertyTypeDisplay = (type: string) =>
    type
      .replace(/([A-Z])/g, " $1")
      // biome-ignore lint/performance/useTopLevelRegex: ignore
      .replace(/^./, (str) => str.toUpperCase());

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
      ? [{ icon: Maximize, label: `${property.specifications.totalArea} sqft` }]
      : []),
    ...(property.location
      ? [
          {
            icon: MapPin,
            label: `${property.location.address.town}, ${property.location.county}`,
          },
        ]
      : []),
  ];

  const additionalFeatures = [
    ...(property.specifications.furnished
      ? [{ icon: Users, label: "Furnished" }]
      : []),
    ...(property.amenities.parking
      ? [{ icon: Car, label: "Parking Available" }]
      : []),
    ...(Object.keys(property.amenities)?.includes("wifi")
      ? [{ icon: Wifi, label: "WiFi Included" }]
      : []),
  ];

  return (
    <div className={className}>
      {/* Property Header */}
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="wrap-break-word mb-2 font-bold text-2xl text-foreground md:text-3xl">
              {property.title}
            </h1>
            <div className="mb-3 flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4 shrink-0" />
              <span className="truncate text-sm">
                {property.location?.address.line1},{" "}
                {property.location?.address.town}, {property.location?.county}
              </span>
            </div>
          </div>
          <div className="shrink-0 text-right">
            <div className="font-bold text-2xl text-primary md:text-3xl">
              {formatCurrency(property.pricing?.rent || 0, "KES")}
              <span className="font-normal text-muted-foreground text-sm">
                /{property.pricing?.paymentFrequency || "month"}
              </span>
            </div>
            {property.pricing?.deposit && (
              <div className="text-muted-foreground text-sm">
                + {formatCurrency(property.pricing.deposit, "KES")} deposit
              </div>
            )}
          </div>
        </div>

        {/* Property Type and Status */}
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="bg-primary/10" variant="outline">
            {getPropertyTypeDisplay(property.type)}
          </Badge>
          <Badge
            className="border-green-200 bg-green-100 text-green-800"
            variant="outline"
          >
            <Shield className="mr-1 h-3 w-3" />
            {property.status}
          </Badge>
          {property.pricing?.negotiable && (
            <Badge
              className="border-blue-200 bg-blue-100 text-blue-800"
              variant="outline"
            >
              <Tag className="mr-1 h-3 w-3" />
              Negotiable
            </Badge>
          )}
        </div>
      </div>

      <Separator className="my-6" />

      {/* Key Features Grid */}
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        {keyFeatures.map((feature, index) => (
          <Card className="p-4" key={index.toString()}>
            <CardContent className="flex items-center gap-3 p-0">
              <div className="rounded-full bg-primary/10 p-2">
                <feature.icon className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="truncate font-medium text-sm">{feature.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Description */}
      {property.description && (
        <div className="mb-6">
          <h3 className="mb-3 font-semibold text-lg">Description</h3>
          <div className="prose max-w-none text-muted-foreground">
            <p className="whitespace-pre-wrap leading-relaxed">
              {property.description}
            </p>
          </div>
        </div>
      )}

      {/* Additional Details */}
      <div className="mb-6 grid gap-6 md:grid-cols-2">
        {/* Property Information */}
        <Card>
          <CardContent className="p-4">
            <h4 className="mb-3 font-semibold">Property Information</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Property Type:</span>
                <span className="font-medium">
                  {getPropertyTypeDisplay(property.type)}
                </span>
              </div>
              {property.specifications.totalArea && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Size:</span>
                  <span className="font-medium">
                    {property.specifications.totalArea} sqft
                  </span>
                </div>
              )}
              {property.specifications.bedrooms && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bedrooms:</span>
                  <span className="font-medium">
                    {property.specifications.bedrooms}
                  </span>
                </div>
              )}
              {property.specifications.bathrooms && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bathrooms:</span>
                  <span className="font-medium">
                    {property.specifications.bathrooms}
                  </span>
                </div>
              )}
              {property.specifications.furnished !== undefined && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Furnished:</span>
                  <span className="font-medium">
                    {property.specifications.furnished ? "Yes" : "No"}
                  </span>
                </div>
              )}
              {property.amenities.parking !== undefined && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Parking:</span>
                  <span className="font-medium">
                    {property.amenities.parking ? "Available" : "Not Available"}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Rental Details */}
        <Card>
          <CardContent className="p-4">
            <h4 className="mb-3 font-semibold">Rental Details</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Monthly Rent:</span>
                <span className="font-medium text-primary">
                  {formatCurrency(property.pricing?.rent || 0, "KES")}
                </span>
              </div>
              {property.pricing?.deposit && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Security Deposit:
                  </span>
                  <span className="font-medium">
                    {formatCurrency(property.pricing.deposit, "KES")}
                  </span>
                </div>
              )}
              {property.pricing?.serviceFee && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Service Charge:</span>
                  <span className="font-medium">
                    {formatCurrency(property.pricing.serviceFee, "KES")}
                  </span>
                </div>
              )}
              {property.pricing?.currency && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Currency:</span>
                  <span className="font-medium">
                    {property.pricing.currency}
                  </span>
                </div>
              )}
              {property.pricing?.paymentFrequency && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment:</span>
                  <span className="font-medium capitalize">
                    {property.pricing.paymentFrequency}
                  </span>
                </div>
              )}
              {property.pricing?.negotiable !== undefined && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Negotiable:</span>
                  <span className="font-medium">
                    {property.pricing.negotiable ? "Yes" : "No"}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Availability */}
      {(property.availability.availableFrom ||
        property.availability.availableTo) && (
        <Card className="mb-6">
          <CardContent className="p-4">
            <h4 className="mb-3 flex items-center gap-2 font-semibold">
              <Calendar className="h-4 w-4" />
              Availability
            </h4>
            <div className="grid gap-4 text-sm md:grid-cols-2">
              {property.availability.availableFrom && (
                <div>
                  <span className="text-muted-foreground">Available From:</span>
                  <p className="font-medium">
                    {formatDate(
                      property.availability.availableFrom.toISOString()
                    )}
                  </p>
                </div>
              )}
              {property.availability.availableTo && (
                <div>
                  <span className="text-muted-foreground">
                    Available Until:
                  </span>
                  <p className="font-medium">
                    {formatDate(
                      property.availability.availableTo.toISOString()
                    )}
                  </p>
                </div>
              )}
              {/* {property.availability.noticePeriod && (
								<div>
									<span className="text-muted-foreground">Notice Period:</span>
									<p className="font-medium">{property.availability.noticePeriod}</p>
								</div>
							)}
							{property.availability.leaseTerms && (
								<div>
									<span className="text-muted-foreground">Lease Terms:</span>
									<p className="font-medium">{property.availability.leaseTerms}</p>
								</div>
							)} */}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Additional Features */}
      {additionalFeatures.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h4 className="mb-3 font-semibold">Additional Features</h4>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {additionalFeatures.map((feature, index) => (
                <div
                  className="flex items-center gap-2 text-sm"
                  key={index.toString()}
                >
                  <feature.icon className="h-4 w-4 shrink-0 text-primary" />
                  <span>{feature.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
