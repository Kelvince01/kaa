import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { getMetadata } from "@/config/metadata";
import ResetPasswordContainer from "@/modules/auth/components/reset-password-container";

export async function generateMetadata() {
  const t = await getTranslations("auth.metadata");
  return getMetadata({
    title: t("reset_password_title"),
    description: t("reset_password_description"),
  });
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordContainer />
    </Suspense>
  );
}
