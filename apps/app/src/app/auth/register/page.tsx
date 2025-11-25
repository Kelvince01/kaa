import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { getMetadata } from "@/config/metadata";
import { RegistrationForm } from "@/modules/auth/components/register/step-form/registration-form";
// import RegisterContainer from "@/modules/auth/components/register/register-container";

export async function generateMetadata() {
  const t = await getTranslations("auth.metadata");
  return getMetadata({
    title: t("register_title"),
    description: t("register_description"),
  });
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      {/* <RegisterContainer /> */}
      <RegistrationForm />
    </Suspense>
  );
}
