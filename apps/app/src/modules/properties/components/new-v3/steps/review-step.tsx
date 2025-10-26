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
import {
  Bath,
  Bed,
  Building2,
  Calendar,
  CheckCircle2,
  DollarSign,
  Home,
  MapPin,
  Phone,
  Sparkles,
  User,
} from "lucide-react";
import Image from "next/image";
import type { UseFormReturn } from "react-hook-form";
import type { PropertyFormData } from "../schema";

type ReviewStepProps = {
  form: UseFormReturn<PropertyFormData>;
  onEdit: (stepIndex: number) => void;
};

export function ReviewStep({ form, onEdit }: ReviewStepProps) {
  const values = form.watch();

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
          <CheckCircle2 className="h-10 w-10 text-green-600" />
        </div>
        <h2 className="font-bold text-2xl">Review Your Listing</h2>
        <p className="mt-2 text-muted-foreground">
          Please review all information before submitting
        </p>
      </div>

      {/* Basic Information */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-5 w-5" />
              Basic Information
            </CardTitle>
            <Button
              onClick={() => onEdit(0)}
              size="sm"
              type="button"
              variant="ghost"
            >
              Edit
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <h3 className="font-semibold text-lg">{values.title}</h3>
            <Badge className="mt-1 capitalize" variant="secondary">
              {values.type}
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm">{values.description}</p>
          {values.tags && values.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {values.tags.map((tag) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Location */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="h-5 w-5" />
              Location
            </CardTitle>
            <Button
              onClick={() => onEdit(1)}
              size="sm"
              type="button"
              variant="ghost"
            >
              Edit
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div>
            <span className="text-muted-foreground">Address: </span>
            <span className="font-medium">{values.address}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Area: </span>
            <span className="font-medium">
              {values.estate}, {values.county}
            </span>
          </div>
          {values.buildingName && (
            <div>
              <span className="text-muted-foreground">Building: </span>
              <span className="font-medium">{values.buildingName}</span>
            </div>
          )}
          {values.coordinates && (
            <div className="font-mono text-xs">
              📍 {values.coordinates.latitude.toFixed(6)},{" "}
              {values.coordinates.longitude.toFixed(6)}
            </div>
          )}
          {values.nearbyAmenities && values.nearbyAmenities.length > 0 && (
            <div className="pt-2">
              <span className="text-muted-foreground text-xs">Nearby: </span>
              <div className="mt-1 flex flex-wrap gap-1">
                {values.nearbyAmenities.map((amenity) => (
                  <Badge key={amenity} variant="outline">
                    {amenity}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Specifications */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Home className="h-5 w-5" />
              Specifications
            </CardTitle>
            <Button
              onClick={() => onEdit(2)}
              size="sm"
              type="button"
              variant="ghost"
            >
              Edit
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
            <div className="flex items-center gap-2">
              <Bed className="h-4 w-4 text-muted-foreground" />
              <span>
                <strong>{values.bedrooms}</strong> Bedroom
                {values.bedrooms !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Bath className="h-4 w-4 text-muted-foreground" />
              <span>
                <strong>{values.bathrooms}</strong> Bathroom
                {values.bathrooms !== 1 ? "s" : ""}
              </span>
            </div>
            {values.totalArea && (
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-muted-foreground" />
                <span>
                  <strong>{values.totalArea}</strong> m²
                </span>
              </div>
            )}
            <div className="col-span-2 sm:col-span-1">
              <Badge className="capitalize" variant="secondary">
                {values.furnished?.replace("_", " ")}
              </Badge>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <Badge className="capitalize" variant="outline">
                {values.condition?.replace("_", " ")}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pricing */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <DollarSign className="h-5 w-5" />
              Pricing
            </CardTitle>
            <Button
              onClick={() => onEdit(3)}
              size="sm"
              type="button"
              variant="ghost"
            >
              Edit
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-baseline justify-between">
            <span className="text-muted-foreground">Monthly Rent:</span>
            <span className="font-bold text-2xl">
              KES {values.rent?.toLocaleString()}
            </span>
          </div>
          <Separator />
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Security Deposit:</span>
              <span className="font-medium">
                KES {values.deposit?.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Payment Frequency:</span>
              <Badge className="capitalize" variant="secondary">
                {values.paymentFrequency}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Advance Months:</span>
              <span className="font-medium">
                {values.advanceMonths} month
                {values.advanceMonths !== 1 ? "s" : ""}
              </span>
            </div>
            {values.serviceFee && values.serviceFee > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Service Fee:</span>
                <span className="font-medium">
                  KES {values.serviceFee.toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Amenities */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              Amenities ({values.amenities?.length || 0})
            </CardTitle>
            <Button
              onClick={() => onEdit(4)}
              size="sm"
              type="button"
              variant="ghost"
            >
              Edit
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {values.amenities && values.amenities.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {values.amenities.map((amenity) => (
                <Badge key={amenity} variant="secondary">
                  {amenity}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              No amenities selected
            </p>
          )}
        </CardContent>
      </Card>

      {/* Media */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              Photos ({values.images?.length || 0})
            </CardTitle>
            <Button
              onClick={() => onEdit(5)}
              size="sm"
              type="button"
              variant="ghost"
            >
              Edit
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {values.images && values.images.length > 0 ? (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
              {values.images.map((image, index) => (
                <div
                  className="relative aspect-square overflow-hidden rounded-md"
                  key={index.toString()}
                >
                  <Image
                    alt={`Property ${index + 1}`}
                    className="h-full w-full object-cover"
                    height={100}
                    src={image}
                    width={100}
                  />
                  {index === 0 && (
                    <Badge
                      className="absolute top-1 left-1 text-xs"
                      variant="default"
                    >
                      Primary
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No images uploaded</p>
          )}
        </CardContent>
      </Card>

      {/* Availability & Contact */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="h-5 w-5" />
              Availability & Contact
            </CardTitle>
            <Button
              onClick={() => onEdit(6)}
              size="sm"
              type="button"
              variant="ghost"
            >
              Edit
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {values.availableFrom ? (
            <div>
              <span className="text-muted-foreground">Available from: </span>
              <span className="font-medium">
                {new Date(values.availableFrom).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
          ) : (
            <div>
              <Badge variant="default">Available Immediately</Badge>
            </div>
          )}
          <Separator />
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{values.viewingContact?.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <a
                className="text-blue-600 hover:underline"
                href={`tel:${values.viewingContact?.phone}`}
              >
                {values.viewingContact?.phone}
              </a>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rules */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Property Rules</CardTitle>
            <Button
              onClick={() => onEdit(7)}
              size="sm"
              type="button"
              variant="ghost"
            >
              Edit
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Pets:</span>
            <Badge variant={values.petsAllowed ? "default" : "secondary"}>
              {values.petsAllowed ? "Allowed" : "Not Allowed"}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Minimum Lease:</span>
            <Badge variant="secondary">
              {values.minimumLease}{" "}
              {values.minimumLease === 1 ? "month" : "months"}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
