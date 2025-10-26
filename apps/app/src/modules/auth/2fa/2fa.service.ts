import { MFAType } from "@kaa/models/types";
import { httpClient } from "@/lib/axios";
import type {
  TwoFactorCompleteLoginRequest,
  TwoFactorCompleteLoginResponse,
  TwoFactorSetupResponse,
} from "./2fa.types";

export const twoFactorService = {
  async setup2FA(): Promise<TwoFactorSetupResponse> {
    const { data } = await httpClient.api.post<TwoFactorSetupResponse>(
      "/auth/mfa/setup/totp"
    );
    return data;
  },

  async verify2FASetup(
    token: string,
    secret: string
  ): Promise<{ recoveryCodes: string[] }> {
    const response = await httpClient.api.post<{ recoveryCodes: string[] }>(
      "/auth/mfa/setup/totp/verify",
      {
        token,
        secret,
      }
    );
    return response.data;
  },

  async disable2FA(): Promise<{ message: string }> {
    const response = await httpClient.api.delete(`/auth/mfa/${MFAType.TOTP}`);
    return response.data;
  },

  async regenerateBackupCodes(): Promise<{ recoveryCodes: string[] }> {
    const response = await httpClient.api.post<{ recoveryCodes: string[] }>(
      "/auth/mfa/recovery-codes/regenerate"
    );
    return response.data;
  },

  async get2FAStatus(): Promise<{
    data: { isEnabled: boolean; backupCodesRemaining: number };
  }> {
    const { data } = await httpClient.api.get("/auth/mfa/status");
    return data;
  },

  async verify2FAToken(
    token: string,
    recoveryCode?: string
  ): Promise<{ isValid: boolean }> {
    const response = await httpClient.api.post("/auth/mfa/validate", {
      token,
      recoveryCode,
    });
    return response.data;
  },

  async verifyBackupCode(token: string): Promise<{ usedBackupCode: boolean }> {
    const response = await httpClient.api.post("/auth/mfa/verify/backup-code", {
      token,
    });
    return response.data;
  },

  // Complete login using 2FA token or recovery code
  async completeLogin(
    payload: TwoFactorCompleteLoginRequest
  ): Promise<TwoFactorCompleteLoginResponse> {
    const { data } = await httpClient.api.post<TwoFactorCompleteLoginResponse>(
      "/auth/mfa/complete/login",
      payload
    );
    return data;
  },
};
