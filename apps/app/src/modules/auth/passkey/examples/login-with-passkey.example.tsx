"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@kaa/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import { Input } from "@kaa/ui/components/input";
import { Label } from "@kaa/ui/components/label";
import { Separator } from "@kaa/ui/components/separator";
import { Loader2, Lock, Mail } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import { PasskeyLoginButton } from "@/modules/auth/passkey";
import { useLogin } from "../../auth.queries";

const loginSchema = z.object({
  email: z.email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

/**
 * Example login page showing how to integrate passkey authentication
 * alongside traditional password login
 */
export const LoginWithPasskeyExample: React.FC = () => {
  const [email, setEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const login = useLogin();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  // Watch email field for passkey button
  const watchedEmail = watch("email");

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login.mutateAsync(data);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handlePasskeySuccess = () => {
    toast.success("Successfully authenticated with passkey!");
    // Navigation handled by the passkey hook
  };

  return (
    <div className="container mx-auto max-w-lg py-10">
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="font-bold text-2xl">Sign in</CardTitle>
          <CardDescription>
            Choose your preferred sign-in method
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-10"
                  id="email"
                  placeholder="you@example.com"
                  type="email"
                  {...register("email", {
                    onChange: (e) => setEmail(e.target.value),
                  })}
                />
              </div>
              {errors.email && (
                <p className="text-destructive text-sm">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Passkey Button - Shows when email is valid */}
            {watchedEmail && z.email().safeParse(watchedEmail).success && (
              <>
                <PasskeyLoginButton
                  email={watchedEmail}
                  fullWidth
                  onSuccess={handlePasskeySuccess}
                  variant="secondary"
                />

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <Separator />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Or continue with password
                    </span>
                  </div>
                </div>
              </>
            )}

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-10"
                  id="password"
                  placeholder="••••••••"
                  type={showPassword ? "text" : "password"}
                  {...register("password")}
                />
              </div>
              {errors.password && (
                <p className="text-destructive text-sm">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              className="w-full"
              disabled={isSubmitting || login.isPending}
              type="submit"
            >
              {isSubmitting || login.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign in with Password"
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <div className="text-center text-muted-foreground text-sm">
            Don't have an account?{" "}
            <a className="text-primary hover:underline" href="/auth/register">
              Sign up
            </a>
          </div>
          <div className="text-center text-muted-foreground text-sm">
            <a
              className="text-primary hover:underline"
              href="/auth/forgot-password"
            >
              Forgot password?
            </a>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};
