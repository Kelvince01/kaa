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
  open,
  onOpenChange,
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
    onOpenChange(false);
  };

  const handleCancel = () => {
    setCreatePermissionModalOpen(false);
    onOpenChange(false);
  };

  return (
    <Sheet
      onOpenChange={setCreatePermissionModalOpen || onOpenChange}
      open={isCreatePermissionModalOpen || open}
    >
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>
            {permissionId ? "Edit Permission" : "Create Permission"}
          </SheetTitle>
          <SheetDescription>
            {permissionId
              ? "Edit an existing permission to define specific actions users can perform."
              : "Create a new permission to define specific actions users can perform."}
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6">
          <PermissionForm
            mode={permissionId ? "edit" : "create"}
            onCancel={handleCancel}
            onSuccess={handleSuccess}
            permission={currentPermission.data?.permission as any}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
