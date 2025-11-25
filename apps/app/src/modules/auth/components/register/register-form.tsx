/** biome-ignore-all lint/performance/useTopLevelRegex: top level regex */

import { zodResolver } from "@hookform/resolvers/zod";
import { Icon } from "@iconify/react";
import { Button } from "@kaa/ui/components/button";
import { Card, CardContent, CardHeader } from "@kaa/ui/components/card";
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
import { PhoneInput } from "@kaa/ui/extensions/phone-input";
import {
  Check,
  Eye,
  EyeOff,
  Lock,
  Mail,
  User as UserIcon,
  X,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type React from "react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { securityUtils } from "@/modules/auth";
import { getPasswordStrength } from "@/shared/utils/form.util";
import { useRegister } from "../../auth.queries";
import { type RegisterFormValues, registerSchema } from "../../auth.schema";

type RegisterFormProps = {
  redirectTo?: string;
};

/**
 * Registration form component for new user accounts
 */
const RegisterForm: React.FC<RegisterFormProps> = () => {
  const t = useTranslations("auth.register");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const registerMutation = useRegister();
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    text: "",
    color: "",
  });

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      username: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      role: "tenant",
      acceptTerms: false,
    },
  });

  // Watch for changes in firstName and lastName to generate username
  const watchedFirstName = form.watch("firstName");
  const watchedLastName = form.watch("lastName");

  // Generate username based on first and last name
  useEffect(() => {
    if (watchedFirstName || watchedLastName) {
      const generateUsername = (
        firstName: string,
        lastName: string
      ): string => {
        // Remove spaces and special characters, convert to lowercase
        const cleanFirstName = firstName
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "");
        const cleanLastName = lastName.toLowerCase().replace(/[^a-z0-9]/g, "");

        if (!(cleanFirstName || cleanLastName)) return "";
        if (!cleanFirstName) return cleanLastName;
        if (!cleanLastName) return cleanFirstName;

        // Combine first name + last name initial, or first name + last name if both are short
        if (cleanLastName.length <= 3) {
          return `${cleanFirstName}${cleanLastName}`;
        }
        return `${cleanFirstName}${cleanLastName.charAt(0)}`;
      };

      const newUsername = generateUsername(watchedFirstName, watchedLastName);
      if (newUsername && form.getValues("username") !== newUsername) {
        form.setValue("username", newUsername, { shouldValidate: true });
      }
    }
  }, [watchedFirstName, watchedLastName, form]);

  // Function to get the appropriate CSS classes based on password strength
  const getStrengthClasses = () => {
    switch (passwordStrength.color) {
      case "red":
        return {
          text: "text-red-600 font-semibold text-xs",
          bar: "bg-red-500",
        };
      case "yellow":
        return {
          text: "text-yellow-600 font-semibold text-xs",
          bar: "bg-yellow-500",
        };
      case "green":
        return {
          text: "text-green-600 font-semibold text-xs",
          bar: "bg-green-500",
        };
      case "emerald":
        return {
          text: "text-emerald-600 font-semibold text-xs",
          bar: "bg-emerald-500",
        };
      default:
        return {
          text: "text-gray-600 font-semibold text-xs",
          bar: "bg-gray-500",
        };
    }
  };

  const strengthClasses = getStrengthClasses();

  /**
   * Toggle password visibility
   */
  const togglePasswordVisibility = (): void => {
    setPasswordVisible(!passwordVisible);
  };

  /**
   * Toggle confirm password visibility
   */
  const toggleConfirmPasswordVisibility = (): void => {
    setConfirmPasswordVisible(!confirmPasswordVisible);
  };

  /**
   * Handle password change to update strength indicator
   */
  const handlePasswordChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ): void => {
    const password = e.target.value;
    form.setValue("password", password);

    // Use enhanced password validation from auth config
    const validation = securityUtils.validatePassword(password);

    if (!validation.isValid && password.length > 0) {
      // Show validation errors
      form.setError("password", {
        type: "manual",
        message: validation.errors[0] || "Password does not meet requirements",
      });
    } else {
      // Clear any previous errors
      form.clearErrors("password");
    }

    const strength = getPasswordStrength(password);
    // Translate the strength text
    if (strength.text) {
      // Handle "Very Strong" case by replacing space with underscore for translation key
      const translationKey = strength.text.toLowerCase().replace(" ", "_");
      strength.text = t(`password_strength_${translationKey}`);
    }
    setPasswordStrength(strength);
  };

  /**
   * Handle form submission
   */
  const onSubmit = async (values: RegisterFormValues): Promise<void> => {
    const { confirmPassword, ...registerData } = values;
    await registerMutation.mutateAsync(registerData);
  };

  /**
   * Check if password meets specific requirements
   */
  const getPasswordRequirements = (password: string) => ({
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[^a-zA-Z0-9]/.test(password),
  });

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-linear-to-br from-slate-50 via-emerald-50/30 to-teal-50/50 p-4">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzA1OTY2OSIgc3Ryb2tlLW9wYWNpdHk9IjAuMDMiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-60" />
      <div className="absolute top-20 left-20 h-80 w-80 rounded-full bg-emerald-500/8 blur-3xl" />
      <div className="absolute right-20 bottom-20 h-96 w-96 rounded-full bg-teal-500/6 blur-3xl" />
      <div className="relative z-10 grid w-full max-w-6xl items-center gap-8 lg:grid-cols-2">
        <div className="hidden space-y-8 lg:block">
          <div className="pointer-events-none absolute inset-0 opacity-5">
            <svg className="h-full w-full" viewBox="0 0 800 600">
              <defs />
              <rect
                fill="url(#pavement)"
                height="150"
                opacity="0.2"
                width="700"
                x="50"
                y="400"
              />
              <rect
                fill="none"
                height="300"
                rx="8"
                stroke="currentColor"
                strokeWidth="2"
                width="120"
                x="100"
                y="100"
              />
              <rect
                fill="none"
                height="320"
                rx="8"
                stroke="currentColor"
                strokeWidth="2"
                width="140"
                x="250"
                y="80"
              />
              <rect
                fill="none"
                height="280"
                rx="8"
                stroke="currentColor"
                strokeWidth="2"
                width="110"
                x="420"
                y="120"
              />
              <rect
                fill="none"
                height="310"
                rx="8"
                stroke="currentColor"
                strokeWidth="2"
                width="130"
                x="560"
                y="90"
              />
              <rect
                fill="none"
                height="20"
                opacity="0.6"
                stroke="currentColor"
                strokeWidth="1"
                width="15"
                x="110"
                y="120"
              />
              <rect
                fill="none"
                height="20"
                opacity="0.6"
                stroke="currentColor"
                strokeWidth="1"
                width="15"
                x="135"
                y="120"
              />
              <rect
                fill="none"
                height="20"
                opacity="0.6"
                stroke="currentColor"
                strokeWidth="1"
                width="15"
                x="160"
                y="120"
              />
              <rect
                fill="none"
                height="20"
                opacity="0.6"
                stroke="currentColor"
                strokeWidth="1"
                width="15"
                x="185"
                y="120"
              />
              <rect
                fill="none"
                height="20"
                opacity="0.6"
                stroke="currentColor"
                strokeWidth="1"
                width="15"
                x="110"
                y="160"
              />
              <rect
                fill="none"
                height="20"
                opacity="0.6"
                stroke="currentColor"
                strokeWidth="1"
                width="15"
                x="135"
                y="160"
              />
              <rect
                fill="none"
                height="20"
                opacity="0.6"
                stroke="currentColor"
                strokeWidth="1"
                width="15"
                x="160"
                y="160"
              />
              <rect
                fill="none"
                height="20"
                opacity="0.6"
                stroke="currentColor"
                strokeWidth="1"
                width="15"
                x="185"
                y="160"
              />
              <rect
                fill="none"
                height="20"
                opacity="0.6"
                stroke="currentColor"
                strokeWidth="1"
                width="15"
                x="260"
                y="100"
              />
              <rect
                fill="none"
                height="20"
                opacity="0.6"
                stroke="currentColor"
                strokeWidth="1"
                width="15"
                x="285"
                y="100"
              />
              <rect
                fill="none"
                height="20"
                opacity="0.6"
                stroke="currentColor"
                strokeWidth="1"
                width="15"
                x="310"
                y="100"
              />
              <rect
                fill="none"
                height="20"
                opacity="0.6"
                stroke="currentColor"
                strokeWidth="1"
                width="15"
                x="335"
                y="100"
              />
              <rect
                fill="none"
                height="20"
                opacity="0.6"
                stroke="currentColor"
                strokeWidth="1"
                width="15"
                x="260"
                y="140"
              />
              <rect
                fill="none"
                height="20"
                opacity="0.6"
                stroke="currentColor"
                strokeWidth="1"
                width="15"
                x="285"
                y="140"
              />
              <rect
                fill="none"
                height="20"
                opacity="0.6"
                stroke="currentColor"
                strokeWidth="1"
                width="15"
                x="310"
                y="140"
              />
              <rect
                fill="none"
                height="20"
                opacity="0.6"
                stroke="currentColor"
                strokeWidth="1"
                width="15"
                x="335"
                y="140"
              />
              <circle
                cx="150"
                cy="450"
                fill="currentColor"
                opacity="0.4"
                r="3"
              />
              <circle
                cx="200"
                cy="460"
                fill="currentColor"
                opacity="0.4"
                r="3"
              />
              <circle
                cx="300"
                cy="440"
                fill="currentColor"
                opacity="0.4"
                r="3"
              />
              <circle
                cx="350"
                cy="470"
                fill="currentColor"
                opacity="0.4"
                r="3"
              />
              <circle
                cx="450"
                cy="450"
                fill="currentColor"
                opacity="0.4"
                r="3"
              />
              <circle
                cx="500"
                cy="465"
                fill="currentColor"
                opacity="0.4"
                r="3"
              />
              <circle
                cx="600"
                cy="445"
                fill="currentColor"
                opacity="0.4"
                r="3"
              />
              <circle
                cx="650"
                cy="455"
                fill="currentColor"
                opacity="0.4"
                r="3"
              />
              <path
                d="M 140 450 Q 160 440 180 450"
                fill="none"
                opacity="0.3"
                stroke="currentColor"
                strokeWidth="1"
              />
              <path
                d="M 290 440 Q 310 430 330 440"
                fill="none"
                opacity="0.3"
                stroke="currentColor"
                strokeWidth="1"
              />
              <path
                d="M 440 450 Q 460 440 480 450"
                fill="none"
                opacity="0.3"
                stroke="currentColor"
                strokeWidth="1"
              />
              <path
                d="M 590 445 Q 610 435 630 445"
                fill="none"
                opacity="0.3"
                stroke="currentColor"
                strokeWidth="1"
              />
            </svg>
          </div>
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 backdrop-blur-sm">
              <Icon
                className="size-5 text-emerald-600"
                icon="solar:stars-bold"
              />
              <span className="font-medium text-emerald-700 text-sm">
                AI-Powered Property Management
              </span>
            </div>
            <h1 className="font-bold font-heading text-5xl text-slate-900 tracking-tight">
              Welcome to Kaa
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed">
              Revolutionize your rental business with intelligent automation,
              smart analytics, and seamless tenant management tailored for the
              Kenyan market.
            </p>
          </div>
          <div className="space-y-4">
            <div className="flex items-start gap-4 rounded-2xl border border-slate-200/60 bg-white/70 p-5 shadow-sm backdrop-blur-sm transition-shadow hover:shadow-md">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-emerald-500 to-teal-500 shadow-emerald-500/25 shadow-lg">
                <Icon
                  className="size-6 text-white"
                  icon="solar:home-smile-bold"
                />
              </div>
              <div>
                <h3 className="mb-1 font-semibold text-slate-900">
                  Smart Property Listings
                </h3>
                <p className="text-slate-600 text-sm">
                  AI-optimized listings that attract quality tenants faster
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 rounded-2xl border border-slate-200/60 bg-white/70 p-5 shadow-sm backdrop-blur-sm transition-shadow hover:shadow-md">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-teal-500 to-emerald-500 shadow-lg shadow-teal-500/25">
                <Icon
                  className="size-6 text-white"
                  icon="solar:chart-square-bold"
                />
              </div>
              <div>
                <h3 className="mb-1 font-semibold text-slate-900">
                  Real-Time Analytics
                </h3>
                <p className="text-slate-600 text-sm">
                  Track occupancy, revenue, and performance metrics instantly
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 rounded-2xl border border-slate-200/60 bg-white/70 p-5 shadow-sm backdrop-blur-sm transition-shadow hover:shadow-md">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-emerald-600 to-teal-600 shadow-emerald-600/25 shadow-lg">
                <Icon
                  className="size-6 text-white"
                  icon="solar:shield-check-bold"
                />
              </div>
              <div>
                <h3 className="mb-1 font-semibold text-slate-900">
                  Automated Rent Collection
                </h3>
                <p className="text-slate-600 text-sm">
                  M-Pesa integration with automatic reminders and receipts
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-6 pt-4">
            <div className="-space-x-3 flex">
              <img
                alt="User"
                className="h-10 w-10 rounded-full border-2 border-white object-cover shadow-sm"
                src="https://wqnmyfkavrotpmupbtou.supabase.co/storage/v1/object/public/generation-assets/photos/residential-listings/portrait/1.webp"
              />
              <img
                alt="User"
                className="h-10 w-10 rounded-full border-2 border-white object-cover shadow-sm"
                src="https://wqnmyfkavrotpmupbtou.supabase.co/storage/v1/object/public/generation-assets/photos/residential-listings/portrait/3.webp"
              />
              <img
                alt="User"
                className="h-10 w-10 rounded-full border-2 border-white object-cover shadow-sm"
                src="https://wqnmyfkavrotpmupbtou.supabase.co/storage/v1/object/public/generation-assets/photos/residential-listings/portrait/5.webp"
              />
              <img
                alt="User"
                className="h-10 w-10 rounded-full border-2 border-white object-cover shadow-sm"
                src="https://wqnmyfkavrotpmupbtou.supabase.co/storage/v1/object/public/generation-assets/photos/residential-listings/portrait/2.webp"
              />
            </div>
            <div>
              <div className="mb-1 flex items-center gap-1">
                <Icon
                  className="size-4 text-emerald-500 [&>path]:fill-emerald-500"
                  icon="solar:star-bold"
                />
                <Icon
                  className="size-4 text-emerald-500 [&>path]:fill-emerald-500"
                  icon="solar:star-bold"
                />
                <Icon
                  className="size-4 text-emerald-500 [&>path]:fill-emerald-500"
                  icon="solar:star-bold"
                />
                <Icon
                  className="size-4 text-emerald-500 [&>path]:fill-emerald-500"
                  icon="solar:star-bold"
                />
                <Icon
                  className="size-4 text-emerald-500 [&>path]:fill-emerald-500"
                  icon="solar:star-bold"
                />
              </div>
              <p className="text-slate-600 text-sm">
                <span className="font-semibold text-slate-900">2,500+</span>{" "}
                property owners trust Kaa
              </p>
            </div>
          </div>
        </div>
        <Card className="border-slate-200/60 bg-white/80 shadow-2xl shadow-slate-900/5 backdrop-blur-xl">
          <CardHeader className="pb-2 text-center">
            <div className="mb-4 flex items-center justify-center">
              <div className="rounded-xl bg-emerald-600 p-3">
                <Icon className="h-8 w-8 text-white" icon="mdi:home-city" />
              </div>
            </div>
            <h2 className="font-heading text-2xl text-gray-900">
              {t("title")}
            </h2>
            <p className="text-gray-600">
              {t("already_have_account")}{" "}
              <Link
                className="font-medium text-primary/50 hover:text-primary/80"
                href="/auth/login"
              >
                {t("sign_in")}
              </Link>
            </p>
          </CardHeader>

          <CardContent className="space-y-4 px-6">
            <Form {...form}>
              <form
                className="space-y-6"
                onSubmit={form.handleSubmit(onSubmit)}
              >
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("first_name_label")}</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                              <UserIcon className="text-gray-400" />
                            </div>
                            <Input {...field} className="pl-10" required />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("last_name_label")}</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                              <UserIcon className="text-gray-400" />
                            </div>
                            <Input {...field} className="pl-10" required />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

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
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("phone_label")}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <PhoneInput
                            placeholder="Enter a phone number"
                            {...field}
                            defaultCountry="KE"
                            international
                            required
                          />
                        </div>
                      </FormControl>
                      <FormDescription className="text-left">
                        Enter a phone number
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                            autoComplete="new-password"
                            className="pr-10 pl-10"
                            onChange={handlePasswordChange}
                            required
                            type={passwordVisible ? "text" : "password"}
                          />
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                            <button
                              className="text-gray-400 hover:text-gray-500 focus:outline-none"
                              onClick={togglePasswordVisibility}
                              type="button"
                            >
                              {passwordVisible ? (
                                <EyeOff className="h-5 w-5" />
                              ) : (
                                <Eye className="h-5 w-5" />
                              )}
                            </button>
                          </div>
                        </div>
                      </FormControl>

                      {field.value && (
                        <div className="mt-2">
                          <div className="mb-1 flex justify-between">
                            <span className="text-xs">
                              {t("password_strength")}
                            </span>
                            <span className={strengthClasses.text}>
                              {passwordStrength.text}
                            </span>
                          </div>
                          <div className="h-1 w-full rounded-full bg-gray-200">
                            <div
                              className={`h-1 rounded-full ${strengthClasses.bar}`}
                              style={{
                                width: `${passwordStrength.score * 25}%`,
                              }}
                            />
                          </div>

                          {/* Password requirements list */}
                          <div className="mt-2">
                            <p className="text-gray-600 text-xs">
                              {t("password_requirements")}
                            </p>
                            <ul className="mt-1 space-y-1 text-xs">
                              {Object.entries(
                                getPasswordRequirements(field.value)
                              ).map(([key, isMet]) => (
                                <li className="flex items-center" key={key}>
                                  {isMet ? (
                                    <Check className="mr-2 h-3 w-3 text-green-500" />
                                  ) : (
                                    <X className="mr-2 h-3 w-3 text-red-500" />
                                  )}
                                  <span
                                    className={
                                      isMet ? "text-green-600" : "text-gray-600"
                                    }
                                  >
                                    {t(`password_requirement_${key}`)}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}

                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("password_confirmation_label")}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <Lock className="text-gray-400" />
                          </div>
                          <Input
                            {...field}
                            autoComplete="new-password"
                            className="pr-10 pl-10"
                            required
                            type={confirmPasswordVisible ? "text" : "password"}
                          />
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                            <button
                              className="text-gray-400 hover:text-gray-500 focus:outline-none"
                              onClick={toggleConfirmPasswordVisibility}
                              type="button"
                            >
                              {confirmPasswordVisible ? (
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

                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("role_label")}</FormLabel>
                      <FormControl>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label
                              className={`relative block cursor-pointer border p-3 ${
                                field.value === "tenant"
                                  ? "border-primary-600 bg-primary-50"
                                  : "border-gray-200"
                              } hover:primary-500 rounded-md shadow-sm transition-colors`}
                              htmlFor="tenant"
                            >
                              <input
                                checked={field.value === "tenant"}
                                className="sr-only"
                                disabled={registerMutation.isPending}
                                id="tenant"
                                name="role"
                                onChange={field.onChange}
                                type="radio"
                                value="tenant"
                              />
                              <span className="font-medium text-gray-900 text-sm">
                                {t("tenant")}
                              </span>
                              <span className="mt-1 block text-gray-500 text-xs">
                                {t("tenant_description")}
                              </span>
                              {field.value === "tenant" && (
                                <span className="absolute top-1 right-1 text-primary-600">
                                  <Check className="h-5 w-5" />
                                </span>
                              )}
                            </label>
                          </div>
                          <div>
                            <label
                              className={`relative block cursor-pointer border p-3 ${
                                field.value === "landlord"
                                  ? "border-primary-600 bg-primary-50"
                                  : "border-gray-200"
                              } hover:primary-500 rounded-md shadow-sm transition-colors`}
                              htmlFor="landlord"
                            >
                              <input
                                checked={field.value === "landlord"}
                                className="sr-only"
                                disabled={registerMutation.isPending}
                                id="landlord"
                                name="role"
                                onChange={field.onChange}
                                type="radio"
                                value="landlord"
                              />
                              <span className="font-medium text-gray-900 text-sm">
                                {t("landlord")}
                              </span>
                              <span className="mt-1 block text-gray-500 text-xs">
                                {t("landlord_description")}
                              </span>
                              {field.value === "landlord" && (
                                <span className="absolute top-1 right-1 text-primary-600">
                                  <Check className="h-5 w-5" />
                                </span>
                              )}
                            </label>
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="acceptTerms"
                  render={({ field }) => (
                    <FormItem className="flex flex-col items-start">
                      <div className="flex flex-row items-center gap-2">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel>
                          <span className="font-medium text-gray-900 text-sm">
                            {t("terms")}{" "}
                            <Link
                              className="text-foreground/50 underline underline-offset-4 hover:text-foreground/80"
                              href="/terms-of-service"
                            >
                              {t("terms_link")}
                            </Link>{" "}
                            {t("and")}{" "}
                            <Link
                              className="text-foreground/50 underline underline-offset-4 hover:text-foreground/80"
                              href="/privacy-policy"
                            >
                              {t("privacy_policy")}
                            </Link>
                          </span>
                        </FormLabel>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button className="w-full" type="submit">
                  {registerMutation.isPending ? t("creating") : t("submit")}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RegisterForm;
