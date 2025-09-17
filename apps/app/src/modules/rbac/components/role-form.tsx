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
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useCreateRole, useUpdateRole } from "../rbac.queries";
import { type RoleFormData, roleSchema } from "../rbac.schema";

type RoleFormProps = {
  mode?: "create" | "edit";
  role?: RoleFormData;
  onSuccess?: () => void;
  onCancel?: () => void;
};

export function RoleForm({
  mode = "create",
  role,
  onSuccess,
  onCancel,
}: RoleFormProps) {
  const isEdit = mode === "edit";

  const form = useForm<RoleFormData>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: role?.name || "",
      description: role?.description || "",
      isSystem: role?.isSystem,
      level: role?.level || 0,
    },
  });

  const createRole = useCreateRole();
  const updateRole = useUpdateRole();
  const isPending = createRole.isPending || updateRole.isPending;

  const onSubmit = async (formValues: RoleFormData) => {
    try {
      if (isEdit && role?._id) {
        await updateRole.mutateAsync({ id: role._id, data: formValues });
      } else {
        await createRole.mutateAsync(formValues);
      }

      toast.success(
        `Role has been ${isEdit ? "updated" : "created"} successfully.`
      );
      onSuccess?.();
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error(
        `Failed to ${isEdit ? "update" : "create"} role. Please try again.`
      );
    }
  };

  return (
    <Form {...form}>
      <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Role Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter role name" {...field} />
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
                  <Input placeholder="Enter role description" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button disabled={isPending} type="submit">
          {isPending ? "Saving..." : isEdit ? "Update Role" : "Create Role"}
        </Button>
        <Button onClick={onCancel} type="button" variant="secondary">
          Cancel
        </Button>
      </form>
    </Form>
  );
}
