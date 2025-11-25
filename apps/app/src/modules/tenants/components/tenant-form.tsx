"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@kaa/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
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
import { Textarea } from "@kaa/ui/components/textarea";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useContracts } from "@/modules/contracts/contract.queries";
import { useUserContext } from "@/modules/me";
import {
  useProperties,
  useProperty,
} from "@/modules/properties/property.queries";
import {
  useCreateTenant,
  useUpdateTenant,
} from "@/modules/tenants/tenant.mutations";
import {
  type TenantFormValues,
  tenantFormSchema,
} from "@/modules/tenants/tenant.schema";
import type { Tenant } from "@/modules/tenants/tenant.type";
import { TenantStatus, TenantType } from "@/modules/tenants/tenant.type";
import { useUnits } from "@/modules/units/unit.queries";

// Define the tenant status options for the select dropdown
const tenantStatusOptions = [
  { value: TenantStatus.ACTIVE, label: "Active" },
  { value: TenantStatus.INACTIVE, label: "Inactive" },
  { value: TenantStatus.SUSPENDED, label: "Suspended" },
] as const;

// Define the tenant status options for the select dropdown
const tenantTypeOptions = [
  { value: TenantType.CORPORATE, label: "Corporate" },
  { value: TenantType.INDIVIDUAL, label: "Individual" },
  { value: TenantType.STUDENT, label: "Student" },
] as const;

// Define the relationship options for emergency contact
const relationshipOptions = [
  { value: "spouse", label: "Spouse" },
  { value: "parent", label: "Parent" },
  { value: "child", label: "Child" },
  { value: "sibling", label: "Sibling" },
  { value: "friend", label: "Friend" },
  { value: "other", label: "Other" },
] as const;

// Define the marital status options
const maritalStatusOptions = [
  { value: "single", label: "Single" },
  { value: "married", label: "Married" },
  { value: "divorced", label: "Divorced" },
  { value: "widowed", label: "Widowed" },
] as const;

type TenantFormMode = "create" | "edit";

type TenantFormProps = {
  /**
   * The form mode (create or edit)
   * @default 'create'
   */
  mode?: TenantFormMode;

  /**
   * The tenant data to edit (required in edit mode)
   */
  tenant?: Tenant;

  /**
   * Callback function called when the form is successfully submitted
   */
  onSuccess?: () => void;

  /**
   * Callback function called when the cancel button is clicked
   */
  onCancel?: () => void;

  /**
   * The property data to edit (required in edit mode)
   */
  property?: string;
};

/**
 * A form component for creating or editing a tenant.
 *
 * @component
 * @param {TenantFormProps} props - The component props
 * @param {'create' | 'edit'} [props.mode='create'] - The form mode (create or edit)
 * @param {Tenant} [props.tenant] - The tenant data to edit (required in edit mode)
 * @param {() => void} [props.onSuccess] - Callback function called on successful form submission
 * @param {() => void} [props.onCancel] - Callback function called when cancel is clicked
 * @returns {JSX.Element} The rendered tenant form
 */
export function TenantForm({
  property,
  mode = "create",
  tenant,
  onSuccess,
  onCancel,
}: TenantFormProps) {
  const isEdit = mode === "edit";

  const form = useForm<TenantFormValues>({
    resolver: zodResolver(tenantFormSchema),
    defaultValues: {
      property: tenant?.property?._id || "",
      unit: tenant?.unit?._id || "",
      contract: tenant?.contract?._id || "",
      startDate: tenant?.startDate
        ? new Date(tenant.startDate).toISOString().split("T")[0]
        : "",
      endDate: tenant?.endDate
        ? new Date(tenant.endDate).toISOString().split("T")[0]
        : "",
      status: tenant?.status || TenantStatus.ACTIVE,
      type: tenant?.type || TenantType.INDIVIDUAL,
      personalInfo: tenant?.personalInfo
        ? {
            firstName: tenant.personalInfo.firstName || "",
            middleName: tenant.personalInfo.middleName || "",
            lastName: tenant.personalInfo.lastName || "",
            email: tenant.personalInfo.email || "",
            phone: tenant.personalInfo.phone || "",
            nationalId: tenant.personalInfo.nationalId || "",
            dateOfBirth: tenant.personalInfo.dateOfBirth
              ? new Date(tenant.personalInfo.dateOfBirth)
                  .toISOString()
                  .split("T")[0]
              : "",
            occupation: tenant.personalInfo.occupation || "",
            employer: tenant.personalInfo.employer || "",
            monthlyIncome: tenant.personalInfo.monthlyIncome || 0,
            maritalStatus: tenant.personalInfo.maritalStatus || "single",
            dependents: tenant.personalInfo.dependents || 0,
          }
        : {
            firstName: "",
            middleName: "",
            lastName: "",
            email: "",
            phone: "",
            nationalId: "",
            dateOfBirth: "",
            occupation: "",
            employer: "",
            monthlyIncome: 0,
            maritalStatus: "single",
            dependents: 0,
          },
      address: tenant?.address
        ? {
            line1: tenant.address.line1 || "",
            line2: tenant.address.line2 || "",
            town: tenant.address.town || "",
            county: tenant.address.county || "",
            postalCode: tenant.address.postalCode || "",
            country: tenant.address.country || "",
            directions: tenant.address.directions || "",
          }
        : {
            line1: "",
            line2: "",
            town: "",
            county: "",
            postalCode: "",
            country: "",
            directions: "",
          },
      emergencyContact: tenant?.emergencyContacts?.[0]
        ? {
            name: tenant.emergencyContacts[0].name || "",
            phone: tenant.emergencyContacts[0].phone || "",
            relationship: tenant.emergencyContacts[0].relationship || "other",
            email: tenant.emergencyContacts[0].email || "",
          }
        : {
            name: "",
            phone: "",
            relationship: "other",
            email: "",
          },
      notes: tenant?.notes || "",
      id: tenant?._id,
    },
  });

  // Get the selected property ID for filtering units
  const [selectedProperty, setSelectedProperty] = useState<string>("");
  const { profile } = useUserContext();

  // Fetch data for dropdowns
  const { data: propertyData } = useProperty(property as string);
  const { data: propertiesData } = useProperties({
    landlordId: profile?.data._id,
  });
  const { data: unitsData, refetch: refetchUnits } = useUnits(
    selectedProperty ? { property: selectedProperty } : {}
  );
  const { data: contractsData, refetch: refetchContracts } = useContracts({
    landlordId: profile?.data._id,
  });

  const createTenantMutation = useCreateTenant();
  const updateTenantMutation = useUpdateTenant();
  const isPending =
    createTenantMutation.isPending || updateTenantMutation.isPending;

  useEffect(() => {
    if (selectedProperty) refetchUnits();
  }, [selectedProperty, refetchUnits]);

  const onSubmit = async (formValues: TenantFormValues) => {
    try {
      // Transform form values to match API expectations
      const { id, startDate, endDate, ...rest } = formValues;

      const transformedData = {
        ...rest,
        startDate: new Date(startDate).toISOString(),
        ...(endDate && { endDate: new Date(endDate).toISOString() }),
      };

      if (mode === "edit" && tenant?._id) {
        // For updates, we need to exclude the id from the data
        await updateTenantMutation.mutateAsync({
          id: tenant._id,
          data: transformedData,
        });
      } else {
        // For new tenants, we need to ensure we're not sending the id
        await createTenantMutation.mutateAsync(transformedData);
      }

      toast.success(
        `Tenant has been ${mode === "edit" ? "updated" : "created"} successfully.`
      );
      form.reset();
      onSuccess?.();
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error(
        `Failed to ${mode === "edit" ? "update" : "create"} tenant. Please try again.`
      );
    }
  };

  const handleCancel = () => {
    form.reset();
    onCancel?.();
  };

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Select the property, unit, and contract for this tenant
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="property"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Property</FormLabel>
                      <Select
                        defaultValue={field.value}
                        onValueChange={(value) => {
                          field.onChange(value);
                          setSelectedProperty(value);
                          // Reset unit when property changes
                          form.setValue("unit", "");
                        }}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a property" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {propertiesData?.properties?.map((property) => (
                            <SelectItem
                              key={(property as any)._id as string}
                              value={(property as any)._id as string}
                            >
                              <div>
                                <div className="font-medium">
                                  {property.title}
                                </div>
                                <div className="text-muted-foreground text-sm">
                                  {property.location.address.line1}
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {selectedProperty && (
                  <FormField
                    control={form.control}
                    name="unit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unit</FormLabel>
                        <Select
                          defaultValue={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a unit" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {unitsData?.items?.map((unit) => (
                              <SelectItem key={unit._id} value={unit._id}>
                                {unit.unitNumber}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {isEdit && (
                  <FormField
                    control={form.control}
                    name="contract"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contract</FormLabel>
                        <Select
                          defaultValue={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a contract" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {contractsData?.items?.map((contract) => (
                              <SelectItem
                                key={contract._id}
                                value={contract._id}
                              >
                                {contract._id}
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
            </CardContent>
          </Card>

          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                Enter the tenant's personal details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="personalInfo.firstName"
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
                  name="personalInfo.middleName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Middle Name (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Michael" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="personalInfo.lastName"
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
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="personalInfo.email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="john.doe@example.com"
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
                  name="personalInfo.phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="+1234567890" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="personalInfo.nationalId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>National ID</FormLabel>
                      <FormControl>
                        <Input placeholder="123456789" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="personalInfo.dateOfBirth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date of Birth</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="personalInfo.occupation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Occupation</FormLabel>
                      <FormControl>
                        <Input placeholder="Software Engineer" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="personalInfo.employer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Employer (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Company Name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <FormField
                  control={form.control}
                  name="personalInfo.monthlyIncome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monthly Income</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="0"
                          type="number"
                          {...field}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value === ""
                                ? 0
                                : Number.parseFloat(e.target.value)
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="personalInfo.maritalStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Marital Status</FormLabel>
                      <Select
                        defaultValue={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select marital status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {maritalStatusOptions.map((option) => (
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

                <FormField
                  control={form.control}
                  name="personalInfo.dependents"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dependents</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="0"
                          type="number"
                          {...field}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value === ""
                                ? 0
                                : Number.parseInt(e.target.value, 10)
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Address Information */}
          <Card>
            <CardHeader>
              <CardTitle>Address Information</CardTitle>
              <CardDescription>
                Enter the tenant's address details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="address.line1"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address Line 1</FormLabel>
                      <FormControl>
                        <Input placeholder="123 Main Street" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address.line2"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address Line 2 (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Apartment 4B" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="address.town"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Town</FormLabel>
                      <FormControl>
                        <Input placeholder="Nairobi" {...field} />
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
                        <Input placeholder="Nairobi County" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="address.postalCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Postal Code</FormLabel>
                      <FormControl>
                        <Input placeholder="00100" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
              </div>

              <FormField
                control={form.control}
                name="address.directions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Directions (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        className="min-h-[80px]"
                        placeholder="Additional directions to locate the address..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Lease Information */}
          <Card>
            <CardHeader>
              <CardTitle>Lease Information</CardTitle>
              <CardDescription>Set the lease dates and status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select
                        defaultValue={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {tenantStatusOptions.map((option) => (
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

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select
                        defaultValue={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {tenantTypeOptions.map((option) => (
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
            </CardContent>
          </Card>

          {/* Emergency Contact */}
          <Card>
            <CardHeader>
              <CardTitle>Emergency Contact</CardTitle>
              <CardDescription>
                Add emergency contact information for the tenant
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="emergencyContact.name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="emergencyContact.phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="+1234567890" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="emergencyContact.relationship"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Relationship</FormLabel>
                      <Select
                        defaultValue={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select relationship" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {relationshipOptions.map((option) => (
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

                <FormField
                  control={form.control}
                  name="emergencyContact.email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="contact@example.com"
                          type="email"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
              <CardDescription>
                Add any additional notes about the tenant
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        className="min-h-[100px]"
                        placeholder="Additional notes about the tenant..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-4">
            <Button
              disabled={isPending}
              onClick={handleCancel}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button disabled={isPending} type="submit">
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? "Update Tenant" : "Create Tenant"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
