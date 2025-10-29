"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@kaa/ui/components/dialog";
import { toast } from "sonner";
import { useCreateWebhook, useSupportedEvents } from "../webhook.queries";
import type { CreateWebhookInput } from "../webhook.type";
import { WebhookForm } from "./webhook-form";

type WebhookCreateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
};

export const WebhookCreateDialog = ({
  open,
  onOpenChange,
  onSuccess,
}: WebhookCreateDialogProps) => {
  const createWebhook = useCreateWebhook();
  const { data: eventsData } = useSupportedEvents();

  const handleSubmit = async (values: CreateWebhookInput) => {
    try {
      await createWebhook.mutateAsync(values);
      toast.success("Webhook created successfully");
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error(
        `Failed to create webhook: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Webhook</DialogTitle>
          <DialogDescription>
            Configure a new webhook to receive event notifications
          </DialogDescription>
        </DialogHeader>

        <WebhookForm
          isLoading={createWebhook.isPending}
          onSubmit={handleSubmit}
          submitLabel="Create Webhook"
          supportedEvents={eventsData?.events}
        />
      </DialogContent>
    </Dialog>
  );
};
