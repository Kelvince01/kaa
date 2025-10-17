import { useMutation } from "@tanstack/react-query";
import * as tenantService from "./tenant.service";
import type { TenantCreateInput, TenantUpdateInput } from "./tenant.type";
import { queryClient } from "@/query/query-client";

// Create tenant
export const useCreateTenant = () => {
	return useMutation({
		mutationFn: tenantService.createTenant,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["tenants"] });
		},
	});
};

// Update tenant
export const useUpdateTenant = () => {
	return useMutation({
		mutationFn: ({ id, data }: { id: string; data: TenantUpdateInput }) =>
			tenantService.updateTenant(id, data),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({ queryKey: ["tenants"] });
			queryClient.invalidateQueries({ queryKey: ["tenants", variables.id] });
		},
	});
};

// Delete tenant
export const useDeleteTenant = () => {
	return useMutation({
		mutationFn: tenantService.deleteTenant,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["tenants"] });
		},
	});
};

// Verify tenant
export const useVerifyTenant = () => {
	return useMutation({
		mutationFn: tenantService.verifyTenant,
		onSuccess: (_, tenantId) => {
			queryClient.invalidateQueries({ queryKey: ["tenants"] });
			queryClient.invalidateQueries({ queryKey: ["tenants", tenantId] });
		},
	});
};

// Update tenant verification
export const useUpdateTenantVerification = () => {
	return useMutation({
		mutationFn: ({ id, verificationData }: { id: string; verificationData: any }) =>
			tenantService.updateTenantVerification(id, verificationData),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({ queryKey: ["tenants"] });
			queryClient.invalidateQueries({ queryKey: ["tenants", variables.id] });
		},
	});
};
