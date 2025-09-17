"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@kaa/ui/components/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@kaa/ui/components/form";
import { Input } from "@kaa/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@kaa/ui/components/select";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useCreateUser, useUpdateUser } from "@/modules/users/user.queries";
import {
  type UserFormValues,
  userFormSchema,
} from "@/modules/users/user.schema";
import type { User } from "@/modules/users/user.type";
import { UserRole } from "@/modules/users/user.type";

// Define the user role options for the select dropdown
const userRoleOptions = [
  { value: UserRole.ADMIN, label: "Admin" },
  { value: UserRole.USER, label: "User" },
  { value: UserRole.MANAGER, label: "Manager" },
] as const;

// Define the user status options for the select dropdown
// Only include statuses that are valid in the form schema
const userStatusOptions = [
  { value: "active" as const, label: "Active" },
  { value: "inactive" as const, label: "Inactive" },
  { value: "suspended" as const, label: "Suspended" },
] as const;

type UserFormMode = "create" | "edit";

type UserFormProps = {
  /**
   * The form mode (create or edit)
   * @default 'create'
   */
  mode?: UserFormMode;

  /**
   * The user data to edit (required in edit mode)
   */
  user?: User;

  /**
   * Callback function called when the form is successfully submitted
   */
  onSuccess?: () => void;

  /**
   * Callback function called when the cancel button is clicked
   */
  onCancel?: () => void;
};

/**
 * A form component for creating or editing a user.
 *
 * @component
 * @param {UserFormProps} props - The component props
 * @param {'create' | 'edit'} [props.mode='create'] - The form mode (create or edit)
 * @param {User} [props.user] - The user data to edit (required in edit mode)
 * @param {() => void} [props.onSuccess] - Callback function called on successful form submission
 * @param {() => void} [props.onCancel] - Callback function called when cancel is clicked
 * @returns {JSX.Element} The rendered user form
 *
 * @example
 * // Create mode
 * <UserForm onSuccess={handleSuccess} onCancel={handleCancel} />
 *
 * @example
 * // Edit mode
 * <UserForm
 *   mode="edit"
 *   user={selectedUser}
 *   onSuccess={handleSuccess}
 *   onCancel={handleCancel}
 * />
 */
export function UserForm({
  mode = "create",
  user,
  onSuccess,
  onCancel,
}: UserFormProps) {
  const isEdit = mode === "edit";

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      role: (user?.role as UserFormValues["role"]) || "user",
      status: (user?.status as UserFormValues["status"]) || "active",
      id: user?.id,
    },
  });

  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const isPending = createUser.isPending || updateUser.isPending;

  const onSubmit = async (formValues: UserFormValues) => {
    try {
      if (mode === "edit" && user?.id) {
        // For updates, we need to exclude the id from the data
        const { id, ...updateData } = formValues;
        await updateUser.mutateAsync({
          id: user.id,
          data: updateData as any,
        });
      } else {
        // For new users, we need to ensure we're not sending the id
        const { id, ...createData } = formValues;
        await createUser.mutateAsync(createData as any); // Type assertion needed due to form values not matching exactly with API types
      }

      toast.success(
        `User ${formValues.email} has been ${mode === "edit" ? "updated" : "created"} successfully.`
      );
      onSuccess?.();
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error(
        `Failed to ${mode === "edit" ? "update" : "create"} user. Please try again.`
      );
    }
  };

  return (
    <Form {...form}>
      <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input placeholder="John" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input placeholder="Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    placeholder="user@example.com"
                    type="email"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Role</FormLabel>
                <Select
                  defaultValue={field.value}
                  onValueChange={field.onChange}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {userRoleOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {isEdit && (
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select
                    defaultValue={field.value || "active"}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {userStatusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        <div className="flex justify-end space-x-4">
          <Button
            disabled={isPending}
            onClick={onCancel}
            type="button"
            variant="outline"
          >
            Cancel
          </Button>
          <Button disabled={isPending} type="submit">
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? "Update User" : "Create User"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
