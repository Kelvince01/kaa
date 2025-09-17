import { Alert, AlertDescription } from "@kaa/ui/components/alert";
import { Button } from "@kaa/ui/components/button";
import { Input } from "@kaa/ui/components/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@kaa/ui/components/input-otp";
import { AlertCircle, Key, Loader2, Shield } from "lucide-react";
import { useState } from "react";
import type { User } from "@/modules/users/user.type";
import use2FA from "../2fa/use-2fa";

type TwoFactorVerifyProps = {
  userId: string;
  onSuccess: (token: string, user: User) => void;
  onCancel: () => void;
};

const TwoFactorVerify = ({
  userId,
  onSuccess,
  onCancel,
}: TwoFactorVerifyProps) => {
  const [verificationCode, setVerificationCode] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useRecoveryCode, setUseRecoveryCode] = useState(false);

  const { completeTwoFactorLoginMutation } = use2FA();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!(verificationCode || recoveryCode)) {
      setError("Please enter a verification code or recovery code");
      return;
    }

    setIsLoading(true);

    try {
      const result = await completeTwoFactorLoginMutation.mutateAsync({
        userId,
        token: useRecoveryCode ? undefined : verificationCode,
        recoveryCode: useRecoveryCode ? recoveryCode : undefined,
      });

      if (result.status === "success" && result.tokens && result.user) {
        onSuccess(result.tokens.access_token, result.user as User);
      } else {
        setError(
          result.message || "Invalid verification code. Please try again."
        );
      }
    } catch (error: any) {
      console.error("2FA verification error:", error);
      setError(
        error?.response?.data?.message ||
          "Invalid verification code. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const toggleRecoveryCode = () => {
    setUseRecoveryCode(!useRecoveryCode);
    setError(null);
  };

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="rounded-lg bg-white p-8 shadow-md">
        <div className="mb-6 text-center">
          <div className="mb-4 flex justify-center">
            <Shield className="h-12 w-12 text-primary-500" />
          </div>
          <h1 className="font-bold text-gray-900 text-xl">
            Two-Factor Authentication
          </h1>
          <p className="mt-1 text-gray-600">
            {useRecoveryCode
              ? "Enter a recovery code to access your account"
              : "Enter the verification code from your authenticator app"}
          </p>
        </div>

        {error && (
          <Alert className="mb-4" variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          {useRecoveryCode ? (
            <div>
              <label
                className="block font-medium text-gray-700 text-sm"
                htmlFor="recoveryCode"
              >
                Recovery Code
              </label>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Key className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  className="pl-10"
                  id="recoveryCode"
                  onChange={(e) => setRecoveryCode(e.target.value)}
                  placeholder="xxxx-xxxx-xxxx"
                  value={recoveryCode}
                />
              </div>
            </div>
          ) : (
            <div>
              <label
                className="block font-medium text-gray-700 text-sm"
                htmlFor="verificationCode"
              >
                Verification Code
              </label>
              <div className="mt-3 flex justify-center">
                <InputOTP
                  maxLength={6}
                  onChange={(val) =>
                    setVerificationCode(val.replace(/\D/g, ""))
                  }
                  value={verificationCode}
                >
                  <InputOTPGroup>
                    <InputOTPSlot className="h-12 w-11" index={0} />
                    <InputOTPSlot className="h-12 w-11" index={1} />
                    <InputOTPSlot className="h-12 w-11" index={2} />
                    <InputOTPSlot className="h-12 w-11" index={3} />
                    <InputOTPSlot className="h-12 w-11" index={4} />
                    <InputOTPSlot className="h-12 w-11" index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
            </div>
          )}

          <div className="flex flex-col space-y-4">
            <Button className="w-full" disabled={isLoading} type="submit">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify"
              )}
            </Button>

            <Button
              className="h-auto p-0"
              onClick={toggleRecoveryCode}
              type="button"
              variant="link"
            >
              {useRecoveryCode
                ? "Use authenticator app instead"
                : "Use a recovery code instead"}
            </Button>

            <Button
              className="justify-center"
              onClick={onCancel}
              type="button"
              variant="ghost"
            >
              Back to login
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TwoFactorVerify;
