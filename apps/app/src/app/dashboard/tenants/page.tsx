import type { Metadata } from "next";
import React from "react";
import { Shell } from "@/components/shell";
import { DataTableSkeleton } from "@/components/ui/data-table/data-table-skeleton";
import { FeatureFlagsProvider } from "@/components/ui/data-table/feature-flags-provider";
import TenantsManagement from "@/routes/dashboard/tenants";
import type { SearchParams } from "@/shared/types";

export const metadata: Metadata = {
  title: "Tenant Management | Dashboard",
  description: "Manage tenants, lease agreements, and tenant information",
};

type TenantsPageProps = {
  searchParams?: Promise<SearchParams>;
};

export default function TenantsPage() {
  return (
    <Shell className="gap-2">
      <FeatureFlagsProvider>
        <React.Suspense
          fallback={
            <DataTableSkeleton
              cellWidths={[
                "15rem",
                "10rem",
                "10rem",
                "8rem",
                "10rem",
                "8rem",
                "8rem",
                "6rem",
              ]}
              columnCount={8}
              filterCount={2}
              shrinkZero
            />
          }
        >
          <TenantsManagement />
        </React.Suspense>
      </FeatureFlagsProvider>
    </Shell>
  );
}
