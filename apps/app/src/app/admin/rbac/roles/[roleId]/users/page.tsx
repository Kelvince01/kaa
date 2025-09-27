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
import { ArrowLeft, Users } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useRole, useUsersWithRole } from "@/modules/rbac/rbac.queries";
import {
  getStatusIcon,
  getUsersTableColumns,
} from "@/modules/users/components/table/columns";
import type { User } from "@/modules/users/user.type";
import { UserStatus } from "@/modules/users/user.type";
import type { DataTableRowAction } from "@/shared/types/data-table";

export default function RoleUsersPage() {
  const router = useRouter();
  const { roleId } = useParams();
  const [_rowAction, setRowAction] = useState<DataTableRowAction<User> | null>(
    null
  );
  const [pagination, _setPagination] = useState({ limit: 10, offset: 0 });

  const { data: roleData, isLoading: roleLoading } = useRole(roleId as string);
  const {
    data: usersData,
    isLoading: usersLoading,
    error: usersError,
  } = useUsersWithRole(roleId as string, pagination);

  if (roleLoading || usersLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
      </div>
    );
  }

  if (usersError) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <p className="mb-2 text-destructive">Error loading users</p>
          <p className="text-muted-foreground text-sm">{usersError.message}</p>
        </div>
      </div>
    );
  }

  const users = usersData?.users || [];
  const totalUsers = usersData?.pagination?.total || 0;

  // Calculate status counts for the table columns
  const statusCounts = users.reduce(
    (counts, user) => {
      counts[user.status] = (counts[user.status] || 0) + 1;
      return counts;
    },
    {} as Record<UserStatus, number>
  );

  // Initialize status counts with 0 for missing statuses
  for (const status of Object.values(UserStatus)) {
    if (!(status in statusCounts)) {
      statusCounts[status] = 0;
    }
  }

  const _columns = getUsersTableColumns({ statusCounts, setRowAction });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            className="gap-2"
            onClick={() => router.back()}
            size="sm"
            variant="ghost"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="font-bold text-3xl tracking-tight">
              Users with Role: {roleData?.name}
            </h1>
            <p className="text-muted-foreground">
              Manage users assigned to this role
            </p>
          </div>
        </div>
      </div>
      {/* Role Information Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">{roleData?.name}</CardTitle>
                <CardDescription>
                  {roleData?.description || "No description available"}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge className="gap-1" variant="secondary">
                <Users className="h-3 w-3" />
                {totalUsers} {totalUsers === 1 ? "User" : "Users"}
              </Badge>
              {roleData?.isActive && <Badge variant="default">Active</Badge>}
            </div>
          </div>
        </CardHeader>
      </Card>
      {/* Users Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users List</CardTitle>
          <CardDescription>
            All users currently assigned to the {roleData?.name} role
          </CardDescription>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="flex min-h-[200px] items-center justify-center">
              <div className="text-center">
                <Users className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 font-semibold text-lg">No users found</h3>
                <p className="text-muted-foreground">
                  No users are currently assigned to this role.
                </p>
              </div>
            </div>
          ) : (
            // <DataTable
            // 	data={users || []}
            // 	columns={columns}
            // 	enablePagination
            // 	pageSize={pagination.limit}
            // 	pageIndex={Math.floor(pagination.offset / pagination.limit)}
            // 	pageCount={Math.ceil(totalUsers / pagination.limit)}
            // 	onPaginationChange={(updater: any) => {
            // 		if (typeof updater === "function") {
            // 			const newPagination = updater({
            // 				pageIndex: Math.floor(pagination.offset / pagination.limit),
            // 				pageSize: pagination.limit,
            // 			});
            // 			setPagination({
            // 				limit: newPagination.pageSize,
            // 				offset: newPagination.pageIndex * newPagination.pageSize,
            // 			});
            // 		}
            // 	}}
            // />
            <div>Users</div>
          )}
        </CardContent>
      </Card>
      {/* Status Summary */}
      {users.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">User Status Summary</CardTitle>
            <CardDescription>
              Breakdown of user statuses for this role
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
              {Object.entries(statusCounts).map(([status, count]) => (
                <div
                  className="flex items-center space-x-2 rounded-lg border p-3"
                  key={status}
                >
                  {getStatusIcon(status as UserStatus)}
                  <div>
                    <p className="font-medium text-sm capitalize">
                      {status.toLowerCase()}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {count as any} users
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
