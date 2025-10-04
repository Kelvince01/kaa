"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@kaa/ui/components/button";
import { Calendar } from "@kaa/ui/components/calendar";
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
import { cn } from "@kaa/ui/lib/utils";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useUsers } from "../../users/user.queries";
import { useRoles } from "../rbac.queries";
import {
  type RoleAssignmentFormData,
  roleAssignmentSchema,
} from "../rbac.schema";
import { assignRoleToUser } from "../rbac.service";

type RoleAssignmentFormProps = {
  userId?: string;
  roleId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
};

export function RoleAssignmentForm({
  userId,
  roleId,
  onSuccess,
  onCancel,
}: RoleAssignmentFormProps) {
  const form = useForm<RoleAssignmentFormData>({
    resolver: zodResolver(roleAssignmentSchema),
    defaultValues: {
      userId: userId || "",
      roleId: roleId || "",
      // isPrimary: false,
      // expiresAt: "",
      context: {
        department: "",
        project: "",
        location: "",
        temporary: false,
        reason: "",
      },
    },
  });

  // Fetch users and roles for the select dropdowns
  const { data: usersData } = useUsers({});
  const { data: rolesData } = useRoles();

  const onSubmit = async (formValues: RoleAssignmentFormData) => {
    try {
      await assignRoleToUser(formValues);

      toast.success("Role has been assigned successfully.");
      onSuccess?.();
    } catch (error) {
      console.error("Error assigning role:", error);
      toast.error("Failed to assign role. Please try again.");
    }
  };

  return (
    <Form {...form}>
      <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="userId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>User</FormLabel>
                <Select
                  defaultValue={field.value}
                  disabled={!!userId}
                  onValueChange={field.onChange}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a user" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {usersData?.users?.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.firstName} {user.lastName} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="roleId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Role</FormLabel>
                <Select
                  defaultValue={field.value}
                  disabled={!!roleId}
                  onValueChange={field.onChange}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {rolesData?.roles?.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* <FormField
						control={form.control}
						name="isPrimary"
						render={({ field }) => (
							<FormItem className="flex flex-row items-start space-x-3 space-y-0">
								<FormControl>
									<Checkbox checked={field.value} onCheckedChange={field.onChange} />
								</FormControl>
								<div className="space-y-1 leading-none">
									<FormLabel>Primary Role</FormLabel>
								</div>
							</FormItem>
						)}
					/> */}

          {/* <FormField
            control={form.control}
            name="expiresAt"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Expires At (Optional)</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} />
                </FormControl>
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
                      selected={field.value ? new Date(field.value) : undefined}
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
        </div>

        <div className="space-y-4">
          <h3 className="font-medium text-lg">Additional Context</h3>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="context.department"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Department</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter department" {...field} />
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
                    <Input placeholder="Enter project" {...field} />
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
                    <Input placeholder="Enter location" {...field} />
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
                    <Input
                      placeholder="Enter reason for assignment"
                      {...field}
                    />
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
                </div>
              </FormItem>
            )}
          />
        </div>

        <div className="flex space-x-4">
          <Button type="submit">Assign Role</Button>
          <Button onClick={onCancel} type="button" variant="secondary">
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}
