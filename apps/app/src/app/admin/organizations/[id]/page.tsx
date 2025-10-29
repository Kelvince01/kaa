"use client";

import { Button } from "@kaa/ui/components/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Shell } from "@/components/shell";
import { OrganizationDetails, useOrganization } from "@/modules/organizations";

export default function OrganizationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const organizationId = params.id as string;

  const { data, isLoading } = useOrganization(organizationId);

  if (isLoading) {
    return (
      <Shell>
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="mb-4 text-muted-foreground">
              Loading organization details...
            </div>
          </div>
        </div>
      </Shell>
    );
  }

  if (!data?.organization) {
    return (
      <Shell>
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="mb-4 font-semibold text-lg">
              Organization not found
            </div>
            <Button asChild variant="outline">
              <Link href="/admin/organizations">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Organizations
              </Link>
            </Button>
          </div>
        </div>
      </Shell>
    );
  }

  return (
    <Shell className="gap-4">
      {/* Header with back button */}
      <div className="flex items-center gap-4">
        <Button onClick={() => router.back()} size="sm" variant="ghost">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="font-bold text-2xl">{data.organization.name}</h1>
          <p className="text-muted-foreground text-sm">Organization Details</p>
        </div>
      </div>

      {/* Organization Details Component */}
      <OrganizationDetails organizationId={organizationId} />
    </Shell>
  );
}
