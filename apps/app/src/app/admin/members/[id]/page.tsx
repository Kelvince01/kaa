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
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  CircleX,
  User,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Shell } from "@/components/shell";
import { MemberDetails, MemberStats, useMember } from "@/modules/members";
import { formatDate } from "@/shared/utils/format.util";

export default function MemberDetailPage() {
  const params = useParams();
  const router = useRouter();
  const memberId = params.id as string;

  const { data, isLoading } = useMember(memberId);

  if (isLoading) {
    return (
      <Shell>
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="mb-4 text-muted-foreground">
              Loading member details...
            </div>
          </div>
        </div>
      </Shell>
    );
  }

  if (!data?.data) {
    return (
      <Shell>
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="mb-4 font-semibold text-lg">Member not found</div>
            <Button asChild variant="outline">
              <Link href="/admin/members">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Members
              </Link>
            </Button>
          </div>
        </div>
      </Shell>
    );
  }

  const member = data.data;

  return (
    <Shell className="gap-4">
      {/* Header with back button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button onClick={() => router.back()} size="sm" variant="ghost">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="font-bold text-2xl">{member.name}</h1>
            <p className="text-muted-foreground text-sm">@{member.slug}</p>
          </div>
        </div>
        <Badge variant={member.isActive ? "default" : "secondary"}>
          {member.isActive ? (
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

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Details */}
        <div className="space-y-6 lg:col-span-2">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Member Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <User className="h-4 w-4" />
                  <span>User</span>
                </div>
                <span className="font-medium text-sm">
                  {typeof member.user === "string"
                    ? member.user
                    : member.user?.email || "N/A"}
                </span>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Building2 className="h-4 w-4" />
                  <span>Organization</span>
                </div>
                <span className="font-medium text-sm">
                  {typeof member.organization === "string"
                    ? member.organization
                    : member.organization?.name || "N/A"}
                </span>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">Role</span>
                <Badge variant="secondary">
                  {typeof member.role === "string"
                    ? member.role
                    : member.role?.name || "N/A"}
                </Badge>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">Plan</span>
                <Badge variant="outline">
                  {typeof member.plan === "string"
                    ? member.plan
                    : member.plan?.name || "N/A"}
                </Badge>
              </div>

              {member.domain && (
                <>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-sm">
                      Domain
                    </span>
                    <span className="font-medium text-sm">{member.domain}</span>
                  </div>
                </>
              )}

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Calendar className="h-4 w-4" />
                  <span>Created</span>
                </div>
                <span className="font-medium text-sm">
                  {formatDate(member.createdAt)}
                </span>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Calendar className="h-4 w-4" />
                  <span>Last Updated</span>
                </div>
                <span className="font-medium text-sm">
                  {formatDate(member.updatedAt)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Member Stats */}
          <MemberStats memberId={memberId} />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <MemberDetails memberId={memberId} />
        </div>
      </div>
    </Shell>
  );
}
