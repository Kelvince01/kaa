"use client";

import { use } from "react";
import { PageContainer } from "@/components/page-container";
import { PropertyContractorsList } from "@/routes/dashboard/properties/property-contractors-list";

type ContractorsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default function ContractorsPage({ params }: ContractorsPageProps) {
  const { id: propertyId } = use(params);

  return (
    <PageContainer>
      <div className="space-y-6">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">Contractors</h1>
          <p className="text-muted-foreground">
            Find and manage contractors for your property
          </p>
        </div>
        <PropertyContractorsList
          propertyId={propertyId}
          serviceArea={undefined}
          specialty={undefined}
        />
      </div>
    </PageContainer>
  );
}
