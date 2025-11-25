"use client";

import { Button } from "@kaa/ui/components/button";
import { Card } from "@kaa/ui/components/card";
import { File } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { useState } from "react";
import { DataTable } from "@/components/ui/data-table/data-table";
import { DataTableAdvancedToolbar } from "@/components/ui/data-table/data-table-advanced-toolbar";
import { DataTableFilterList } from "@/components/ui/data-table/data-table-filter-list";
import { DataTableFilterMenu } from "@/components/ui/data-table/data-table-filter-menu";
import { DataTableSortList } from "@/components/ui/data-table/data-table-sort-list";
import { DataTableToolbar } from "@/components/ui/data-table/data-table-toolbar";
import { useFeatureFlags } from "@/components/ui/data-table/feature-flags-provider";
import { useDataTable } from "@/hooks/use-data-table";
import { getValidFilters } from "@/lib/data-table";
import { useAuthStore } from "@/modules/auth";
import {
  DocumentCategory,
  DocumentStatus,
} from "@/routes/account/applications";
import type { SearchParams } from "@/shared/types";
import type { DataTableRowAction } from "@/shared/types/data-table";
import {
  useApplicationEstimatedOfferAmount,
  useApplicationStatusCounts,
  useApplications,
} from "../application.queries";
import { searchParamsCache } from "../application.schema";
import {
  type Application,
  ApplicationStatus,
  TimelineEventStatus,
} from "../application.type";
import { DeleteApplicationsDialog } from "../components/delete-applications-dialog";
import { UpdateApplicationSheet } from "../components/update-application-sheet";
import { ApplicationsTableActionBar } from "./action-bar";
import { getApplicationsTableColumns } from "./columns";
import { ApplicationsTableToolbarActions } from "./toolbar-actions";

type ApplicationsTableProps = {
  params: Promise<SearchParams>;
};

export function ApplicationsTable({ params }: ApplicationsTableProps) {
  const { enableAdvancedFilter, filterFlag } = useFeatureFlags();
  const searchParams = React.use(params);
  const search = searchParamsCache.parse(searchParams);
  const { user } = useAuthStore();
  const isLandlord = user?.role === "landlord";
  const [status, setStatus] = useState<ApplicationStatus | null>(null);

  const validFilters = getValidFilters(search.filters);

  const { data } = useApplications({
    status: search.status,
    page: search.page,
    limit: search.perPage,
  });

  // {
  // 	...search,
  // 	filters: validFilters,
  // }

  const { data: statusCounts } = useApplicationStatusCounts();
  const { data: estimatedOfferAmount } = useApplicationEstimatedOfferAmount();

  const [rowAction, setRowAction] =
    React.useState<DataTableRowAction<Application> | null>(null);

  const columns = React.useMemo(
    () =>
      getApplicationsTableColumns({
        statusCounts: statusCounts?.data as Record<
          Application["status"],
          number
        >,
        estimatedOfferAmount: estimatedOfferAmount?.data as {
          min: number;
          max: number;
        },
        setRowAction,
        isLandlord,
      }),
    [statusCounts, estimatedOfferAmount, isLandlord]
  );

  const { table, shallow, debounceMs, throttleMs } = useDataTable({
    data: data?.items ?? [],
    columns,
    pageCount: data?.pagination.page ?? 1,
    enableAdvancedFilter,
    initialState: {
      sorting: [{ id: "createdAt", desc: true }],
      columnPinning: { right: ["actions"] },
    },
    getRowId: (originalRow) => originalRow._id,
    shallow: false,
    clearOnDefault: true,
  });

  return (
    <div className="application-list">
      {/* Applications list */}
      {data?.items?.length === 0 ? (
        <Card className="p-6 text-center">
          <File className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 font-medium text-gray-900 text-sm">
            No applications found
          </h3>
          <p className="mt-1 text-gray-500 text-sm">
            {status === null
              ? "You haven't submitted any applications yet."
              : `You don't have any applications with "${status}" status.`}
          </p>
          {!isLandlord && (
            <div className="mt-6">
              <Link href="/properties">
                <Button variant={"link"}>Browse Properties</Button>
              </Link>
            </div>
          )}
        </Card>
      ) : (
        <div>
          <DataTable
            actionBar={<ApplicationsTableActionBar table={table} />}
            table={table}
          >
            {enableAdvancedFilter ? (
              <DataTableAdvancedToolbar table={table}>
                <ApplicationsTableToolbarActions table={table} />
                <DataTableSortList align="start" table={table} />
                {filterFlag === "advancedFilters" ? (
                  <DataTableFilterList
                    align="start"
                    debounceMs={debounceMs}
                    shallow={shallow}
                    table={table}
                    throttleMs={throttleMs}
                  />
                ) : (
                  <DataTableFilterMenu
                    debounceMs={debounceMs}
                    shallow={shallow}
                    table={table}
                    throttleMs={throttleMs}
                  />
                )}
              </DataTableAdvancedToolbar>
            ) : (
              <DataTableToolbar table={table}>
                <DataTableSortList align="end" table={table} />
              </DataTableToolbar>
            )}
          </DataTable>
          <UpdateApplicationSheet
            application={rowAction?.row?.original ?? null}
            onOpenChange={() => setRowAction(null)}
            open={rowAction?.variant === "update"}
          />
          <DeleteApplicationsDialog
            applications={
              rowAction?.row?.original ? [rowAction?.row.original] : []
            }
            onOpenChange={() => setRowAction(null)}
            onSuccess={() => rowAction?.row?.toggleSelected(false)}
            open={rowAction?.variant === "delete"}
            showTrigger={false}
          />
        </div>
      )}
    </div>
  );
}

const mockApplications: Application[] = [
  {
    _id: "app-1",
    property: {
      _id: "prop-1",
      memberId: "prop-1",
      title: "2 Bedroom Apartment in Hackney",
      description: "Modern apartment in the heart of Hackney",
      // location: "Hackney, London",
      location: {
        country: "United Kingdom",
        county: "",
        constituency: "",
        address: {
          line1: "123 Hackney Road",
          town: "London",
          postalCode: "E8 3SA",
        },
      },
      pricing: {
        rentAmount: 1800,
        securityDeposit: 1800,
        currency: "KES",
        paymentFrequency: "monthly",
        utilitiesIncluded: [],
        negotiable: false,
      },
      details: {
        bedrooms: 2,
        bathrooms: 1,
        furnished: true,
        petsAllowed: false,
      },
      amenities: [],
      type: "apartment",
      available: true,
      availableFrom: "2025-04-01",
      media: {
        photos: [
          { url: "/images/property1.jpg", isPrimary: true },
          { url: "/images/property1-2.jpg", isPrimary: false },
        ],
      },
      features: ["Balcony", "Washing Machine", "Dishwasher"],
      landlord: {
        _id: "landlord-1",
        memberId: "prop-1",
        firstName: "James",
        lastName: "Wilson",
        email: "james@example.com",
        role: "landlord",
        createdAt: "2025-01-01T00:00:00",
        updatedAt: "2025-01-01T00:00:00",
        isVerified: true,
        emailVerified: true,
        phoneVerified: true,
        status: "active",
      },
      // contactName: "James Wilson",
      // contactPhone: "07123456789",
      geolocation: {
        type: "Point",
        coordinates: [51.545, -0.055],
      },
      status: "active",
      createdAt: "2025-03-01T00:00:00",
      updatedAt: "2025-03-01T00:00:00",
    },
    tenant: {
      _id: "user-tenant-1",
      memberId: "prop-1",
      firstName: "Jane",
      lastName: "Smith",
      email: "jane@example.com",
      phone: "07700900001",
      password: "",
      role: "tenant",
      createdAt: "2025-01-01T00:00:00",
      updatedAt: "2025-01-01T00:00:00",
      isVerified: true,
      emailVerified: true,
      phoneVerified: true,
      status: "active",
    },
    status: ApplicationStatus.submitted,
    appliedAt: "2025-03-28T10:30:00",
    moveInDate: "2025-04-15",
    offerAmount: 1500,
    notes: "First-time renter with good references",
    timeline: [
      {
        title: "Application Submitted",
        description:
          "Your application has been successfully submitted and is pending review.",
        date: "2025-03-28T10:30:00",
        status: TimelineEventStatus.COMPLETED,
        actor: "tenant",
      },
      {
        title: "Documents Uploaded",
        description:
          "Proof of ID, proof of address, and employment reference details provided.",
        date: "2025-03-28T10:25:00",
        status: TimelineEventStatus.COMPLETED,
        actor: "tenant",
      },
      {
        title: "Application Started",
        description: "You started your application for this property.",
        date: "2025-03-28T09:45:00",
        status: TimelineEventStatus.COMPLETED,
        actor: "tenant",
      },
    ],
    documents: [
      {
        _id: "doc-1",
        name: "Proof of ID",
        status: DocumentStatus.VERIFIED,
        uploadedAt: "2025-03-28T10:10:00",
        user: {
          _id: "user-1",
          memberId: "prop-1",
          firstName: "Jane",
          lastName: "Smith",
          email: "jane@example.com",
          phone: "07700900001",
          password: "",
          role: "tenant",
          createdAt: "2025-01-01T00:00:00",
          updatedAt: "2025-01-01T00:00:00",
          isVerified: true,
          emailVerified: true,
          phoneVerified: true,
          status: "active",
        },
        type: DocumentCategory.IDENTITY,
        category: DocumentCategory.IDENTITY,
        file: "/docs/id.pdf",
        mimeType: "application/pdf",
        size: 1_024_000,
      },
      {
        _id: "doc-2",
        name: "Proof of Address",
        status: DocumentStatus.VERIFIED,
        uploadedAt: "2025-03-28T10:15:00",
        user: {
          _id: "user-1",
          memberId: "prop-1",
          firstName: "Jane",
          lastName: "Smith",
          email: "jane@example.com",
          phone: "07700900001",
          password: "",
          role: "tenant",
          createdAt: "2025-01-01T00:00:00",
          updatedAt: "2025-01-01T00:00:00",
          isVerified: true,
          emailVerified: true,
          phoneVerified: true,
          status: "active",
        },
        type: DocumentCategory.ADDRESS,
        category: DocumentCategory.ADDRESS,
        file: "/docs/address.pdf",
        mimeType: "application/pdf",
        size: 824_000,
      },
      {
        _id: "doc-3",
        name: "Employment Reference",
        status: DocumentStatus.PENDING,
        uploadedAt: "2025-03-28T10:20:00",
        user: {
          _id: "user-1",
          memberId: "prop-1",
          firstName: "Jane",
          lastName: "Smith",
          email: "jane@example.com",
          phone: "07700900001",
          password: "",
          role: "tenant",
          createdAt: "2025-01-01T00:00:00",
          updatedAt: "2025-01-01T00:00:00",
          isVerified: true,
          emailVerified: true,
          phoneVerified: true,
          status: "active",
        },
        type: DocumentCategory.REFERENCE,
        category: DocumentCategory.REFERENCE,
        file: "/docs/employment.pdf",
        mimeType: "application/pdf",
        size: 724_000,
      },
    ],
    messages: [
      {
        _id: "msg-1",
        sender: {
          _id: "system",
          memberId: "prop-1",
          firstName: "System",
          lastName: "System",
          email: "system@example.com",
          phone: "07700900001",
          password: "",
          role: "admin",
          createdAt: "2025-01-01T00:00:00",
          updatedAt: "2025-01-01T00:00:00",
          isVerified: true,
          emailVerified: true,
          phoneVerified: true,
          status: "active",
        },
        receiver: {
          _id: "user-tenant-1",
          memberId: "prop-1",
          firstName: "Jane",
          lastName: "Smith",
          email: "jane@example.com",
          phone: "07700900001",
          password: "",
          role: "tenant",
          createdAt: "2025-01-01T00:00:00",
          updatedAt: "2025-01-01T00:00:00",
          isVerified: true,
          emailVerified: true,
          phoneVerified: true,
          status: "active",
        },
        content:
          "Your application has been received and is being processed. You will be notified once there is an update.",
        isRead: false,
        createdAt: "2025-03-28T10:35:00",
        updatedAt: "2025-03-28T10:35:00",
      },
      {
        _id: "msg-2",
        sender: {
          _id: "system",
          memberId: "prop-1",
          firstName: "System",
          lastName: "System",
          email: "system@example.com",
          phone: "07700900001",
          password: "",
          role: "admin",
          createdAt: "2025-01-01T00:00:00",
          updatedAt: "2025-01-01T00:00:00",
          isVerified: true,
          emailVerified: true,
          phoneVerified: true,
          status: "active",
        },
        receiver: {
          _id: "user-tenant-1",
          memberId: "prop-1",
          firstName: "Jane",
          lastName: "Smith",
          email: "jane@example.com",
          phone: "07700900001",
          password: "",
          role: "tenant",
          createdAt: "2025-01-01T00:00:00",
          updatedAt: "2025-01-01T00:00:00",
          isVerified: true,
          emailVerified: true,
          phoneVerified: true,
          status: "active",
        },
        content:
          "We have received all your required documents. Thank you for providing this information promptly.",
        isRead: true,
        createdAt: "2025-03-28T10:25:00",
        updatedAt: "2025-03-28T10:25:00",
      },
    ],
    createdAt: "2025-03-28T09:45:00",
    // updatedAt: "2025-03-28T10:35:00",
  },
];
