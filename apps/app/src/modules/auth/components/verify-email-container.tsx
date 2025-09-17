"use client";

import { Alert, AlertDescription } from "@kaa/ui/components/alert";
import { Button } from "@kaa/ui/components/button";
import { AlertCircle, CheckCircle, Loader2, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import {
  getRoleRedirect,
  useResendVerification,
  useVerifyEmail,
} from "../auth.queries";
import { useAuth } from "../use-auth";

const VerifyEmailContainer = () => {
  const t = useTranslations("auth");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated } = useAuth();
  const verifyEmailMutation = useVerifyEmail();
  const resendVerificationMutation = useResendVerification();

  const token = searchParams.get("token");
  const email = searchParams.get("email") || user?.email;

  const [verificationStatus, setVerificationStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [resendStatus, setResendStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [verificationAttempted, setVerificationAttempted] = useState(false);

  // If user is already verified and logged in, redirect to dashboard
  useEffect(() => {
    if (isAuthenticated && user?.isVerified) {
      getRoleRedirect(user.role as string);
    }
  }, [isAuthenticated, user]);

  // Create a stable verification function
  const verifyEmailToken = useCallback(async () => {
    if (!token || verificationAttempted) return;

    setVerificationAttempted(true);

    try {
      await verifyEmailMutation.mutate({ token });
      setVerificationStatus("success");
    } catch (error: any) {
      setVerificationStatus("error");
      setErrorMessage(error.message || t("common.error"));
    }
  }, [verifyEmailMutation, t, verificationAttempted, token]);

  // Verify email if token is present
  useEffect(() => {
    if (token && !verificationAttempted) {
      verifyEmailToken().then(() => null);
    }
  }, [token, verifyEmailToken, verificationAttempted]);

  // Handle resend verification email
  const handleResendVerification = async () => {
    if (!email) {
      setResendStatus("error");
      setErrorMessage(t("verify_email.email_required"));
      return;
    }

    setResendStatus("idle");

    try {
      // Call resend verification API
      await resendVerificationMutation.mutate({ email });

      setResendStatus("success");
    } catch (error: any) {
      setResendStatus("error");
      setErrorMessage(error.message || t("common.error"));
    }
  };

  return (
    <div className="mx-auto max-w-md space-y-6 rounded-lg bg-white p-8 shadow-md">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-50">
          <Mail className="h-8 w-8 text-primary-600" />
        </div>

        <h1 className="font-bold text-2xl">{t("verify_email.title")}</h1>

        {/* Different states based on verification status */}
        {verifyEmailMutation.isPending ? (
          <div className="mt-6 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary-600" />
            <p className="text-gray-600">
              {t("verify_email.verification_progress")}
            </p>
          </div>
        ) : verificationStatus === "success" ? (
          <Alert className="mt-6 border-green-200 bg-green-50">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <AlertDescription className="ml-2">
              {t("verify_email.verification_success")}
            </AlertDescription>
          </Alert>
        ) : verificationStatus === "error" ? (
          <Alert className="mt-6" variant="destructive">
            <AlertCircle className="h-5 w-5" />
            <AlertDescription className="ml-2">{errorMessage}</AlertDescription>
          </Alert>
        ) : (
          <>
            {/* Default state - no token provided */}
            <p className="mt-2 text-gray-600 text-sm">
              {t.rich("verify_email.description", {
                email: () => <span className="font-semibold">{email}</span>,
              })}
            </p>

            <div className="mt-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
              <p>{t("verify_email.check_spam")}</p>
            </div>

            {resendStatus === "success" && (
              <Alert className="mt-6 border-green-200 bg-green-50">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <AlertDescription className="ml-2">
                  {t("verify_email.resend_success")}
                </AlertDescription>
              </Alert>
            )}

            {resendStatus === "error" && (
              <Alert className="mt-6" variant="destructive">
                <AlertCircle className="h-5 w-5" />
                <AlertDescription className="ml-2">
                  {errorMessage}
                </AlertDescription>
              </Alert>
            )}

            <div className="mt-6 space-y-4">
              <Button
                className="w-full"
                disabled={resendVerificationMutation.isPending}
                onClick={handleResendVerification}
              >
                {resendVerificationMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("verify_email.sending")}
                  </>
                ) : (
                  t("verify_email.resend_button")
                )}
              </Button>

              <div className="text-center text-sm">
                <Link
                  className="font-medium text-primary-600 hover:text-primary-500"
                  href="/auth/login"
                >
                  {t("common.back_to_login")}
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmailContainer;
