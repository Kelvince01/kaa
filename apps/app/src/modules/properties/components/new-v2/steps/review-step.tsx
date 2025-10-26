"use client";

import { PropertyType } from "@kaa/models/types";
import { Badge } from "@kaa/ui/components/badge";
import { Card } from "@kaa/ui/components/card";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  DollarSign,
  Home,
  MapPin,
  User,
} from "lucide-react";
import Image from "next/image";
import { useFormContext } from "react-hook-form";
import type { PropertyFormData } from "../schema";

const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  [PropertyType.APARTMENT]: "Apartment",
  [PropertyType.HOUSE]: "House",
  [PropertyType.FLAT]: "Flat",
  [PropertyType.STUDIO]: "Studio",
  [PropertyType.BEDSITTER]: "Bedsitter",
  [PropertyType.VILLA]: "Villa",
  [PropertyType.PENTHOUSE]: "Penthouse",
  [PropertyType.MAISONETTE]: "Maisonette",
  [PropertyType.LAND]: "Land",
  [PropertyType.SHOP]: "Shop",
  [PropertyType.OFFICE]: "Office",
  [PropertyType.WAREHOUSE]: "Warehouse",
  [PropertyType.COMMERCIAL]: "Commercial",
  [PropertyType.OTHER]: "Other",
};

export function ReviewStep() {
  const form = useFormContext<PropertyFormData>();
  const data = form.getValues();

  const sections = [
    {
      title: "Basic Information",
      icon: Home,
      items: [
        { label: "Title", value: data.title },
        {
          label: "Type",
          value: data.type
            ? PROPERTY_TYPE_LABELS[data.type as PropertyType]
            : "Not specified",
        },
        { label: "Description", value: data.description, truncate: true },
        {
          label: "Tags",
          value: data.tags?.length ? data.tags.join(", ") : "None",
        },
      ],
    },
    {
      title: "Location",
      icon: MapPin,
      items: [
        { label: "County", value: data.county },
        { label: "Estate", value: data.estate },
        { label: "Address", value: data.address },
        {
          label: "Building",
          value: data.buildingName || "Not specified",
        },
        {
          label: "Plot Number",
          value: data.plotNumber || "Not specified",
        },
        {
          label: "Coordinates",
          value: data.coordinates
            ? `${data.coordinates.latitude.toFixed(4)}, ${data.coordinates.longitude.toFixed(4)}`
            : "Not set",
        },
        {
          label: "Nearby Amenities",
          value: data.nearbyAmenities?.length
            ? `${data.nearbyAmenities.length} listed`
            : "None",
        },
      ],
    },
    {
      title: "Specifications",
      icon: Home,
      items: [
        { label: "Bedrooms", value: data.bedrooms?.toString() || "0" },
        { label: "Bathrooms", value: data.bathrooms?.toString() || "0" },
        {
          label: "Total Area",
          value: data.totalArea ? `${data.totalArea} m²` : "Not specified",
        },
        {
          label: "Furnished",
          value: data.furnished?.replace("_", " ") || "Not specified",
        },
        {
          label: "Condition",
          value: data.condition?.replace("_", " ") || "Not specified",
        },
      ],
    },
    {
      title: "Pricing",
      icon: DollarSign,
      items: [
        {
          label: "Monthly Rent",
          value: `KES ${(data.rent || 0).toLocaleString()}`,
        },
        {
          label: "Deposit",
          value: `KES ${(data.deposit || 0).toLocaleString()} (${data.depositMonths || 0} months)`,
        },
        {
          label: "Service Fee",
          value: data.serviceFee
            ? `KES ${data.serviceFee.toLocaleString()}`
            : "None",
        },
        {
          label: "Payment Frequency",
          value: data.paymentFrequency || "Not set",
        },
        {
          label: "Advance Payment",
          value: `${data.advanceMonths || 0} months`,
        },
        {
          label: "Total Upfront",
          value: `KES ${(
            (data.rent || 0) * (data.advanceMonths || 0) +
              (data.deposit || 0) +
              (data.serviceFee || 0)
          ).toLocaleString()}`,
        },
      ],
    },
    {
      title: "Amenities",
      icon: CheckCircle2,
      items: [
        {
          label: "Selected Amenities",
          value: `${data.amenities?.length || 0} amenities`,
        },
      ],
    },
    {
      title: "Media",
      icon: CheckCircle2,
      items: [
        {
          label: "Images",
          value: `${data.images?.length || 0} images uploaded`,
        },
      ],
    },
    {
      title: "Availability",
      icon: Calendar,
      items: [
        {
          label: "Available From",
          value: data.availableFrom
            ? new Date(data.availableFrom).toLocaleDateString()
            : "Immediately",
        },
        {
          label: "Contact Name",
          value: data.viewingContact?.name || "Not set",
        },
        {
          label: "Contact Phone",
          value: data.viewingContact?.phone || "Not set",
        },
      ],
    },
    {
      title: "Rules & Policies",
      icon: User,
      items: [
        {
          label: "Pets Allowed",
          value: data.petsAllowed ? "Yes" : "No",
        },
        {
          label: "Minimum Lease",
          value: `${data.minimumLease || 0} months`,
        },
      ],
    },
  ];

  const isComplete = form.formState.isValid;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-2 font-semibold text-2xl text-foreground">
          Review & Submit
        </h2>
        <p className="text-muted-foreground text-sm">
          Review all information before submitting your property listing
        </p>
      </div>

      {!isComplete && (
        <Card className="border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-950/20">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-yellow-600 dark:text-yellow-400" />
            <div className="space-y-1">
              <h4 className="font-medium text-yellow-900 dark:text-yellow-100">
                Incomplete Information
              </h4>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                Please go back and complete all required fields before
                submitting.
              </p>
            </div>
          </div>
        </Card>
      )}

      <div className="space-y-4">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <Card className="p-5" key={section.title}>
              <div className="mb-4 flex items-center gap-2">
                <Icon className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-lg">{section.title}</h3>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {section.items.map((item) => (
                  <div className="space-y-1" key={item.label}>
                    <p className="text-muted-foreground text-sm">
                      {item.label}
                    </p>
                    <p
                      className={`font-medium text-sm ${
                        item.truncate ? "line-clamp-2" : ""
                      }`}
                    >
                      {item.value || (
                        <span className="text-muted-foreground italic">
                          Not provided
                        </span>
                      )}
                    </p>
                  </div>
                ))}
              </div>

              {section.title === "Amenities" && data.amenities?.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {data.amenities.slice(0, 10).map((amenity) => (
                    <Badge key={amenity} variant="secondary">
                      {amenity}
                    </Badge>
                  ))}
                  {data.amenities.length > 10 && (
                    <Badge variant="outline">
                      +{data.amenities.length - 10} more
                    </Badge>
                  )}
                </div>
              )}

              {section.title === "Media" && data.images?.length > 0 && (
                <div className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8">
                  {data.images.slice(0, 8).map((url) => (
                    <div
                      className="aspect-square overflow-hidden rounded-md border"
                      key={url}
                    >
                      <Image
                        alt={`Property ${url}`}
                        className="h-full w-full object-cover"
                        height={100}
                        src={url}
                        width={100}
                      />
                    </div>
                  ))}
                  {data.images.length > 8 && (
                    <div className="flex aspect-square items-center justify-center overflow-hidden rounded-md border bg-muted text-muted-foreground text-xs">
                      +{data.images.length - 8}
                    </div>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <Card className="border-primary/20 bg-primary/5 p-5">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Ready to Submit?</h3>
          </div>
          <p className="text-muted-foreground text-sm">
            Once you submit, your property will be reviewed by our team. You'll
            receive a notification once it's approved and published. You can
            edit your listing anytime from your dashboard.
          </p>
        </div>
      </Card>
    </div>
  );
}
