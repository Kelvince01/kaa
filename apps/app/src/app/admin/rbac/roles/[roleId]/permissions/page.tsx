"use client";

import { Button } from "@kaa/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import {
  ArrowLeft,
  Check,
  Edit,
  Loader2,
  RotateCcw,
  Save,
  X,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  useAvailablePermissions,
  useRole,
  useRolePermissions,
  useUpdateRolePermissions,
} from "@/modules/rbac/rbac.queries";

// Actions that can be performed
const ACTION_LABELS: Record<string, string> = {
  create: "Create",
  read: "View",
  update: "Edit",
  delete: "Delete",
};

// Resource categories for grouping
const RESOURCE_CATEGORIES: Record<string, string[]> = {
  "User Management": [
    "users",
    "userRoles",
    "roles",
    "rolePermissions",
    "permissions",
    "verificationTokens",
    "sessions",
    "otps",
    "passkeys",
    "refreshTokens",
    "oauthConnections",
    "securityViolations",
  ],
  Properties: [
    "properties",
    "listings",
    "units",
    "propertyConditions",
    "propertyInspections",
  ],
  Applications: ["applications", "tenants", "savedSearches"],
  Contracts: ["contracts", "leases"],
  Financials: [
    "payments",
    "mpesaPayments",
    "paymentMethods",
    "transactions",
    "wallets",
    "subscriptions",
    "financial",
  ],
  Bookings: ["bookings", "viewings"],
  Communication: [
    "messages",
    "notifications",
    "notificationPreferences",
    "conversations",
    "webhooks",
    "sms",
  ],
  Reviews: ["reviews", "ratings"],
  Analytics: ["reports", "analytics", "audits"],
  Maintenance: ["maintenance", "tickets"],
  Files: ["documents", "files"],
};

type PermissionState = {
  [resource: string]: {
    [action: string]: {
      enabled: boolean;
      permissionId?: string;
    };
  };
};

export default function RolePermissionsPage() {
  const router = useRouter();
  const { roleId } = useParams();
  const { data: roleData, isLoading: roleLoading } = useRole(roleId as string);
  const { data: permissionsData, isLoading: permissionsLoading } =
    useRolePermissions(roleId as string);
  const { data: allPermissionsData, isLoading: allPermissionsLoading } =
    useAvailablePermissions();
  const updateRolePermissions = useUpdateRolePermissions(roleId as string);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [isEdit, setIsEdit] = useState(false);
  const [resources, setResources] = useState<string[]>([]);
  const [actions, setActions] = useState<string[]>([]);

  const [permissions, setPermissions] = useState<PermissionState>({});
  const [originalPermissions, setOriginalPermissions] =
    useState<PermissionState>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Transform API response to permission state
  useEffect(() => {
    if (permissionsData?.data) {
      const permissionState: PermissionState = {};

      for (const perm of permissionsData.data) {
        if (!permissionState[perm.resource]) {
          permissionState[perm.resource] = {};
        }
        (permissionState[perm.resource] as any)[perm.action] = {
          enabled: true,
          permissionId: perm.id,
        };
      }

      if (isEdit) {
        for (const perm of allPermissionsData?.data.permissions || []) {
          if (!permissionState[perm.resource]) {
            permissionState[perm.resource] = {};
          }
          (permissionState[perm.resource] as any)[perm.action] = {
            enabled:
              permissionsData.meta.actions.includes(perm.action) &&
              permissionsData.meta.resources.includes(perm.resource) &&
              perm.name ===
                permissionsData.data.find((p) => p.id === perm.id)?.name,
            permissionId: perm.id,
          };
        }
      }

      setPermissions(permissionState);
      setOriginalPermissions(JSON.parse(JSON.stringify(permissionState)));
      setResources(permissionsData.meta.resources);
      setActions(permissionsData.meta.actions);
    }
  }, [permissionsData, allPermissionsData?.data, isEdit]);

  // Check if there are unsaved changes
  useEffect(() => {
    const changed =
      JSON.stringify(permissions) !== JSON.stringify(originalPermissions);
    setHasChanges(changed);
  }, [permissions, originalPermissions]);

  // Get all unique resources
  const getAllResources = (): string[] => {
    const resourceSet = new Set<string>();
    for (const r of Object.values(RESOURCE_CATEGORIES).flat()) {
      resourceSet.add(r);
    }
    for (const r of Object.keys(permissions)) {
      resourceSet.add(r);
    }
    return Array.from(resourceSet).sort();
  };

  useEffect(() => {
    if (isEdit && allPermissionsData?.data) {
      setResources(allPermissionsData?.data.resources || []);
      setActions(allPermissionsData?.data.actions || []);
    }
  }, [allPermissionsData?.data, isEdit]);

  // Group resources by category
  const getGroupedResources = () => {
    const grouped: Record<string, string[]> = {};
    // const allResources = getAllResources();

    for (const [category, _resources] of Object.entries(RESOURCE_CATEGORIES)) {
      const categoryResources = _resources.filter((r) => resources.includes(r));
      if (categoryResources.length > 0) {
        grouped[category] = categoryResources;
      }
    }

    const categorizedResources = Object.values(RESOURCE_CATEGORIES).flat();
    const uncategorized = resources.filter(
      (r) => !categorizedResources.includes(r)
    );
    if (uncategorized.length > 0) {
      grouped.Other = uncategorized;
    }

    return grouped;
  };

  // Toggle individual permission
  const togglePermission = (resource: string, action: string) => {
    setPermissions((prev) => ({
      ...prev,
      [resource]: {
        ...prev[resource],
        [action]: {
          enabled: !prev[resource]?.[action]?.enabled,
          permissionId: prev[resource]?.[action]?.permissionId,
        },
      },
    }));
  };

  // Toggle all actions for a resource
  const toggleResourceAll = (resource: string) => {
    const currentPerms = permissions[resource] || {};
    const hasAll = actions.every((action) => currentPerms[action]?.enabled);

    setPermissions((prev) => ({
      ...prev,
      [resource]: actions.reduce(
        (acc, action) => ({
          // biome-ignore lint/performance/noAccumulatingSpread: ignore
          ...acc,
          [action]: {
            enabled: !hasAll,
            permissionId: prev[resource]?.[action]?.permissionId,
          },
        }),
        {}
      ),
    }));
  };

  // Toggle all resources for an action
  const toggleActionAll = (action: string) => {
    // const resources = getAllResources();
    const hasAll = resources.every((r) => permissions[r]?.[action]?.enabled);

    setPermissions((prev) => {
      const updated = { ...prev };
      for (const resource of resources) {
        if (!updated[resource]) updated[resource] = {};
        updated[resource][action] = {
          enabled: !hasAll,
          permissionId: updated[resource]?.[action]?.permissionId,
        };
      }
      return updated;
    });
  };

  // Check if resource has all permissions
  const hasAllPermissions = (resource: string) => {
    const perms = permissions[resource];
    return perms && actions.every((action) => perms[action]?.enabled);
  };

  // Check if action is enabled for all resources
  const isActionEnabledForAll = (action: string) => {
    // const resources = getAllResources();
    return resources.every((r) => permissions[r]?.[action]?.enabled);
  };

  // Save changes
  const handleSave = async () => {
    try {
      // Build list of permission IDs that should be enabled
      const selectedPermissionIds: string[] = [];

      for (const [resource, actions] of Object.entries(permissions)) {
        for (const [action, perm] of Object.entries(actions)) {
          if (perm.enabled && perm.permissionId) {
            selectedPermissionIds.push(perm.permissionId);
          }
        }
      }

      await updateRolePermissions.mutateAsync(selectedPermissionIds);
      setOriginalPermissions(JSON.parse(JSON.stringify(permissions)));
      setHasChanges(false);
      setIsEdit(false);
      toast.success("Permissions updated successfully");
    } catch (error) {
      console.error("Failed to update permissions:", error);
      toast.error("Failed to update permissions");
    }
  };

  // Reset to original permissions
  const handleReset = () => {
    setPermissions(JSON.parse(JSON.stringify(originalPermissions)));
    setHasChanges(false);
    setIsEdit(false);
  };

  if (roleLoading || permissionsLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            onClick={() => router.push("/admin/rbac/roles")}
            size="sm"
            variant="ghost"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Roles
          </Button>
          <div>
            <h1 className="font-bold text-3xl tracking-tight">
              Manage Permissions
            </h1>
            <p className="mt-1 text-gray-600 text-sm">
              Configure permissions for {(roleData as any)?.role.name}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {hasChanges && (
            <span className="flex items-center gap-1 text-amber-600 text-sm">
              <span className="h-2 w-2 rounded-full bg-amber-600" />
              Unsaved changes
            </span>
          )}

          <Button
            disabled={hasChanges || updateRolePermissions.isPending}
            onClick={() => setIsEdit(!isEdit)}
            variant="outline"
          >
            {isEdit ? (
              <X className="mr-2 h-4 w-4" />
            ) : (
              <Edit className="mr-2 h-4 w-4" />
            )}
            {isEdit ? "Cancel" : "Edit"}
          </Button>

          <Button
            disabled={!hasChanges || updateRolePermissions.isPending}
            onClick={handleReset}
            variant="outline"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset
          </Button>
          <Button
            disabled={!hasChanges || updateRolePermissions.isPending}
            onClick={handleSave}
          >
            {updateRolePermissions.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Role Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>{roleData?.role.name}</CardTitle>
          <CardDescription>
            {roleData?.role.description ||
              "Configure what this role can access and modify"}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Permissions Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Permission Matrix</CardTitle>
          <CardDescription>
            Toggle permissions for different resources and actions
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              {/* Table Header */}
              <thead className="border-gray-200 border-b bg-gray-50">
                <tr>
                  <th className="sticky left-0 z-20 bg-gray-50 px-6 py-4 text-left">
                    <span className="font-semibold text-gray-700 text-sm">
                      Resource
                    </span>
                  </th>

                  {actions.map((action) => (
                    <th
                      className="min-w-[100px] px-6 py-4 text-center"
                      key={action}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <span className="font-semibold text-gray-700 text-sm">
                          {ACTION_LABELS[action] || action}
                        </span>
                        <button
                          className={`rounded p-1.5 transition-colors disabled:opacity-50 ${
                            isActionEnabledForAll(action)
                              ? "bg-blue-100 text-blue-600 hover:bg-blue-200"
                              : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                          }`}
                          disabled={updateRolePermissions.isPending || !isEdit}
                          onClick={() => toggleActionAll(action)}
                          title={`Toggle all ${ACTION_LABELS[action]}`}
                          type="button"
                        >
                          <Check className="h-3 w-3" />
                        </button>
                      </div>
                    </th>
                  ))}

                  <th className="min-w-[80px] px-6 py-4 text-center">
                    <span className="font-semibold text-gray-700 text-sm">
                      All
                    </span>
                  </th>
                </tr>
              </thead>

              {/* Table Body */}
              <tbody className="divide-y divide-gray-200">
                {Object.entries(getGroupedResources()).map(
                  ([category, resources]) => (
                    <React.Fragment key={category}>
                      {/* Category Header */}
                      <tr className="bg-gray-50">
                        <td className="px-6 py-2" colSpan={actions.length + 2}>
                          <span className="font-semibold text-gray-600 text-xs uppercase tracking-wider">
                            {category}
                          </span>
                        </td>
                      </tr>

                      {/* Resources in Category */}
                      {resources.map((resource) => (
                        <tr
                          className="transition-colors hover:bg-gray-50"
                          key={resource}
                        >
                          {/* Resource Name */}
                          <td className="sticky left-0 z-10 border-gray-200 border-r bg-white px-6 py-4">
                            <div className="flex flex-col">
                              <span className="font-medium text-gray-900 text-sm capitalize">
                                {resource.replace(/_/g, " ")}
                              </span>
                            </div>
                          </td>

                          {/* Action Checkboxes */}
                          {actions.map((action) => (
                            <td className="px-6 py-4 text-center" key={action}>
                              <button
                                className={`inline-flex h-8 w-8 items-center justify-center rounded-lg transition-all disabled:opacity-50 ${
                                  permissions[resource]?.[action]?.enabled
                                    ? "bg-green-100 text-green-600 hover:bg-green-200"
                                    : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                                }`}
                                disabled={
                                  updateRolePermissions.isPending || !isEdit
                                }
                                onClick={() =>
                                  togglePermission(resource, action)
                                }
                                title={`${ACTION_LABELS[action]} ${resource}`}
                                type="button"
                              >
                                {permissions[resource]?.[action]?.enabled ? (
                                  <Check className="h-4 w-4" />
                                ) : (
                                  <X className="h-4 w-4" />
                                )}
                              </button>
                            </td>
                          ))}

                          {/* All Toggle */}
                          <td className="px-6 py-4 text-center">
                            <button
                              className={`inline-flex items-center justify-center rounded-lg px-3 py-1.5 font-medium text-xs transition-all disabled:opacity-50 ${
                                hasAllPermissions(resource)
                                  ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                              }`}
                              disabled={
                                updateRolePermissions.isPending || !isEdit
                              }
                              onClick={() => toggleResourceAll(resource)}
                              title={`Toggle all permissions for ${resource}`}
                              type="button"
                            >
                              {hasAllPermissions(resource) ? "All" : "None"}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  )
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="flex items-center gap-6 text-gray-600 text-sm">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-green-100">
            <Check className="h-4 w-4 text-green-600" />
          </div>
          <span>Enabled</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-gray-100">
            <X className="h-4 w-4 text-gray-400" />
          </div>
          <span>Disabled</span>
        </div>
        <div className="text-gray-500 text-xs">
          Click column headers to toggle all resources for that action
        </div>
      </div>
    </div>
  );
}
