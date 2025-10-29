import { httpClient } from "@/lib/axios";
import type {
  MemberCreateInput,
  MemberListResponse,
  MemberResponse,
  MemberStatsResponse,
  MemberUpdateInput,
} from "./member.type";

// Create member
export const createMember = async (
  data: MemberCreateInput
): Promise<MemberResponse> => {
  const response = await httpClient.api.post("/members", data);
  return response.data;
};

// Get all members (with optional filters)
export const getMembers = async (
  params: {
    page?: number;
    limit?: number;
    search?: string;
    plan?: string;
    organization?: string;
  } = {}
): Promise<MemberListResponse> => {
  const response = await httpClient.api.get("/members", { params });
  return response.data;
};

// Get member by ID
export const getMember = async (id: string): Promise<MemberResponse> => {
  const response = await httpClient.api.get(`/members/${id}`);
  return response.data;
};

// Update member
export const updateMember = async (
  id: string,
  data: MemberUpdateInput
): Promise<MemberResponse> => {
  const response = await httpClient.api.patch(`/members/${id}`, data);
  return response.data;
};

// Delete member
export const deleteMember = async (id: string): Promise<MemberResponse> => {
  const response = await httpClient.api.delete(`/members/${id}`);
  return response.data;
};

// Get current member
export const getCurrentMember = async (): Promise<MemberResponse> => {
  const response = await httpClient.api.get("/members/me");
  return response.data;
};

// Update current member
export const updateCurrentMember = async (
  data: MemberUpdateInput
): Promise<MemberResponse> => {
  const response = await httpClient.api.put("/members/me", data);
  return response.data;
};

// Delete current member
export const deleteCurrentMember = async (): Promise<{
  status: string;
  message: string;
}> => {
  const response = await httpClient.api.delete("/members/me");
  return response.data;
};

// Get member stats
export const getMemberStats = async (
  memberId: string
): Promise<MemberStatsResponse> => {
  const response = await httpClient.api.get(`/members/${memberId}/stats`);
  return response.data;
};

// Get member stats
export const getMeStats = async (): Promise<MemberStatsResponse> => {
  const endpoint = "/members/me/stats";
  const response = await httpClient.api.get(endpoint);
  return response.data;
};
