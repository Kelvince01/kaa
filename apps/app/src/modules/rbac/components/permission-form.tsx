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
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useCreatePermission, useUpdatePermission } from "../rbac.queries";
import { type PermissionFormData, permissionSchema } from "../rbac.schema";
import { PermissionAction } from "../rbac.type";

// Define the permission action options for the select dropdown
const permissionActionOptions = [
  { value: PermissionAction.CREATE, label: "Create" },
  { value: PermissionAction.READ, label: "Read" },
  { value: PermissionAction.UPDATE, label: "Update" },
  { value: PermissionAction.DELETE, label: "Delete" },
  { value: PermissionAction.APPROVE, label: "Approve" },
  { value: PermissionAction.REJECT, label: "Reject" },
  { value: PermissionAction.MANAGE, label: "Manage" },
  { value: PermissionAction.EXPORT, label: "Export" },
  { value: PermissionAction.IMPORT, label: "Import" },
] as const;

type PermissionFormProps = {
  mode?: "create" | "edit";
  permission?: PermissionFormData;
  onSuccess?: () => void;
  onCancel?: () => void;
};

export function PermissionForm({
  mode = "create",
  permission,
  onSuccess,
  onCancel,
}: PermissionFormProps) {
  const isEdit = mode === "edit";

  const form = useForm<PermissionFormData>({
    resolver: zodResolver(permissionSchema),
    defaultValues: {
      name: permission?.name || "",
      description: permission?.description || "",
      resource: permission?.resource || "",
      action: permission?.action || PermissionAction.READ,
      conditions: permission?.conditions || [],
    },
  });

  const createPermission = useCreatePermission();
  const updatePermission = useUpdatePermission();
  const isPending = createPermission.isPending || updatePermission.isPending;

  const resource = form.watch("resource");
  const action = form.watch("action");

  const actionDescriptions: Record<PermissionAction, string> = {
    [PermissionAction.CREATE]: "create new",
    [PermissionAction.READ]: "view",
    [PermissionAction.UPDATE]: "edit",
    [PermissionAction.DELETE]: "delete",
    [PermissionAction.APPROVE]: "approve",
    [PermissionAction.REJECT]: "reject",
    [PermissionAction.MANAGE]: "manage",
    [PermissionAction.EXPORT]: "export",
    [PermissionAction.IMPORT]: "import",
  };

  const formatDescription = (action: PermissionAction, resource: string) => {
    const actionText = actionDescriptions[action] || action.toLowerCase();
    return `Ability to ${actionText} ${resource}.`;
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: ignore
  useEffect(() => {
    if (resource && action) {
      form.setValue("name", `${resource}:${action}`);
      form.setValue("description", formatDescription(action, resource));
    }
  }, [resource, action, form.setValue]);

  const onSubmit = async (formValues: PermissionFormData) => {
    try {
      if (isEdit && permission?.id) {
        await updatePermission.mutateAsync({
          id: permission.id as string,
          data: formValues,
        });
      } else {
        await createPermission.mutateAsync(formValues);
      }

      toast.success(
        `Permission has been ${isEdit ? "updated" : "created"} successfully.`
      );
      onSuccess?.();
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error(
        `Failed to ${isEdit ? "update" : "create"} permission. Please try again.`
      );
    }
  };

  return (
    <Form {...form}>
      <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="resource"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Resource</FormLabel>
                <FormControl>
                  <Input placeholder="Enter resource name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="action"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Action</FormLabel>
                <Select
                  defaultValue={field.value}
                  onValueChange={field.onChange}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an action" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {permissionActionOptions.map((option) => (
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
        </div>

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Permission Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter permission name"
                  {...field}
                  disabled
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Input placeholder="Enter permission description" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex space-x-4">
          <Button disabled={isPending} type="submit">
            {isPending
              ? "Saving..."
              : isEdit
                ? "Update Permission"
                : "Create Permission"}
          </Button>
          <Button onClick={onCancel} type="button" variant="secondary">
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}
