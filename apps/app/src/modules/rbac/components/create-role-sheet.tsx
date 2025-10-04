"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@kaa/ui/components/sheet";
import { useRole } from "../rbac.queries";
import { useRBACStore } from "../rbac.store";
import { RoleForm } from "./role-form";

export function CreateRoleSheet({
  // open,
  // onOpenChange,
  roleId,
}: {
  roleId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const {
    isCreateRoleModalOpen,
    setCreateRoleModalOpen,
    isUpdateRoleModalOpen,
    setUpdateRoleModalOpen,
    editingRole,
  } = useRBACStore();
  const isEdit = !!editingRole || !!roleId;
  const editingRoleId = editingRole || roleId;
  const mode = isEdit ? "edit" : "create";
  const isOpen = isCreateRoleModalOpen || isUpdateRoleModalOpen;
  const onOpenChange = isEdit ? setUpdateRoleModalOpen : setCreateRoleModalOpen;
  const title = isEdit ? "Edit Role" : "Create Role";
  const description = isEdit
    ? "Edit an existing role to manage user permissions and access control."
    : "Create a new role to manage user permissions and access control.";

  const currentRole = useRole(editingRoleId as string);

  const handleSuccess = () => {
    setCreateRoleModalOpen(false);
  };

  const handleCancel = () => {
    setCreateRoleModalOpen(false);
  };

  return (
    <Sheet onOpenChange={onOpenChange} open={isOpen}>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>
        <div className="mt-6">
          <RoleForm
            mode={mode}
            onCancel={handleCancel}
            onSuccess={handleSuccess}
            role={currentRole.data?.role as any}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
