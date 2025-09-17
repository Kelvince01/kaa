import { httpClient } from "@/lib/axios";
import type {
  TwoFactorCompleteLoginRequest,
  TwoFactorCompleteLoginResponse,
  TwoFactorSetupResponse,
} from "./2fa.types";

export const twoFactorService = {
  async setup2FA(): Promise<TwoFactorSetupResponse> {
    const { data } = await httpClient.api.post("/auth/2fa/setup");
    return data;
  },

  async verify2FASetup(
    token: string,
    secret: string
  ): Promise<{ recoveryCodes: string[] }> {
    const response = await httpClient.api.post("/auth/2fa/verify", {
      token,
      secret,
    });
    return response.data;
  },

  async disable2FA(): Promise<{ message: string }> {
    const response = await httpClient.api.delete("/auth/2fa/disable");
    return response.data;
  },

  async regenerateBackupCodes(): Promise<{ recoveryCodes: string[] }> {
    const response = await httpClient.api.post(
      "/auth/2fa/recovery-codes/regenerate"
    );
    return response.data;
  },

  async get2FAStatus(): Promise<{
    data: { isEnabled: boolean; backupCodesRemaining: number };
  }> {
    const { data } = await httpClient.api.get("/auth/2fa/status");
    return data;
  },

  async verify2FAToken(
    token: string,
    recoveryCode?: string
  ): Promise<{ isValid: boolean }> {
    const response = await httpClient.api.post("/auth/2fa/validate", {
      token,
      recoveryCode,
    });
    return response.data;
  },

  async verifyBackupCode(token: string): Promise<{ usedBackupCode: boolean }> {
    const response = await httpClient.api.post("/auth/2fa/verify/backup-code", {
      token,
    });
    return response.data;
  },

  // Complete login using 2FA token or recovery code
  async completeLogin(
    payload: TwoFactorCompleteLoginRequest
  ): Promise<TwoFactorCompleteLoginResponse> {
    const { data } = await httpClient.api.post<TwoFactorCompleteLoginResponse>(
      "/auth/2fa/complete/login",
      payload
    );
    return data;
  },
};
