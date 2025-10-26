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
import {
  Calendar,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Shield,
  Star,
  User,
  Users,
  Verified,
} from "lucide-react";
import { useState } from "react";
import type { Property } from "@/modules/properties/property.type";

type PropertyLandlordProps = {
  property: Property;
  onContactLandlord: () => void;
};

export function PropertyLandlord({
  property,
  onContactLandlord,
}: PropertyLandlordProps) {
  const [showFullProfile, setShowFullProfile] = useState(false);
  const landlord = property.landlord;

  if (!landlord) {
    return null;
  }

  // Mock additional landlord data (would come from API)
  const landlordExtras = {
    rating: 4.7,
    totalReviews: 43,
    totalProperties: 12,
    responseTime: "Within 2 hours",
    memberSince: "2019-03-15",
    verificationStatus: "verified" as const,
    verifiedOn: "2023-01-20",
    activeListings: 8,
    languages: ["English", "Swahili"],
    bio: "Experienced property manager with over 10 years in the Kenyan real estate market. I specialize in residential rentals and pride myself on maintaining quality properties and providing excellent tenant services.",
  };

  const renderStars = (rating: number) =>
    Array.from({ length: 5 }).map((_, i) => (
      <Star
        className={`h-4 w-4 ${
          i < Math.floor(rating)
            ? "fill-yellow-400 text-yellow-400"
            : i < rating
              ? "fill-yellow-200 text-yellow-400"
              : "text-gray-300"
        }`}
        key={`star-${i.toString()}`}
      />
    ));

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Property Owner
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Landlord Profile */}
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage
              alt={`${(landlord as any).personalInfo.firstName} ${(landlord as any).personalInfo.lastName}`}
              src={(landlord as any).personalInfo.avatar}
            />
            <AvatarFallback className="bg-primary text-lg text-primary-foreground">
              {getInitials(
                `${(landlord as any).personalInfo.firstName} ${(landlord as any).personalInfo.lastName}`
              )}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg">
                {(landlord as any).personalInfo.firstName}{" "}
                {(landlord as any).personalInfo.lastName}
              </h3>
              {landlordExtras.verificationStatus === "verified" && (
                <div className="flex items-center gap-1">
                  <Verified className="h-4 w-4 text-green-600" />
                  <Badge
                    className="bg-green-50 text-green-700"
                    variant="secondary"
                  >
                    Verified
                  </Badge>
                </div>
              )}
            </div>

            {/* Rating */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                {renderStars(landlordExtras.rating)}
              </div>
              <span className="text-muted-foreground text-sm">
                {landlordExtras.rating} ({landlordExtras.totalReviews} reviews)
              </span>
            </div>

            {/* Member since */}
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Calendar className="h-3 w-3" />
              Member since {new Date(landlordExtras.memberSince).getFullYear()}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg bg-gray-50 p-3 text-center">
            <div className="font-semibold text-lg">
              {landlordExtras.totalProperties}
            </div>
            <div className="text-muted-foreground text-sm">Properties</div>
          </div>
          <div className="rounded-lg bg-gray-50 p-3 text-center">
            <div className="font-semibold text-lg">
              {landlordExtras.activeListings}
            </div>
            <div className="text-muted-foreground text-sm">Active Listings</div>
          </div>
        </div>

        {/* Response Time */}
        <div className="flex items-center gap-2 rounded-lg bg-green-50 p-3">
          <MessageCircle className="h-4 w-4 text-green-600" />
          <span className="text-green-700 text-sm">
            Typically responds {landlordExtras.responseTime.toLowerCase()}
          </span>
        </div>

        {/* Contact Actions */}
        <div className="space-y-3">
          <Button className="w-full" onClick={onContactLandlord} size="lg">
            <Mail className="mr-2 h-4 w-4" />
            Send Message
          </Button>

          <div className="grid grid-cols-2 gap-2">
            <Button
              disabled={!(landlord as any).personalInfo.phone}
              onClick={() => {
                if ((landlord as any).personalInfo.phone) {
                  window.open(
                    `tel:${(landlord as any).personalInfo.phone}`,
                    "_self"
                  );
                }
              }}
              size="sm"
              variant="outline"
            >
              <Phone className="mr-2 h-3 w-3" />
              Call
            </Button>

            <Button
              disabled={!(landlord as any).personalInfo.phone}
              onClick={() => {
                if ((landlord as any).personalInfo.phone) {
                  window.open(
                    `https://wa.me/${(landlord as any).personalInfo.phone?.replace(/[^0-9]/g, "")}`,
                    "_blank"
                  );
                }
              }}
              size="sm"
              variant="outline"
            >
              <MessageCircle className="mr-2 h-3 w-3" />
              WhatsApp
            </Button>
          </div>
        </div>

        {/* Additional Info Toggle */}
        <div className="space-y-3">
          <Button
            className="w-full"
            onClick={() => setShowFullProfile(!showFullProfile)}
            size="sm"
            variant="ghost"
          >
            {showFullProfile ? "Show Less" : "View Full Profile"}
          </Button>

          {showFullProfile && (
            <div className="space-y-4 border-t pt-4">
              {/* Verification Details */}
              {landlordExtras.verificationStatus === "verified" && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Shield className="h-4 w-4 text-green-600" />
                    <span className="font-medium">Verification Details</span>
                  </div>
                  <p className="ml-6 text-muted-foreground text-sm">
                    Identity verified on{" "}
                    {new Date(landlordExtras.verifiedOn).toLocaleDateString()}
                  </p>
                </div>
              )}

              {/* Languages */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4" />
                  <span className="font-medium">Languages</span>
                </div>
                <div className="ml-6 flex gap-2">
                  {landlordExtras.languages.map((language) => (
                    <Badge key={language} variant="outline">
                      {language}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Bio */}
              {landlordExtras.bio && (
                <div className="space-y-2">
                  <p className="font-medium text-sm">About</p>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {landlordExtras.bio}
                  </p>
                </div>
              )}

              {/* Location */}
              {(landlord as any)?.contactInfo.primaryAddress && (
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <MapPin className="h-4 w-4" />
                  <span>
                    {(landlord as any).contactInfo.primaryAddress.line1}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
