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
  const { isCreateRoleModalOpen, setCreateRoleModalOpen } = useRBACStore();
  const currentRole = useRole(roleId as string);

  const handleSuccess = () => {
    setCreateRoleModalOpen(false);
  };

  const handleCancel = () => {
    setCreateRoleModalOpen(false);
  };

  return (
    <Sheet onOpenChange={setCreateRoleModalOpen} open={isCreateRoleModalOpen}>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>Create Role</SheetTitle>
          <SheetDescription>
            Create a new role to manage user permissions and access control.
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6">
          <RoleForm
            mode="create"
            onCancel={handleCancel}
            onSuccess={handleSuccess}
            role={currentRole.data}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
