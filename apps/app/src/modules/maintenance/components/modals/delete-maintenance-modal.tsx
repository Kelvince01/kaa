"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@kaa/ui/components/alert-dialog";
import { Loader2 } from "lucide-react";
import { useState } from "react";

type DeleteMaintenanceModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  maintenanceTitle?: string;
  isMultiple?: boolean;
  count?: number;
};

export function DeleteMaintenanceModal({
  isOpen,
  onClose,
  onConfirm,
  maintenanceTitle,
  isMultiple = false,
  count = 1,
}: DeleteMaintenanceModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error("Failed to delete maintenance:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog onOpenChange={onClose} open={isOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isMultiple
              ? `Delete ${count} Maintenance Requests?`
              : "Delete Maintenance Request?"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isMultiple ? (
              <>
                Are you sure you want to delete {count} maintenance requests?
                This action cannot be undone and will permanently remove all
                associated data including updates, attachments, and history.
              </>
            ) : (
              <>
                Are you sure you want to delete the maintenance request
                {maintenanceTitle && (
                  <span className="font-semibold"> "{maintenanceTitle}"</span>
                )}
                ? This action cannot be undone and will permanently remove all
                associated data including updates, attachments, and history.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={isDeleting}
            onClick={handleConfirm}
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
