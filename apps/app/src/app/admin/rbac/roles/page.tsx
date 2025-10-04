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
import { Filter, Key, Plus, Search, Shield, Trash2, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { RolesTable } from "@/modules/rbac/components";
import { useDeleteRole, useRoles } from "@/modules/rbac/rbac.queries";
import { useRBACStore } from "@/modules/rbac/rbac.store";
import type { Role } from "@/modules/rbac/rbac.type";

export default function RolesManagementPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "system" | "custom">(
    "all"
  );

  const { data: rolesData, isLoading } = useRoles({
    q: searchTerm,
    isSystem: filterType === "all" ? undefined : filterType === "system",
  });

  const deleteRole = useDeleteRole();
  const {
    selectedRoles,
    clearSelectedRoles,
    setCreateRoleModalOpen,
    setUpdateRoleModalOpen,
    hasSelectedRoles,
    selectedRoleCount,
  } = useRBACStore();

  const handleEditRole = (role: Role) => {
    setUpdateRoleModalOpen(true, role.id);
  };

  const handleBulkDelete = async () => {
    const nonSystemRoles = selectedRoles.filter((roleId) => {
      const role = rolesData?.roles?.find((r) => r.id === roleId);
      return role && !role.isSystem;
    });

    if (nonSystemRoles.length === 0) {
      toast.warning("Cannot delete system roles");
      return;
    }

    if (
      // biome-ignore lint/suspicious/noAlert: ignore
      window.confirm(
        `Are you sure you want to delete ${nonSystemRoles.length} selected roles?`
      )
    ) {
      try {
        await Promise.all(
          nonSystemRoles.map((roleId) => deleteRole.mutateAsync(roleId))
        );
        clearSelectedRoles();
      } catch (error) {
        console.error("Failed to delete roles:", error);
      }
    }
  };

  const handleAssignPermissions = (role: Role) => {
    router.push(`/admin/rbac/roles/${role.id}/permissions`);
  };

  const handleViewUsers = (role: Role) => {
    router.push(`/admin/rbac/roles/${role.id}/users`);
  };

  const filteredRoles =
    rolesData?.roles?.filter((role) => {
      const matchesSearch =
        role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (role.description?.toLowerCase().includes(searchTerm.toLowerCase()) ??
          false);

      if (filterType === "all") return matchesSearch;
      if (filterType === "system") return matchesSearch && role.isSystem;
      if (filterType === "custom") return matchesSearch && !role.isSystem;

      return matchesSearch;
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
            Roles Management
          </h1>
          <p className="text-gray-600">
            Create and manage user roles and their permissions
          </p>
        </div>
        <Button className="gap-2" onClick={() => setCreateRoleModalOpen(true)}>
          <Plus className="h-4 w-4" />
          Create Role
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Total Roles</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              {rolesData?.roles?.length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">System Roles</CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              {rolesData?.roles?.filter((role) => role.isSystem).length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Custom Roles</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              {rolesData?.roles?.filter((role) => !role.isSystem).length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Selected</CardTitle>
            <Badge variant="outline">{selectedRoleCount()}</Badge>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              {hasSelectedRoles() && (
                <>
                  <Button
                    className="gap-1"
                    onClick={handleBulkDelete}
                    size="sm"
                    variant="destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                    Delete ({selectedRoleCount()})
                  </Button>
                  <Button
                    onClick={clearSelectedRoles}
                    size="sm"
                    variant="outline"
                  >
                    Clear
                  </Button>
                </>
              )}
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
                placeholder="Search roles..."
                value={searchTerm}
              />
            </div>

            <Select
              onValueChange={(value: "all" | "system" | "custom") =>
                setFilterType(value)
              }
              value={filterType}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="system">System Roles Only</SelectItem>
                <SelectItem value="custom">Custom Roles Only</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {filteredRoles.length} roles found
              </Badge>
              {(searchTerm || filterType !== "all") && (
                <Button
                  onClick={() => {
                    setSearchTerm("");
                    setFilterType("all");
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

      {/* Roles Table */}
      <Card>
        <CardHeader>
          <CardTitle>Roles</CardTitle>
          <CardDescription>
            Manage system and custom roles. System roles cannot be deleted.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RolesTable
            onAssignPermissions={handleAssignPermissions}
            onEditRole={handleEditRole}
            onViewUsers={handleViewUsers}
          />
        </CardContent>
      </Card>
    </div>
  );
}
