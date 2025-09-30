"use client";

import { Button } from "@kaa/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import {
  useRole,
  useRolePermissions,
  useUpdateRolePermissions,
} from "@/modules/rbac/rbac.queries";
import type { Permission } from "@/modules/rbac/rbac.type";

export default function RolePermissionsPage() {
  const router = useRouter();
  const { roleId } = useParams();
  const { data: roleData, isLoading: roleLoading } = useRole(roleId as string);
  const { data: permissionsData, isLoading: permissionsLoading } =
    useRolePermissions(roleId as string);
  const updateRolePermissions = useUpdateRolePermissions(roleId as string);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  if (roleLoading || permissionsLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
      </div>
    );
  }

  const handleSave = async () => {
    try {
      await updateRolePermissions.mutateAsync(selectedPermissions);
      toast.success("Permissions updated successfully");
      router.push("/admin/rbac/roles");
    } catch (error) {
      console.error("Failed to update permissions:", error);
      toast.error("Failed to update permissions");
    }
  };

  const handlePermissionToggle = (permissionId: string) => {
    setSelectedPermissions((current) =>
      current.includes(permissionId)
        ? current.filter((id) => id !== permissionId)
        : [...current, permissionId]
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-bold text-3xl tracking-tight">
          Manage Permissions for {roleData?.name}
        </h1>
        <Button className="gap-2" onClick={handleSave}>
          Save
        </Button>
      </div>

      <Card className="">
        <CardHeader>
          <CardTitle>Available Permissions</CardTitle>
          <CardDescription>
            Select permissions to assign to the role
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="divide-y divide-gray-200">
            {permissionsData?.permissions.map((permission: Permission) => (
              <li className="flex justify-between py-2" key={permission.id}>
                <span>{permission.name}</span>
                <input
                  checked={selectedPermissions.includes(permission.id)}
                  onChange={() => handlePermissionToggle(permission.id)}
                  type="checkbox"
                />
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
