import type { Metadata } from "next";
import React from "react";
import { Shell } from "@/components/shell";
import { DataTableSkeleton } from "@/components/ui/data-table/data-table-skeleton";
import { FeatureFlagsProvider } from "@/components/ui/data-table/feature-flags-provider";
import LandlordsManagement from "@/routes/admin/landlords";
import type { SearchParams } from "@/shared/types";

export const metadata: Metadata = {
  title: "Landlord Management | Admin",
  description: "Manage landlords, verification status, and property ownership",
};

type LandlordsPageProps = {
  searchParams: Promise<SearchParams>;
};

export default function LandlordsPage(props: LandlordsPageProps) {
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
                "12rem",
                "8rem",
                "8rem",
                "8rem",
                "10rem",
                "8rem",
                "6rem",
              ]}
              columnCount={10}
              filterCount={3}
              shrinkZero
            />
          }
        >
          <LandlordsManagement searchParams={props.searchParams} />
        </React.Suspense>
      </FeatureFlagsProvider>
    </Shell>
  );
}
