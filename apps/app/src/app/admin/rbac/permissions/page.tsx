"use client";

import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import { Input } from "@kaa/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@kaa/ui/components/select";
import { Filter, Key, Plus, Search } from "lucide-react";
import { useState } from "react";
import {
  CreatePermissionSheet,
  PermissionsTable,
} from "@/modules/rbac/components";
import {
  useDeletePermission,
  usePermissions,
} from "@/modules/rbac/rbac.queries";
import { useRBACStore } from "@/modules/rbac/rbac.store";
import type { Permission } from "@/modules/rbac/rbac.type";

export default function PermissionsManagementPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterResource, setFilterResource] = useState("all");
  const [permissionToDelete, setPermissionToDelete] =
    useState<Permission | null>(null);

  const { data: permissionsData, isLoading } = usePermissions();
  const deletePermission = useDeletePermission();
  const { isCreatePermissionModalOpen, setCreatePermissionModalOpen } =
    useRBACStore();

  const handleEditPermission = (_permission: Permission) => {
    // Placeholder for edit functionality
  };

  const handleDeletePermission = (permission: Permission) => {
    setPermissionToDelete(permission);
  };

  const confirmDeletePermission = async () => {
    if (!permissionToDelete) return;
    try {
      await deletePermission.mutateAsync(permissionToDelete.id);
      setPermissionToDelete(null);
    } catch (error) {
      console.error("Failed to delete permission:", error);
    }
  };

  const filteredPermissions =
    permissionsData?.permissions?.filter((permission) => {
      const matchesSearch =
        permission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        permission.resource.toLowerCase().includes(searchTerm.toLowerCase());
      if (filterResource === "all") return matchesSearch;
      return matchesSearch && permission.resource === filterResource;
    }) || [];

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

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="relative">
              <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-gray-400" />
              <Input
                className="pl-10"
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search permissions..."
                value={searchTerm}
              />
            </div>

            <Select
              onValueChange={(value) => setFilterResource(value)}
              value={filterResource}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by resource" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {permissionsData?.permissions
                  ?.map((permission) => permission.resource)
                  .filter((value, index, self) => self.indexOf(value) === index)
                  .map((resource) => (
                    <SelectItem key={resource} value={resource}>
                      {resource}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {filteredPermissions.length} permissions found
              </Badge>
              {(searchTerm || filterResource !== "all") && (
                <Button
                  onClick={() => {
                    setSearchTerm("");
                    setFilterResource("all");
                  }}
                  size="sm"
                  variant="ghost"
                >
                  Clear filters
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Permissions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Permissions</CardTitle>
          <CardDescription>
            Manage permissions across various resources.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PermissionsTable onEditPermission={handleEditPermission} />
        </CardContent>
      </Card>

      {/* Create Permission Sheet */}
      <CreatePermissionSheet
        onOpenChange={setCreatePermissionModalOpen}
        open={isCreatePermissionModalOpen}
      />

      {/* Confirm Delete Dialog */}
      {permissionToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="rounded-lg bg-white p-6 shadow-lg">
            <h2 className="font-bold text-lg">Delete Permission</h2>
            <p className="mt-4">
              Are you sure you want to delete permission "
              {permissionToDelete.name}"?
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <Button
                onClick={() => setPermissionToDelete(null)}
                variant="outline"
              >
                Cancel
              </Button>
              <Button onClick={confirmDeletePermission} variant="destructive">
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
