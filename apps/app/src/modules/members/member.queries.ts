import { useQuery } from "@tanstack/react-query";
import * as memberService from "./member.service";

// Get all members
export const useMembers = (
  params: {
    page?: number;
    limit?: number;
    search?: string;
    plan?: string;
    organization?: string;
  } = {}
) =>
  useQuery({
    queryKey: ["members", params],
    queryFn: () => memberService.getMembers(params),
  });

// Get member by ID
export const useMember = (id: string) =>
  useQuery({
    queryKey: ["members", id],
    queryFn: () => memberService.getMember(id),
    enabled: !!id,
  });

// Get current member
export const useCurrentMember = () =>
  useQuery({
    queryKey: ["members", "me"],
    queryFn: memberService.getCurrentMember,
  });

// Get member statistics
export const useMemberStats = (memberId: string) =>
  useQuery({
    queryKey: memberId
      ? ["members", memberId, "stats"]
      : ["members", "me", "stats"],
    queryFn: () => memberService.getMemberStats(memberId),
  });
