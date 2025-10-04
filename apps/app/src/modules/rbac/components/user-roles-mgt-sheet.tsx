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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@kaa/ui/components/sheet";
import { Calendar, Plus, Shield, Trash2, UserPlus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useRemoveRoleFromUser, useUserRoles } from "../rbac.queries";
import type { UserRole } from "../rbac.type";
import { RoleAssignmentForm } from "./role-assignment-form";

type UserRolesManagementProps = {
  userId: string;
  memberId?: string;
};

export function UserRolesManagement({
  userId,
  memberId,
}: UserRolesManagementProps) {
  const [isAssignRoleOpen, setIsAssignRoleOpen] = useState(false);
  const { data: userRoles, isLoading } = useUserRoles(userId, memberId);
  const removeRole = useRemoveRoleFromUser();

  const handleRemoveRole = async (roleId: string) => {
    // biome-ignore lint/suspicious/noAlert: ignore
    if (window.confirm("Are you sure you want to remove this role?")) {
      try {
        await removeRole.mutateAsync({ userId, roleId, memberId });
        toast.success("Role removed successfully");
      } catch (error) {
        toast.error("Failed to remove role");
      }
    }
  };

  const formatDate = (date: string | undefined) => {
    if (!date) return null;
    return new Date(date).toLocaleDateString();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Assigned Roles
          </CardTitle>
          <CardDescription>
            Manage roles and permissions for this user
          </CardDescription>
        </div>
        <Sheet onOpenChange={setIsAssignRoleOpen} open={isAssignRoleOpen}>
          <SheetTrigger asChild>
            <Button className="gap-2" size="sm">
              <Plus className="h-4 w-4" />
              Assign Role
            </Button>
          </SheetTrigger>
          <SheetContent className="overflow-y-auto sm:max-w-[600px]">
            <SheetHeader>
              <SheetTitle>Assign Role to User</SheetTitle>
              <SheetDescription>
                Assign a new role to this user with optional context and expiry
              </SheetDescription>
            </SheetHeader>
            <div className="mt-6">
              <RoleAssignmentForm
                onCancel={() => setIsAssignRoleOpen(false)}
                onSuccess={() => {
                  setIsAssignRoleOpen(false);
                  toast.success("Role assigned successfully");
                }}
                userId={userId}
              />
            </div>
          </SheetContent>
        </Sheet>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
          </div>
        ) : userRoles && userRoles.length > 0 ? (
          <div className="space-y-3">
            {userRoles.map((userRole: UserRole) => (
              <div
                className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-gray-50"
                key={userRole.id}
              >
                <div className="flex flex-1 items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                    <Shield className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-sm">
                        {(userRole.roleId as any)?.name || "Unknown Role"}
                      </h4>
                      {userRole.isPrimary && (
                        <Badge className="text-xs" variant="default">
                          Primary
                        </Badge>
                      )}
                      {(userRole.roleId as any)?.isSystem && (
                        <Badge className="text-xs" variant="secondary">
                          System
                        </Badge>
                      )}
                    </div>
                    <p className="mt-1 text-muted-foreground text-xs">
                      {(userRole.roleId as any)?.description ||
                        "No description"}
                    </p>

                    {/* Context Info */}
                    {userRole.context && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {userRole.context.department && (
                          <Badge className="text-xs" variant="outline">
                            Dept: {userRole.context.department}
                          </Badge>
                        )}
                        {userRole.context.project && (
                          <Badge className="text-xs" variant="outline">
                            Project: {userRole.context.project}
                          </Badge>
                        )}
                        {userRole.context.location && (
                          <Badge className="text-xs" variant="outline">
                            Location: {userRole.context.location}
                          </Badge>
                        )}
                        {userRole.context.temporary && (
                          <Badge
                            className="text-amber-600 text-xs"
                            variant="outline"
                          >
                            Temporary
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Expiry Date */}
                    {userRole.expiresAt && (
                      <div className="mt-2 flex items-center gap-1 text-muted-foreground text-xs">
                        <Calendar className="h-3 w-3" />
                        Expires: {formatDate(userRole.expiresAt)}
                      </div>
                    )}
                  </div>
                </div>

                <Button
                  className="text-red-600 hover:bg-red-50 hover:text-red-700"
                  onClick={() => handleRemoveRole(userRole.roleId)}
                  size="sm"
                  variant="ghost"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Shield className="mb-3 h-12 w-12 text-gray-400" />
            <h3 className="mb-1 font-medium text-gray-900 text-sm">
              No roles assigned
            </h3>
            <p className="mb-4 text-gray-500 text-xs">
              This user doesn't have any roles assigned yet
            </p>
            <Button
              className="gap-2"
              onClick={() => setIsAssignRoleOpen(true)}
              size="sm"
            >
              <Plus className="h-4 w-4" />
              Assign First Role
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

type AddUsersToRoleSheetProps = {
  roleId: string;
  roleName: string;
};

export function AddUsersToRoleSheet({
  roleId,
  roleName,
}: AddUsersToRoleSheetProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Sheet onOpenChange={setIsOpen} open={isOpen}>
      <SheetTrigger asChild>
        <Button className="gap-2">
          <UserPlus className="h-4 w-4" />
          Add Users
        </Button>
      </SheetTrigger>
      <SheetContent className="overflow-y-auto sm:max-w-[600px]">
        <SheetHeader>
          <SheetTitle>Add Users to {roleName}</SheetTitle>
          <SheetDescription>
            Assign this role to users with optional context and expiry
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6">
          <RoleAssignmentForm
            onCancel={() => setIsOpen(false)}
            onSuccess={() => {
              setIsOpen(false);
              toast.success("User added to role successfully");
            }}
            roleId={roleId}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}

// Hook for user roles (add to rbac.queries.ts)
// function useUserRoles(userId: string, memberId?: string) {
//   return useQuery({
//     queryKey: ["user-roles", userId, memberId],
//     queryFn: () => getUserRoles(userId, memberId),
//     enabled: !!userId,
//   });
// }

// // Hook for removing role (add to rbac.queries.ts)
// function useRemoveRoleFromUser() {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: ({
//       userId,
//       roleId,
//       memberId,
//     }: {
//       userId: string;
//       roleId: string;
//       memberId?: string;
//     }) => removeRoleFromUser(userId, roleId, memberId),
//     onSuccess: (_, variables) => {
//       queryClient.invalidateQueries({
//         queryKey: ["user-roles", variables.userId],
//       });
//     },
//   });
// }
