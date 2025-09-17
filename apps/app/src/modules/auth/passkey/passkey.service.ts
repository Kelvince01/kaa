import type { AxiosResponse } from "axios";
import { httpClient } from "@/lib/axios";
import type {
  PasskeyCreateRequest,
  PasskeyCreateResponse,
  PasskeyDeleteResponse,
  PasskeyEnrollRequest,
  PasskeyEnrollResponse,
  PasskeyGetResponse,
  PasskeyListResponse,
  PasskeyProcessEnrollRequest,
  PasskeyProcessEnrollResponse,
  // PasskeyProcessVerifyRequest,
  PasskeyProcessVerifyResponse,
  PasskeyUpdateCounterRequest,
  PasskeyVerifyOptionsRequest,
  PasskeyVerifyOptionsResponse,
  // IPasskey,
} from "./passkey.type";

export const passkeyService = {
  // Generate enrollment options
  getEnrollOptions: async (
    data: PasskeyEnrollRequest
  ): Promise<PasskeyEnrollResponse> => {
    const response: AxiosResponse<PasskeyEnrollResponse> =
      await httpClient.api.post("/auth/passkey/enroll/options", data);
    return response.data;
  },

  // Generate verification options
  getVerifyOptions: async (
    data: PasskeyVerifyOptionsRequest
  ): Promise<PasskeyVerifyOptionsResponse> => {
    const response: AxiosResponse<PasskeyVerifyOptionsResponse> =
      await httpClient.api.post("/auth/passkey/verify/options", data);
    return response.data;
  },

  // Process enrollment response
  processEnroll: async (
    data: PasskeyProcessEnrollRequest
  ): Promise<PasskeyProcessEnrollResponse> => {
    const response: AxiosResponse<PasskeyProcessEnrollResponse> =
      await httpClient.api.post("/auth/passkey/process/enroll", data);
    return response.data;
  },

  // Process verification response
  processVerify: async (
    email: string,
    data: { passkeyInfo: any }
  ): Promise<PasskeyProcessVerifyResponse> => {
    const response: AxiosResponse<PasskeyProcessVerifyResponse> =
      await httpClient.api.post(
        `/auth/passkey/process/verify?email=${encodeURIComponent(email)}`,
        data
      );
    return response.data;
  },

  // Create a new passkey
  createPasskey: async (
    data: PasskeyCreateRequest
  ): Promise<PasskeyCreateResponse> => {
    const response: AxiosResponse<PasskeyCreateResponse> =
      await httpClient.api.post("/auth/passkey/enroll", data);
    return response.data;
  },

  // Get user's passkey
  getPasskey: async (userId: string): Promise<PasskeyGetResponse> => {
    const response: AxiosResponse<PasskeyGetResponse> =
      await httpClient.api.get(`/auth/passkey/${userId}`);
    return response.data;
  },

  // Get user's passkey by email
  getPasskeyByEmail: async (
    email: string
  ): Promise<PasskeyGetResponse & { user?: any }> => {
    const response: AxiosResponse<PasskeyGetResponse & { user?: any }> =
      await httpClient.api.get(`/auth/passkey/user/${email}`);
    return response.data;
  },

  // Get all user's passkeys
  getUserPasskeys: async (userId: string): Promise<PasskeyListResponse> => {
    const response: AxiosResponse<PasskeyListResponse> =
      await httpClient.api.get(`/auth/passkey/${userId}/list`);
    return response.data;
  },

  // Update passkey counter
  updatePasskeyCounter: async (
    passkeyId: string,
    data: PasskeyUpdateCounterRequest
  ): Promise<PasskeyCreateResponse> => {
    const response: AxiosResponse<PasskeyCreateResponse> =
      await httpClient.api.patch(`/auth/passkey/${passkeyId}`, data);
    return response.data;
  },

  // Delete a passkey
  deletePasskey: async (
    passkeyId: string,
    userId: string
  ): Promise<PasskeyDeleteResponse> => {
    const response: AxiosResponse<PasskeyDeleteResponse> =
      await httpClient.api.delete(`/auth/passkey/${passkeyId}/${userId}`);
    return response.data;
  },

  // Check if user has a passkey
  hasPasskey: async (email: string): Promise<boolean> => {
    try {
      const response = await passkeyService.getPasskeyByEmail(email);
      return response.status === "success" && !!response.passkey;
    } catch {
      return false;
    }
  },
};
