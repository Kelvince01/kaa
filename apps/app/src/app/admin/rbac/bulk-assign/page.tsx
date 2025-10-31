"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import { Calendar } from "@kaa/ui/components/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import { Checkbox } from "@kaa/ui/components/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@kaa/ui/components/form";
import { Input } from "@kaa/ui/components/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@kaa/ui/components/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@kaa/ui/components/select";
import { Separator } from "@kaa/ui/components/separator";
import { cn } from "@kaa/ui/lib/utils";
import { format } from "date-fns";
import {
  AlertCircle,
  CalendarIcon,
  CheckCircle2,
  Loader2,
  Search,
  Shield,
  UserCheck,
  Users,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useBulkAssignRoles, useRoles } from "@/modules/rbac/rbac.queries";
import { useUsers } from "@/modules/users/user.queries";
import type { User } from "@/modules/users/user.type";

// Schema for bulk assignment
const bulkAssignmentSchema = z.object({
  roleId: z.string().min(1, "Please select a role"),
  isPrimary: z.boolean(),
  expiresAt: z.string().optional(),
  context: z
    .object({
      department: z.string().optional(),
      project: z.string().optional(),
      location: z.string().optional(),
      temporary: z.boolean(),
      reason: z.string().optional(),
    })
    .optional(),
});

type BulkAssignmentFormData = z.infer<typeof bulkAssignmentSchema>;

export default function BulkRoleAssignmentPage() {
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const { data: usersData, isLoading: usersLoading } = useUsers({});
  const { data: rolesData, isLoading: rolesLoading } = useRoles();
  const bulkAssignRoles = useBulkAssignRoles();

  const form = useForm<BulkAssignmentFormData>({
    resolver: zodResolver(bulkAssignmentSchema),
    defaultValues: {
      roleId: "",
      isPrimary: false,
      expiresAt: "",
      context: {
        department: "",
        project: "",
        location: "",
        temporary: false,
        reason: "",
      },
    },
  });

  // Filter users based on search and status
  const filteredUsers =
    usersData?.users?.filter((user: User) => {
      const matchesSearch =
        user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        filterStatus === "all" || user.status === filterStatus;

      return matchesSearch && matchesStatus;
    }) || [];

  // Toggle user selection
  const toggleUser = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  // Select all filtered users
  const selectAll = () => {
    const allFilteredIds = filteredUsers.map((user: User) => user.id);
    setSelectedUsers(allFilteredIds);
  };

  // Deselect all
  const deselectAll = () => {
    setSelectedUsers([]);
  };

  // Check if all filtered users are selected
  const allSelected =
    filteredUsers.length > 0 &&
    filteredUsers.every((user: User) => selectedUsers.includes(user.id));

  // Submit bulk assignment
  const onSubmit = async (data: BulkAssignmentFormData) => {
    if (selectedUsers.length === 0) {
      toast.error("Please select at least one user");
      return;
    }

    try {
      await bulkAssignRoles.mutateAsync({
        userIds: selectedUsers,
        roleId: data.roleId,
        isPrimary: data.isPrimary,
        expiresAt: data.expiresAt,
        // context: data.context,
      });

      // Reset form and selections
      form.reset();
      setSelectedUsers([]);

      toast.success(
        `Role assigned to ${selectedUsers.length} users successfully`
      );
    } catch (error) {
      console.error("Bulk assignment error:", error);
      toast.error("Failed to assign roles. Please try again.");
    }
  };

  if (usersLoading || rolesLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-gray-600 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="font-bold text-3xl tracking-tight">
          Bulk Role Assignment
        </h1>
        <p className="mt-1 text-muted-foreground">
          Assign the same role to multiple users at once
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              {usersData?.users?.length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Filtered</CardTitle>
            <Search className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{filteredUsers.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Selected</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl text-blue-600">
              {selectedUsers.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">
              Available Roles
            </CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              {rolesData?.roles?.length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Users Selection Panel */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Select Users
            </CardTitle>
            <CardDescription>
              Choose users to assign the role to
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search and Filters */}
            <div className="space-y-3">
              <div className="relative">
                <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-gray-400" />
                <Input
                  className="pl-10"
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search users..."
                  value={searchTerm}
                />
              </div>

              <div className="flex items-center gap-2">
                <Select onValueChange={setFilterStatus} value={filterStatus}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Bulk Selection Actions */}
              <div className="flex items-center justify-between">
                <Badge className="gap-1" variant="outline">
                  <CheckCircle2 className="h-3 w-3" />
                  {selectedUsers.length} selected
                </Badge>
                <div className="flex gap-2">
                  <Button
                    disabled={allSelected || filteredUsers.length === 0}
                    onClick={selectAll}
                    size="sm"
                    variant="outline"
                  >
                    Select All
                  </Button>
                  <Button
                    disabled={selectedUsers.length === 0}
                    onClick={deselectAll}
                    size="sm"
                    variant="outline"
                  >
                    Clear
                  </Button>
                </div>
              </div>
            </div>

            <Separator />

            {/* Users List */}
            <div className="max-h-[500px] space-y-2 overflow-y-auto">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user: User) => (
                  <div
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                      selectedUsers.includes(user.id)
                        ? "border-blue-500 bg-blue-50"
                        : "hover:bg-gray-50"
                    }`}
                    key={user.id}
                    onClick={() => toggleUser(user.id)}
                  >
                    <Checkbox
                      checked={selectedUsers.includes(user.id)}
                      onCheckedChange={() => toggleUser(user.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-sm">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="truncate text-muted-foreground text-xs">
                        {user.email}
                      </p>
                    </div>
                    <Badge className="text-xs" variant="outline">
                      {user.status}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <XCircle className="mb-3 h-12 w-12 text-gray-400" />
                  <p className="text-gray-600 text-sm">No users found</p>
                  <p className="mt-1 text-gray-500 text-xs">
                    Try adjusting your search or filters
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Role Assignment Form Panel */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Role Assignment
            </CardTitle>
            <CardDescription>
              Configure role and assignment details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                className="space-y-6"
                onSubmit={form.handleSubmit(onSubmit)}
              >
                {/* Selected Users Summary */}
                {selectedUsers.length > 0 && (
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="mt-0.5 h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-medium text-blue-900 text-sm">
                          Assigning to {selectedUsers.length} user
                          {selectedUsers.length !== 1 ? "s" : ""}
                        </p>
                        <p className="mt-1 text-blue-700 text-xs">
                          The selected role will be assigned to all selected
                          users with the same configuration
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Role Selection */}
                <FormField
                  control={form.control}
                  name="roleId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {rolesData?.roles?.map((role) => (
                            <SelectItem key={role.id} value={role.id}>
                              <div className="flex items-center gap-2">
                                <span>{role.name}</span>
                                {role.isSystem && (
                                  <Badge
                                    className="text-xs"
                                    variant="secondary"
                                  >
                                    System
                                  </Badge>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Primary Role Checkbox */}
                <FormField
                  control={form.control}
                  name="isPrimary"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Set as Primary Role</FormLabel>
                        <p className="text-muted-foreground text-xs">
                          This will be the main role for all selected users
                        </p>
                      </div>
                    </FormItem>
                  )}
                />

                {/* Expiry Date */}
                {/* <FormField
                  control={form.control}
                  name="expiresAt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expires At (Optional)</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <p className="text-muted-foreground text-xs">
                        Leave empty for permanent assignment
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                /> */}

                <FormField
                  control={form.control}
                  name="expiresAt"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Expires At (Optional)</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              className={cn(
                                "w-[240px] pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                              variant={"outline"}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent align="start" className="w-auto p-0">
                          <Calendar
                            captionLayout="dropdown"
                            disabled={(date) =>
                              date > new Date() || date < new Date("1900-01-01")
                            }
                            mode="single"
                            onSelect={field.onChange}
                            selected={
                              field.value ? new Date(field.value) : undefined
                            }
                          />
                        </PopoverContent>
                      </Popover>
                      <FormDescription>
                        Leave empty for permanent assignment
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Separator />

                {/* Context Section */}
                <div className="space-y-4">
                  <h3 className="font-medium text-sm">
                    Additional Context (Optional)
                  </h3>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="context.department"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Department</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Sales" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="context.project"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Project</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Project X" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="context.location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Location</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Nairobi" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="context.reason"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Reason</FormLabel>
                          <FormControl>
                            <Input placeholder="Assignment reason" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="context.temporary"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Temporary Assignment</FormLabel>
                          <p className="text-muted-foreground text-xs">
                            Mark this as a temporary role assignment
                          </p>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                {/* Submit Button */}
                <div className="flex gap-3 pt-4">
                  <Button
                    className="flex-1"
                    disabled={
                      selectedUsers.length === 0 || bulkAssignRoles.isPending
                    }
                    type="submit"
                  >
                    {bulkAssignRoles.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Assigning...
                      </>
                    ) : (
                      <>
                        <Shield className="mr-2 h-4 w-4" />
                        Assign Role to {selectedUsers.length} User
                        {selectedUsers.length !== 1 ? "s" : ""}
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
