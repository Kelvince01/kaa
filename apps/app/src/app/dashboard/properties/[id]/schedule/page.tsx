"use client";

import { Alert, AlertDescription } from "@kaa/ui/components/alert";
import { Skeleton } from "@kaa/ui/components/skeleton";
import { AlertCircle } from "lucide-react";
import { use } from "react";
import { PageContainer } from "@/components/page-container";
import { useUserContext } from "@/modules/me";
import { PropertyScheduleCalendar } from "@/routes/dashboard/properties/property-schedule-calendar";

type SchedulePageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default function SchedulePage({ params }: SchedulePageProps) {
  const { id: propertyId } = use(params);
  const { data, isLoading, isError, user } = useUserContext();

  // Show loading state
  if (isLoading) {
    return (
      <PageContainer>
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-96 w-full" />
        </div>
      </PageContainer>
    );
  }

  // Show error state
  if (isError || !data) {
    return (
      <PageContainer>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load user context. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      </PageContainer>
    );
  }

  const userId = user?.id || "";

  return (
    <PageContainer>
      <PropertyScheduleCalendar propertyId={propertyId} userId={userId} />
    </PageContainer>
  );
}
