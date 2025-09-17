"use client";

import type React from "react";
import {
  CreatePermissionSheet,
  CreateRoleSheet,
} from "@/modules/rbac/components";
import { useRBACStore } from "@/modules/rbac/rbac.store";

type RBACLayoutProps = {
  children: React.ReactNode;
};

export default function RBACLayout({ children }: RBACLayoutProps) {
  const {
    isCreateRoleModalOpen,
    setCreateRoleModalOpen,
    isCreatePermissionModalOpen,
    setCreatePermissionModalOpen,
    isUpdateRoleModalOpen,
    setUpdateRoleModalOpen,
    isUpdatePermissionModalOpen,
    setUpdatePermissionModalOpen,
    editingRole,
    editingPermission,
  } = useRBACStore();

  return (
    <>
      {children}

      {/* Global RBAC Modals and Sheets */}
      <CreateRoleSheet
        onOpenChange={setCreateRoleModalOpen}
        open={isCreateRoleModalOpen}
      />

      <CreatePermissionSheet
        onOpenChange={setCreatePermissionModalOpen}
        open={isCreatePermissionModalOpen}
      />

      {/* Update Role Sheet - if you have one */}
      {isUpdateRoleModalOpen && editingRole && (
        <CreateRoleSheet
          onOpenChange={setUpdateRoleModalOpen}
          open={isUpdateRoleModalOpen}
          roleId={editingRole}
        />
      )}

      {/* Update Permission Sheet - if you have one */}
      {isUpdatePermissionModalOpen && editingPermission && (
        <CreatePermissionSheet
          onOpenChange={setUpdatePermissionModalOpen}
          open={isUpdatePermissionModalOpen}
          permissionId={editingPermission}
        />
      )}
    </>
  );
}
