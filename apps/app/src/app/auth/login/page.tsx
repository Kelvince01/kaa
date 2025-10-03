import { getTranslations } from "next-intl/server";
import { getMetadata } from "@/config/metadata";
import { GuestGuard } from "@/modules/auth/components/guest-guard";
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
    <GuestGuard>
      <LoginContainer />
    </GuestGuard>
  );
}
