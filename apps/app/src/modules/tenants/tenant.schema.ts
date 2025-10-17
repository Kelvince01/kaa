import * as z from "zod";
import { TenantStatus } from "./tenant.type";

// Schema for emergency contact
const emergencyContactSchema = z.object({
	name: z.string().min(1, "Name is required"),
	phone: z.string().min(1, "Phone number is required"),
	relationship: z.string().min(1, "Relationship is required"),
	email: z.email("Invalid email format").optional(),
});

// Schema for tenant form
export const tenantFormSchema = z.object({
	property: z.string().min(1, "Property is required"),
	unit: z.string().min(1, "Unit is required"),
	contract: z.string().min(1, "Contract is required"),
	startDate: z.string().min(1, "Start date is required"),
	endDate: z.string().optional(),
	status: z.enum(TenantStatus),
	emergencyContact: emergencyContactSchema.optional(),
	notes: z.string().optional(),
	id: z.string().optional(), // For edit mode
});

// Type for form values
export type TenantFormValues = z.infer<typeof tenantFormSchema>;
