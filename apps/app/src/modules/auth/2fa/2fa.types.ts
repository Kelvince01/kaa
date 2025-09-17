export type TwoFactorSetupResponse = {
  qrCodeUrl: string;
  secret: string;
};

export type TwoFactorStatus = {
  isEnabled: boolean;
  backupCodesRemaining: number;
};

export type TwoFactorVerificationRequest = {
  token: string;
  secret?: string;
};

export type BackupCodeVerificationRequest = {
  code: string;
};

export type TwoFactorVerificationResponse = {
  isValid: boolean;
  message?: string;
};

// Complete login (2FA) types
import type { User } from "@/modules/users/user.type";

export type TwoFactorCompleteLoginRequest = {
  userId: string;
  token?: string;
  recoveryCode?: string;
};

export type TwoFactorCompleteLoginResponse = {
  status: "success" | "error";
  message?: string;
  tokens?: {
    access_token: string;
    refresh_token: string;
  };
  user?: User;
  sessionId?: string;
};
