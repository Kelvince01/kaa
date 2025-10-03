"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@kaa/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@kaa/ui/components/form";
import { Input } from "@kaa/ui/components/input";
import { Separator } from "@kaa/ui/components/separator";
import { Switch } from "@kaa/ui/components/switch";
import { Lock, Shield } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  type SecuritySettingsData,
  securitySettingsSchema,
  type TwoFactorData,
  twoFactorSchema,
} from "./schemas";

type SecuritySettingsFormProps = {
  onSavePassword?: (data: SecuritySettingsData) => Promise<void>;
  onToggle2FA?: (data: TwoFactorData) => Promise<void>;
};

export function SecuritySettingsForm({
  onSavePassword,
  onToggle2FA,
}: SecuritySettingsFormProps) {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  // Password change form
  const passwordForm = useForm<SecuritySettingsData>({
    resolver: zodResolver(securitySettingsSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Two-factor authentication form
  const twoFactorForm = useForm<TwoFactorData>({
    resolver: zodResolver(twoFactorSchema),
    defaultValues: {
      enabled: twoFactorEnabled,
    },
  });

  const handlePasswordSubmit = async (data: SecuritySettingsData) => {
    try {
      if (onSavePassword) {
        await onSavePassword(data);
      } else {
        // Default save simulation
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }
      toast.success("Password updated successfully!");
      passwordForm.reset();
    } catch (error) {
      toast.error("Failed to update password. Please try again.");
      console.error("Error updating password:", error);
    }
  };

  const handleToggle2FA = async (enabled: boolean) => {
    try {
      const data = { enabled };
      if (onToggle2FA) {
        await onToggle2FA(data);
      } else {
        // Default save simulation
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      setTwoFactorEnabled(enabled);
      toast.success(
        enabled
          ? "Two-factor authentication enabled successfully!"
          : "Two-factor authentication disabled successfully!"
      );
    } catch (error) {
      toast.error(
        "Failed to update two-factor authentication. Please try again."
      );
      console.error("Error updating 2FA:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Password Change Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Change Password
          </CardTitle>
          <CardDescription>
            Update your password to keep your account secure.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...passwordForm}>
            <form
              className="space-y-6"
              onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)}
            >
              <FormField
                control={passwordForm.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current password</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter your current password"
                        type="password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={passwordForm.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New password</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter your new password"
                        type="password"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Password must be at least 8 characters long and contain
                      uppercase, lowercase, number, and special character.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={passwordForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm new password</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Confirm your new password"
                        type="password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end">
                <Button
                  disabled={passwordForm.formState.isSubmitting}
                  type="submit"
                >
                  {passwordForm.formState.isSubmitting
                    ? "Updating..."
                    : "Update Password"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Two-Factor Authentication Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Two-Factor Authentication
          </CardTitle>
          <CardDescription>
            Add an extra layer of security to your account by requiring both
            your password and a verification code.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-base">Enable two-factor authentication</div>
              <div className="text-muted-foreground text-sm">
                Protect your account with an additional verification step
              </div>
            </div>
            <Switch
              checked={twoFactorEnabled}
              onCheckedChange={handleToggle2FA}
            />
          </div>

          {twoFactorEnabled && (
            <>
              <Separator className="my-6" />
              <div className="space-y-4">
                <div className="rounded-lg border p-4">
                  <h4 className="mb-2 font-medium text-sm">
                    Setup Instructions
                  </h4>
                  <ol className="list-inside list-decimal space-y-1 text-muted-foreground text-sm">
                    <li>
                      Download an authenticator app (Google Authenticator,
                      Authy, etc.)
                    </li>
                    <li>Scan the QR code below with your authenticator app</li>
                    <li>
                      Enter the 6-digit code from your app to verify setup
                    </li>
                  </ol>
                </div>

                <div className="flex flex-col items-center space-y-4">
                  {/* QR Code placeholder */}
                  <div className="flex h-48 w-48 items-center justify-center rounded-lg border-2 border-muted-foreground/25 border-dashed bg-muted">
                    <div className="text-center text-muted-foreground">
                      <Shield className="mx-auto mb-2 h-8 w-8" />
                      <div className="text-sm">QR Code</div>
                      <div className="text-xs">Scan with authenticator app</div>
                    </div>
                  </div>

                  {/* Verification code input */}
                  <div className="w-full max-w-sm space-y-2">
                    {/* biome-ignore lint/a11y/noLabelWithoutControl: ignore */}
                    <label className="font-medium text-sm">
                      Verification Code
                    </label>
                    <Input
                      className="text-center text-lg tracking-widest"
                      maxLength={6}
                      placeholder="Enter 6-digit code"
                    />
                    <Button className="w-full" size="sm">
                      Verify & Complete Setup
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Account Recovery Card */}
      <Card>
        <CardHeader>
          <CardTitle>Account Recovery</CardTitle>
          <CardDescription>
            Manage your account recovery options.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <div className="font-medium text-sm">Recovery Email</div>
                <div className="text-muted-foreground text-sm">
                  Used to recover your account if you lose access
                </div>
              </div>
              <Button size="sm" variant="outline">
                Update
              </Button>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <div className="font-medium text-sm">Backup Codes</div>
                <div className="text-muted-foreground text-sm">
                  Generate backup codes for account recovery
                </div>
              </div>
              <Button size="sm" variant="outline">
                Generate
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
