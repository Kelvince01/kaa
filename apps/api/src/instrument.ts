import { opentelemetry } from "@elysiajs/opentelemetry";
import config from "@kaa/config/api";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-node";

export const telemetryConfig = opentelemetry({
  spanProcessors: [
    new BatchSpanProcessor(
      new OTLPTraceExporter({
        url: "https://api.axiom.co/v1/traces",
        headers: {
          Authorization: `Bearer ${config.axiom.token}`,
          "X-Axiom-Dataset": config.axiom.dataset,
        },
      })
    ),
  ],
});
