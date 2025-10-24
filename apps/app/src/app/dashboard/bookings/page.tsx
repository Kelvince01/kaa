import type { Metadata } from "next";
import { Suspense } from "react";
import { DataTableSkeleton } from "@/components/ui/data-table/data-table-skeleton";
import { FeatureFlagsProvider } from "@/components/ui/data-table/feature-flags-provider";
import { NewBookingButton } from "@/modules/bookings/components/new-booking-button";
import { BookingsTable } from "@/modules/bookings/table";
import type { SearchParams } from "@/shared/types";

export const metadata: Metadata = {
  title: "Bookings | Dashboard",
  description: "Manage property bookings and viewing requests",
};

type BookingsPageProps = {
  searchParams: Promise<SearchParams>;
};

export default function BookingsPage({ searchParams }: BookingsPageProps) {
  return (
    <div className="flex h-full flex-col gap-4 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-semibold text-2xl text-gray-900">Bookings</h1>
          <p className="text-muted-foreground text-sm">
            Manage property bookings and viewing requests
          </p>
        </div>
        <NewBookingButton />
      </div>

      <FeatureFlagsProvider>
        <Suspense
          fallback={
            <DataTableSkeleton
              cellWidths={[
                "100px",
                "200px",
                "150px",
                "200px",
                "150px",
                "120px",
                "100px",
                "80px",
              ]}
              columnCount={8}
              filterCount={2}
              rowCount={15}
              shrinkZero
              withPagination
              withViewOptions
            />
          }
        >
          <BookingsTable params={searchParams} />
        </Suspense>
      </FeatureFlagsProvider>
    </div>
  );
}
