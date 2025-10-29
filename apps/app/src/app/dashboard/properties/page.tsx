"use client";

import { PageContainer } from "@/components/page-container";
import { RoleBasedContent } from "@/components/role-based-content";
import { useUserContext } from "@/modules/me";
import LandlordPropertiesView from "./landlord-view";
import TenantPropertiesView from "./tenant-view";

type PropertiesPageProps = {
  searchParams: Promise<{
    [key: string]: string | string[] | undefined;
  }>;
};

export default function PropertiesPage({ searchParams }: PropertiesPageProps) {
  const { data: context } = useUserContext();

  return (
    <PageContainer>
      <RoleBasedContent
        landlord={<LandlordPropertiesView searchParams={searchParams} />}
        tenant={<TenantPropertiesView />}
      />
    </PageContainer>
  );
}
