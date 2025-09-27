"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, AlertDescription } from "@kaa/ui/components/alert";
import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import { Input } from "@kaa/ui/components/input";
import {
  CheckCircle,
  Copy,
  Download,
  Info,
  Key,
  Loader2,
  RefreshCw,
  Shield,
  Smartphone,
} from "lucide-react";
import Image from "next/image";
import type React from "react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { use2FA } from "@/modules/auth/2fa/use-2fa";

type TwoFactorAuthProps = {
  userId: string;
  onSuccess: () => void;
};

const verificationSchema = z.object({
  token: z
    .string()
    .min(6, "Verification code must be 6 digits")
    .max(6, "Verification code must be 6 digits"),
});

type VerificationFormData = z.infer<typeof verificationSchema>;

const TwoFactorAuth: React.FC<TwoFactorAuthProps> = ({ onSuccess }) => {
  const [setupStep, setSetupStep] = useState(0); // 0: status, 1: setup, 2: verify, 3: backup codes
  const [setupData, setSetupData] = useState<{
    qrCodeUrl: string;
    secret: string;
  } | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);

  const {
    twoFactorStatus,
    isStatusLoading,
    setup2FAMutation,
    verify2FASetupMutation,
    disable2FAMutation,
    regenerateBackupCodesMutation,
  } = use2FA();

  const form = useForm<VerificationFormData>({
    resolver: zodResolver(verificationSchema),
    defaultValues: {
      token: "",
    },
  });

  const handleSetup2FA = async () => {
    try {
      const result = await setup2FAMutation.mutateAsync();
      if (result) {
        setSetupData(result);
        setSetupStep(1);
      }
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleVerify = async (data: VerificationFormData) => {
    try {
      if (!setupData?.secret) {
        toast.error("Setup data not found. Please restart the setup process.");
        return;
      }
      const result = await verify2FASetupMutation.mutateAsync({
        token: data.token,
        secret: setupData.secret,
      });
      if (result) {
        setBackupCodes(result.recoveryCodes);
      }
      setSetupStep(3); // Show backup codes
      onSuccess();
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleDisable2FA = async () => {
    try {
      await disable2FAMutation.mutateAsync();
      setSetupStep(0);
      onSuccess();
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleRegenerateBackupCodes = async () => {
    try {
      const result = await regenerateBackupCodesMutation.mutateAsync();
      if (result.recoveryCodes) {
        setBackupCodes(result.recoveryCodes);
      }
    } catch (error) {
      // Error handled by mutation
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        toast.success("Copied to clipboard!");
      },
      (err) => {
        console.error("Could not copy text: ", err);
        toast.error("Failed to copy to clipboard");
      }
    );
  };

  const downloadBackupCodes = () => {
    if (!backupCodes?.length) return;

    const content = `KAA SaaS Two-Factor Authentication Backup Codes\n\nKeep these codes in a safe place. Each code can only be used once.\n\n${backupCodes.join("\n")}\n\nGenerated: ${new Date().toLocaleString()}`;

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "kaa-2fa-backup-codes.txt";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Backup codes downloaded!");
  };

  if (isStatusLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Smartphone className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 text-lg">
            Two-Factor Authentication
          </h3>
          <p className="text-gray-600 text-sm">
            Add an extra layer of security to your account
          </p>
        </div>
      </div>
      {/* Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Two-factor authentication (2FA) helps protect your account by
          requiring a verification code from your phone in addition to your
          password.
        </AlertDescription>
      </Alert>
      {/* 2FA Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Authentication Status
              </CardTitle>
              <CardDescription>
                Current two-factor authentication status for your account
              </CardDescription>
            </div>
            {twoFactorStatus?.isEnabled && (
              <Badge
                className="border-green-200 bg-green-50 text-green-700"
                variant="outline"
              >
                <CheckCircle className="mr-1 h-3 w-3" />
                Enabled
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!twoFactorStatus?.isEnabled && setupStep === 0 && (
            <div className="space-y-4">
              <div className="py-6 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                  <Shield className="h-8 w-8 text-gray-400" />
                </div>
                <h4 className="mb-2 font-medium text-gray-900 text-lg">
                  2FA Not Enabled
                </h4>
                <p className="mx-auto max-w-sm text-gray-600 text-sm">
                  Two-factor authentication adds an extra layer of security by
                  requiring a verification code from your authenticator app.
                </p>
              </div>
              <Button
                className="w-full"
                disabled={setup2FAMutation.isPending}
                onClick={handleSetup2FA}
              >
                {setup2FAMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Setting up...
                  </>
                ) : (
                  <>
                    <Smartphone className="mr-2 h-4 w-4" />
                    Enable 2FA
                  </>
                )}
              </Button>
            </div>
          )}

          {setupStep === 1 && setupData && (
            <div className="space-y-6">
              <div className="text-center">
                <h4 className="mb-2 font-medium text-gray-900 text-lg">
                  Setup Two-Factor Authentication
                </h4>
                <p className="text-gray-600 text-sm">
                  Follow these steps to secure your account with 2FA
                </p>
              </div>

              {/* Step 1: QR Code */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary font-medium text-white text-xs">
                    1
                  </div>
                  <span className="font-medium text-sm">Scan QR Code</span>
                </div>
                <p className="ml-8 text-gray-600 text-sm">
                  Use your authenticator app (Google Authenticator, Authy, etc.)
                  to scan this QR code
                </p>
                <div className="ml-8 flex justify-center">
                  <div className="rounded-lg border border-gray-200 bg-white p-4">
                    <Image
                      alt="QR Code for 2FA"
                      className="h-48 w-48"
                      src={setupData.qrCodeUrl}
                      style={{
                        maxWidth: "100%",
                        height: "auto",
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Step 2: Manual Entry */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary font-medium text-white text-xs">
                    2
                  </div>
                  <span className="font-medium text-sm">
                    Or Enter Key Manually
                  </span>
                </div>
                <div className="ml-8 flex items-center gap-2">
                  <code className="flex-1 rounded border bg-gray-100 px-3 py-2 font-mono text-sm">
                    {setupData.secret}
                  </code>
                  <Button
                    onClick={() => copyToClipboard(setupData.secret)}
                    size="icon"
                    title="Copy to clipboard"
                    variant="outline"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Step 3: Verification */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary font-medium text-white text-xs">
                    3
                  </div>
                  <span className="font-medium text-sm">
                    Enter Verification Code
                  </span>
                </div>
                <form
                  className="ml-8 flex gap-2"
                  onSubmit={form.handleSubmit(handleVerify)}
                >
                  <Input
                    {...form.register("token")}
                    className="max-w-xs"
                    maxLength={6}
                    onChange={(e) =>
                      form.setValue("token", e.target.value.replace(/\D/g, ""))
                    }
                    placeholder="Enter 6-digit code"
                    type="text"
                  />
                  <Button
                    disabled={
                      verify2FASetupMutation.isPending ||
                      form.watch("token").length !== 6
                    }
                    type="submit"
                  >
                    {verify2FASetupMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      "Verify & Enable"
                    )}
                  </Button>
                </form>
                {form.formState.errors.token && (
                  <p className="ml-8 text-red-600 text-sm">
                    {form.formState.errors.token.message}
                  </p>
                )}
              </div>

              <div className="flex justify-center pt-4">
                <Button onClick={() => setSetupStep(0)} variant="ghost">
                  Cancel Setup
                </Button>
              </div>
            </div>
          )}

          {setupStep === 3 && setupData && (
            <div className="space-y-6">
              <Alert>
                <Download className="h-4 w-4" />
                <AlertDescription>
                  <strong>Important:</strong> Save your backup codes in a safe
                  place. You'll need them if you lose access to your
                  authenticator app.
                </AlertDescription>
              </Alert>

              <Card className="border-yellow-200 bg-yellow-50">
                <CardHeader>
                  <CardTitle className="text-yellow-800">
                    Backup Codes
                  </CardTitle>
                  <CardDescription className="text-yellow-700">
                    Each code can only be used once. Store them securely.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4 grid grid-cols-2 gap-2 font-mono text-sm">
                    {backupCodes.map((code, index) => (
                      <div
                        className="rounded border bg-white p-2"
                        key={`${index + 1}`}
                      >
                        {code}
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => copyToClipboard(backupCodes.join("\n"))}
                      size="sm"
                      variant="outline"
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Copy Codes
                    </Button>
                    <Button
                      onClick={downloadBackupCodes}
                      size="sm"
                      variant="outline"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Button className="w-full" onClick={() => setSetupStep(0)}>
                Continue to Dashboard
              </Button>
            </div>
          )}

          {twoFactorStatus?.isEnabled && setupStep === 0 && (
            <div className="space-y-6">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Two-factor authentication is active on your account. Your
                  account is more secure!
                </AlertDescription>
              </Alert>

              <div className="grid gap-4 sm:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Backup Codes</CardTitle>
                    <CardDescription>
                      Generate new backup codes for account recovery
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-gray-600 text-sm">
                        Codes remaining:{" "}
                        {twoFactorStatus.backupCodesRemaining || 0}
                      </p>
                      <Button
                        className="w-full"
                        disabled={regenerateBackupCodesMutation.isPending}
                        onClick={handleRegenerateBackupCodes}
                        variant="outline"
                      >
                        {regenerateBackupCodesMutation.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="mr-2 h-4 w-4" />
                        )}
                        Generate New Codes
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base text-red-600">
                      Disable 2FA
                    </CardTitle>
                    <CardDescription>
                      Turn off two-factor authentication (not recommended)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      className="w-full"
                      disabled={disable2FAMutation.isPending}
                      onClick={handleDisable2FA}
                      variant="destructive"
                    >
                      {disable2FAMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        "Disable 2FA"
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      {/* Benefits Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-4 w-4" />
            Why Enable 2FA?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Enhanced Security</h4>
                <p className="text-gray-600 text-sm">
                  Protect against password breaches and unauthorized access
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
                <Smartphone className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">
                  Mobile Verification
                </h4>
                <p className="text-gray-600 text-sm">
                  Use your phone as a secure verification device
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100">
                <Key className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Backup Codes</h4>
                <p className="text-gray-600 text-sm">
                  Emergency access codes if you lose your device
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-100">
                <Shield className="h-4 w-4 text-yellow-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Industry Standard</h4>
                <p className="text-gray-600 text-sm">
                  Trusted security method used by major platforms
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TwoFactorAuth;
