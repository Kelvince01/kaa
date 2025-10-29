// import type { Metadata } from "next";
import React from "react";
import { Shell } from "@/components/shell";
import { DataTableSkeleton } from "@/components/ui/data-table/data-table-skeleton";
import { FeatureFlagsProvider } from "@/components/ui/data-table/feature-flags-provider";
import { PropertiesTable } from "@/modules/properties/table";
import type { SearchParams } from "@/shared/types";

// export const metadata: Metadata = {
//   title: "Properties | Dashboard",
//   description: "Manage your properties in one place.",
// };

type PropertiesPageProps = {
  searchParams: Promise<SearchParams>;
};

export default function PropertiesPage(props: PropertiesPageProps) {
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
          <PropertiesTable params={props.searchParams} />
        </React.Suspense>
      </FeatureFlagsProvider>
    </Shell>
  );
}
