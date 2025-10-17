import { useQuery } from "@tanstack/react-query";
import * as tenantService from "./tenant.service";

// Get all tenants
export const useTenants = (params: any = {}) => {
	return useQuery({
		queryKey: ["tenants", params],
		queryFn: () => tenantService.getTenants(params),
	});
};

// Get tenant by ID
export const useTenant = (id: string) => {
	return useQuery({
		queryKey: ["tenants", id],
		queryFn: () => tenantService.getTenant(id),
		enabled: !!id,
	});
};

// Get tenant statistics
export const useTenantStats = () => {
	return useQuery({
		queryKey: ["tenants", "stats"],
		queryFn: tenantService.getTenantStats,
	});
};
