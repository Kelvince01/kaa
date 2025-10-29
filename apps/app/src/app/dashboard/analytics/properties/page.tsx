import type { Metadata } from "next";
import { PropertyPerformanceChart } from "@/modules/analytics";

export const metadata: Metadata = {
  title: "Property Analytics | Dashboard",
  description: "Detailed analytics for individual properties.",
};

export default function PropertyAnalyticsPage() {
  // In a real implementation, you would get the propertyId from search params or context
  const propertyId = "example-property-id";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-bold text-3xl tracking-tight">
          Property Analytics
        </h1>
        <p className="text-muted-foreground">
          Detailed performance metrics and insights for your properties.
        </p>
      </div>

      <PropertyPerformanceChart propertyId={propertyId} />
    </div>
  );
}
