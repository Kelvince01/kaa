"use client";

import { Button } from "@kaa/ui/components/button";
import { Heading } from "@kaa/ui/components/heading";
import { Separator } from "@kaa/ui/components/separator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@kaa/ui/components/tabs";
import { Plus, Webhook } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  useActivateWebhook,
  useDeactivateWebhook,
  useDeleteWebhook,
  useRegenerateWebhookSecret,
  useTestWebhook,
  useUserWebhooks,
  WebhookCreateDialog,
  WebhookEditDialog,
  WebhookList,
  WebhookTestDialog,
  type WebhookType,
} from "@/modules/misc/webhooks";

export default function AdminWebhooksContainer() {
  const [activeTab, setActiveTab] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showTest, setShowTest] = useState(false);
  const [selectedWebhook, setSelectedWebhook] = useState<WebhookType | null>(
    null
  );

  // Queries and mutations
  const { data: allWebhooks, isLoading: isLoadingAll } = useUserWebhooks();
  const { data: activeWebhooks, isLoading: isLoadingActive } = useUserWebhooks({
    isActive: true,
  });
  const { data: inactiveWebhooks, isLoading: isLoadingInactive } =
    useUserWebhooks({ isActive: false });

  const deleteWebhook = useDeleteWebhook();
  const activateWebhook = useActivateWebhook();
  const deactivateWebhook = useDeactivateWebhook();
  const regenerateSecret = useRegenerateWebhookSecret();
  const testWebhook = useTestWebhook();

  // Handlers
  const handleCreateNew = () => {
    setShowCreate(true);
  };

  const handleEdit = (webhook: WebhookType) => {
    setSelectedWebhook(webhook);
    setShowEdit(true);
  };

  const handleDelete = async (webhookId: string) => {
    // TODO: Replace with custom confirmation dialog
    const confirmed =
      typeof window !== "undefined" &&
      // biome-ignore lint/suspicious/noAlert: ignore
      window.confirm("Are you sure you want to delete this webhook?");
    if (confirmed) {
      try {
        await deleteWebhook.mutateAsync(webhookId);
        toast.success("Webhook deleted successfully");
      } catch (error) {
        toast.error(
          `Failed to delete webhook: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }
  };

  const handleTest = (webhookId: string) => {
    const webhook = allWebhooks?.webhooks?.find((w) => w._id === webhookId);
    if (webhook) {
      setSelectedWebhook(webhook);
      setShowTest(true);
    }
  };

  const handleTestWebhook = async (webhookId: string) => {
    const result = await testWebhook.mutateAsync(webhookId);
    return result.data;
  };

  const handleActivate = async (webhookId: string) => {
    try {
      await activateWebhook.mutateAsync(webhookId);
      toast.success("Webhook activated");
    } catch (error) {
      toast.error(
        `Failed to activate webhook: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  };

  const handleDeactivate = async (webhookId: string) => {
    try {
      await deactivateWebhook.mutateAsync(webhookId);
      toast.success("Webhook deactivated");
    } catch (error) {
      toast.error(
        `Failed to deactivate webhook: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  };

  const handleRegenerateSecret = async (webhookId: string) => {
    // TODO: Replace with custom confirmation dialog
    const confirmed =
      typeof window !== "undefined" &&
      // biome-ignore lint/suspicious/noAlert: ignore
      window.confirm(
        "Are you sure you want to regenerate the webhook secret? This will invalidate the current secret."
      );
    if (confirmed) {
      try {
        const result = await regenerateSecret.mutateAsync(webhookId);
        toast.success(`New secret: ${result.secret}`, {
          duration: 10_000,
        });
      } catch (error) {
        toast.error(
          `Failed to regenerate secret: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }
  };

  const handleViewDeliveries = (webhookId: string) => {
    // Navigate to deliveries page or open deliveries dialog
    window.location.href = `/admin/webhooks/${webhookId}/deliveries`;
  };

  const handleViewAnalytics = (webhookId: string) => {
    // Navigate to analytics page or open analytics dialog
    window.location.href = `/admin/webhooks/${webhookId}/analytics`;
  };

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-start justify-between">
        <Heading
          description="Manage webhook configurations and monitor deliveries"
          title="Webhooks Management"
        />
        <Button onClick={handleCreateNew}>
          <Plus className="mr-2 h-4 w-4" />
          Create Webhook
        </Button>
      </div>

      <Separator />

      <Tabs defaultValue="all" onValueChange={setActiveTab} value={activeTab}>
        <TabsList>
          <TabsTrigger value="all">
            <Webhook className="mr-2 h-4 w-4" />
            All Webhooks
            {allWebhooks?.webhooks && (
              <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs">
                {allWebhooks.webhooks.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="active">
            Active
            {activeWebhooks?.webhooks && (
              <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-green-700 text-xs">
                {activeWebhooks.webhooks.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="inactive">
            Inactive
            {inactiveWebhooks?.webhooks && (
              <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-gray-700 text-xs">
                {inactiveWebhooks.webhooks.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent className="space-y-4" value="all">
          <WebhookList
            isLoading={isLoadingAll}
            onActivate={handleActivate}
            onCreateNew={handleCreateNew}
            onDeactivate={handleDeactivate}
            onDelete={handleDelete}
            onEdit={handleEdit}
            onRegenerateSecret={handleRegenerateSecret}
            onTest={handleTest}
            onViewAnalytics={handleViewAnalytics}
            onViewDeliveries={handleViewDeliveries}
            webhooks={allWebhooks?.webhooks}
          />
        </TabsContent>

        <TabsContent className="space-y-4" value="active">
          <WebhookList
            isLoading={isLoadingActive}
            onActivate={handleActivate}
            onCreateNew={handleCreateNew}
            onDeactivate={handleDeactivate}
            onDelete={handleDelete}
            onEdit={handleEdit}
            onRegenerateSecret={handleRegenerateSecret}
            onTest={handleTest}
            onViewAnalytics={handleViewAnalytics}
            onViewDeliveries={handleViewDeliveries}
            webhooks={activeWebhooks?.webhooks}
          />
        </TabsContent>

        <TabsContent className="space-y-4" value="inactive">
          <WebhookList
            isLoading={isLoadingInactive}
            onActivate={handleActivate}
            onCreateNew={handleCreateNew}
            onDeactivate={handleDeactivate}
            onDelete={handleDelete}
            onEdit={handleEdit}
            onRegenerateSecret={handleRegenerateSecret}
            onTest={handleTest}
            onViewAnalytics={handleViewAnalytics}
            onViewDeliveries={handleViewDeliveries}
            webhooks={inactiveWebhooks?.webhooks}
          />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <WebhookCreateDialog
        onOpenChange={setShowCreate}
        onSuccess={() => {
          toast.success("Webhook created successfully");
          setShowCreate(false);
        }}
        open={showCreate}
      />

      <WebhookEditDialog
        onOpenChange={setShowEdit}
        onSuccess={() => {
          toast.success("Webhook updated successfully");
          setShowEdit(false);
        }}
        open={showEdit}
        webhook={selectedWebhook}
      />

      {selectedWebhook && (
        <WebhookTestDialog
          onOpenChange={setShowTest}
          onTest={handleTestWebhook}
          open={showTest}
          webhookId={selectedWebhook._id}
          webhookName={selectedWebhook.name}
        />
      )}
    </div>
  );
}
