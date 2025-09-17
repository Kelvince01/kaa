import type { Metadata } from "next";
import React from "react";
import ErrorBoundary from "@/components/error-boundary";
import { ErrorFallback } from "@/components/error-fallback";
import { Shell } from "@/components/shell";
import { DataTableSkeleton } from "@/components/ui/data-table/data-table-skeleton";
import { FeatureFlagsProvider } from "@/components/ui/data-table/feature-flags-provider";
import { UsersTable } from "@/modules/users/components/table";
import type { SearchParams } from "@/shared/types";

export const metadata: Metadata = {
  title: "Users | Admin",
  description: "Manage users, roles, and verification status",
};

type UsersPageProps = {
  searchParams: Promise<SearchParams>;
};

export default function UsersPage(props: UsersPageProps) {
  return (
    <Shell className="gap-2">
      <FeatureFlagsProvider>
        <ErrorBoundary errorComponent={ErrorFallback}>
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
            <UsersTable params={props.searchParams} />
          </React.Suspense>
        </ErrorBoundary>
      </FeatureFlagsProvider>
    </Shell>
  );
}
