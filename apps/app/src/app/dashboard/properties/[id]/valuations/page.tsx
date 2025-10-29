"use client";

import { use } from "react";
import { PageContainer } from "@/components/page-container";
import { PropertyValuationDashboard } from "@/routes/dashboard/properties/property-valuation-dashboard";

type ValuationsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default function ValuationsPage({ params }: ValuationsPageProps) {
  const { id: propertyId } = use(params);

  return (
    <PageContainer>
      <PropertyValuationDashboard propertyId={propertyId} />
    </PageContainer>
  );
}
