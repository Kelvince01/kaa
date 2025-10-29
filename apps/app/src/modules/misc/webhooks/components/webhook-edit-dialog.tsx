"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@kaa/ui/components/dialog";
import { toast } from "sonner";
import { useSupportedEvents, useUpdateWebhook } from "../webhook.queries";
import type { UpdateWebhookInput, WebhookType } from "../webhook.type";
import { WebhookForm } from "./webhook-form";

type WebhookEditDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  webhook: WebhookType | null;
  onSuccess?: () => void;
};

export const WebhookEditDialog = ({
  open,
  onOpenChange,
  webhook,
  onSuccess,
}: WebhookEditDialogProps) => {
  const updateWebhook = useUpdateWebhook();
  const { data: events } = useSupportedEvents();

  const handleSubmit = async (values: UpdateWebhookInput) => {
    if (!webhook) return;

    try {
      await updateWebhook.mutateAsync({
        webhookId: webhook._id,
        updates: values,
      });
      toast.success("Webhook updated successfully");
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error(
        `Failed to update webhook: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  };

  if (!webhook) return null;

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Webhook</DialogTitle>
          <DialogDescription>Update webhook configuration</DialogDescription>
        </DialogHeader>

        <WebhookForm
          defaultValues={{
            name: webhook.name,
            description: webhook.description,
            url: webhook.url,
            method: webhook.method,
            events: webhook.events,
            environment: webhook.environment,
            priority: webhook.priority,
            contentType: webhook.contentType,
            timeout: webhook.timeout,
            tags: webhook.tags,
          }}
          isLoading={updateWebhook.isPending}
          onSubmit={handleSubmit}
          submitLabel="Update Webhook"
          supportedEvents={events?.events}
        />
      </DialogContent>
    </Dialog>
  );
};
