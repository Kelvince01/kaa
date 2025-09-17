"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@kaa/ui/components/sheet";
import { usePermission } from "../rbac.queries";
import { useRBACStore } from "../rbac.store";
import { PermissionForm } from "./permission-form";

export function CreatePermissionSheet({
  // open,
  // onOpenChange,
  permissionId,
}: {
  permissionId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { isCreatePermissionModalOpen, setCreatePermissionModalOpen } =
    useRBACStore();
  const currentPermission = usePermission(permissionId as string);

  const handleSuccess = () => {
    setCreatePermissionModalOpen(false);
  };

  const handleCancel = () => {
    setCreatePermissionModalOpen(false);
  };

  return (
    <Sheet
      onOpenChange={setCreatePermissionModalOpen}
      open={isCreatePermissionModalOpen}
    >
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>Create Permission</SheetTitle>
          <SheetDescription>
            Create a new permission to define specific actions users can
            perform.
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6">
          <PermissionForm
            mode="create"
            onCancel={handleCancel}
            onSuccess={handleSuccess}
            permission={currentPermission.data as any}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
