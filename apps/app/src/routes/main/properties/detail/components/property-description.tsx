/**
 * Property description component displaying detailed property information
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
import { Separator } from "@kaa/ui/components/separator";
import { cn } from "@kaa/ui/lib/utils";
import {
  Building,
  Calendar,
  ChevronDown,
  ChevronUp,
  DollarSign,
  FileText,
  Home,
  MapPin,
} from "lucide-react";
import { useState } from "react";
import type { Property } from "@/modules/properties/property.type";
import { formatCurrency } from "@/shared/utils/format.util";

type PropertyDescriptionProps = {
  property: Property;
  className?: string;
};

export function PropertyDescription({
  property,
  className,
}: PropertyDescriptionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "details" | "lease">(
    "overview"
  );

  const tabs = [
    {
      key: "overview" as const,
      label: "Overview",
      icon: FileText,
      count: null,
    },
    {
      key: "details" as const,
      label: "Property Details",
      icon: Home,
      count: null,
    },
    {
      key: "lease" as const,
      label: "Lease Terms",
      icon: Calendar,
      count: null,
    },
  ];

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Main Description */}
      <div>
        <h3 className="mb-3 flex items-center gap-2 font-semibold">
          <FileText className="h-4 w-4" />
          Property Description
        </h3>
        {property.description ? (
          <div className="space-y-3">
            <p
              className={cn(
                "text-muted-foreground leading-relaxed",
                !isExpanded && "line-clamp-4"
              )}
            >
              {property.description}
            </p>
            {property.description.length > 200 && (
              <Button
                className="h-auto p-0 font-medium text-primary"
                onClick={() => setIsExpanded(!isExpanded)}
                size="sm"
                variant="ghost"
              >
                {isExpanded ? (
                  <>
                    Show Less <ChevronUp className="ml-1 h-3 w-3" />
                  </>
                ) : (
                  <>
                    Show More <ChevronDown className="ml-1 h-3 w-3" />
                  </>
                )}
              </Button>
            )}
          </div>
        ) : (
          <p className="text-muted-foreground italic">
            No description provided for this property.
          </p>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-lg bg-muted/50 p-3 text-center">
          <div className="font-semibold text-lg">
            {property.specifications.bedrooms || "N/A"}
          </div>
          <div className="text-muted-foreground text-xs">Bedrooms</div>
        </div>
        <div className="rounded-lg bg-muted/50 p-3 text-center">
          <div className="font-semibold text-lg">
            {property.specifications.bathrooms || "N/A"}
          </div>
          <div className="text-muted-foreground text-xs">Bathrooms</div>
        </div>
        <div className="rounded-lg bg-muted/50 p-3 text-center">
          <div className="font-semibold text-lg">
            {property.specifications.totalArea
              ? `${property.specifications.totalArea} sqft`
              : "N/A"}
          </div>
          <div className="text-muted-foreground text-xs">Living Space</div>
        </div>
        <div className="rounded-lg bg-muted/50 p-3 text-center">
          <div className="font-semibold text-lg capitalize">
            {property.type?.replace(/([A-Z])/g, " $1").trim() || "N/A"}
          </div>
          <div className="text-muted-foreground text-xs">Property Type</div>
        </div>
      </div>

      {/* Key Highlights */}
      {(Object.values(property.amenities)?.length ||
        property.specifications.furnished ||
        property.amenities.parking) && (
        <div>
          <h4 className="mb-3 font-medium">Key Highlights</h4>
          <div className="flex flex-wrap gap-2">
            {property.specifications.furnished && (
              <Badge variant="secondary">Furnished</Badge>
            )}
            {property.amenities.parking && (
              <Badge variant="secondary">Parking Available</Badge>
            )}
            {property.rules.petsAllowed && (
              <Badge variant="secondary">Pet Friendly</Badge>
            )}
            {Object.values(property.amenities)
              ?.slice(0, 6)
              .map((feature, index) => (
                <Badge
                  className="capitalize"
                  key={index.toString()}
                  variant="outline"
                >
                  {feature}
                </Badge>
              ))}
            {Object.values(property.amenities)?.length > 6 && (
              <Badge variant="outline">
                +{Object.values(property.amenities)?.length - 6} more features
              </Badge>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const renderDetails = () => (
    <div className="space-y-6">
      {/* Property Specifications */}
      <div>
        <h3 className="mb-4 flex items-center gap-2 font-semibold">
          <Building className="h-4 w-4" />
          Property Specifications
        </h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-3">
            <DetailRow label="Property Type" value={property.type} />
            <DetailRow
              label="Bedrooms"
              value={property.specifications.bedrooms?.toString()}
            />
            <DetailRow
              label="Bathrooms"
              value={property.specifications.bathrooms?.toString()}
            />
            <DetailRow
              label="Living Space"
              value={
                property.specifications.totalArea
                  ? `${property.specifications.totalArea} sqft`
                  : undefined
              }
            />
            <DetailRow
              label="Furnished"
              value={property.specifications.furnished ? "Yes" : "No"}
            />
            <DetailRow
              label="Parking"
              value={property.amenities.parking ? "Available" : "Not Available"}
            />
          </div>
          <div className="space-y-3">
            <DetailRow label="Status" value={property.status} />
            <DetailRow
              label="Pet Policy"
              value={property.rules.petsAllowed ? "Pets Allowed" : "No Pets"}
            />
            <DetailRow
              label="Year Built"
              value={property.specifications.yearBuilt?.toString()}
            />
            {/* <DetailRow label="Floor Number" value={property.specifications.floorLevel?.toString()} /> */}
            <DetailRow
              label="Total Floors"
              value={property.specifications.floors?.toString()}
            />
            <DetailRow
              label="Property ID"
              value={property._id.slice(-8).toUpperCase()}
            />
          </div>
        </div>
      </div>

      {/* Location Details */}
      {property.location && (
        <div>
          <h3 className="mb-4 flex items-center gap-2 font-semibold">
            <MapPin className="h-4 w-4" />
            Location Information
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <DetailRow
                label="Address"
                value={property.location.address.toString()}
              />
              <DetailRow label="City" value={property.location.address.town} />
              <DetailRow label="State" value={property.location.constituency} />
            </div>
            <div className="space-y-3">
              <DetailRow
                label="Postal Code"
                value={property.location.address.postalCode}
              />
              <DetailRow label="Country" value={property.location.country} />
              <DetailRow
                label="Neighborhood"
                value={property.location.neighborhood}
              />
            </div>
          </div>
        </div>
      )}

      {/* Building Amenities */}
      {Object.values(property.amenities)?.length && (
        <div>
          <h3 className="mb-4 font-semibold">Building Amenities</h3>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
            {Object.keys(property.amenities)?.map((amenity, index) => (
              // <div key={index.toString()} className="flex items-center gap-2 rounded bg-muted/30 p-2">
              // 	{amenity.icon && <span className="text-sm">{amenity.icon}</span>}
              // 	<span className="text-sm">{amenity.name}</span>
              // </div>

              <div
                className="flex items-center gap-2 rounded bg-muted/30 p-2"
                key={index.toString()}
              >
                {/* {getAmenityIcon(amenity)} */}
                <span className="text-sm">{amenity}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderLeaseTerms = () => (
    <div className="space-y-6">
      {/* Pricing Information */}
      <div>
        <h3 className="mb-4 flex items-center gap-2 font-semibold">
          <DollarSign className="h-4 w-4" />
          Pricing & Payment
        </h3>
        {property.pricing ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <DetailRow
                label="Monthly Rent"
                value={formatCurrency(property.pricing.rent, "KES")}
              />
              <DetailRow
                label="Security Deposit"
                value={
                  property.pricing.deposit
                    ? formatCurrency(property.pricing.deposit, "KES")
                    : undefined
                }
              />
              <DetailRow
                className="capitalize"
                label="Payment Frequency"
                value={property.pricing.paymentFrequency}
              />
              <DetailRow
                label="Negotiable"
                value={property.pricing.negotiable ? "Yes" : "No"}
              />
            </div>
            <div className="space-y-3">
              <DetailRow
                label="Utilities Included"
                value={Object.keys(property.pricing.utilitiesIncluded)?.join(
                  ", "
                )}
              />
              <DetailRow
                label="Additional Fees"
                value={
                  // property.pricing.additionalFees
                  // 	? Object.entries(property.pricing.additionalFees)
                  // 			.map(([key, value]) => `${key}: ${formatCurrency(value as number, "KES")}`)
                  // 			.join(", ")
                  // 	: undefined
                  undefined
                }
              />
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground">
            Pricing information not available.
          </p>
        )}
      </div>

      <Separator />

      {/* Availability Information */}
      <div>
        <h3 className="mb-4 flex items-center gap-2 font-semibold">
          <Calendar className="h-4 w-4" />
          Availability & Terms
        </h3>
        {property.availability.isAvailable ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <DetailRow
                label="Available From"
                value={
                  property.availability.availableFrom
                    ? new Date(
                        property.availability.availableFrom
                      ).toLocaleDateString()
                    : undefined
                }
              />
              <DetailRow
                label="Available Until"
                value={
                  property.availability.availableTo
                    ? new Date(
                        property.availability.availableTo
                      ).toLocaleDateString()
                    : undefined
                }
              />
            </div>
            {/* <div className="space-y-3">
							<DetailRow
								label="Notice Period"
								value={
									property.availability.noticePeriod
										? `${property.availability.noticePeriod} days`
										: undefined
								}
							/>
							<DetailRow
								label="Minimum Lease"
								value={
									property.leaseTerms?.minimumLease
										? `${property.leaseTerms.minimumLease} months`
										: undefined
								}
							/>
						</div> */}
          </div>
        ) : (
          <p className="text-muted-foreground">
            Availability information not provided.
          </p>
        )}
      </div>

      {/* Lease Terms */}
      {/* {property.leaseTerms && (
				<>
					<Separator />
					<div>
						<h3 className="mb-4 font-semibold">Additional Lease Terms</h3>
						<div className="space-y-3">
							<DetailRow
								label="Maximum Lease"
								value={
									property.leaseTerms.maximumLease
										? `${property.leaseTerms.maximumLease} months`
										: undefined
								}
							/>
							<DetailRow label="Renewable" value={property.leaseTerms.renewable ? "Yes" : "No"} />
							<DetailRow
								label="Early Termination"
								value={
									property.leaseTerms.earlyTerminationFee
										? `Fee: ${formatCurrency(property.leaseTerms.earlyTerminationFee)}`
										: "Not Allowed"
								}
							/>
						</div>
					</div>
				</>
			)} */}
    </div>
  );

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Property Information
          </CardTitle>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 rounded-lg bg-muted p-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 font-medium text-sm transition-all",
                  activeTab === tab.key
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                type="button"
              >
                <Icon className="h-3 w-3" />
                {tab.label}
                {tab.count && (
                  <Badge
                    className="ml-1 h-5 px-1.5 text-xs"
                    variant="secondary"
                  >
                    {tab.count}
                  </Badge>
                )}
              </button>
            );
          })}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {activeTab === "overview" && renderOverview()}
        {activeTab === "details" && renderDetails()}
        {activeTab === "lease" && renderLeaseTerms()}
      </CardContent>
    </Card>
  );
}

type DetailRowProps = {
  label: string;
  value?: string;
  className?: string;
};

function DetailRow({ label, value, className }: DetailRowProps) {
  if (!value) return null;

  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-muted-foreground text-sm">{label}</span>
      <span className={cn("font-medium text-sm", className)}>
        {value
          .split(",")
          .map((v) => v.trim())
          .map((v) =>
            v.length > 0 ? v.charAt(0).toUpperCase() + v.slice(1) : ""
          )
          .join(", ")}
      </span>
    </div>
  );
}
