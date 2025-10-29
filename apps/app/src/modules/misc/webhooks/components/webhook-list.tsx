"use client";

import { Alert, AlertDescription } from "@kaa/ui/components/alert";
import { Button } from "@kaa/ui/components/button";
import { Skeleton } from "@kaa/ui/components/skeleton";
import { AlertCircle, Plus } from "lucide-react";
import type { WebhookListQuery, WebhookType } from "../webhook.type";
import { WebhookCard } from "./webhook-card";

type WebhookListProps = {
  webhooks?: WebhookType[];
  isLoading?: boolean;
  error?: Error | null;
  filters?: WebhookListQuery;
  onCreateNew?: () => void;
  onEdit?: (webhook: WebhookType) => void;
  onDelete?: (webhookId: string) => void;
  onTest?: (webhookId: string) => void;
  onActivate?: (webhookId: string) => void;
  onDeactivate?: (webhookId: string) => void;
  onViewDeliveries?: (webhookId: string) => void;
  onViewAnalytics?: (webhookId: string) => void;
  onRegenerateSecret?: (webhookId: string) => void;
};

export const WebhookList = ({
  webhooks = [],
  isLoading = false,
  error = null,
  onCreateNew,
  onEdit,
  onDelete,
  onTest,
  onActivate,
  onDeactivate,
  onViewDeliveries,
  onViewAnalytics,
  onRegenerateSecret,
}: WebhookListProps) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load webhooks: {error.message}
        </AlertDescription>
      </Alert>
    );
  }

  if (webhooks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
        <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
          <h3 className="mt-4 font-semibold text-lg">No webhooks configured</h3>
          <p className="mt-2 mb-4 text-muted-foreground text-sm">
            You haven't created any webhooks yet. Create your first webhook to
            start receiving event notifications.
          </p>
          {onCreateNew && (
            <Button onClick={onCreateNew}>
              <Plus className="mr-2 h-4 w-4" />
              Create Webhook
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {webhooks.map((webhook) => (
        <WebhookCard
          key={webhook._id}
          onActivate={onActivate}
          onDeactivate={onDeactivate}
          onDelete={onDelete}
          onEdit={onEdit}
          onRegenerateSecret={onRegenerateSecret}
          onTest={onTest}
          onViewAnalytics={onViewAnalytics}
          onViewDeliveries={onViewDeliveries}
          webhook={webhook}
        />
      ))}
    </div>
  );
};
