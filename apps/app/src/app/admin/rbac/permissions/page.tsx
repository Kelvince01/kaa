"use client";

import { Button } from "@kaa/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import { Key, Plus } from "lucide-react";
import {
  CreatePermissionSheet,
  PermissionsTable,
} from "@/modules/rbac/components";
import { usePermissions } from "@/modules/rbac/rbac.queries";
import { useRBACStore } from "@/modules/rbac/rbac.store";

export default function PermissionsManagementPage() {
  const { data: permissionsData, isLoading } = usePermissions();
  const { isCreatePermissionModalOpen, setCreatePermissionModalOpen } =
    useRBACStore();

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">
            Permissions Management
          </h1>
          <p className="text-gray-600">Create and manage system permissions</p>
        </div>
        <Button
          className="gap-2"
          onClick={() => setCreatePermissionModalOpen(true)}
        >
          <Plus className="h-4 w-4" />
          Create Permission
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">
              Total Permissions
            </CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              {permissionsData?.pagination?.total || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Permissions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Permissions</CardTitle>
          <CardDescription>
            Manage permissions across various resources.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PermissionsTable />
        </CardContent>
      </Card>

      {/* Create Permission Sheet */}
      <CreatePermissionSheet
        onOpenChange={setCreatePermissionModalOpen}
        open={isCreatePermissionModalOpen}
      />
    </div>
  );
}
