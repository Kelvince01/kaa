/** biome-ignore-all lint/performance/useTopLevelRegex: top level regex */

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
      agreeToTerms: false,
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
    <div className="mx-auto w-full max-w-md">
      <div className="rounded-lg bg-white px-6 py-8 shadow-md">
        <div className="mb-6 text-center">
          <h2 className="font-extrabold text-3xl text-gray-900">
            {t("title")}
          </h2>
          <p className="mt-2 text-gray-600 text-sm">
            {t("already_have_account")}{" "}
            <Link
              className="font-medium text-primary/50 hover:text-primary/80"
              href="/auth/login"
            >
              {t("sign_in")}
            </Link>
          </p>
        </div>

        <Form {...form}>
          <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
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
                          style={{ width: `${passwordStrength.score * 25}%` }}
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
              name="agreeToTerms"
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
      </div>
    </div>
  );
};

export default RegisterForm;
