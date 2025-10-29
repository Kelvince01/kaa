import { httpClient } from "@/lib/axios";
import type {
  AddMemberInput,
  OrganizationCreateInput,
  OrganizationFilters,
  OrganizationListResponse,
  OrganizationResponse,
  OrganizationUpdateInput,
  SlugCheckResponse,
} from "./organization.type";

// Create organization
export const createOrganization = async (
  data: OrganizationCreateInput
): Promise<OrganizationResponse> => {
  const response = await httpClient.api.post("/organizations", data);
  return response.data;
};

// Get all organizations (with optional filters)
export const getOrganizations = async (
  filters: OrganizationFilters = {}
): Promise<OrganizationListResponse> => {
  const response = await httpClient.api.get("/organizations", {
    params: filters,
  });
  return response.data;
};

// Get organization by ID
export const getOrganization = async (
  id: string
): Promise<OrganizationResponse> => {
  const response = await httpClient.api.get(`/organizations/${id}`);
  return response.data;
};

// Get organization by slug
export const getOrganizationBySlug = async (
  slug: string
): Promise<OrganizationResponse> => {
  const response = await httpClient.api.get(`/organizations/slug/${slug}`);
  return response.data;
};

// Check if slug is available
export const checkSlugAvailability = async (
  slug: string
): Promise<SlugCheckResponse> => {
  const response = await httpClient.api.get(
    `/organizations/slug/${slug}/check`
  );
  return response.data;
};

// Update organization
export const updateOrganization = async (
  id: string,
  data: OrganizationUpdateInput
): Promise<OrganizationResponse> => {
  const response = await httpClient.api.patch(`/organizations/${id}`, data);
  return response.data;
};

// Delete organization
export const deleteOrganization = async (
  id: string
): Promise<OrganizationResponse> => {
  const response = await httpClient.api.delete(`/organizations/${id}`);
  return response.data;
};

// Add member to organization
export const addMemberToOrganization = async (
  orgId: string,
  data: AddMemberInput
): Promise<OrganizationResponse> => {
  const response = await httpClient.api.post(
    `/organizations/${orgId}/members`,
    data
  );
  return response.data;
};

// Remove member from organization
export const removeMemberFromOrganization = async (
  orgId: string,
  memberId: string
): Promise<OrganizationResponse> => {
  const response = await httpClient.api.delete(
    `/organizations/${orgId}/members/${memberId}`
  );
  return response.data;
};
