"use client";

import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@kaa/ui/components/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@kaa/ui/components/table";
import { Edit, MoreHorizontal, Trash2 } from "lucide-react";
import { useDeletePermission, usePermissions } from "../rbac.queries";
import { useRBACStore } from "../rbac.store";
import type { Permission } from "../rbac.type";

type PermissionsTableProps = {
  roleId?: string;
  onEditPermission?: (permission: Permission) => void;
};

export function PermissionsTable({
  roleId,
  onEditPermission,
}: PermissionsTableProps) {
  const { data: permissionsData, isLoading } = usePermissions({ roleId });
  const deletePermission = useDeletePermission();
  const { selectedPermissions, togglePermissionSelection } = useRBACStore();

  const handleDeletePermission = async (permissionId: string) => {
    if (window.confirm("Are you sure you want to delete this permission?")) {
      await deletePermission.mutateAsync(permissionId);
    }
  };

  if (isLoading) {
    return <div>Loading permissions...</div>;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <input
                checked={
                  (permissionsData?.permissions?.length as number) > 0 &&
                  permissionsData?.permissions.every((permission) =>
                    selectedPermissions.includes(permission.id)
                  )
                }
                onChange={(e) => {
                  const allPermissionIds =
                    permissionsData?.permissions?.map(
                      (permission) => permission.id
                    ) || [];
                  if (e.target.checked) {
                    for (const id of allPermissionIds) {
                      if (!selectedPermissions.includes(id)) {
                        togglePermissionSelection(id);
                      }
                    }
                  } else {
                    for (const id of allPermissionIds) {
                      if (selectedPermissions.includes(id)) {
                        togglePermissionSelection(id);
                      }
                    }
                  }
                }}
                type="checkbox"
              />
            </TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Resource</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="w-12">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {permissionsData?.permissions?.map((permission) => (
            <TableRow key={permission.id}>
              <TableCell>
                <input
                  checked={selectedPermissions.includes(permission.id)}
                  onChange={() => togglePermissionSelection(permission.id)}
                  type="checkbox"
                />
              </TableCell>
              <TableCell className="font-medium">{permission.name}</TableCell>
              <TableCell>{permission.resource}</TableCell>
              <TableCell>
                <Badge variant="outline">{permission.action}</Badge>
              </TableCell>
              <TableCell>{permission.description || "-"}</TableCell>
              <TableCell>
                <Badge variant={permission.isSystem ? "secondary" : "default"}>
                  {permission.isSystem ? "System" : "Custom"}
                </Badge>
              </TableCell>
              <TableCell>
                {new Date(permission.createdAt).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button className="h-8 w-8 p-0" variant="ghost">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => onEditPermission?.(permission)}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    {!permission.isSystem && (
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => handleDeletePermission(permission.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
