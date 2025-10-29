import WebhookDeliveriesContainer from "@/routes/admin/webhooks/deliveries";

type WebhookDeliveriesPageProps = {
  params: {
    webhookId: string;
  };
};

export default function WebhookDeliveriesPage({
  params,
}: WebhookDeliveriesPageProps) {
  return <WebhookDeliveriesContainer webhookId={params.webhookId} />;
}
