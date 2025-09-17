import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { queryClient } from "@/query/query-client";
import { useAuthStore } from "../auth.store";
import { twoFactorService } from "./2fa.service";
import type {
  BackupCodeVerificationRequest,
  TwoFactorCompleteLoginRequest,
  TwoFactorCompleteLoginResponse,
  TwoFactorVerificationRequest,
} from "./2fa.types";

export const use2FA = () => {
  const t = useTranslations();
  const router = useRouter();

  // Eagerly load translation messages to avoid context issues in callbacks
  const messages = {
    setup_success: t("2fa.setup_success"),
    failed_to_setup_2fa: t("2fa.failed_to_setup_2fa"),
    verification_success: t("2fa.verification_success"),
    failed_to_verify_2fa: t("2fa.failed_to_verify_2fa"),
    disabled_success: t("2fa.disabled_success"),
    failed_to_disable_2fa: t("2fa.failed_to_disable_2fa"),
    backup_codes_regenerated: t("2fa.backup_codes_regenerated"),
    failed_to_regenerate_backup_codes: t(
      "2fa.failed_to_regenerate_backup_codes"
    ),
    invalid_2fa_token: t("2fa.invalid_2fa_token"),
    invalid_backup_code: t("2fa.invalid_backup_code"),
  };

  // Get 2FA status
  const {
    data: twoFactorStatus,
    isLoading: isStatusLoading,
    refetch: refetchStatus,
  } = useQuery({
    queryKey: ["2fa-status"],
    queryFn: () => twoFactorService.get2FAStatus(),
  });

  // Setup 2FA
  const setup2FAMutation = useMutation({
    mutationFn: twoFactorService.setup2FA,
    onSuccess: () => {
      refetchStatus();
      toast.success(messages.setup_success);
    },
    onError: (error: any) => {
      toast.error(error?.message || messages.failed_to_setup_2fa);
    },
  });

  // Verify 2FA setup
  const verify2FASetupMutation = useMutation({
    mutationFn: (data: TwoFactorVerificationRequest & { secret: string }) =>
      twoFactorService.verify2FASetup(data.token, data.secret),
    onSuccess: (data) => {
      refetchStatus();
      toast.success(messages.verification_success);
      return data?.recoveryCodes || [];
    },
    onError: (error: any) => {
      toast.error(error?.message || messages.failed_to_verify_2fa);
    },
  });

  // Disable 2FA
  const disable2FAMutation = useMutation({
    mutationFn: twoFactorService.disable2FA,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["2fa-status"] });
      toast.success(messages.disabled_success);
    },
    onError: (error: any) => {
      toast.error(error?.message || messages.failed_to_disable_2fa);
    },
  });

  // Regenerate backup codes
  const regenerateBackupCodesMutation = useMutation({
    mutationFn: twoFactorService.regenerateBackupCodes,
    onSuccess: (data) => {
      refetchStatus();
      toast.success(messages.backup_codes_regenerated);
      return data?.recoveryCodes || [];
    },
    onError: (error: any) => {
      toast.error(error?.message || messages.failed_to_regenerate_backup_codes);
    },
  });

  // Verify 2FA token (for login)
  const verify2FATokenMutation = useMutation({
    mutationFn: (data: TwoFactorVerificationRequest) =>
      twoFactorService.verify2FAToken(data.token),
    onError: (error: any) => {
      toast.error(error?.message || messages.invalid_2fa_token);
    },
  });

  // Verify backup code (for login)
  const verifyBackupCodeMutation = useMutation({
    mutationFn: (data: BackupCodeVerificationRequest) =>
      twoFactorService.verifyBackupCode(data.code),
    onError: (error: any) => {
      toast.error(error?.message || messages.invalid_backup_code);
    },
  });

  // Complete login with 2FA (TOTP or recovery code)
  const { setUser, setTokens } = useAuthStore();
  const completeTwoFactorLoginMutation = useMutation({
    mutationFn: async (
      payload: TwoFactorCompleteLoginRequest
    ): Promise<TwoFactorCompleteLoginResponse> =>
      twoFactorService.completeLogin(payload),
    onSuccess: (data) => {
      if (data.status === "success" && data.user && data.tokens) {
        setUser({
          id: data.user.id,
          memberId: data.user.memberId,
          username: data.user.username,
          firstName: data.user.firstName,
          lastName: data.user.lastName,
          email: data.user.email,
          avatar: data.user.avatar,
          role: data.user.role,
          phone: data.user.phone,
          address: data.user.address,
          status: data.user.status,
          isActive: data.user.isActive,
          isVerified: data.user.isVerified,
          createdAt: data.user.createdAt,
          updatedAt: data.user.updatedAt,
        });

        setTokens({
          access_token: data.tokens.access_token,
          refresh_token: data.tokens.refresh_token,
        });

        toast.success(messages.verification_success);
      } else {
        toast.error(messages.invalid_2fa_token);
      }
    },
    onError: (error: any) => {
      toast.error(error?.message || messages.invalid_2fa_token);
    },
  });

  return {
    // Status
    twoFactorStatus: twoFactorStatus?.data,
    isStatusLoading,
    refetchStatus,

    // Mutations
    setup2FAMutation,
    verify2FASetupMutation,
    disable2FAMutation,
    regenerateBackupCodesMutation,
    verify2FATokenMutation,
    verifyBackupCodeMutation,
    completeTwoFactorLoginMutation,
  };
};

export default use2FA;
