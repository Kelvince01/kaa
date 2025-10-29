import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/query/query-client";
import * as memberService from "./member.service";
import type { MemberUpdateInput } from "./member.type";

// Create member
export const useCreateMember = () =>
  useMutation({
    mutationFn: memberService.createMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
    },
  });

// Update member
export const useUpdateMember = () =>
  useMutation({
    mutationFn: ({ id, data }: { id: string; data: MemberUpdateInput }) =>
      memberService.updateMember(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      queryClient.invalidateQueries({ queryKey: ["members", variables.id] });
    },
  });

// Delete member
export const useDeleteMember = () =>
  useMutation({
    mutationFn: memberService.deleteMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
    },
  });

// Update current member
export const useUpdateCurrentMember = () =>
  useMutation({
    mutationFn: memberService.updateCurrentMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members", "me"] });
      queryClient.invalidateQueries({ queryKey: ["members"] });
    },
  });

// Delete current member
export const useDeleteCurrentMember = () =>
  useMutation({
    mutationFn: memberService.deleteCurrentMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
    },
  });
