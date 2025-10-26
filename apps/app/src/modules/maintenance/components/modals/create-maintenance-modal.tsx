"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@kaa/ui/components/dialog";
import { CreateMaintenanceForm } from "../forms/create-maintenance-form";

type CreateMaintenanceModalProps = {
  isOpen: boolean;
  onClose: () => void;
  defaultPropertyId?: string;
};

export function CreateMaintenanceModal({
  isOpen,
  onClose,
  defaultPropertyId,
}: CreateMaintenanceModalProps) {
  return (
    <Dialog onOpenChange={onClose} open={isOpen}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Maintenance Request</DialogTitle>
        </DialogHeader>

        <CreateMaintenanceForm
          defaultPropertyId={defaultPropertyId}
          onCancel={onClose}
          onSuccess={onClose}
        />
      </DialogContent>
    </Dialog>
  );
}
