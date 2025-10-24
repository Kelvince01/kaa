"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@kaa/ui/components/avatar";
import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@kaa/ui/components/dropdown-menu";
import type { ColumnDef } from "@tanstack/react-table";
import { formatDistanceToNow } from "date-fns";
import { Edit, Eye, MoreHorizontal, Trash } from "lucide-react";
import {
  type Landlord,
  LandlordStatus,
  LandlordType,
  RiskLevel,
  VerificationStatus,
} from "../landlord.type";

const getStatusColor = (status: LandlordStatus) => {
  switch (status) {
    case LandlordStatus.ACTIVE:
      return "bg-green-100 text-green-800 hover:bg-green-200";
    case LandlordStatus.PENDING_VERIFICATION:
      return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200";
    case LandlordStatus.VERIFICATION_IN_PROGRESS:
      return "bg-blue-100 text-blue-800 hover:bg-blue-200";
    case LandlordStatus.SUSPENDED:
      return "bg-red-100 text-red-800 hover:bg-red-200";
    case LandlordStatus.REJECTED:
      return "bg-gray-100 text-gray-800 hover:bg-gray-200";
    case LandlordStatus.INACTIVE:
      return "bg-gray-100 text-gray-800 hover:bg-gray-200";
    default:
      return "bg-gray-100 text-gray-800 hover:bg-gray-200";
  }
};

const getVerificationStatusColor = (status: VerificationStatus) => {
  switch (status) {
    case VerificationStatus.COMPLETED:
      return "bg-green-100 text-green-800 hover:bg-green-200";
    case VerificationStatus.IN_PROGRESS:
      return "bg-blue-100 text-blue-800 hover:bg-blue-200";
    case VerificationStatus.PENDING:
      return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200";
    case VerificationStatus.FAILED:
      return "bg-red-100 text-red-800 hover:bg-red-200";
    case VerificationStatus.EXPIRED:
      return "bg-orange-100 text-orange-800 hover:bg-orange-200";
    case VerificationStatus.REQUIRES_REVIEW:
      return "bg-purple-100 text-purple-800 hover:bg-purple-200";
    default:
      return "bg-gray-100 text-gray-800 hover:bg-gray-200";
  }
};

const getRiskLevelColor = (riskLevel: RiskLevel) => {
  switch (riskLevel) {
    case RiskLevel.LOW:
      return "bg-green-100 text-green-800 hover:bg-green-200";
    case RiskLevel.MEDIUM:
      return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200";
    case RiskLevel.HIGH:
      return "bg-orange-100 text-orange-800 hover:bg-orange-200";
    case RiskLevel.VERY_HIGH:
      return "bg-red-100 text-red-800 hover:bg-red-200";
    default:
      return "bg-gray-100 text-gray-800 hover:bg-gray-200";
  }
};

type LandlordActionsProps = {
  landlord: Landlord;
  onView?: (landlord: Landlord) => void;
  onEdit?: (landlord: Landlord) => void;
  onDelete?: (landlord: Landlord) => void;
};

const LandlordActions = ({
  landlord,
  onView,
  onEdit,
  onDelete,
}: LandlordActionsProps) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button className="h-8 w-8 p-0" variant="ghost">
        <span className="sr-only">Open menu</span>
        <MoreHorizontal className="h-4 w-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuLabel>Actions</DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={() => onView?.(landlord)}>
        <Eye className="mr-2 h-4 w-4" />
        View Details
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => onEdit?.(landlord)}>
        <Edit className="mr-2 h-4 w-4" />
        Edit
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        className="text-red-600 hover:text-red-700"
        onClick={() => onDelete?.(landlord)}
      >
        <Trash className="mr-2 h-4 w-4" />
        Delete
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
);

export const createLandlordColumns = (
  onView?: (landlord: Landlord) => void,
  onEdit?: (landlord: Landlord) => void,
  onDelete?: (landlord: Landlord) => void
): ColumnDef<Landlord>[] => [
  {
    accessorKey: "displayName",
    header: "Name",
    cell: ({ row }) => {
      const landlord = row.original;
      const displayName =
        landlord.landlordType === LandlordType.INDIVIDUAL
          ? `${landlord.personalInfo?.firstName || ""} ${landlord.personalInfo?.lastName || ""}`.trim()
          : landlord.businessInfo?.companyName || "";

      const email =
        landlord.landlordType === LandlordType.INDIVIDUAL
          ? landlord.personalInfo?.email
          : landlord.businessInfo?.directors?.[0]?.name || "";

      const initials = displayName
        .split(" ")
        .map((name) => name.charAt(0))
        .join("")
        .toUpperCase()
        .slice(0, 2);

      return (
        <div className="flex items-center space-x-3">
          <Avatar className="h-8 w-8">
            <AvatarImage alt={displayName} src="" />
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{displayName}</div>
            <div className="text-muted-foreground text-xs">{email}</div>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "landlordType",
    header: "Type",
    cell: ({ row }) => {
      const type = row.getValue("landlordType") as LandlordType;
      return (
        <Badge className="capitalize" variant="outline">
          {type.replace("_", " ")}
        </Badge>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as LandlordStatus;
      return (
        <Badge className={getStatusColor(status)}>
          {status.replace("_", " ")}
        </Badge>
      );
    },
  },
  {
    accessorKey: "verification.status",
    header: "Verification",
    cell: ({ row }) => {
      const verification = row.original.verification;
      return (
        <Badge className={getVerificationStatusColor(verification.status)}>
          {verification.status.replace("_", " ")}
        </Badge>
      );
    },
  },
  {
    accessorKey: "riskAssessment.riskLevel",
    header: "Risk Level",
    cell: ({ row }) => {
      const riskLevel = row.original.riskAssessment.riskLevel;
      return (
        <Badge className={getRiskLevelColor(riskLevel)}>
          {riskLevel.replace("_", " ")}
        </Badge>
      );
    },
  },
  {
    accessorKey: "propertyStats.totalProperties",
    header: "Properties",
    cell: ({ row }) => {
      const totalProperties = row.original.propertyStats.totalProperties;
      const activeProperties = row.original.propertyStats.activeProperties;
      return (
        <div className="text-center">
          <div className="font-medium">{totalProperties}</div>
          <div className="text-muted-foreground text-xs">
            {activeProperties} active
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "performanceMetrics.occupancyRate",
    header: "Occupancy",
    cell: ({ row }) => {
      const occupancyRate = row.original.performanceMetrics.occupancyRate;
      return (
        <div className="text-center">
          <div className="font-medium">{occupancyRate.toFixed(1)}%</div>
        </div>
      );
    },
  },
  {
    accessorKey: "contactInfo.primaryAddress.city",
    header: "Location",
    cell: ({ row }) => {
      const address = row.original.contactInfo.primaryAddress;
      return (
        <div className="text-sm">
          <div>{address.city}</div>
          <div className="text-muted-foreground">
            {address.state}, {address.country}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "Joined",
    cell: ({ row }) => {
      const createdAt = new Date(row.getValue("createdAt"));
      return (
        <div className="text-sm">
          {formatDistanceToNow(createdAt, { addSuffix: true })}
        </div>
      );
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const landlord = row.original;
      return (
        <LandlordActions
          landlord={landlord}
          onDelete={onDelete}
          onEdit={onEdit}
          onView={onView}
        />
      );
    },
  },
];
