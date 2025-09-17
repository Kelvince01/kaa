"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import Loader from "@/components/loader";
import { useRefreshToken } from "@/modules/auth/auth.queries";

export default function OAuthCallbackPage() {
  const t = useTranslations("auth.oauth");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [processed, setProcessed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { mutate: refreshUser } = useRefreshToken();

  useEffect(() => {
    // Only run this once to prevent infinite loops
    if (processed) return;

    const handleCallback = async () => {
      try {
        setProcessed(true);

        // Get token from URL query parameter
        const token = searchParams.get("token");

        if (!token) {
          setError(t("no_token"));
          return;
        }

        console.log("Received token, storing and updating auth state");

        // persist token in localStorage
        // setTokens({ accessToken: token, refreshToken: token });

        // Update auth state
        await refreshUser();

        // Redirect to dashboard or home page
        console.log("Authentication complete, redirecting to home");
        router.push("/");
      } catch (err) {
        console.error("OAuth callback error:", err);
        setError(t("auth_failed"));
      }
    };

    handleCallback();
  }, [router, searchParams, refreshUser, processed, t]);

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <div className="rounded-lg bg-white p-8 shadow-md">
          <h1 className="font-bold text-red-600 text-xl">{t("error_title")}</h1>
          <p className="mt-2 text-gray-600">{error}</p>
          <button
            className="mt-4 rounded-md bg-primary-600 px-4 py-2 text-white hover:bg-primary-700"
            onClick={() => router.push("/auth/login")}
            type="button"
          >
            {t("return_to_login")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div className="rounded-lg bg-white p-8 text-center shadow-md">
        <h1 className="font-bold text-gray-900 text-xl">
          {t("completing_auth")}
        </h1>
        <div className="mt-4 flex justify-center">
          <Loader />
        </div>
        <p className="mt-4 text-gray-600">{t("please_wait")}</p>
      </div>
    </div>
  );
}
