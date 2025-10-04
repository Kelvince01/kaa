"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@kaa/ui/components/alert-dialog";
import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import { Checkbox } from "@kaa/ui/components/checkbox";
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
import { useState } from "react";
import { toast } from "sonner";
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
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);

  const handleDeleteRole = (role: Role) => {
    if (role.isSystem) {
      toast.warning("System roles cannot be deleted");
      return;
    }
    setRoleToDelete(role);
  };

  const confirmDeleteRole = async () => {
    if (!roleToDelete) return;

    try {
      await deleteRole.mutateAsync(roleToDelete.id);
      setRoleToDelete(null);
    } catch (error) {
      console.error("Failed to delete role:", error);
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
              <Checkbox
                checked={
                  (rolesData?.roles?.length as number) > 0 &&
                  rolesData?.roles?.every((role) =>
                    selectedRoles.includes(role.id)
                  )
                }
                onChange={(e) => {
                  const allRoleIds =
                    rolesData?.roles?.map((role) => role.id) || [];
                  if ((e.target as HTMLInputElement).checked) {
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
                <Checkbox
                  checked={selectedRoles.includes(role.id)}
                  onChange={() => toggleRoleSelection(role.id)}
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
                        onClick={() => handleDeleteRole(role)}
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        onOpenChange={() => setRoleToDelete(null)}
        open={!!roleToDelete}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Role</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the role "{roleToDelete?.name}"?
              This action cannot be undone. All users assigned to this role will
              lose their permissions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={confirmDeleteRole}
            >
              Delete Role
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
