"use client";

import { Badge } from "@kaa/ui/components/badge";
import type { ColumnDef } from "@tanstack/react-table";
import { Home, Star } from "lucide-react";
import Image from "next/image";
import type { Property } from "@/modules/properties/property.type";
import { formatDate } from "@/shared/utils/format.util";

export const columns: ColumnDef<Property>[] = [
  {
    accessorKey: "property",
    header: "Property",
    cell: ({ row }) => (
      <div className="flex items-center">
        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md bg-gray-200">
          {row.original.media.images && row.original.media.images.length > 0 ? (
            <Image
              alt={row.original.title}
              className="h-12 w-12 object-cover"
              height={48}
              src={row.original.media.images[0]?.url ?? ""}
              width={48}
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center bg-gray-100">
              <Home className="h-6 w-6 text-gray-400" />
            </div>
          )}
        </div>
        <div className="ml-4">
          <div className="font-medium text-gray-900 text-sm">
            {row.original.title}
          </div>
          <div className="text-gray-500 text-xs">
            {row.original.location.address.line1},{" "}
            {row.original.location.address.town}
          </div>
        </div>
      </div>
    ),
  },
  {
    accessorKey: "price",
    header: "Price",
    cell: ({ row }) => (
      <div>
        <div className="text-gray-900 text-sm">
          {row.original.pricing.currency} {row.original.pricing.rent}
        </div>
        <div className="text-gray-500 text-xs">
          {" "}
          {row.original.pricing.paymentFrequency}
        </div>
      </div>
    ),
  },
  {
    accessorKey: "landlord",
    header: "Owner",
    cell: ({ row }) => (
      <div>
        <div className="text-gray-500 text-sm">
          {row.original.landlord
            ? `${(row.original.landlord as any).personalInfo.firstName} ${(row.original.landlord as any).personalInfo.lastName}`
            : "No landlord assigned"}
        </div>
        <div className="text-gray-500 text-xs">
          {row.original.landlord
            ? (row.original.landlord as any).personalInfo.email
            : "No email assigned"}
        </div>
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge
        variant={
          row.original.status === "active"
            ? "success"
            : row.original.status === "inactive"
              ? "default"
              : row.original.status === "draft"
                ? "warning"
                : "secondary"
        }
      >
        {row.original.status?.charAt(0).toUpperCase() +
          row.original.status?.slice(1)}
      </Badge>
    ),
  },
  {
    accessorKey: "createdAt",
    header: "Listed On",
    cell: ({ row }) => (
      <div className="text-gray-500 text-sm">
        {formatDate(row.original.createdAt)}
      </div>
    ),
  },
  {
    accessorKey: "featured",
    header: "Featured",
    cell: ({ row }) => (
      <div className="flex items-center">
        {row.original.featured ? (
          <Badge className="flex items-center" variant="warning">
            <Star className="mr-1" />
            Featured
          </Badge>
        ) : (
          <Badge variant="outline">Standard</Badge>
        )}
      </div>
    ),
  },
  {
    accessorKey: "verified",
    header: "Verification",
    cell: ({ row }) => (
      <Badge variant={row.original.verified ? "success" : "warning"}>
        {row.original.verified ? "Verified" : "Unverified"}
      </Badge>
    ),
  },
];
