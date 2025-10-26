/**
 * Property pricing sidebar with contact form and landlord info
 */
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@kaa/ui/components/avatar";
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
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  Mail,
  MessageCircle,
  Phone,
  Shield,
  Star,
  User,
} from "lucide-react";
import type { Property } from "@/modules/properties/property.type";
import { formatCurrency } from "@/shared/utils/format.util";

type PropertyPricingSidebarProps = {
  property: Property;
  onContactLandlord: () => void;
  className?: string;
};

export function PropertyPricingSidebar({
  property,
  onContactLandlord,
  className,
}: PropertyPricingSidebarProps) {
  const pricing = property.pricing;
  const landlord = property.landlord;

  // Calculate total monthly cost
  const totalMonthlyCost = (pricing?.rent || 0) + (pricing?.serviceFee || 0);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const getLandlordInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  const getLandlordRatingDisplay = (rating: number) =>
    Array.from({ length: 5 }, (_, i) => (
      <Star
        className={cn(
          "h-3 w-3",
          i < Math.floor(rating)
            ? "fill-yellow-400 text-yellow-400"
            : "text-muted-foreground"
        )}
        key={i.toString()}
      />
    ));

  return (
    <div className={cn("space-y-6", className)}>
      {/* Main Pricing Card */}
      <Card className="sticky top-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Pricing Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-6">
          {/* Primary Price */}
          <div className="border-b pb-4 text-center">
            <div className="mb-2 font-bold text-3xl text-primary">
              {formatCurrency(pricing?.rent || 0, "KES")}
              <span className="ml-1 font-normal text-muted-foreground text-sm">
                /{pricing?.paymentFrequency || "month"}
              </span>
            </div>
            {pricing?.negotiable && (
              <Badge
                className="border-blue-200 bg-blue-50 text-blue-700"
                variant="outline"
              >
                Negotiable
              </Badge>
            )}
          </div>

          {/* Cost Breakdown */}
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Monthly Rent:</span>
              <span className="font-medium">
                {formatCurrency(pricing?.rent || 0, "KES")}
              </span>
            </div>

            {pricing?.serviceFee && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Service Charge:</span>
                <span className="font-medium">
                  {formatCurrency(pricing.serviceFee, "KES")}
                </span>
              </div>
            )}

            {pricing?.deposit && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Security Deposit:</span>
                <span className="font-medium">
                  {formatCurrency(pricing.deposit, "KES")}
                </span>
              </div>
            )}

            {/* Total Monthly Cost */}
            {pricing?.serviceFee && (
              <>
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Total Monthly:</span>
                  <span className="text-primary">
                    {formatCurrency(totalMonthlyCost, "KES")}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Utilities Included */}
          {pricing?.utilitiesIncluded &&
            Object.values(pricing.utilitiesIncluded).length > 0 && (
              <div className="border-t pt-4">
                <h4 className="mb-2 flex items-center gap-2 font-medium">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Utilities Included
                </h4>
                <div className="flex flex-wrap gap-1">
                  {Object.values(pricing.utilitiesIncluded).map(
                    (utility, index) => (
                      <Badge
                        className="text-xs"
                        key={index.toString()}
                        variant="secondary"
                      >
                        {utility}
                      </Badge>
                    )
                  )}
                </div>
              </div>
            )}

          {/* Availability */}
          {property.availability.availableFrom && (
            <div className="border-t pt-4">
              <div className="mb-2 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <span className="font-medium">Available From</span>
              </div>
              <p className="text-muted-foreground text-sm">
                {formatDate(
                  new Date(property.availability.availableFrom).toISOString()
                )}
              </p>
              {/* {property.availability.leaseTerms && (
								<p className="mt-1 text-muted-foreground text-xs">
									Lease: {property.availability.leaseTerms}
								</p>
							)} */}
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3 pt-4">
            <Button className="w-full" onClick={onContactLandlord} size="lg">
              <MessageCircle className="mr-2 h-4 w-4" />
              Contact Landlord
            </Button>

            <Button className="w-full" size="lg" variant="outline">
              <Calendar className="mr-2 h-4 w-4" />
              Schedule Viewing
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Landlord Information Card */}
      {landlord && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Landlord Information
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="mb-4 flex items-start gap-4">
              <Avatar className="h-12 w-12">
                <AvatarImage
                  alt={(landlord as any).personalInfo.firstName}
                  src={(landlord as any).personalInfo.avatar}
                />
                <AvatarFallback>
                  {getLandlordInitials(
                    `${(landlord as any).personalInfo.firstName} ${(landlord as any).personalInfo.lastName}`
                  )}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <h3 className="truncate font-semibold">
                  {(landlord as any).personalInfo.firstName}
                </h3>
                {(landlord as any).personalInfo.title && (
                  <p className="text-muted-foreground text-sm">
                    {(landlord as any).personalInfo.title}
                  </p>
                )}

                {/* Rating */}
                {(landlord as any)?.rating && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex items-center">
                      {getLandlordRatingDisplay((landlord as any).rating)}
                    </div>
                    <span className="text-muted-foreground text-sm">
                      {(landlord as any).rating.toFixed(1)}
                    </span>
                    {(landlord as any).reviewCount && (
                      <span className="text-muted-foreground text-xs">
                        ({(landlord as any).reviewCount} reviews)
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Landlord Stats */}
            {((landlord as any)?.responseTime ||
              (landlord as any)?.propertiesCount ||
              (landlord as any)?.yearsExperience) && (
              <div className="mb-4 grid grid-cols-2 gap-4 rounded-lg bg-muted/30 p-3">
                {(landlord as any)?.responseTime && (
                  <div className="text-center">
                    <div className="mb-1 flex items-center justify-center">
                      <Clock className="mr-1 h-3 w-3 text-primary" />
                    </div>
                    <p className="font-medium text-xs">
                      {(landlord as any).responseTime}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      Response Time
                    </p>
                  </div>
                )}

                {(landlord as any)?.propertiesCount && (
                  <div className="text-center">
                    <p className="font-medium text-xs">
                      {(landlord as any).profile.propertiesCount}
                    </p>
                    <p className="text-muted-foreground text-xs">Properties</p>
                  </div>
                )}

                {(landlord as any)?.yearsExperience && (
                  <div className="col-span-2 text-center">
                    <p className="font-medium text-xs">
                      {(landlord as any).yearsExperience} years
                    </p>
                    <p className="text-muted-foreground text-xs">Experience</p>
                  </div>
                )}
              </div>
            )}

            {/* Landlord Bio */}
            {(landlord as any)?.personalInfo.bio && (
              <div className="mb-4">
                <h4 className="mb-2 font-medium">About</h4>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {(landlord as any).personalInfo.bio}
                </p>
              </div>
            )}

            {/* Contact Methods */}
            <div className="space-y-2">
              {(landlord as any)?.personalInfo.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-primary" />
                  <span>{(landlord as any).personalInfo.phone}</span>
                </div>
              )}

              {(landlord as any)?.personalInfo.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-primary" />
                  <span className="truncate">
                    {(landlord as any).personalInfo.email}
                  </span>
                </div>
              )}
            </div>

            {/* Verification Badges */}
            {(landlord as any)?.isVerified && (
              <div className="mt-4 border-t pt-4">
                <div className="flex items-center gap-2">
                  <Badge
                    className="border-green-200 bg-green-50 text-green-700"
                    variant="outline"
                  >
                    <Shield className="mr-1 h-3 w-3" />
                    Verified Landlord
                  </Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quick Stats Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Property Status</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">Status:</span>
              <Badge
                className="border-green-200 bg-green-50 text-green-700"
                variant="outline"
              >
                {property.status}
              </Badge>
            </div>

            {property.createdAt && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">Listed:</span>
                <span className="font-medium text-sm">
                  {formatDate(new Date(property.createdAt).toISOString())}
                </span>
              </div>
            )}

            {property.updatedAt &&
              property.updatedAt !== property.createdAt && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">
                    Updated:
                  </span>
                  <span className="font-medium text-sm">
                    {formatDate(new Date(property.updatedAt).toISOString())}
                  </span>
                </div>
              )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
