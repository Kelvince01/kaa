"use client";

import { Button } from "@kaa/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@kaa/ui/components/dialog";
import { ScrollArea } from "@kaa/ui/components/scroll-area";
import { CheckCircle, ClipboardCheck, Clock, Plus, Users } from "lucide-react";
import { useState } from "react";
import { CreateReferenceForm } from "@/modules/references/components/forms/create-reference-form";
import { StatusBadge } from "@/modules/references/components/status/status-badge";
import { TypeBadge } from "@/modules/references/components/status/type-badge";
import {
  useReferences,
  useResendReference,
} from "@/modules/references/reference.queries";
import { useReferenceStore } from "@/modules/references/reference.store";
import type { Reference } from "@/modules/references/reference.type";
import {
  formatDate,
  generateReferenceInvitationUrl,
  generateReferenceSummary,
  getReferenceStats,
} from "@/modules/references/utils/reference-utils";
import { useTenant } from "@/modules/tenants/tenant.store";

export default function ReferencesPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const tenant = useTenant();
  const { data: referencesData, isLoading } = useReferences(tenant?._id || "");
  const { setReferenceModalOpen } = useReferenceStore();
  const resendReferenceMutation = useResendReference();

  const references = referencesData?.items || [];
  const stats = getReferenceStats(references);

  const handleCopyReferenceLink = (reference: Reference) => {
    const url = generateReferenceInvitationUrl(reference.referenceToken);
    navigator.clipboard.writeText(url);
    // In a real app, show a toast notification
    console.log("Reference link copied to clipboard");
  };

  const handleResendInvitation = async (referenceId: string) => {
    try {
      await resendReferenceMutation.mutateAsync(referenceId);
      // You could show a success toast here
      console.log("Reference request resent successfully");
    } catch (error) {
      console.error("Failed to resend reference request:", error);
      // You could show an error toast here
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto space-y-6 py-6">
        <div className="animate-pulse">
          <div className="mb-4 h-8 w-64 rounded bg-muted" />
          <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div className="h-32 rounded bg-muted" key={i.toString()} />
            ))}
          </div>
          <div className="h-96 rounded bg-muted" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6 py-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">References</h1>
          <p className="text-muted-foreground">
            Manage your reference requests and track their completion
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Request Reference
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">
              Total References
            </CardTitle>
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{stats.total}</div>
            <p className="text-muted-foreground text-xs">
              {generateReferenceSummary(references)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{stats.completed}</div>
            <p className="text-muted-foreground text-xs">
              {stats.completionRate}% completion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{stats.pending}</div>
            <p className="text-muted-foreground text-xs">Awaiting response</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">
              Average Rating
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              {stats.avgRating > 0 ? `${stats.avgRating}/5` : "N/A"}
            </div>
            <p className="text-muted-foreground text-xs">
              From completed references
            </p>
          </CardContent>
        </Card>
      </div>

      {/* References List */}
      <Card>
        <CardHeader>
          <CardTitle>Your References</CardTitle>
        </CardHeader>
        <CardContent>
          {references.length > 0 ? (
            <div className="space-y-4">
              {references.map((reference: Reference) => (
                <div
                  className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
                  key={reference._id}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div>
                        <h3 className="font-medium">
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
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <TypeBadge showIcon type={reference.referenceType} />
                      <div className="mt-2">
                        <StatusBadge status={reference.status} />
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-muted-foreground text-sm">
                        Submitted: {formatDate(reference.submittedAt)}
                      </div>
                      {reference.completedAt && (
                        <div className="text-muted-foreground text-sm">
                          Completed: {formatDate(reference.completedAt)}
                        </div>
                      )}
                      {reference.rating && (
                        <div className="mt-1 flex items-center gap-1">
                          <span className="font-medium text-sm">
                            {reference.rating}/5
                          </span>
                          <div className="flex">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <span
                                className={`text-xs ${
                                  i < (reference.rating || 0)
                                    ? "text-yellow-400"
                                    : "text-muted-foreground"
                                }`}
                                key={i.toString()}
                              >
                                ★
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      <Button
                        onClick={() => handleCopyReferenceLink(reference)}
                        size="sm"
                        variant="outline"
                      >
                        Copy Link
                      </Button>
                      {reference.status === "pending" && (
                        <Button
                          onClick={() => handleResendInvitation(reference._id)}
                          size="sm"
                          variant="outline"
                        >
                          Resend
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center">
              <ClipboardCheck className="mx-auto h-12 w-12 text-muted-foreground/40" />
              <h3 className="mt-4 font-medium text-lg">No references yet</h3>
              <p className="mt-2 text-muted-foreground">
                Request references from your employers, previous landlords, or
                character references to strengthen your rental applications.
              </p>
              <Button
                className="mt-4"
                onClick={() => setIsCreateModalOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Request Your First Reference
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Reference Modal */}
      <Dialog onOpenChange={setIsCreateModalOpen} open={isCreateModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Request New Reference</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[calc(100vh-200px)]">
            <CreateReferenceForm
              onCancel={() => setIsCreateModalOpen(false)}
              onSuccess={() => setIsCreateModalOpen(false)}
              tenantId={tenant?._id || ""}
            />
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
