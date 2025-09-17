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
import { AlertCircle, Key, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import use2FA from "../2fa/use-2fa";

const recoveryCodeSchema = z.object({
  recoveryCode: z
    .string()
    .min(8, "Recovery code is too short")
    .max(24, "Recovery code is too long"),
});

type RecoveryCodeFormValues = z.infer<typeof recoveryCodeSchema>;

const RecoveryCodeContainer = () => {
  const t = useTranslations("auth");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { completeTwoFactorLoginMutation } = use2FA();

  const userId = searchParams.get("userId");
  const redirectTo = searchParams.get("redirectTo") || "/";

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const form = useForm<RecoveryCodeFormValues>({
    resolver: zodResolver(recoveryCodeSchema),
    defaultValues: {
      recoveryCode: "",
    },
  });

  // Redirect to login if no userId provided
  useEffect(() => {
    if (!userId) {
      router.push("/auth/login");
    }
  }, [userId, router]);

  // Handle form submission
  const onSubmit = async (values: RecoveryCodeFormValues) => {
    if (!userId) return;

    setIsSubmitting(true);
    setError("");
    const loadingToast = toast.loading(t("common.verifying"));

    try {
      const result = await completeTwoFactorLoginMutation.mutateAsync({
        userId,
        recoveryCode: values.recoveryCode,
      });

      if (result.status === "success") {
        toast.success(t("two_factor.success"), { id: loadingToast });
        router.push(redirectTo);
      } else {
        setError(result.message || t("common.error"));
        toast.error(result.message || t("common.error"), { id: loadingToast });
      }
    } catch (error: any) {
      setError(
        error?.response?.data?.message || error.message || t("common.error")
      );
      toast.error(t("common.error"), { id: loadingToast });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!userId) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="mx-auto max-w-md space-y-6 rounded-lg bg-white p-8 shadow-md">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-50">
          <Key className="h-8 w-8 text-primary-600" />
        </div>

        <h1 className="font-bold text-2xl">{t("recovery_code.title")}</h1>
        <p className="mt-2 text-gray-600 text-sm">
          {t("recovery_code.description")}
        </p>

        {error && (
          <Alert className="mt-4" variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form
            className="mt-6 space-y-6"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <FormField
              control={form.control}
              name="recoveryCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("recovery_code.code_label")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className="text-center font-mono"
                      placeholder={t("recovery_code.code_label")}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button className="w-full" disabled={isSubmitting} type="submit">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("common.verifying")}
                </>
              ) : (
                t("recovery_code.submit")
              )}
            </Button>
          </form>
        </Form>

        <div className="mt-6 flex flex-col space-y-4">
          <Link
            className="font-medium text-primary-600 text-sm hover:text-primary-500"
            href={`/auth/two-factor?userId=${userId}`}
          >
            {t("recovery_code.use_authenticator")}
          </Link>

          <Link
            className="text-gray-600 text-sm hover:text-gray-800"
            href="/auth/login"
          >
            {t("common.back_to_login")}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RecoveryCodeContainer;
