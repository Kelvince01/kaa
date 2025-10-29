"use client";

import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import { Separator } from "@kaa/ui/components/separator";
import {
  Building2,
  Calendar,
  CheckCircle2,
  CircleX,
  ExternalLink,
  Globe,
  Mail,
  MapPin,
  Phone,
} from "lucide-react";
import Image from "next/image";
import { formatDate } from "@/shared/utils/format.util";
import { useOrganization } from "../organization.queries";
import type { OrganizationType } from "../organization.type";
import { OrganizationMembers } from "./organization-members";

type OrganizationDetailsProps = {
  organizationId: string;
};

const TYPE_COLORS: Record<OrganizationType, string> = {
  landlord: "bg-blue-100 text-blue-800",
  property_manager: "bg-purple-100 text-purple-800",
  agency: "bg-green-100 text-green-800",
  other: "bg-gray-100 text-gray-800",
};

const TYPE_LABELS: Record<OrganizationType, string> = {
  landlord: "Landlord",
  property_manager: "Property Manager",
  agency: "Agency",
  other: "Other",
};

export function OrganizationDetails({
  organizationId,
}: OrganizationDetailsProps) {
  const { data, isLoading } = useOrganization(organizationId);

  if (isLoading) {
    return (
      <div className="p-4 text-center">Loading organization details...</div>
    );
  }

  if (!data?.organization) {
    return <div className="p-4 text-center">Organization not found</div>;
  }

  const org = data.organization;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              {org.logo ? (
                <Image
                  alt={`${org.name} logo`}
                  className="rounded-lg object-cover"
                  height={64}
                  src={org.logo}
                  width={64}
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-muted">
                  <Building2 className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              <div>
                <CardTitle className="text-2xl">{org.name}</CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <span>@{org.slug}</span>
                  <Badge
                    className={`${TYPE_COLORS[org.type]} capitalize`}
                    variant="outline"
                  >
                    {TYPE_LABELS[org.type]}
                  </Badge>
                </CardDescription>
              </div>
            </div>
            <Badge variant={org.isActive ? "default" : "secondary"}>
              {org.isActive ? (
                <>
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  Active
                </>
              ) : (
                <>
                  <CircleX className="mr-1 h-3 w-3" />
                  Inactive
                </>
              )}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Mail className="h-4 w-4" />
              <span>Email</span>
            </div>
            <a
              className="font-medium text-blue-600 text-sm hover:underline"
              href={`mailto:${org.email}`}
            >
              {org.email}
            </a>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Phone className="h-4 w-4" />
              <span>Phone</span>
            </div>
            <a
              className="font-medium text-blue-600 text-sm hover:underline"
              href={`tel:${org.phone}`}
            >
              {org.phone}
            </a>
          </div>
          {org.website && (
            <>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Globe className="h-4 w-4" />
                  <span>Website</span>
                </div>
                <Button asChild size="sm" variant="link">
                  <a
                    href={org.website}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    {org.website}
                    <ExternalLink className="ml-2 h-3 w-3" />
                  </a>
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Address */}
      <Card>
        <CardHeader>
          <CardTitle>Address</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-2">
            <MapPin className="mt-1 h-4 w-4 text-muted-foreground" />
            <div className="space-y-1 text-sm">
              <div>{org.address.street}</div>
              <div>{org.address.town}</div>
              <div>{org.address.county}</div>
              <div>{org.address.country}</div>
              {org.address.postalCode && <div>{org.address.postalCode}</div>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Information */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {org.registrationNumber && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">
                  Registration Number
                </span>
                <span className="font-medium text-sm">
                  {org.registrationNumber}
                </span>
              </div>
              <Separator />
            </>
          )}
          {org.kraPin && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">KRA PIN</span>
                <span className="font-medium text-sm">{org.kraPin}</span>
              </div>
              <Separator />
            </>
          )}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Calendar className="h-4 w-4" />
              <span>Created</span>
            </div>
            <span className="font-medium text-sm">
              {formatDate(org.createdAt)}
            </span>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Calendar className="h-4 w-4" />
              <span>Last Updated</span>
            </div>
            <span className="font-medium text-sm">
              {formatDate(org.updatedAt)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Members */}
      <OrganizationMembers organization={org} />
    </div>
  );
}
