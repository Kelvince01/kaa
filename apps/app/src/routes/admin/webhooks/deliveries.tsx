"use client";

import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import { Heading } from "@kaa/ui/components/heading";
import { Separator } from "@kaa/ui/components/separator";
import { Skeleton } from "@kaa/ui/components/skeleton";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  useRedeliverWebhook,
  useWebhook,
  useWebhookDeliveries,
  WebhookDeliveries,
  type WebhookDeliveryType,
} from "@/modules/misc/webhooks";

type WebhookDeliveriesContainerProps = {
  webhookId: string;
};

export default function WebhookDeliveriesContainer({
  webhookId,
}: WebhookDeliveriesContainerProps) {
  const router = useRouter();
  const { data: webhookData, isLoading: isLoadingWebhook } =
    useWebhook(webhookId);
  const { data: deliveriesData, isLoading: isLoadingDeliveries } =
    useWebhookDeliveries(webhookId);
  const redeliverWebhook = useRedeliverWebhook();

  const handleBack = () => {
    router.push("/admin/webhooks");
  };

  const handleRedeliver = async (deliveryId: string) => {
    try {
      await redeliverWebhook.mutateAsync(deliveryId);
      toast.success("Webhook redelivery initiated");
    } catch (error) {
      toast.error(
        `Failed to redeliver webhook: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  };

  const handleViewDetails = (_delivery: WebhookDeliveryType) => {
    // Could open a modal or navigate to details page
    toast.info("Viewing delivery details");
  };

  if (isLoadingWebhook) {
    return (
      <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const webhook = webhookData?.data;

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <Button
            className="mb-4"
            onClick={handleBack}
            size="sm"
            variant="ghost"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Webhooks
          </Button>
          <Heading
            description={`Delivery history for ${webhook?.name}`}
            title="Webhook Deliveries"
          />
        </div>
      </div>

      <Separator />

      {/* Webhook Info Card */}
      {webhook && (
        <Card>
          <CardHeader>
            <CardTitle>Webhook Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="font-medium text-sm">Name</p>
                <p className="text-muted-foreground text-sm">{webhook.name}</p>
              </div>
              <div>
                <p className="font-medium text-sm">Status</p>
                <Badge variant={webhook.isActive ? "default" : "secondary"}>
                  {webhook.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              <div>
                <p className="font-medium text-sm">URL</p>
                <div className="flex items-center gap-2">
                  <code className="rounded bg-muted px-2 py-1 text-xs">
                    {webhook.url}
                  </code>
                  <Button
                    onClick={() => window.open(webhook.url, "_blank")}
                    size="icon"
                    variant="ghost"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div>
                <p className="font-medium text-sm">Events</p>
                <p className="text-muted-foreground text-sm">
                  {webhook.events.length} events configured
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Deliveries Table */}
      <WebhookDeliveries
        deliveries={deliveriesData?.data || []}
        isLoading={isLoadingDeliveries}
        onRedeliver={handleRedeliver}
        onViewDetails={handleViewDetails}
      />
    </div>
  );
}
