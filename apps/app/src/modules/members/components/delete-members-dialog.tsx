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
import { useDeleteMember } from "../member.mutations";
import type { Member } from "../member.type";

type DeleteMembersDialogProps = {
  members: Member[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
  showTrigger?: boolean;
};

export function DeleteMembersDialog({
  members,
  open,
  onOpenChange,
  onSuccess,
  showTrigger = true,
}: DeleteMembersDialogProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const deleteMember = useDeleteMember();

  const handleOpenChange = (newOpen: boolean) => {
    setIsOpen(newOpen);
    onOpenChange?.(newOpen);
  };

  const handleDelete = async () => {
    try {
      // Delete all selected members
      for (const member of members) {
        await deleteMember.mutateAsync(member._id);
      }

      toast.success(
        `Successfully deleted ${members.length} member${members.length > 1 ? "s" : ""}`
      );

      handleOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error deleting members:", error);
      toast.error("Failed to delete members. Please try again.");
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
            {members.length === 1 ? (
              <>
                This will permanently delete <strong>{members[0]?.name}</strong>
                . This action cannot be undone.
              </>
            ) : (
              <>
                This will permanently delete <strong>{members.length}</strong>{" "}
                members. This action cannot be undone.
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            disabled={deleteMember.isPending}
            onClick={() => handleOpenChange(false)}
            variant="outline"
          >
            Cancel
          </Button>
          <Button
            disabled={deleteMember.isPending}
            onClick={handleDelete}
            variant="destructive"
          >
            {deleteMember.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
