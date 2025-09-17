import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { getMetadata } from "@/config/metadata";
import LoginContainer from "@/modules/auth/components/login/login-container";

export async function generateMetadata() {
  const t = await getTranslations("auth.metadata");
  return getMetadata({
    title: t("login_title"),
    description: t("login_description"),
  });
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginContainer />
    </Suspense>
  );
}
