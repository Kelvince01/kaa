/** biome-ignore-all lint/performance/useTopLevelRegex: top level regex */
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, AlertDescription } from "@kaa/ui/components/alert";
import { Button } from "@kaa/ui/components/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@kaa/ui/components/form";
import { Input } from "@kaa/ui/components/input";
import { Check, Eye, EyeOff, Lock, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { getPasswordStrength } from "@/shared/utils/form.util";
import { useResetPassword } from "../auth.queries";
import {
  type ResetPasswordFormValues,
  resetPasswordSchema,
} from "../auth.schema";

export function ResetPasswordContainer() {
  const resetPasswordMutation = useResetPassword();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [errorMessage, setErrorMessage] = useState("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState<boolean>(false);

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  // Get password strength for UI feedback
  const passwordStrength = getPasswordStrength(form.watch("password"));

  /**
   * Toggle password visibility
   */
  const togglePasswordVisibility = (): void => {
    setShowPassword(!showPassword);
  };

  /**
   * Toggle confirm password visibility
   */
  const toggleConfirmPasswordVisibility = (): void => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  if (!token) {
    return (
      <div className="mx-auto mt-4 max-w-md space-y-6 rounded-lg bg-white p-6 shadow-md">
        <Alert variant="destructive">
          <AlertDescription>
            Invalid or missing reset token. Please request a new password reset
            link.
          </AlertDescription>
        </Alert>
        <div className="mt-4 text-center">
          <a
            className="text-blue-600 text-sm hover:text-blue-800"
            href="/auth/forgot-password"
          >
            Request password reset
          </a>
        </div>
      </div>
    );
  }

  const onSubmit = async (data: ResetPasswordFormValues) => {
    try {
      setErrorMessage("");

      await resetPasswordMutation.mutateAsync({
        token,
        password: data.password,
      });

      // Redirect to login with success message
      router.push("/auth/login?resetSuccess=true");
    } catch (error: any) {
      setErrorMessage(
        error.message || "Failed to reset password. Please try again."
      );
    }
  };

  return (
    <div className="mx-auto mt-4 max-w-md space-y-6 rounded-lg bg-white p-6 shadow-md">
      <div className="text-center">
        <h1 className="font-bold text-2xl">Reset Password</h1>
        <p className="mt-2 text-gray-500 text-sm">
          Enter your new password below
        </p>
      </div>

      {errorMessage && (
        <Alert variant="destructive">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>New Password</FormLabel>
                <FormControl>
                  <div>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <Input
                        placeholder="••••••••"
                        type={showPassword ? "text" : "password"}
                        {...field}
                        className="block w-full py-2 pr-10 pl-10"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <button
                          aria-label={
                            showPassword ? "Hide password" : "Show password"
                          }
                          className="text-gray-400 hover:text-gray-500 focus:outline-none"
                          onClick={togglePasswordVisibility}
                          type="button"
                        >
                          {showPassword ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Password strength indicator */}
                    {form.watch("password") && (
                      <div className="mt-2">
                        <div className="flex items-center">
                          <div className="h-2 w-full rounded-full bg-gray-200">
                            <div
                              className={`h-2 rounded-full ${
                                passwordStrength.score <= 1
                                  ? "bg-red-500"
                                  : passwordStrength.score <= 2
                                    ? "bg-orange-500"
                                    : passwordStrength.score <= 3
                                      ? "bg-yellow-500"
                                      : "bg-green-500"
                              }`}
                              style={{
                                width: `${(passwordStrength.score / 5) * 100}%`,
                              }}
                            />
                          </div>
                          <span
                            className={`ml-2 font-medium text-xs ${
                              passwordStrength.score <= 1
                                ? "text-red-700"
                                : passwordStrength.score <= 2
                                  ? "text-orange-700"
                                  : passwordStrength.score <= 3
                                    ? "text-yellow-700"
                                    : "text-green-700"
                            }`}
                          >
                            {passwordStrength.text}
                          </span>
                        </div>
                        <div className="mt-1 text-gray-600 text-xs">
                          <ul className="space-y-1">
                            <li className="flex items-center">
                              {form.watch("password").length >= 8 ? (
                                <Check className="mr-1 h-3 w-3 text-green-500" />
                              ) : (
                                <X className="mr-1 h-3 w-3 text-red-500" />
                              )}
                              At least 8 characters
                            </li>
                            <li className="flex items-center">
                              {/[A-Z]/.test(form.watch("password")) ? (
                                <Check className="mr-1 h-3 w-3 text-green-500" />
                              ) : (
                                <X className="mr-1 h-3 w-3 text-red-500" />
                              )}
                              At least one uppercase letter
                            </li>
                            <li className="flex items-center">
                              {/[a-z]/.test(form.watch("password")) ? (
                                <Check className="mr-1 h-3 w-3 text-green-500" />
                              ) : (
                                <X className="mr-1 h-3 w-3 text-red-500" />
                              )}
                              At least one lowercase letter
                            </li>
                            <li className="flex items-center">
                              {/[0-9]/.test(form.watch("password")) ? (
                                <Check className="mr-1 h-3 w-3 text-green-500" />
                              ) : (
                                <X className="mr-1 h-3 w-3 text-red-500" />
                              )}
                              At least one number
                            </li>
                            <li className="flex items-center">
                              {/[^a-zA-Z0-9]/.test(form.watch("password")) ? (
                                <Check className="mr-1 h-3 w-3 text-green-500" />
                              ) : (
                                <X className="mr-1 h-3 w-3 text-red-500" />
                              )}
                              At least one special character
                            </li>
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <Input
                      placeholder="••••••••"
                      type={showConfirmPassword ? "text" : "password"}
                      {...field}
                      className="block w-full py-2 pr-10 pl-10"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <button
                        aria-label={
                          showConfirmPassword
                            ? "Hide password"
                            : "Show password"
                        }
                        className="text-gray-400 hover:text-gray-500 focus:outline-none"
                        onClick={toggleConfirmPasswordVisibility}
                        type="button"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            className="w-full"
            disabled={resetPasswordMutation.isPending}
            type="submit"
          >
            {resetPasswordMutation.isPending
              ? "Resetting Password..."
              : "Reset Password"}
          </Button>

          <div className="mt-4 text-center">
            <a
              className="text-blue-600 text-sm hover:text-blue-800"
              href="/auth/login"
            >
              Back to login
            </a>
          </div>
        </form>
      </Form>
    </div>
  );
}

export default ResetPasswordContainer;
