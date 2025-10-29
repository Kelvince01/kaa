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
import {
  useCreateOrganization,
  useUpdateOrganization,
} from "../organization.mutations";
import {
  type UpdateOrganizationFormValues,
  updateOrganizationFormSchema,
} from "../organization.schema";
import type { Organization } from "../organization.type";

type OrganizationFormMode = "create" | "edit";

type OrganizationFormProps = {
  mode?: OrganizationFormMode;
  organization?: Organization;
  onSuccess?: () => void;
  onCancel?: () => void;
};

const TYPE_OPTIONS = [
  { value: "landlord", label: "Landlord" },
  { value: "property_manager", label: "Property Manager" },
  { value: "agency", label: "Agency" },
  { value: "other", label: "Other" },
] as const;

export function OrganizationForm({
  mode = "create",
  organization,
  onSuccess,
  onCancel,
}: OrganizationFormProps) {
  const isEdit = mode === "edit";

  const form = useForm<UpdateOrganizationFormValues>({
    resolver: zodResolver(updateOrganizationFormSchema),
    defaultValues: {
      name: organization?.name || "",
      type: organization?.type || "landlord",
      email: organization?.email || "",
      phone: organization?.phone || "",
      address: {
        country: organization?.address?.country || "",
        county: organization?.address?.county || "",
        town: organization?.address?.town || "",
        street: organization?.address?.street || "",
        postalCode: organization?.address?.postalCode || "",
      },
      registrationNumber: organization?.registrationNumber || "",
      kraPin: organization?.kraPin || "",
      website: organization?.website || "",
      logo: organization?.logo || "",
      id: organization?._id,
    },
  });

  const createOrganization = useCreateOrganization();
  const updateOrganization = useUpdateOrganization();
  const isPending =
    createOrganization.isPending || updateOrganization.isPending;

  const onSubmit = async (formValues: UpdateOrganizationFormValues) => {
    try {
      if (mode === "edit" && organization?._id) {
        const { id, ...updateData } = formValues;
        await updateOrganization.mutateAsync({
          id: organization._id,
          data: updateData,
        });
        toast.success(
          `Organization ${formValues.name} has been updated successfully.`
        );
      } else {
        toast.error(
          "Create mode requires slug generation - use CreateOrganizationSheet"
        );
        return;
      }

      onSuccess?.();
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error(
        `Failed to ${mode === "edit" ? "update" : "create"} organization. Please try again.`
      );
    }
  };

  return (
    <Form {...form}>
      <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
        {/* Basic Information */}
        <div className="space-y-4 rounded-lg border p-4">
          <h3 className="font-semibold text-lg">Basic Information</h3>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Organization Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Acme Properties" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Organization Type</FormLabel>
                  <Select
                    defaultValue={field.value}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {TYPE_OPTIONS.map((option) => (
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
        </div>

        {/* Contact Information */}
        <div className="space-y-4 rounded-lg border p-4">
          <h3 className="font-semibold text-lg">Contact Information</h3>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="info@acmeproperties.com"
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
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input placeholder="+254 700 000 000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Address Information */}
        <div className="space-y-4 rounded-lg border p-4">
          <h3 className="font-semibold text-lg">Address</h3>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="address.country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Country</FormLabel>
                  <FormControl>
                    <Input placeholder="Kenya" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address.county"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>County</FormLabel>
                  <FormControl>
                    <Input placeholder="Nairobi" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address.town"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Town/City</FormLabel>
                  <FormControl>
                    <Input placeholder="Nairobi" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address.street"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Street</FormLabel>
                  <FormControl>
                    <Input placeholder="Kenyatta Avenue" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address.postalCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Postal Code (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="00100" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Additional Information */}
        <div className="space-y-4 rounded-lg border p-4">
          <h3 className="font-semibold text-lg">Additional Information</h3>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="registrationNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Registration Number (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="REG-123456" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="kraPin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>KRA PIN (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="A000000000A" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="website"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://acmeproperties.com"
                      type="url"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="logo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Logo URL (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://example.com/logo.png"
                      type="url"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
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
            {isEdit ? "Update Organization" : "Create Organization"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
