"use client";

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
import { TrashIcon } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { useMediaQuery } from "@/hooks/use-media-query";
import { getErrorMessage } from "@/lib/handle-error";
import type { Tenant } from "../tenant.type";

type TenantsTableActionBarProps = {
  selectedRows: Tenant[];
  onDelete: (ids: string[]) => void;
};

export function TenantsTableActionBar({
  selectedRows,
  onDelete,
}: TenantsTableActionBarProps) {
  const [open, setOpen] = React.useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const selectedIds = selectedRows.map((row) => row._id);

  const handleDelete = () => {
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
        <DialogDescription className="hidden sm:block">
          {description}
        </DialogDescription>
      </div>
      <DialogFooter className="gap-2 sm:space-x-0">
        <DialogClose asChild>
          <Button variant="outline">Cancel</Button>
        </DialogClose>
        <Button
          disabled={!selectedIds.length}
          onClick={handleDelete}
          variant="destructive"
        >
          Delete
        </Button>
      </DialogFooter>
    </>
  );

  if (isDesktop) {
    return (
      <Dialog onOpenChange={setOpen} open={open}>
        <DialogTrigger asChild>
          <Button size="sm" variant="outline">
            <TrashIcon aria-hidden="true" className="mr-2 size-4" />
            Delete ({selectedRows.length})
          </Button>
        </DialogTrigger>
        <DialogContent>{content}</DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer onOpenChange={setOpen} open={open}>
      <DrawerTrigger asChild>
        <Button size="sm" variant="outline">
          <TrashIcon aria-hidden="true" className="mr-2 size-4" />
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
          <Button
            disabled={!selectedIds.length}
            onClick={handleDelete}
            variant="destructive"
          >
            Delete
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
