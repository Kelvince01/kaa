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
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useForgotPassword } from "../auth.queries";
import {
  type ForgotPasswordFormValues,
  forgotPasswordSchema,
} from "../auth.schema";

export function ForgotPasswordContainer() {
  const forgotPasswordMutation = useForgotPassword();
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const t = useTranslations("auth.forgot_password");

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    try {
      setErrorMessage("");

      await forgotPasswordMutation.mutateAsync({ email: data.email });

      setSuccessMessage(t("success"));
      form.reset();
    } catch (error: any) {
      setErrorMessage(error.message || t("failed"));
    }
  };

  return (
    <div className="mx-auto mt-4 max-w-md space-y-6 rounded-lg bg-white p-6 shadow-md">
      <div className="text-center">
        <h1 className="font-bold text-2xl">{t("title")}</h1>
        <p className="mt-2 text-gray-500 text-sm">{t("description")}</p>
      </div>

      {successMessage && (
        <Alert className="border border-green-200 bg-green-50">
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}

      {errorMessage && (
        <Alert variant="destructive">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("email_label")}</FormLabel>
                <FormControl>
                  <Input placeholder={t("email_placeholder")} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-between">
            <Button
              className="w-full"
              disabled={forgotPasswordMutation.isPending}
              type="submit"
            >
              {forgotPasswordMutation.isPending
                ? t("sending")
                : t("send_reset_link")}
            </Button>
          </div>

          <div className="mt-4 text-center">
            <a
              className="text-primary/50 underline underline-offset-4 hover:text-primary/80"
              href="/auth/login"
            >
              {t("back_to_login")}
            </a>
          </div>
        </form>
      </Form>
    </div>
  );
}

export default ForgotPasswordContainer;
