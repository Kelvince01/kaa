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
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@kaa/ui/components/input-otp";
import { AlertCircle, Loader2, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import use2FA from "../2fa/use-2fa";

const twoFactorSchema = z.object({
  code: z
    .string()
    .min(6, "Code must be 6 digits")
    .max(6, "Code must be 6 digits"),
});

type TwoFactorFormValues = z.infer<typeof twoFactorSchema>;

const TwoFactorContainer = () => {
  const t = useTranslations("auth");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { completeTwoFactorLoginMutation } = use2FA();

  const userId = searchParams.get("userId");
  const redirectTo = searchParams.get("redirectTo") || "/";

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const form = useForm<TwoFactorFormValues>({
    resolver: zodResolver(twoFactorSchema),
    defaultValues: {
      code: "",
    },
  });

  // Redirect to login if no userId provided
  useEffect(() => {
    if (!userId) {
      router.push("/auth/login");
    }
  }, [userId, router]);

  // Handle form submission
  const onSubmit = async (values: TwoFactorFormValues) => {
    if (!userId) return;

    setIsSubmitting(true);
    setError("");
    const loadingToast = toast.loading(t("common.verifying"));

    try {
      const result = await completeTwoFactorLoginMutation.mutateAsync({
        userId,
        token: values.code,
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

  const handleUseRecoveryCode = () => {
    if (userId) {
      router.push(`/auth/recovery?userId=${userId}&redirectTo=${redirectTo}`);
    }
  };

  if (!userId) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="mx-auto mt-4 max-w-md space-y-6 rounded-lg bg-white p-8 shadow-md">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-50">
          <ShieldCheck className="h-8 w-8 text-primary-600" />
        </div>

        <h1 className="font-bold text-2xl">{t("two_factor.title")}</h1>
        <p className="mt-2 text-gray-600 text-sm">
          {t("two_factor.description")}
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
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="justify-center gap-1">
                    {t("two_factor.code_label")}
                  </FormLabel>
                  <FormControl>
                    <InputOTP
                      maxLength={6}
                      {...field}
                      containerClassName="justify-center gap-1"
                    >
                      <InputOTPGroup>
                        <InputOTPSlot className="h-12 w-11" index={0} />
                        <InputOTPSlot className="h-12 w-11" index={1} />
                        <InputOTPSlot className="h-12 w-11" index={2} />
                        <InputOTPSlot className="h-12 w-11" index={3} />
                        <InputOTPSlot className="h-12 w-11" index={4} />
                        <InputOTPSlot className="h-12 w-11" index={5} />
                      </InputOTPGroup>
                    </InputOTP>
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
                t("two_factor.submit")
              )}
            </Button>
          </form>
        </Form>

        <div className="mt-6 flex flex-col space-y-4">
          <button
            className="font-medium text-primary-600 text-sm hover:text-primary-500"
            onClick={handleUseRecoveryCode}
            type="button"
          >
            {t("two_factor.use_recovery")}
          </button>

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

export default TwoFactorContainer;
