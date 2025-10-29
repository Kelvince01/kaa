import { useQuery } from "@tanstack/react-query";
import * as organizationService from "./organization.service";
import type { OrganizationFilters } from "./organization.type";

// Get all organizations
export const useOrganizations = (filters: OrganizationFilters = {}) =>
  useQuery({
    queryKey: ["organizations", filters],
    queryFn: () => organizationService.getOrganizations(filters),
  });

// Get organization by ID
export const useOrganization = (id: string) =>
  useQuery({
    queryKey: ["organizations", id],
    queryFn: () => organizationService.getOrganization(id),
    enabled: !!id,
  });

// Get organization by slug
export const useOrganizationBySlug = (slug: string) =>
  useQuery({
    queryKey: ["organizations", "slug", slug],
    queryFn: () => organizationService.getOrganizationBySlug(slug),
    enabled: !!slug,
  });

// Check if slug is available
export const useSlugAvailability = (slug: string) =>
  useQuery({
    queryKey: ["organizations", "slug-check", slug],
    queryFn: () => organizationService.checkSlugAvailability(slug),
    enabled: !!slug && slug.length > 0,
    retry: false,
  });
