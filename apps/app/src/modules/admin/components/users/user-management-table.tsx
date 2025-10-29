"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarInitials,
} from "@kaa/ui/components/avatar";
import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import { Checkbox } from "@kaa/ui/components/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@kaa/ui/components/dropdown-menu";
import { Input } from "@kaa/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@kaa/ui/components/select";
import { Skeleton } from "@kaa/ui/components/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@kaa/ui/components/table";
import { formatDistanceToNow } from "date-fns";
import {
  Edit,
  Eye,
  MoreHorizontal,
  Search,
  Shield,
  Trash2,
  UserPlus,
} from "lucide-react";
import { useState } from "react";
import {
  useAdminUsers,
  useDeleteAdminUser,
  useImpersonateUser,
} from "../../admin.queries";
import { useAdminStore } from "../../admin.store";
import type { UserManagementFilter } from "../../admin.type";

export function UserManagementTable() {
  const [filter, setFilter] = useState<UserManagementFilter>({
    page: 1,
    limit: 20,
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  const { data, isLoading } = useAdminUsers(filter);
  const deleteUser = useDeleteAdminUser();
  const impersonateUser = useImpersonateUser();

  const {
    selectedUsers,
    toggleUserSelection,
    clearSelectedUsers,
    hasSelectedUsers,
    selectedCount,
  } = useAdminStore();

  const handleFilterChange = (key: keyof UserManagementFilter, value: any) => {
    setFilter((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked && data?.items) {
      // Select all users on current page
      const userIds = data.items.map((user) => user._id);
      // This would need to be implemented in the store
      console.log("Select all:", userIds);
    } else {
      clearSelectedUsers();
    }
  };

  const getInitials = (firstName: string, lastName: string) =>
    `${firstName.charAt(0)}${lastName.charAt(0)}`;

  const getRoleBadgeVariant = (
    role: string
  ): "default" | "secondary" | "destructive" | "outline" => {
    switch (role) {
      case "super_admin":
        return "destructive";
      case "admin":
        return "default";
      case "support":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getStatusBadgeVariant = (isActive: boolean): "default" | "secondary" =>
    isActive ? "default" : "secondary";

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div className="flex items-center space-x-4" key={i.toString()}>
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-8 w-8" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle>User Management</CardTitle>
          <Button>
            <UserPlus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-4">
          <div className="relative max-w-sm flex-1">
            <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 transform text-muted-foreground" />
            <Input
              className="pl-9"
              onChange={(e) => handleFilterChange("search", e.target.value)}
              placeholder="Search users..."
              value={filter.search || ""}
            />
          </div>

          <Select
            onValueChange={(value) =>
              handleFilterChange("role", value === "all" ? undefined : value)
            }
            value={filter.role || "all"}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="super_admin">Super Admin</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="support">Support</SelectItem>
            </SelectContent>
          </Select>

          <Select
            onValueChange={(value) =>
              handleFilterChange("status", value === "all" ? undefined : value)
            }
            value={filter.status || "all"}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Bulk Actions */}
        {hasSelectedUsers() && (
          <div className="flex items-center space-x-2 rounded-md bg-muted p-2">
            <span className="text-muted-foreground text-sm">
              {selectedCount()} users selected
            </span>
            <Button size="sm" variant="outline">
              <Shield className="mr-2 h-4 w-4" />
              Change Role
            </Button>
            <Button size="sm" variant="outline">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        )}
      </CardHeader>

      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={
                    data?.items && selectedUsers.length === data.items.length
                  }
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Login</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.items?.map((user, index) => (
              <TableRow key={index.toString()}>
                <TableCell>
                  <Checkbox
                    checked={selectedUsers.includes(user._id)}
                    onCheckedChange={() => toggleUserSelection(user._id)}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        <AvatarInitials>
                          {getInitials(
                            user.profile.firstName,
                            user.profile.lastName
                          )}
                        </AvatarInitials>
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {user.profile.firstName} {user.profile.lastName}
                      </p>
                      <p className="text-muted-foreground text-sm">
                        {user.contact.email}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={getRoleBadgeVariant(user.role)}>
                    {user?.role ? user.role.replace("_", " ") : "-"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={getStatusBadgeVariant(user.status === "active")}
                  >
                    {user.status === "active" ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {user.activity?.lastLogin
                    ? formatDistanceToNow(new Date(user.activity.lastLogin), {
                        addSuffix: true,
                      })
                    : "Never"}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {formatDistanceToNow(new Date(user.createdAt), {
                    addSuffix: true,
                  })}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => impersonateUser.mutate(user._id)}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Impersonate
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => deleteUser.mutate(user._id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
