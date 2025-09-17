import { getTranslations } from "next-intl/server";
import { getMetadata } from "@/config/metadata";
import RecoveryCodeContainer from "@/modules/auth/components/recovery-code-container";

export async function generateMetadata() {
  const t = await getTranslations("auth.metadata");
  return getMetadata({
    title: t("recovery_title"),
    description: t("recovery_description"),
  });
}

export default function RecoveryCodePage() {
  return <RecoveryCodeContainer />;
}
