import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { getMetadata } from "@/config/metadata";
import ForgotPasswordContainer from "@/modules/auth/components/forgot-password-container";

export async function generateMetadata() {
  const t = await getTranslations("auth.metadata");
  return getMetadata({
    title: t("forgot_password_title"),
    description: t("forgot_password_description"),
  });
}

const ForgotPasswordPage = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ForgotPasswordContainer />
    </Suspense>
  );
};

export default ForgotPasswordPage;
