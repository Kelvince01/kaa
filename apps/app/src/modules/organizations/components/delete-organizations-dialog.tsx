"use client";

import { Button } from "@kaa/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@kaa/ui/components/dialog";
import { Loader2, Trash2 } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { useDeleteOrganization } from "../organization.mutations";
import type { Organization } from "../organization.type";

type DeleteOrganizationsDialogProps = {
  organizations: Organization[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
  showTrigger?: boolean;
};

export function DeleteOrganizationsDialog({
  organizations,
  open,
  onOpenChange,
  onSuccess,
  showTrigger = true,
}: DeleteOrganizationsDialogProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const deleteOrganization = useDeleteOrganization();

  const handleOpenChange = (newOpen: boolean) => {
    setIsOpen(newOpen);
    onOpenChange?.(newOpen);
  };

  const handleDelete = async () => {
    try {
      // Delete all selected organizations
      for (const org of organizations) {
        await deleteOrganization.mutateAsync(org._id);
      }

      toast.success(
        `Successfully deleted ${organizations.length} organization${organizations.length > 1 ? "s" : ""}`
      );

      handleOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error deleting organizations:", error);
      toast.error("Failed to delete organizations. Please try again.");
    }
  };

  return (
    <Dialog onOpenChange={handleOpenChange} open={open ?? isOpen}>
      {showTrigger && (
        <DialogTrigger asChild>
          <Button size="sm" variant="outline">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Are you sure?</DialogTitle>
          <DialogDescription>
            {organizations.length === 1 ? (
              <>
                This will permanently delete{" "}
                <strong>{organizations[0]?.name}</strong>. This action cannot be
                undone.
              </>
            ) : (
              <>
                This will permanently delete{" "}
                <strong>{organizations.length}</strong> organizations. This
                action cannot be undone.
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            disabled={deleteOrganization.isPending}
            onClick={() => handleOpenChange(false)}
            variant="outline"
          >
            Cancel
          </Button>
          <Button
            disabled={deleteOrganization.isPending}
            onClick={handleDelete}
            variant="destructive"
          >
            {deleteOrganization.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
