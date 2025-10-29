import WebhookAnalyticsContainer from "@/routes/admin/webhooks/analytics";

type WebhookAnalyticsPageProps = {
  params: {
    webhookId: string;
  };
};

export default function WebhookAnalyticsPage({
  params,
}: WebhookAnalyticsPageProps) {
  return <WebhookAnalyticsContainer webhookId={params.webhookId} />;
}
