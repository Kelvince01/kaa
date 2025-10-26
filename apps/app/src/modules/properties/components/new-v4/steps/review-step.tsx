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
  Building2,
  Calendar,
  Check,
  DollarSign,
  Edit,
  Home,
  Image as ImageIcon,
  MapPin,
  PawPrint,
  Phone,
  Sparkles,
  User,
} from "lucide-react";
import Image from "next/image";
import { useFormContext } from "react-hook-form";
import type { PropertyFormData } from "../schema";

type ReviewStepProps = {
  onEdit?: (stepId: string) => void;
};

export function ReviewStep({ onEdit }: ReviewStepProps) {
  const form = useFormContext<PropertyFormData>();
  const data = form.getValues();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h2 className="font-semibold text-2xl text-foreground md:text-3xl">
          Review Your Listing
        </h2>
        <p className="text-muted-foreground text-sm md:text-base">
          Please review all information before submitting
        </p>
      </div>

      {/* Completion Status */}
      <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950/20">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-600 text-white">
            <Check className="h-6 w-6" />
          </div>
          <div>
            <p className="font-semibold text-green-900 dark:text-green-100">
              All Required Fields Complete
            </p>
            <p className="text-green-700 text-sm dark:text-green-300">
              Your listing is ready to be submitted
            </p>
          </div>
        </div>
      </div>

      {/* Basic Information */}
      <SectionCard
        icon={Home}
        onEdit={onEdit}
        stepId="basic"
        title="Basic Information"
      >
        <InfoRow label="Title" value={data.title} />
        <InfoRow
          label="Property Type"
          value={data.type ? data.type.replace(/_/g, " ").toUpperCase() : "—"}
        />
        <InfoRow
          label="Furnished"
          value={data.furnished ? data.furnished.replace(/_/g, " ") : "—"}
        />
        <div className="pt-2">
          <p className="mb-1 text-muted-foreground text-xs">Description:</p>
          <p className="line-clamp-3 text-sm">{data.description}</p>
        </div>
        {data.tags && data.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-2">
            {data.tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Location */}
      <SectionCard
        icon={MapPin}
        onEdit={onEdit}
        stepId="location"
        title="Location"
      >
        <InfoRow label="County" value={data.county} />
        <InfoRow label="Estate" value={data.estate} />
        <InfoRow label="Address" value={data.address} />
        {data.buildingName && (
          <InfoRow label="Building" value={data.buildingName} />
        )}
        {data.plotNumber && <InfoRow label="Plot #" value={data.plotNumber} />}
        <InfoRow
          label="Coordinates"
          value={`${data.coordinates.latitude.toFixed(4)}, ${data.coordinates.longitude.toFixed(4)}`}
        />
        {data.nearbyAmenities && data.nearbyAmenities.length > 0 && (
          <div className="pt-2">
            <p className="mb-1 text-muted-foreground text-xs">Nearby:</p>
            <div className="flex flex-wrap gap-1">
              {data.nearbyAmenities.map((amenity) => (
                <Badge key={amenity} variant="outline">
                  {amenity}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </SectionCard>

      {/* Specifications */}
      <SectionCard
        icon={Building2}
        onEdit={onEdit}
        stepId="specifications"
        title="Specifications"
      >
        <InfoRow label="Bedrooms" value={data.bedrooms} />
        <InfoRow label="Bathrooms" value={data.bathrooms} />
        {data.totalArea && (
          <InfoRow label="Total Area" value={`${data.totalArea} m²`} />
        )}
        <InfoRow
          label="Condition"
          value={data.condition ? data.condition.replace(/_/g, " ") : "—"}
        />
      </SectionCard>

      {/* Pricing */}
      <SectionCard
        icon={DollarSign}
        onEdit={onEdit}
        stepId="pricing"
        title="Pricing"
      >
        <InfoRow
          label="Monthly Rent"
          value={`KES ${data.rent.toLocaleString()}`}
        />
        <InfoRow
          label="Security Deposit"
          value={`KES ${data.deposit.toLocaleString()}`}
        />
        {data.serviceFee && data.serviceFee > 0 ? (
          <InfoRow
            label="Service Fee"
            value={`KES ${data.serviceFee.toLocaleString()}`}
          />
        ) : null}
        <InfoRow label="Payment Frequency" value={data.paymentFrequency} />
        <InfoRow
          label="Advance Payment"
          value={`${data.advanceMonths} month${data.advanceMonths > 1 ? "s" : ""}`}
        />
        <Separator className="my-2" />
        <InfoRow
          label="Total Upfront"
          value={
            <span className="font-bold text-base text-primary">
              KES{" "}
              {(
                data.rent * data.advanceMonths +
                data.deposit +
                (data.serviceFee || 0)
              ).toLocaleString()}
            </span>
          }
        />
      </SectionCard>

      {/* Amenities */}
      <SectionCard
        icon={Sparkles}
        onEdit={onEdit}
        stepId="amenities"
        title="Amenities"
      >
        <div className="flex flex-wrap gap-2">
          {data.amenities.map((amenity) => (
            <Badge key={amenity} variant="secondary">
              {amenity.replace(/_/g, " ")}
            </Badge>
          ))}
        </div>
      </SectionCard>

      {/* Media */}
      <SectionCard
        icon={ImageIcon}
        onEdit={onEdit}
        stepId="media"
        title="Media"
      >
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
          {data.images.map((imageUrl, index) => (
            <div
              className="relative aspect-square overflow-hidden rounded-lg border"
              key={imageUrl}
            >
              <Image
                alt={`Property ${index + 1}`}
                className="h-full w-full object-cover"
                height={100}
                src={imageUrl}
                width={100}
              />
              {index === 0 && (
                <Badge className="absolute top-1 left-1 text-xs">Primary</Badge>
              )}
            </div>
          ))}
        </div>
        <p className="text-muted-foreground text-xs">
          {data.images.length} image{data.images.length !== 1 ? "s" : ""}{" "}
          uploaded
        </p>
      </SectionCard>

      {/* Availability */}
      <SectionCard
        icon={Calendar}
        onEdit={onEdit}
        stepId="availability"
        title="Availability"
      >
        {data.availableFrom && (
          <InfoRow
            label="Available From"
            value={new Date(data.availableFrom).toLocaleDateString()}
          />
        )}
        <Separator className="my-2" />
        <div className="space-y-1">
          <p className="font-medium text-sm">Viewing Contact:</p>
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-muted-foreground" />
            <span>{data.viewingContact.name}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span>{data.viewingContact.phone}</span>
          </div>
        </div>
      </SectionCard>

      {/* Rules */}
      <SectionCard
        icon={PawPrint}
        onEdit={onEdit}
        stepId="rules"
        title="Rules & Policies"
      >
        <InfoRow label="Pets Allowed" value={data.petsAllowed ? "Yes" : "No"} />
        <InfoRow
          label="Minimum Lease"
          value={`${data.minimumLease} month${data.minimumLease > 1 ? "s" : ""}`}
        />
      </SectionCard>

      {/* Final Note */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/20">
        <p className="text-blue-900 text-sm dark:text-blue-100">
          <strong>Note:</strong> After submission, your property will be
          reviewed by our team. You'll receive a notification once it's approved
          and live on the platform.
        </p>
      </div>
    </div>
  );
}

const SectionCard = ({
  title,
  stepId,
  icon: Icon,
  children,
  onEdit,
}: {
  title: string;
  stepId: string;
  icon: React.ElementType;
  children: React.ReactNode;
  onEdit?: (stepId: string) => void;
}) => (
  <Card>
    <CardHeader className="pb-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-primary" />
          <CardTitle className="text-base">{title}</CardTitle>
        </div>
        {onEdit && (
          <Button
            onClick={() => onEdit(stepId)}
            size="sm"
            type="button"
            variant="ghost"
          >
            <Edit className="mr-1 h-3 w-3" />
            Edit
          </Button>
        )}
      </div>
    </CardHeader>
    <CardContent className="space-y-2 text-sm">{children}</CardContent>
  </Card>
);

const InfoRow = ({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) => (
  <div className="flex justify-between gap-4">
    <span className="text-muted-foreground">{label}:</span>
    <span className="text-right font-medium">{value}</span>
  </div>
);
