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
import type { Row } from "@tanstack/react-table";
import { Loader, Trash } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { useMediaQuery } from "@/hooks/use-media-query";
import type { Application } from "../application.type";

// import { deleteApplicatio }

interface DeleteApplicationsDialogProps
  extends React.ComponentPropsWithoutRef<typeof Dialog> {
  applications: Row<Application>["original"][];
  showTrigger?: boolean;
  onSuccess?: () => void;
}

export function DeleteApplicationsDialog({
  applications,
  showTrigger = true,
  onSuccess,
  ...props
}: DeleteApplicationsDialogProps) {
  const [isDeletePending, startDeleteTransition] = React.useTransition();
  const isDesktop = useMediaQuery("(min-width: 640px)");

  function onDelete() {
    startDeleteTransition(() => {
      // const { error } = await deleteApplications({
      //   ids: applications.map((application) => application.id),
      // });

      // if (error) {
      //   toast.error(error);
      //   return;
      // }

      props.onOpenChange?.(false);
      toast.success("Applications deleted");
      onSuccess?.();
    });
  }

  if (isDesktop) {
    return (
      <Dialog {...props}>
        {showTrigger ? (
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <Trash aria-hidden="true" className="mr-2 size-4" />
              Delete ({applications.length})
            </Button>
          </DialogTrigger>
        ) : null}
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you absolutely sure?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete your{" "}
              <span className="font-medium">{applications.length}</span>
              {applications.length === 1 ? " application" : " applications"}{" "}
              from our servers.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:space-x-0">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              aria-label="Delete selected rows"
              disabled={isDeletePending}
              onClick={onDelete}
              variant="destructive"
            >
              {isDeletePending && (
                <Loader
                  aria-hidden="true"
                  className="mr-2 size-4 animate-spin"
                />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer {...props}>
      {showTrigger ? (
        <DrawerTrigger asChild>
          <Button size="sm" variant="outline">
            <Trash aria-hidden="true" className="mr-2 size-4" />
            Delete ({applications.length})
          </Button>
        </DrawerTrigger>
      ) : null}
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Are you absolutely sure?</DrawerTitle>
          <DrawerDescription>
            This action cannot be undone. This will permanently delete your{" "}
            <span className="font-medium">{applications.length}</span>
            {applications.length === 1 ? " application" : " applications"} from
            our servers.
          </DrawerDescription>
        </DrawerHeader>
        <DrawerFooter className="gap-2 sm:space-x-0">
          <DrawerClose asChild>
            <Button variant="outline">Cancel</Button>
          </DrawerClose>
          <Button
            aria-label="Delete selected rows"
            disabled={isDeletePending}
            onClick={onDelete}
            variant="destructive"
          >
            {isDeletePending && (
              <Loader aria-hidden="true" className="mr-2 size-4 animate-spin" />
            )}
            Delete
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
