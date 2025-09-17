import { getTranslations } from "next-intl/server";
import { getMetadata } from "@/config/metadata";
import VerifyEmailContainer from "@/modules/auth/components/verify-email-container";

export async function generateMetadata() {
  const t = await getTranslations("auth.metadata");
  return getMetadata({
    title: t("verify_email_title"),
    description: t("verify_email_description"),
  });
}

export default function VerifyEmailPage() {
  return <VerifyEmailContainer />;
}
