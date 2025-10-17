"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Tenant } from "@/modules/tenants/tenant.type";
import { TenantStatus } from "@/modules/tenants/tenant.type";
import { useCreateTenant, useUpdateTenant } from "@/modules/tenants/tenant.queries";
import { tenantFormSchema, type TenantFormValues } from "@/modules/tenants/tenant.schema";
import { useProperties } from "@/modules/properties/property.queries";
import { useUnits } from "@/modules/units/unit.queries";
import { useContracts } from "@/modules/contracts/contract.queries";
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
import { Textarea } from "@kaa/ui/components/textarea";

// Define the tenant status options for the select dropdown
const tenantStatusOptions = [
	{ value: TenantStatus.ACTIVE, label: "Active" },
	{ value: TenantStatus.INACTIVE, label: "Inactive" },
	{ value: TenantStatus.SUSPENDED, label: "Suspended" },
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

type TenantFormMode = "create" | "edit";

interface TenantFormProps {
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
}

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
export function TenantForm({ mode = "create", tenant, onSuccess, onCancel }: TenantFormProps) {
	const isEdit = mode === "edit";

	const form = useForm<TenantFormValues>({
		resolver: zodResolver(tenantFormSchema),
		defaultValues: {
			property: tenant?.property?._id || "",
			unit: tenant?.unit?._id || "",
			contract: tenant?.contract?._id || "",
			startDate: tenant?.startDate || "",
			endDate: tenant?.endDate || "",
			status: tenant?.status || TenantStatus.ACTIVE,
			emergencyContact: tenant?.emergencyContact || {
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
	const selectedPropertyId = form.watch("property");

	// Fetch data for dropdowns
	const { data: propertiesData } = useProperties();
	const { data: unitsData } = useUnits(selectedPropertyId ? { property: selectedPropertyId } : {});
	const { data: contractsData } = useContracts();

	const createTenant = useCreateTenant();
	const updateTenant = useUpdateTenant();
	const isPending = createTenant.isPending || updateTenant.isPending;

	const onSubmit = async (formValues: TenantFormValues) => {
		try {
			if (mode === "edit" && tenant?._id) {
				// For updates, we need to exclude the id from the data
				const { id, ...updateData } = formValues;
				await updateTenant.mutateAsync({
					id: tenant._id,
					data: updateData,
				});
			} else {
				// For new tenants, we need to ensure we're not sending the id
				const { id, ...createData } = formValues;
				await createTenant.mutateAsync(createData);
			}

			toast.success(`Tenant has been ${mode === "edit" ? "updated" : "created"} successfully.`);
			onSuccess?.();
		} catch (error) {
			console.error("Error submitting form:", error);
			toast.error(`Failed to ${mode === "edit" ? "update" : "create"} tenant. Please try again.`);
		}
	};

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
				<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
					<FormField
						control={form.control}
						name="property"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Property</FormLabel>
								<Select
									onValueChange={(value) => {
										field.onChange(value);
										// Reset unit when property changes
										form.setValue("unit", "");
									}}
									defaultValue={field.value}
								>
									<FormControl>
										<SelectTrigger>
											<SelectValue placeholder="Select a property" />
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										{propertiesData?.properties?.map((property) => (
											<SelectItem key={property._id} value={property._id}>
												{property.title}
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
						name="unit"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Unit</FormLabel>
								<Select onValueChange={field.onChange} defaultValue={field.value}>
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

					<FormField
						control={form.control}
						name="contract"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Contract</FormLabel>
								<Select onValueChange={field.onChange} defaultValue={field.value}>
									<FormControl>
										<SelectTrigger>
											<SelectValue placeholder="Select a contract" />
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										{contractsData?.items?.map((contract) => (
											<SelectItem key={contract._id} value={contract._id}>
												{contract._id}
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
								<Select onValueChange={field.onChange} defaultValue={field.value}>
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
				</div>

				<div className="space-y-4">
					<h3 className="font-medium text-lg">Emergency Contact</h3>
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
									<Select onValueChange={field.onChange} defaultValue={field.value}>
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
										<Input type="email" placeholder="contact@example.com" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>
				</div>

				<FormField
					control={form.control}
					name="notes"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Notes</FormLabel>
							<FormControl>
								<Textarea
									placeholder="Additional notes about the tenant..."
									className="min-h-[100px]"
									{...field}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<div className="flex justify-end space-x-4">
					<Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
						Cancel
					</Button>
					<Button type="submit" disabled={isPending}>
						{isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
						{isEdit ? "Update Tenant" : "Create Tenant"}
					</Button>
				</div>
			</form>
		</Form>
	);
}
