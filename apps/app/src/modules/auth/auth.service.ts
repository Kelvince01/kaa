import type { AxiosResponse } from "axios";
import { httpClient } from "@/lib/axios";
import type { ApiResponse } from "@/lib/axios/types";
import type {
  ForgotPasswordRequest,
  LoginRequest,
  LoginResponse,
  LoginTwoFactorResponse,
  MeResponse,
  RegisterRequest,
  RegisterResponse,
  ResendVerificationRequest,
  ResetPasswordRequest,
  VerifyEmailRequest,
} from "./auth.type";

export const authService = {
  // Register
  register: async (data: RegisterRequest): Promise<RegisterResponse> => {
    const response: AxiosResponse<RegisterResponse> = await httpClient.api.post(
      "/auth/register",
      data
    );
    return response.data;
  },

  // Login
  login: async (
    data: LoginRequest
  ): Promise<LoginResponse | LoginTwoFactorResponse> => {
    const response: AxiosResponse<LoginResponse | LoginTwoFactorResponse> =
      await httpClient.api.post("/auth/login", data);

    return response.data;
  },

  // Verify email
  verifyEmail: async (data: VerifyEmailRequest): Promise<ApiResponse> => {
    const response: AxiosResponse<ApiResponse> = await httpClient.api.post(
      "/auth/email/verify",
      data
    );
    return response.data;
  },

  // Resend verification email
  resendVerification: async (
    data: ResendVerificationRequest
  ): Promise<ApiResponse> => {
    const response: AxiosResponse<ApiResponse> = await httpClient.api.post(
      "/auth/resend/email/verify",
      data
    );
    return response.data;
  },

  // Verify phone
  verifyPhone: async (data: VerifyEmailRequest): Promise<ApiResponse> => {
    const response: AxiosResponse<ApiResponse> = await httpClient.api.post(
      "/auth/phone/verify",
      data
    );
    return response.data;
  },

  // Get current user
  getCurrentUser: async (): Promise<MeResponse> => {
    const response: AxiosResponse<MeResponse> =
      await httpClient.api.get<MeResponse>("/auth/me");
    return response.data;
  },

  // Logout
  logout: async (): Promise<ApiResponse> => {
    const response: AxiosResponse<ApiResponse> =
      await httpClient.api.post("/auth/logout");
    return response.data;
  },

  // Upload avatar
  uploadAvatar: async (
    file: File
  ): Promise<{ status: string; avatar: string }> => {
    const formData = new FormData();
    formData.append("avatar", file);

    const response: AxiosResponse<{ status: string; avatar: string }> =
      await httpClient.api.post("/auth/upload/avatar", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
    return response.data;
  },

  // Forgot password
  forgotPassword: async (data: ForgotPasswordRequest): Promise<ApiResponse> => {
    const response: AxiosResponse<ApiResponse> = await httpClient.api.post(
      "/auth/password/forgot",
      data
    );
    return response.data;
  },

  // Reset password
  resetPassword: async (data: ResetPasswordRequest): Promise<ApiResponse> => {
    const response: AxiosResponse<ApiResponse> = await httpClient.api.post(
      "/auth/password/reset",
      data
    );
    return response.data;
  },

  // Refresh token
  refreshToken: async (): Promise<{
    tokens: { access_token: string; refresh_token: string };
  }> => {
    const response = await httpClient.api.post<{
      tokens: { access_token: string; refresh_token: string };
    }>("/auth/refresh", {});
    return response.data;
  },
};
