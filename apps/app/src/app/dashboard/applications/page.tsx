import type { Metadata } from "next";
import * as React from "react";
import { Shell } from "@/components/shell";
import { DataTableSkeleton } from "@/components/ui/data-table/data-table-skeleton";
import { FeatureFlagsProvider } from "@/components/ui/data-table/feature-flags-provider";
import { ApplicationsTable } from "@/modules/applications/table";
import type { SearchParams } from "@/shared/types";

export const metadata: Metadata = {
  title: "Applications | Dashboard",
  description: "Tenant property applications",
};

type ApplicationPageProps = {
  searchParams: Promise<SearchParams>;
};

export default function ApplicationsPage(props: ApplicationPageProps) {
  return (
    <Shell className="gap-2">
      <FeatureFlagsProvider>
        <React.Suspense
          fallback={
            <DataTableSkeleton
              cellWidths={[
                "10rem",
                "30rem",
                "10rem",
                "10rem",
                "6rem",
                "6rem",
                "6rem",
              ]}
              columnCount={7}
              filterCount={2}
              shrinkZero
            />
          }
        >
          <ApplicationsTable params={props.searchParams} />
        </React.Suspense>
      </FeatureFlagsProvider>
    </Shell>
  );
}
