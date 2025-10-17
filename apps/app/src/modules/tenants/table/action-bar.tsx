"use client";

import * as React from "react";
import { TrashIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@kaa/ui/components/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@kaa/ui/components/dialog";
import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerDescription,
	DrawerFooter,
	DrawerHeader,
	DrawerTitle,
	DrawerTrigger,
} from "@kaa/ui/components/drawer";
import { useMediaQuery } from "@/hooks/use-media-query";
import { getErrorMessage } from "@/lib/handle-error";
import type { Tenant } from "../tenant.type";

interface TenantsTableActionBarProps {
	selectedRows: Tenant[];
	onDelete: (ids: string[]) => void;
}

export function TenantsTableActionBar({ selectedRows, onDelete }: TenantsTableActionBarProps) {
	const [open, setOpen] = React.useState(false);
	const isDesktop = useMediaQuery("(min-width: 768px)");
	const selectedIds = selectedRows.map((row) => row._id);

	const handleDelete = async () => {
		try {
			onDelete(selectedIds);
			setOpen(false);
			toast.success("Tenants deleted");
		} catch (err) {
			toast.error(getErrorMessage(err));
		}
	};

	if (selectedRows.length === 0) return null;

	const title = selectedRows.length > 1 ? "tenants" : "tenant";
	const description =
		selectedRows.length > 1
			? `Are you sure you want to delete ${selectedRows.length} tenants?`
			: "Are you sure you want to delete this tenant?";

	const content = (
		<>
			<DialogHeader className="sm:hidden">
				<DialogTitle>Delete {title}</DialogTitle>
				<DialogDescription>{description}</DialogDescription>
			</DialogHeader>
			<div className="grid gap-4">
				<DialogTitle className="hidden sm:block">Delete {title}</DialogTitle>
				<DialogDescription className="hidden sm:block">{description}</DialogDescription>
			</div>
			<DialogFooter className="gap-2 sm:space-x-0">
				<DialogClose asChild>
					<Button variant="outline">Cancel</Button>
				</DialogClose>
				<Button variant="destructive" onClick={handleDelete} disabled={!selectedIds.length}>
					Delete
				</Button>
			</DialogFooter>
		</>
	);

	if (isDesktop) {
		return (
			<Dialog open={open} onOpenChange={setOpen}>
				<DialogTrigger asChild>
					<Button variant="outline" size="sm">
						<TrashIcon className="mr-2 size-4" aria-hidden="true" />
						Delete ({selectedRows.length})
					</Button>
				</DialogTrigger>
				<DialogContent>{content}</DialogContent>
			</Dialog>
		);
	}

	return (
		<Drawer open={open} onOpenChange={setOpen}>
			<DrawerTrigger asChild>
				<Button variant="outline" size="sm">
					<TrashIcon className="mr-2 size-4" aria-hidden="true" />
					Delete ({selectedRows.length})
				</Button>
			</DrawerTrigger>
			<DrawerContent>
				<DrawerHeader className="text-left">
					<DrawerTitle>Delete {title}</DrawerTitle>
					<DrawerDescription>{description}</DrawerDescription>
				</DrawerHeader>
				<DrawerFooter className="gap-2 sm:space-x-0">
					<DrawerClose asChild>
						<Button variant="outline">Cancel</Button>
					</DrawerClose>
					<Button variant="destructive" onClick={handleDelete} disabled={!selectedIds.length}>
						Delete
					</Button>
				</DrawerFooter>
			</DrawerContent>
		</Drawer>
	);
}
