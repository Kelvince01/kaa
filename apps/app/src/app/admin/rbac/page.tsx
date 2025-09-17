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
import {
  BarChart3,
  Key,
  Lock,
  Plus,
  Settings,
  Shield,
  UserCheck,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { usePermissions, useRoles } from "@/modules/rbac/rbac.queries";
import { useRBACStore } from "@/modules/rbac/rbac.store";

export default function RBACOverviewPage() {
  const router = useRouter();
  const { data: rolesData, isLoading: rolesLoading } = useRoles();
  const { data: permissionsData, isLoading: permissionsLoading } =
    usePermissions();
  const { setCreateRoleModalOpen, setCreatePermissionModalOpen } =
    useRBACStore();

  const stats = [
    {
      title: "Total Roles",
      value: rolesData?.roles?.length || 0,
      icon: Shield,
      description: "Active roles in the system",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Total Permissions",
      value: permissionsData?.permissions?.length || 0,
      icon: Key,
      description: "Available permissions",
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "System Roles",
      value: rolesData?.roles?.filter((role) => role.isSystem).length || 0,
      icon: Lock,
      description: "Built-in system roles",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Custom Roles",
      value: rolesData?.roles?.filter((role) => !role.isSystem).length || 0,
      icon: UserCheck,
      description: "User-created roles",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ];

  const quickActions = [
    {
      title: "Create New Role",
      description: "Add a new role with specific permissions",
      icon: Shield,
      action: () => setCreateRoleModalOpen(true),
      color: "bg-blue-600 hover:bg-blue-700",
    },
    {
      title: "Create Permission",
      description: "Define new system permissions",
      icon: Key,
      action: () => setCreatePermissionModalOpen(true),
      color: "bg-green-600 hover:bg-green-700",
    },
    {
      title: "Manage Roles",
      description: "View and edit existing roles",
      icon: Users,
      action: () => router.push("/admin/rbac/roles"),
      color: "bg-purple-600 hover:bg-purple-700",
    },
    {
      title: "Manage Permissions",
      description: "View and edit permissions",
      icon: Settings,
      action: () => router.push("/admin/rbac/permissions"),
      color: "bg-orange-600 hover:bg-orange-700",
    },
  ];

  const recentRoles = rolesData?.roles?.slice(0, 5) || [];
  const recentPermissions = permissionsData?.permissions?.slice(0, 5) || [];

  if (rolesLoading || permissionsLoading) {
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
          <h1 className="font-bold text-3xl tracking-tight">RBAC Management</h1>
          <p className="text-gray-600">
            Manage roles, permissions, and access control for your application
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            className="gap-2"
            onClick={() => setCreateRoleModalOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Create Role
          </Button>
          <Button
            className="gap-2"
            onClick={() => setCreatePermissionModalOpen(true)}
            variant="outline"
          >
            <Plus className="h-4 w-4" />
            Create Permission
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="font-medium text-sm">
                  {stat.title}
                </CardTitle>
                <div className={`rounded-full p-2 ${stat.bgColor}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="font-bold text-2xl">{stat.value}</div>
                <p className="text-gray-600 text-xs">{stat.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Quick Actions
          </CardTitle>
          <CardDescription>Common RBAC management tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Button
                  className={`h-auto flex-col items-start gap-2 p-4 text-left ${action.color}`}
                  key={action.title}
                  onClick={action.action}
                >
                  <Icon className="h-6 w-6" />
                  <div>
                    <div className="font-semibold">{action.title}</div>
                    <div className="text-xs opacity-90">
                      {action.description}
                    </div>
                  </div>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Items */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Roles */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Roles</CardTitle>
              <CardDescription>Latest roles in the system</CardDescription>
            </div>
            <Button
              onClick={() => router.push("/admin/rbac/roles")}
              size="sm"
              variant="outline"
            >
              View All
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentRoles.length > 0 ? (
                recentRoles.map((role) => (
                  <div
                    className="flex items-center justify-between rounded-lg border p-3"
                    key={role.id}
                  >
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-blue-50 p-2">
                        <Shield className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium">{role.name}</div>
                        <div className="text-gray-600 text-sm">
                          {role.description || "No description"}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={role.isSystem ? "secondary" : "default"}>
                        {role.isSystem ? "System" : "Custom"}
                      </Badge>
                      <Badge variant="outline">
                        {role.permissionCount || 0} permissions
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-4 text-center text-gray-500">
                  No roles found
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Permissions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Permissions</CardTitle>
              <CardDescription>
                Latest permissions in the system
              </CardDescription>
            </div>
            <Button
              onClick={() => router.push("/admin/rbac/permissions")}
              size="sm"
              variant="outline"
            >
              View All
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentPermissions.length > 0 ? (
                recentPermissions.map((permission) => (
                  <div
                    className="flex items-center justify-between rounded-lg border p-3"
                    key={permission.id}
                  >
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-green-50 p-2">
                        <Key className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <div className="font-medium">{permission.name}</div>
                        <div className="text-gray-600 text-sm">
                          {permission.resource} - {permission.action}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{permission.action}</Badge>
                      <Badge
                        variant={permission.isSystem ? "secondary" : "default"}
                      >
                        {permission.isSystem ? "System" : "Custom"}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-4 text-center text-gray-500">
                  No permissions found
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
