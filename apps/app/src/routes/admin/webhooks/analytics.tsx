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
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useWebhook,
  useWebhookAnalytics,
  WebhookAnalyticsComponent,
} from "@/modules/misc/webhooks";

type WebhookAnalyticsContainerProps = {
  webhookId: string;
};

export default function WebhookAnalyticsContainer({
  webhookId,
}: WebhookAnalyticsContainerProps) {
  const router = useRouter();
  const { data: webhookData, isLoading: isLoadingWebhook } =
    useWebhook(webhookId);
  const { data: analyticsData, isLoading: isLoadingAnalytics } =
    useWebhookAnalytics(webhookId);

  const handleBack = () => {
    router.push("/admin/webhooks");
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
            description={`Performance metrics for ${webhook?.name}`}
            title="Webhook Analytics"
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
            <div className="grid gap-4 md:grid-cols-3">
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
                <p className="font-medium text-sm">Environment</p>
                <Badge variant="outline">{webhook.environment}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analytics Dashboard */}
      <WebhookAnalyticsComponent
        analytics={analyticsData?.data}
        isLoading={isLoadingAnalytics}
      />
    </div>
  );
}
