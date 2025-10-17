"use client";

import type { ColumnDef } from "@tanstack/react-table";
import {
	ArrowUpDown,
	CalendarIcon,
	CheckCircle2,
	CircleHelp,
	CircleDashed,
	CircleX,
	Clock,
	Ellipsis,
	Text,
	Timer,
	CircleIcon,
	User,
	Home,
	FileText,
} from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { DataTableColumnHeader } from "@/components/ui/data-table/data-table-column-header";
import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import { Checkbox } from "@kaa/ui/components/checkbox";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
	DropdownMenuShortcut,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from "@kaa/ui/components/dropdown-menu";
import { formatDate } from "@/shared/utils/format.util";
import { getErrorMessage } from "@/lib/handle-error";
import type { DataTableRowAction } from "@/shared/types/data-table";

import { useUpdateTenant } from "../tenant.queries";
import { TenantStatus, type Tenant } from "../tenant.type";

export function getStatusIcon(status: Tenant["status"]) {
	const statusIcons = {
		active: CheckCircle2,
		inactive: CircleX,
		suspended: CircleHelp,
	};

	return statusIcons[status] || CircleIcon;
}

interface GetTenantsTableColumnsProps {
	statusCounts: Record<Tenant["status"], number>;
	setRowAction: React.Dispatch<React.SetStateAction<DataTableRowAction<Tenant> | null>>;
}

export function getTenantsTableColumns({
	statusCounts,
	setRowAction,
}: GetTenantsTableColumnsProps): ColumnDef<Tenant>[] {
	return [
		{
			id: "select",
			header: ({ table }) => (
				<Checkbox
					checked={
						table.getIsAllPageRowsSelected() ||
						(table.getIsSomePageRowsSelected() && "indeterminate")
					}
					onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
					aria-label="Select all"
					className="translate-y-0.5"
				/>
			),
			cell: ({ row }) => (
				<Checkbox
					checked={row.getIsSelected()}
					onCheckedChange={(value) => row.toggleSelected(!!value)}
					aria-label="Select row"
					className="translate-y-0.5"
				/>
			),
			enableSorting: false,
			enableHiding: false,
			size: 40,
		},
		{
			id: "name",
			accessorKey: "personalInfo",
			header: ({ column }) => <DataTableColumnHeader column={column} title="Tenant Name" />,
			cell: ({ row }) => {
				const personalInfo = row.getValue<Tenant["personalInfo"]>("personalInfo");
				const fullName = `${personalInfo.firstName} ${personalInfo.middleName ? `${personalInfo.middleName} ` : ""}${personalInfo.lastName}`;
				return (
					<div className="flex items-center gap-2">
						<span className="max-w-[31.25rem] truncate font-medium">{fullName}</span>
					</div>
				);
			},
			meta: {
				label: "Tenant Name",
				placeholder: "Search tenant name...",
				variant: "text",
				icon: User,
			},
			enableColumnFilter: true,
		},
		{
			id: "property",
			accessorKey: "property",
			header: ({ column }) => <DataTableColumnHeader column={column} title="Property" />,
			cell: ({ row }) => {
				const property = row.getValue<Tenant["property"]>("property");
				const propertyTitle =
					property && typeof property === "object" ? property.title || property.name : property;
				return (
					<div className="flex items-center gap-2">
						<span className="max-w-[31.25rem] truncate font-medium">{propertyTitle || "N/A"}</span>
					</div>
				);
			},
			meta: {
				label: "Property",
				placeholder: "Search property...",
				variant: "text",
				icon: Home,
			},
			enableColumnFilter: true,
		},
		{
			id: "unit",
			accessorKey: "unit",
			header: ({ column }) => <DataTableColumnHeader column={column} title="Unit" />,
			cell: ({ row }) => {
				const unit = row.getValue<Tenant["unit"]>("unit");
				const unitTitle = unit && typeof unit === "object" ? unit.title || unit.name : unit;
				return (
					<div className="flex items-center gap-2">
						<span className="max-w-[31.25rem] truncate font-medium">{unitTitle || "N/A"}</span>
					</div>
				);
			},
			meta: {
				label: "Unit",
				placeholder: "Search unit...",
				variant: "text",
				icon: Home,
			},
			enableColumnFilter: true,
		},
		{
			id: "status",
			accessorKey: "status",
			header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
			cell: ({ cell }) => {
				const status = Object.values(TenantStatus).find(
					(status) => status === cell.getValue<Tenant["status"]>()
				);

				if (!status) return null;

				const Icon = getStatusIcon(status);

				return (
					<Badge variant="outline" className="py-1 [&>svg]:size-3.5">
						<Icon />
						<span className="capitalize">{status}</span>
					</Badge>
				);
			},
			meta: {
				label: "Status",
				variant: "multiSelect",
				options: Object.values(TenantStatus).map((status) => ({
					label: status.charAt(0).toUpperCase() + status.slice(1),
					value: status,
					count: statusCounts[status] || 0,
					icon: getStatusIcon(status),
				})),
				icon: CircleDashed,
			},
			enableColumnFilter: true,
		},
		{
			id: "startDate",
			accessorKey: "startDate",
			header: ({ column }) => <DataTableColumnHeader column={column} title="Start Date" />,
			cell: ({ cell }) => formatDate(cell.getValue<Date>()),
			meta: {
				label: "Start Date",
				variant: "dateRange",
				icon: CalendarIcon,
			},
			enableColumnFilter: true,
		},
		{
			id: "endDate",
			accessorKey: "endDate",
			header: ({ column }) => <DataTableColumnHeader column={column} title="End Date" />,
			cell: ({ cell }) => {
				const endDate = cell.getValue<Date>();
				return endDate ? formatDate(endDate) : <span className="text-muted-foreground">N/A</span>;
			},
			meta: {
				label: "End Date",
				variant: "dateRange",
				icon: CalendarIcon,
			},
			enableColumnFilter: true,
		},
		{
			id: "createdAt",
			accessorKey: "createdAt",
			header: ({ column }) => <DataTableColumnHeader column={column} title="Created At" />,
			cell: ({ cell }) => formatDate(cell.getValue<Date>()),
			meta: {
				label: "Created At",
				variant: "dateRange",
				icon: CalendarIcon,
			},
			enableColumnFilter: true,
		},
		{
			id: "actions",
			cell: function Cell({ row }) {
				const [isUpdatePending, startUpdateTransition] = React.useTransition();

				return (
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								aria-label="Open menu"
								variant="ghost"
								className="flex size-8 p-0 data-[state=open]:bg-muted"
							>
								<Ellipsis className="size-4" aria-hidden="true" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-40">
							<DropdownMenuItem onSelect={() => setRowAction({ row, variant: "update" })}>
								Edit
							</DropdownMenuItem>
							<DropdownMenuSub>
								<DropdownMenuSubTrigger>Status</DropdownMenuSubTrigger>
								<DropdownMenuSubContent>
									<DropdownMenuRadioGroup
										value={row.original.status}
										onValueChange={(value) => {
											startUpdateTransition(() => {
												toast.promise(async () => {}, {
													loading: "Updating...",
													success: "Status updated",
													error: (err) => getErrorMessage(err),
												});
											});
										}}
									>
										{Object.values(TenantStatus).map((label) => (
											<DropdownMenuRadioItem
												key={label}
												value={label}
												className="capitalize"
												disabled={isUpdatePending}
											>
												{label}
											</DropdownMenuRadioItem>
										))}
									</DropdownMenuRadioGroup>
								</DropdownMenuSubContent>
							</DropdownMenuSub>
							<DropdownMenuSeparator />
							<DropdownMenuItem onSelect={() => setRowAction({ row, variant: "delete" })}>
								Delete
								<DropdownMenuShortcut>⌘⌫</DropdownMenuShortcut>
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				);
			},
			size: 40,
		},
	];
}
