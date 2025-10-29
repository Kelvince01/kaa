import type { Metadata } from "next";
import React from "react";
import ErrorBoundary from "@/components/error-boundary";
import { ErrorFallback } from "@/components/error-fallback";
import { Shell } from "@/components/shell";
import { DataTableSkeleton } from "@/components/ui/data-table/data-table-skeleton";
import { FeatureFlagsProvider } from "@/components/ui/data-table/feature-flags-provider";
import { MembersTable } from "@/modules/members";
import type { SearchParams } from "@/shared/types";

export const metadata: Metadata = {
  title: "Members | Admin",
  description: "Manage organization members, roles, and settings",
};

type MembersPageProps = {
  searchParams: Promise<SearchParams>;
};

export default function MembersPage(props: MembersPageProps) {
  return (
    <Shell className="gap-2">
      <FeatureFlagsProvider>
        <ErrorBoundary errorComponent={ErrorFallback}>
          <React.Suspense
            fallback={
              <DataTableSkeleton
                cellWidths={[
                  "10rem",
                  "20rem",
                  "10rem",
                  "10rem",
                  "8rem",
                  "8rem",
                  "6rem",
                ]}
                columnCount={7}
                filterCount={2}
                shrinkZero
              />
            }
          >
            <MembersTable params={props.searchParams} />
          </React.Suspense>
        </ErrorBoundary>
      </FeatureFlagsProvider>
    </Shell>
  );
}
