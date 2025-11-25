import { zodResolver } from "@hookform/resolvers/zod";
import { Icon } from "@iconify/react";
import { Button } from "@kaa/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
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
import { Eye, EyeOff } from "lucide-react";
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
import { PasskeyLoginButton } from "../../passkey";

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
    <Card className="relative w-full max-w-md border-emerald-200/50 bg-white/95 shadow-2xl shadow-emerald-500/10 backdrop-blur-sm">
      <div className="-top-1 -translate-x-1/2 absolute left-1/2 h-1 w-20 transform rounded-full bg-linear-to-r from-emerald-500 to-teal-500" />
      <CardHeader className="pt-8 pb-6 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-emerald-500 to-teal-600 shadow-emerald-500/25 shadow-lg">
          <Icon
            className="h-8 w-8 text-white"
            icon="material-symbols:home-work"
          />
        </div>
        <CardTitle className="bg-linear-to-r from-emerald-700 to-teal-700 bg-clip-text font-heading text-2xl text-transparent">
          {t("title")}
        </CardTitle>
        <CardDescription className="text-slate-600">
          {t("create_account")}
          {/* <Link
            className="font-medium text-primary/50 hover:text-primary/80"
            href="/auth/register"
          >
            {t("create_account_link")}
          </Link> */}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6 px-6">
        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700 text-sm">
                    {t("email_label")}
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Icon
                        className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 transform text-emerald-500"
                        icon="material-symbols:mail-outline"
                      />
                      <Input
                        {...field}
                        autoComplete="email"
                        className="border-emerald-200 pl-10 focus:border-emerald-500 focus:ring-emerald-500/20"
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
                <PasskeyLoginButton
                  email={watchedEmail}
                  fullWidth
                  onSuccess={() => {
                    console.log("here");
                    const returnUrl = sessionStorage.getItem("returnUrl");
                    sessionStorage.removeItem("returnUrl");
                    window.location.href = returnUrl || redirectTo;
                  }}
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

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700 text-sm">
                    {t("password_label")}
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Icon
                        className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 transform text-emerald-500"
                        icon="material-symbols:lock-outline"
                      />
                      <Input
                        {...field}
                        autoComplete="current-password"
                        className="border-emerald-200 pl-10 focus:border-emerald-500 focus:ring-emerald-500/20"
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
                  <FormItem className="flex flex-row items-center space-x-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        className="border-emerald-300 data-[state=checked]:border-emerald-500 data-[state=checked]:bg-emerald-500"
                        id="rememberMe"
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="leading-none">
                      <FormLabel
                        className="text-slate-600 text-sm"
                        htmlFor="rememberMe"
                      >
                        {t("remember_me")}
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />
              <Link href="/auth/forgot-password">
                <Button
                  className="h-auto p-0 text-emerald-600 text-sm hover:text-emerald-700"
                  variant="link"
                >
                  {t("forgot_password")}
                </Button>
              </Link>
            </div>

            <Button
              className="w-full bg-linear-to-r from-emerald-500 to-teal-600 py-2.5 font-medium text-white shadow-emerald-500/25 shadow-lg transition-all duration-200 hover:from-emerald-600 hover:to-teal-700 disabled:cursor-not-allowed"
              disabled={loginMutation.isPending || !form.formState.isValid}
              type="submit"
            >
              <Icon className="mr-2 h-4 w-4" icon="material-symbols:login" />
              {loginMutation.isPending ? t("signing_in") : t("submit")}
            </Button>
          </form>
        </Form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator className="bg-emerald-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-3 font-medium text-slate-500">
              {t("continue_with")}
            </span>
          </div>
        </div>

        {/* Social Login Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <OAuthConnectButton
            className="w-full border-emerald-200 transition-colors hover:border-emerald-300 hover:bg-emerald-50"
            provider="google"
          />
          <OAuthConnectButton
            className="w-full border-emerald-200 transition-colors hover:border-emerald-300 hover:bg-emerald-50"
            provider="microsoft"
          />
        </div>
      </CardContent>

      <CardFooter className="pb-8 text-center">
        <div className="w-full space-y-3">
          <p className="text-slate-600 text-sm">
            New to Kaa?
            <Link href="/auth/register">
              <Button
                className="ml-1 h-auto p-0 font-medium text-emerald-600 text-sm hover:text-emerald-700"
                variant="link"
              >
                {t("create_account_link")}
              </Button>
            </Link>
          </p>
          <div className="flex items-center justify-center gap-2 text-slate-500 text-xs">
            <Icon
              className="h-3 w-3 text-emerald-500"
              icon="material-symbols:verified"
            />
            {/* <span>Trusted by 10,000+ Kenyan property owners</span> */}
            <span>Trusted by landlords and tenants</span>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
};

export default LoginForm;
