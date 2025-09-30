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
import { Edit, MoreHorizontal, Shield, Trash2, Users } from "lucide-react";
import { useDeleteRole, useRoles } from "../rbac.queries";
import { useRBACStore } from "../rbac.store";
import type { Role } from "../rbac.type";

type RolesTableProps = {
  onEditRole?: (role: Role) => void;
  onAssignPermissions?: (role: Role) => void;
  onViewUsers?: (role: Role) => void;
};

export function RolesTable({
  onEditRole,
  onAssignPermissions,
  onViewUsers,
}: RolesTableProps) {
  const { data: rolesData, isLoading } = useRoles();
  const deleteRole = useDeleteRole();
  const { selectedRoles, toggleRoleSelection } = useRBACStore();

  const handleDeleteRole = async (roleId: string) => {
    // biome-ignore lint/suspicious/noAlert: ignore
    if (window.confirm("Are you sure you want to delete this role?")) {
      await deleteRole.mutateAsync(roleId);
    }
  };

  if (isLoading) {
    return <div>Loading roles...</div>;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <input
                checked={
                  (rolesData?.roles?.length as number) > 0 &&
                  rolesData?.roles?.every((role) =>
                    selectedRoles.includes(role.id)
                  )
                }
                onChange={(e) => {
                  const allRoleIds =
                    rolesData?.roles?.map((role) => role.id) || [];
                  if (e.target.checked) {
                    for (const id of allRoleIds) {
                      if (!selectedRoles.includes(id)) {
                        toggleRoleSelection(id);
                      }
                    }
                  } else {
                    for (const id of allRoleIds) {
                      if (selectedRoles.includes(id)) {
                        toggleRoleSelection(id);
                      }
                    }
                  }
                }}
                type="checkbox"
              />
            </TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Level</TableHead>
            <TableHead>Permissions</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="w-12">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rolesData?.roles?.map((role) => (
            <TableRow key={role.id}>
              <TableCell>
                <input
                  checked={selectedRoles.includes(role.id)}
                  onChange={() => toggleRoleSelection(role.id)}
                  type="checkbox"
                />
              </TableCell>
              <TableCell className="font-medium">{role.name}</TableCell>
              <TableCell>{role.description || "-"}</TableCell>
              <TableCell>
                <Badge variant={role.isSystem ? "secondary" : "default"}>
                  {role.isSystem ? "System" : "Custom"}
                </Badge>
              </TableCell>
              <TableCell>{role.level}</TableCell>
              <TableCell>
                <Badge variant="outline">
                  {role.permissionCount || 0} permissions
                </Badge>
              </TableCell>
              <TableCell>
                {new Date(role.createdAt).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button className="h-8 w-8 p-0" variant="ghost">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEditRole?.(role)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onAssignPermissions?.(role)}
                    >
                      <Shield className="mr-2 h-4 w-4" />
                      Manage Permissions
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onViewUsers?.(role)}>
                      <Users className="mr-2 h-4 w-4" />
                      View Users
                    </DropdownMenuItem>
                    {!role.isSystem && (
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => handleDeleteRole(role.id)}
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
