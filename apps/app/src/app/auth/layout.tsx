import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { getMetadata } from "@/config/metadata";
import { AuthLayoutContainer } from "@/routes/auth/layout";

export async function generateMetadata() {
  const t = await getTranslations("auth.metadata");
  return getMetadata({
    title: t("accounts_title"),
    description: t("accounts_description"),
  });
}

export default function AuthLayout({ children }: { children: ReactNode }) {
  return <AuthLayoutContainer>{children}</AuthLayoutContainer>;
}
