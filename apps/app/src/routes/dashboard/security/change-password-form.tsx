/** biome-ignore-all lint/performance/useTopLevelRegex: false positive */
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, AlertDescription } from "@kaa/ui/components/alert";
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@kaa/ui/components/form";
import { Input } from "@kaa/ui/components/input";
import { Progress } from "@kaa/ui/components/progress";
import { Check, Eye, EyeOff, Key, Loader2, Shield, X } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useChangePassword } from "@/modules/users/user.queries";

// Password validation schema
const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(
        /[^A-Za-z0-9]/,
        "Password must contain at least one special character"
      ),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

// Password strength calculation
const calculatePasswordStrength = (
  password: string
): { score: number; feedback: string[] } => {
  let score = 0;
  const feedback: string[] = [];

  if (password.length >= 8) {
    score += 20;
  } else {
    feedback.push("At least 8 characters");
  }

  if (password.length >= 12) {
    score += 10;
  }

  if (/[A-Z]/.test(password)) {
    score += 20;
  } else {
    feedback.push("One uppercase letter");
  }

  if (/[a-z]/.test(password)) {
    score += 20;
  } else {
    feedback.push("One lowercase letter");
  }

  if (/[0-9]/.test(password)) {
    score += 15;
  } else {
    feedback.push("One number");
  }

  if (/[^A-Za-z0-9]/.test(password)) {
    score += 15;
  } else {
    feedback.push("One special character");
  }

  return { score, feedback };
};

const getStrengthLabel = (score: number): { label: string; color: string } => {
  if (score < 40) return { label: "Weak", color: "text-red-600" };
  if (score < 70) return { label: "Fair", color: "text-yellow-600" };
  if (score < 90) return { label: "Good", color: "text-blue-600" };
  return { label: "Strong", color: "text-green-600" };
};

export default function ChangePasswordForm() {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const newPassword = form.watch("newPassword");
  const passwordStrength = calculatePasswordStrength(newPassword);
  const strengthInfo = getStrengthLabel(passwordStrength.score);

  const changePasswordMutation = useChangePassword();

  const onSubmit = (data: ChangePasswordFormData) => {
    changePasswordMutation.mutate(data);
    form.reset();
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Key className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 text-lg">
            Change Password
          </h3>
          <p className="text-gray-600 text-sm">
            Update your account password for better security
          </p>
        </div>
      </div>

      {/* Password Requirements Info */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>Password Requirements:</strong> Your password must be at least
          8 characters long and include uppercase letters, lowercase letters,
          numbers, and special characters.
        </AlertDescription>
      </Alert>

      {/* Change Password Form */}
      <Card>
        <CardHeader>
          <CardTitle>Update Password</CardTitle>
          <CardDescription>
            Enter your current password and choose a new secure password
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
              {/* Current Password */}
              <FormField
                control={form.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          placeholder="Enter your current password"
                          type={showCurrentPassword ? "text" : "password"}
                          {...field}
                        />
                        <Button
                          className="absolute top-0 right-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() =>
                            setShowCurrentPassword(!showCurrentPassword)
                          }
                          size="icon"
                          type="button"
                          variant="ghost"
                        >
                          {showCurrentPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* New Password */}
              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          placeholder="Enter your new password"
                          type={showNewPassword ? "text" : "password"}
                          {...field}
                        />
                        <Button
                          className="absolute top-0 right-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          size="icon"
                          type="button"
                          variant="ghost"
                        >
                          {showNewPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />

                    {/* Password Strength Indicator */}
                    {newPassword && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Password strength:</span>
                          <span className={strengthInfo.color}>
                            {strengthInfo.label}
                          </span>
                        </div>
                        <Progress
                          className="h-2"
                          value={passwordStrength.score}
                        />
                        {passwordStrength.feedback.length > 0 && (
                          <div className="text-gray-600 text-sm">
                            <p className="mb-1">Missing requirements:</p>
                            <ul className="space-y-1">
                              {passwordStrength.feedback.map((item, index) => (
                                <li
                                  className="flex items-center gap-2"
                                  key={`${index + 1}`}
                                >
                                  <X className="h-3 w-3 text-red-500" />
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </FormItem>
                )}
              />

              {/* Confirm Password */}
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm New Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          placeholder="Confirm your new password"
                          type={showConfirmPassword ? "text" : "password"}
                          {...field}
                        />
                        <Button
                          className="absolute top-0 right-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                          size="icon"
                          type="button"
                          variant="ghost"
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />

                    {/* Password Match Indicator */}
                    {field.value && newPassword && (
                      <div className="flex items-center gap-2 text-sm">
                        {field.value === newPassword ? (
                          <>
                            <Check className="h-3 w-3 text-green-500" />
                            <span className="text-green-600">
                              Passwords match
                            </span>
                          </>
                        ) : (
                          <>
                            <X className="h-3 w-3 text-red-500" />
                            <span className="text-red-600">
                              Passwords do not match
                            </span>
                          </>
                        )}
                      </div>
                    )}
                  </FormItem>
                )}
              />

              {/* Submit Button */}
              <div className="pt-4">
                <Button
                  className="w-full sm:w-auto"
                  disabled={changePasswordMutation.isPending}
                  type="submit"
                >
                  {changePasswordMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating Password...
                    </>
                  ) : (
                    <>
                      <Key className="mr-2 h-4 w-4" />
                      Update Password
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Security Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-4 w-4" />
            Password Security Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-gray-600 text-sm">
            <li className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
              Use a unique password that you don't use anywhere else
            </li>
            <li className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
              Include a mix of letters, numbers, and special characters
            </li>
            <li className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
              Avoid using personal information like names or birthdays
            </li>
            <li className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
              Consider using a password manager to generate and store strong
              passwords
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
