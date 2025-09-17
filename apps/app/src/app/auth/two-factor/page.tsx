import { getTranslations } from "next-intl/server";
import { getMetadata } from "@/config/metadata";
import TwoFactorContainer from "@/modules/auth/components/two-factor-container";

export async function generateMetadata() {
  const t = await getTranslations("auth.metadata");
  return getMetadata({
    title: t("two_factor_title"),
    description: t("two_factor_description"),
  });
}

export default function TwoFactorPage() {
  return <TwoFactorContainer />;
}
