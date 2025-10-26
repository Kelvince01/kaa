"use client";

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
  CheckCircle,
  Clock,
  Copy,
  RefreshCw,
  Star,
  User,
  XCircle,
} from "lucide-react";

import type { Reference } from "../../reference.type";
import {
  canResendReference,
  formatDate,
  formatDateTime,
  formatDeclineReason,
  generateReferenceInvitationUrl,
  getDaysUntilExpiry,
} from "../../utils/reference-utils";
import { StatusBadge } from "../status/status-badge";
import { TypeBadge } from "../status/type-badge";

type EnhancedReferenceListProps = {
  references: Reference[];
  onResend?: (referenceId: string) => void;
  onCopyLink?: (reference: Reference) => void;
  loading?: boolean;
};

function ReferenceCard({
  reference,
  onResend,
  onCopyLink,
  loading,
}: {
  reference: Reference;
  onResend?: (id: string) => void;
  onCopyLink?: (reference: Reference) => void;
  loading?: boolean;
}) {
  const isExpired = new Date(reference.expiresAt) < new Date();
  const canResend = canResendReference(reference);
  const daysUntilExpiry = getDaysUntilExpiry(reference.expiresAt);

  return (
    <Card className="mb-4 transition-shadow hover:shadow-md">
      <CardContent className="pt-6">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex-1">
            <div className="mb-2 flex items-center gap-3">
              <div>
                <h3 className="font-semibold text-lg">
                  {reference.referenceProvider.name}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {reference.referenceProvider.email}
                </p>
                <p className="text-muted-foreground text-xs">
                  {reference.referenceProvider.relationship}
                </p>
              </div>
            </div>

            <div className="mt-2 flex items-center gap-4">
              <TypeBadge showIcon type={reference.referenceType} />
              <StatusBadge status={reference.status} />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Button
              className="text-xs"
              onClick={() => onCopyLink?.(reference)}
              size="sm"
              variant="outline"
            >
              <Copy className="mr-1 h-3 w-3" />
              Copy Link
            </Button>

            {canResend && onResend && (
              <Button
                className="text-xs"
                disabled={loading}
                onClick={() => onResend(reference._id)}
                size="sm"
                variant="outline"
              >
                {loading ? (
                  <RefreshCw className="mr-1 h-3 w-3 animate-spin" />
                ) : (
                  <RefreshCw className="mr-1 h-3 w-3" />
                )}
                Resend
              </Button>
            )}
          </div>
        </div>

        {/* Status Details */}
        <div className="space-y-3">
          <div className="flex items-center gap-4 text-muted-foreground text-sm">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>Requested: {formatDate(reference.submittedAt)}</span>
            </div>

            {reference.status === "completed" && reference.completedAt && (
              <div className="flex items-center gap-1 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span>Completed: {formatDate(reference.completedAt)}</span>
              </div>
            )}

            {reference.status === "declined" && reference.declinedAt && (
              <div className="flex items-center gap-1 text-red-600">
                <XCircle className="h-4 w-4" />
                <span>Declined: {formatDate(reference.declinedAt)}</span>
              </div>
            )}

            {reference.status === "pending" && (
              <div className="flex items-center gap-1 text-yellow-600">
                <Clock className="h-4 w-4" />
                <span>
                  {daysUntilExpiry > 0
                    ? `Expires in ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? "s" : ""}`
                    : "Expired"}
                </span>
              </div>
            )}
          </div>

          {/* Completed Reference Details */}
          {reference.status === "completed" && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-medium text-green-800">
                  Reference Completed
                </span>
                {reference.rating && (
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-current text-yellow-500" />
                    <span className="font-medium">{reference.rating}/5</span>
                  </div>
                )}
              </div>
              {reference.feedback && (
                <p className="mt-2 text-green-700 text-sm">
                  "{reference.feedback}"
                </p>
              )}
            </div>
          )}

          {/* Declined Reference Details */}
          {reference.status === "declined" && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-medium text-red-800">
                  Reference Declined
                </span>
              </div>
              {reference.declineReason && (
                <p className="text-red-700 text-sm">
                  <span className="font-medium">Reason:</span>{" "}
                  {formatDeclineReason(reference.declineReason)}
                </p>
              )}
              {reference.declineComment && (
                <p className="mt-1 text-red-700 text-sm">
                  <span className="font-medium">Comment:</span> "
                  {reference.declineComment}"
                </p>
              )}
            </div>
          )}

          {/* Request Attempts */}
          {reference.requestAttempts &&
            reference.requestAttempts.length > 0 && (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <h4 className="mb-2 font-medium text-gray-800">
                  Request Attempts ({reference.requestAttempts.length})
                </h4>
                <div className="space-y-1">
                  {reference.requestAttempts.map((attempt, index) => (
                    <div
                      className="flex items-center gap-2 text-gray-600 text-xs"
                      key={index.toString()}
                    >
                      <span className="w-16">#{attempt.attemptNumber}</span>
                      <span className="flex-1">
                        {formatDateTime(attempt.sentAt)}
                      </span>
                      <Badge
                        className="text-xs"
                        variant={
                          attempt.deliveryStatus === "delivered"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {attempt.deliveryStatus}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
        </div>
      </CardContent>
    </Card>
  );
}

export function EnhancedReferenceList({
  references,
  onResend,
  onCopyLink,
  loading,
}: EnhancedReferenceListProps) {
  const handleCopyLink = (reference: Reference) => {
    if (onCopyLink) {
      onCopyLink(reference);
    } else {
      // Default implementation
      const url = generateReferenceInvitationUrl(reference.referenceToken);
      navigator.clipboard.writeText(url);
    }
  };

  if (references.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            <User className="mx-auto mb-4 h-12 w-12 text-muted-foreground/40" />
            <p className="mb-2 font-medium text-lg">No references yet</p>
            <p className="text-sm">Start by requesting your first reference.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Sort references by status priority and date
  const sortedReferences = [...references].sort((a, b) => {
    const statusPriority = {
      pending: 0,
      completed: 1,
      declined: 2,
      expired: 3,
    };
    const aPriority = statusPriority[a.status] ?? 4;
    const bPriority = statusPriority[b.status] ?? 4;

    if (aPriority !== bPriority) {
      return aPriority - bPriority;
    }

    return (
      new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    );
  });

  const completedCount = references.filter(
    (r) => r.status === "completed"
  ).length;
  const pendingCount = references.filter((r) => r.status === "pending").length;
  const declinedCount = references.filter(
    (r) => r.status === "declined"
  ).length;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Reference Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="font-bold text-2xl text-green-600">
                {completedCount}
              </div>
              <div className="text-muted-foreground text-sm">Completed</div>
            </div>
            <div>
              <div className="font-bold text-2xl text-yellow-600">
                {pendingCount}
              </div>
              <div className="text-muted-foreground text-sm">Pending</div>
            </div>
            <div>
              <div className="font-bold text-2xl text-red-600">
                {declinedCount}
              </div>
              <div className="text-muted-foreground text-sm">Declined</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* References List */}
      <div>
        <h2 className="mb-4 font-semibold text-lg">All References</h2>
        {sortedReferences.map((reference) => (
          <ReferenceCard
            key={reference._id}
            loading={loading}
            onCopyLink={handleCopyLink}
            onResend={onResend}
            reference={reference}
          />
        ))}
      </div>
    </div>
  );
}

export default EnhancedReferenceList;
