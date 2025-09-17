"use client";

import { Alert, AlertDescription } from "@kaa/ui/components/alert";
import { Button } from "@kaa/ui/components/button";
import { AlertCircle, Fingerprint, Loader2 } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { useHasPasskey, useVerifyPasskey } from "../passkey.queries";
import { passkeyUtils } from "../passkey.utils";

type PasskeyLoginButtonProps = {
  email: string;
  onSuccess?: () => void;
  className?: string;
  variant?: "default" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  fullWidth?: boolean;
};

export const PasskeyLoginButton: React.FC<PasskeyLoginButtonProps> = ({
  email,
  onSuccess,
  className,
  variant = "outline",
  size = "default",
  fullWidth = false,
}) => {
  const [error, setError] = useState<string | null>(null);
  const verifyPasskey = useVerifyPasskey();
  const { data: hasPasskey, isLoading: checkingPasskey } = useHasPasskey(email);

  const handleLogin = async () => {
    setError(null);

    // Check browser support
    if (!passkeyUtils.isSupported()) {
      setError("Your browser doesn't support passkeys");
      return;
    }

    // Check if user has a passkey
    if (!hasPasskey) {
      setError("No passkey found for this account");
      return;
    }

    try {
      await verifyPasskey.mutateAsync(email);
      onSuccess?.();
    } catch (error: any) {
      setError(error.message || "Failed to authenticate with passkey");
    }
  };

  // Don't show button if checking or user doesn't have a passkey
  if (checkingPasskey || !hasPasskey) {
    return null;
  }

  return (
    <div className={fullWidth ? "w-full" : ""}>
      <Button
        className={`${fullWidth ? "w-full" : ""} ${className || ""}`}
        disabled={verifyPasskey.isPending}
        onClick={handleLogin}
        size={size}
        type="button"
        variant={variant}
      >
        {verifyPasskey.isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Authenticating...
          </>
        ) : (
          <>
            <Fingerprint className="mr-2 h-4 w-4" />
            Sign in with Passkey
          </>
        )}
      </Button>

      {error && (
        <Alert className="mt-2" variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};
