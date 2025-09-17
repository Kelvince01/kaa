"use client";

import { Button } from "@kaa/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@kaa/ui/components/dialog";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useDeleteUser } from "../user.queries";
import type { User } from "../user.type";

type DeleteUsersDialogProps = {
  users: User[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
};

export function DeleteUsersDialog({
  users,
  open,
  onOpenChange,
  onSuccess,
}: DeleteUsersDialogProps) {
  const router = useRouter();
  const { mutateAsync: deleteUser, isPending } = useDeleteUser();
  const isMultiple = users.length > 1;

  const handleDelete = async () => {
    try {
      await Promise.all(users.map((user) => deleteUser(user.id)));

      toast.success(
        isMultiple
          ? `${users.length} users deleted successfully`
          : "User deleted successfully"
      );

      onOpenChange(false);
      onSuccess?.();
      router.refresh();
    } catch (error) {
      console.error("Error deleting users:", error);
      toast.error(
        isMultiple
          ? "Failed to delete users. Please try again."
          : "Failed to delete user. Please try again."
      );
    }
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isMultiple ? `Delete ${users.length} users?` : "Delete user?"}
          </DialogTitle>
          <DialogDescription>
            {isMultiple
              ? `Are you sure you want to delete these ${users.length} users? This action cannot be undone.`
              : `Are you sure you want to delete ${users[0]?.firstName || "this user"}? This action cannot be undone.`}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            disabled={isPending}
            onClick={() => onOpenChange(false)}
            variant="outline"
          >
            Cancel
          </Button>
          <Button
            disabled={isPending}
            onClick={handleDelete}
            variant="destructive"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : isMultiple ? (
              `Delete ${users.length} users`
            ) : (
              "Delete user"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
