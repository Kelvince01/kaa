import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/query/query-client";
import * as organizationService from "./organization.service";
import type {
  AddMemberInput,
  OrganizationCreateInput,
  OrganizationUpdateInput,
} from "./organization.type";

// Create organization
export const useCreateOrganization = () =>
  useMutation({
    mutationFn: (data: OrganizationCreateInput) =>
      organizationService.createOrganization(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
    },
  });

// Update organization
export const useUpdateOrganization = () =>
  useMutation({
    mutationFn: ({ id, data }: { id: string; data: OrganizationUpdateInput }) =>
      organizationService.updateOrganization(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
      queryClient.invalidateQueries({
        queryKey: ["organizations", variables.id],
      });
    },
  });

// Delete organization
export const useDeleteOrganization = () =>
  useMutation({
    mutationFn: (id: string) => organizationService.deleteOrganization(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
    },
  });

// Add member to organization
export const useAddMemberToOrganization = () =>
  useMutation({
    mutationFn: ({ orgId, data }: { orgId: string; data: AddMemberInput }) =>
      organizationService.addMemberToOrganization(orgId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
      queryClient.invalidateQueries({
        queryKey: ["organizations", variables.orgId],
      });
    },
  });

// Remove member from organization
export const useRemoveMemberFromOrganization = () =>
  useMutation({
    mutationFn: ({ orgId, memberId }: { orgId: string; memberId: string }) =>
      organizationService.removeMemberFromOrganization(orgId, memberId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
      queryClient.invalidateQueries({
        queryKey: ["organizations", variables.orgId],
      });
    },
  });
