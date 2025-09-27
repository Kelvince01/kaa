import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@kaa/ui/components/button";
import { Checkbox } from "@kaa/ui/components/checkbox";
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
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type React from "react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";
import { useLogin } from "../../auth.queries";
import { type LoginFormValues, loginSchema } from "../../auth.schema";
import { OAuthConnectButton } from "../../oauth";

// import { PasskeyLoginButton } from "../../passkey";

type LoginFormProps = {
  redirectTo?: string;
};

/**
 * Login form component for user authentication
 */
const LoginForm: React.FC<LoginFormProps> = ({ redirectTo = "/" }) => {
  const t = useTranslations("auth.login");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const loginMutation = useLogin();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  /**
   * Toggle password visibility
   */
  const togglePasswordVisibility = (): void => {
    setShowPassword(!showPassword);
  };

  // Watch email field for passkey button
  const watchedEmail = form.watch("email");

  /**
   * Handle form submission
   */
  const onSubmit = async (values: LoginFormValues): Promise<void> => {
    try {
      await loginMutation.mutateAsync(values);
      // Get stored return URL and clear it
      const returnUrl = sessionStorage.getItem("returnUrl");
      sessionStorage.removeItem("returnUrl");
      // Redirect to return URL if exists, otherwise use provided redirectTo
      window.location.href = returnUrl || redirectTo;
    } catch (error: any) {
      let errorMessage: string;
      if (error.response?.status === 401) {
        errorMessage = t("unauthorized");
      } else if (error.response?.status === 429) {
        errorMessage = t("rate_limit_exceeded");
      } else {
        errorMessage = t("login_failed");
      }

      form.setError("email", { type: "manual", message: errorMessage });
    }
  };

  const handlePasskeySuccess = () => {
    toast.success("Successfully authenticated with passkey!");
    // Navigation handled by the passkey hook
  };

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="rounded-lg bg-white px-6 py-8 shadow-md">
        <div className="mb-6 text-center">
          <h2 className="font-extrabold text-3xl text-gray-900">
            {t("title")}
          </h2>
          <p className="mt-2 text-gray-600 text-sm">
            {t("create_account")}{" "}
            <Link
              className="font-medium text-primary/50 hover:text-primary/80"
              href="/auth/register"
            >
              {t("create_account_link")}
            </Link>
          </p>
        </div>

        <Form {...form}>
          <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("email_label")}</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Mail className="text-gray-400" />
                      </div>
                      <Input
                        {...field}
                        autoComplete="email"
                        className="pl-10"
                        placeholder="name@example.com"
                        required
                        type="email"
                      />
                    </div>
                  </FormControl>
                  <FormDescription>{t("email_description")}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Passkey Button - Shows when email is valid */}
            {watchedEmail && z.email().safeParse(watchedEmail).success && (
              <>
                {/*<PasskeyLoginButton*/}
                {/*  email={watchedEmail}*/}
                {/*  fullWidth*/}
                {/*  onSuccess={() => {*/}
                {/*    console.log("here");*/}
                {/*    const returnUrl = sessionStorage.getItem("returnUrl");*/}
                {/*    sessionStorage.removeItem("returnUrl");*/}
                {/*    window.location.href = returnUrl || redirectTo;*/}
                {/*  }}*/}
                {/*  variant="secondary"*/}
                {/*/>*/}

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

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("password_label")}</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Lock className="text-gray-400" />
                      </div>
                      <Input
                        {...field}
                        autoComplete="current-password"
                        className="pr-10 pl-10"
                        required
                        type={showPassword ? "text" : "password"}
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <button
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
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center justify-between">
              <FormField
                control={form.control}
                name="rememberMe"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        id="rememberMe"
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="leading-none">
                      <FormLabel htmlFor="rememberMe">
                        {t("remember_me")}
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />
              <div className="text-sm">
                <Link
                  className="font-medium text-foreground/50 underline underline-offset-4 hover:text-foreground/80"
                  href="/auth/forgot-password"
                >
                  {t("forgot_password")}
                </Link>
              </div>
            </div>

            <Button
              className="w-full disabled:cursor-not-allowed"
              disabled={loginMutation.isPending || !form.formState.isValid}
              type="submit"
            >
              {loginMutation.isPending ? t("signing_in") : t("submit")}
            </Button>
          </form>
        </Form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-gray-300 border-t" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-2 text-gray-500">
                {t("continue_with")}
              </span>
            </div>
          </div>

          {/* Social Login Buttons */}
          <div className="mt-6 grid grid-cols-1 gap-3">
            <OAuthConnectButton
              className="inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 text-sm shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              provider="google"
            />
            <OAuthConnectButton
              className="inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 text-sm shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              provider="microsoft"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
