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
  Settings,
  Users,
} from "lucide-react";
import Image from "next/image";
import { formatDate } from "@/shared/utils/format.util";
import { useMember } from "../member.queries";
import type { MemberPlan } from "../member.type";

type MemberDetailsProps = {
  memberId: string;
};

const PLAN_COLORS: Record<MemberPlan, string> = {
  free: "bg-gray-100 text-gray-800",
  starter: "bg-blue-100 text-blue-800",
  professional: "bg-purple-100 text-purple-800",
  enterprise: "bg-green-100 text-green-800",
};

export function MemberDetails({ memberId }: MemberDetailsProps) {
  const { data, isLoading } = useMember(memberId);

  if (isLoading) {
    return <div className="p-4 text-center">Loading member details...</div>;
  }

  if (!data?.data) {
    return <div className="p-4 text-center">Member not found</div>;
  }

  const member = data.data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              {member.logo ? (
                <Image
                  alt={`${member.name} logo`}
                  className="h-16 w-16 rounded-lg object-cover"
                  height={64}
                  src={member.logo}
                  width={64}
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-muted">
                  <Building2 className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              <div>
                <CardTitle className="text-2xl">{member.name}</CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <span>@{member.slug}</span>
                  <Badge
                    className={`${PLAN_COLORS[typeof member.plan === "string" ? (member.plan as MemberPlan) : "free"]} capitalize`}
                    variant="outline"
                  >
                    {typeof member.plan === "string"
                      ? member.plan
                      : (member.plan as any)?.name || "free"}
                  </Badge>
                </CardDescription>
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
        </CardHeader>
      </Card>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {member.domain && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Globe className="h-4 w-4" />
                <span>Domain</span>
              </div>
              <Button asChild size="sm" variant="link">
                <a
                  href={member.domain}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {member.domain}
                  <ExternalLink className="ml-2 h-3 w-3" />
                </a>
              </Button>
            </div>
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

      {/* Usage & Limits */}
      <Card>
        <CardHeader>
          <CardTitle>Usage & Limits</CardTitle>
          <CardDescription>Current usage against plan limits</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Users className="h-4 w-4" />
                <span>Users</span>
              </div>
              <span className="font-medium text-sm">
                {member.usage.users} / {member.limits.users}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full ${
                  (member.usage.users / member.limits.users) * 100 > 80
                    ? "bg-red-600"
                    : "bg-primary"
                }`}
                style={{
                  width: `${Math.min((member.usage.users / member.limits.users) * 100, 100)}%`,
                }}
              />
            </div>
          </div>

          <Separator />

          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-muted-foreground text-sm">API Calls</span>
              <span className="font-medium text-sm">
                {member.usage.apiCalls.toLocaleString()} /{" "}
                {member.limits.apiCalls.toLocaleString()}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full ${
                  (member.usage.apiCalls / member.limits.apiCalls) * 100 > 80
                    ? "bg-red-600"
                    : "bg-primary"
                }`}
                style={{
                  width: `${Math.min((member.usage.apiCalls / member.limits.apiCalls) * 100, 100)}%`,
                }}
              />
            </div>
          </div>

          <Separator />

          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-muted-foreground text-sm">Storage</span>
              <span className="font-medium text-sm">
                {(member.usage.storage / 1024 / 1024 / 1024).toFixed(2)} GB /{" "}
                {(member.limits.storage / 1024 / 1024 / 1024).toFixed(2)} GB
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full ${
                  (member.usage.storage / member.limits.storage) * 100 > 80
                    ? "bg-red-600"
                    : "bg-primary"
                }`}
                style={{
                  width: `${Math.min((member.usage.storage / member.limits.storage) * 100, 100)}%`,
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-sm">Theme</span>
            <Badge className="capitalize" variant="outline">
              {member.settings.theme || "light"}
            </Badge>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-sm">
              Custom Branding
            </span>
            <Badge
              variant={member.settings.customBranding ? "default" : "outline"}
            >
              {member.settings.customBranding ? "Enabled" : "Disabled"}
            </Badge>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-sm">Allow Invites</span>
            <Badge
              variant={member.settings.allowInvites ? "default" : "outline"}
            >
              {member.settings.allowInvites ? "Enabled" : "Disabled"}
            </Badge>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-sm">
              Email Verification Required
            </span>
            <Badge
              variant={
                member.settings.requireEmailVerification ? "default" : "outline"
              }
            >
              {member.settings.requireEmailVerification
                ? "Required"
                : "Optional"}
            </Badge>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-sm">
              Two-Factor Authentication
            </span>
            <Badge
              variant={
                member.settings.twoFactorRequired ? "default" : "outline"
              }
            >
              {member.settings.twoFactorRequired ? "Required" : "Optional"}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
