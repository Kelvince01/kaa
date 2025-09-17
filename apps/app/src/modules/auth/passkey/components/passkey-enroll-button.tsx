"use client";

import { Alert, AlertDescription } from "@kaa/ui/components/alert";
import { Button } from "@kaa/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@kaa/ui/components/dialog";
import { AlertCircle, Fingerprint, Loader2, Shield } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { useEnrollPasskey } from "../passkey.queries";
import { passkeyUtils } from "../passkey.utils";

type PasskeyEnrollButtonProps = {
  onSuccess?: () => void;
  className?: string;
  variant?: "default" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
};

export const PasskeyEnrollButton: React.FC<PasskeyEnrollButtonProps> = ({
  onSuccess,
  className,
  variant = "default",
  size = "default",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSupported, setIsSupported] = useState<boolean | null>(null);
  const enrollPasskey = useEnrollPasskey();

  const checkSupport = async () => {
    const supported = passkeyUtils.isSupported();
    const canCreate = supported
      ? await passkeyUtils.canCreatePlatformAuthenticator()
      : false;
    setIsSupported(supported && canCreate);
    if (supported && canCreate) {
      await handleEnroll();
    }
  };

  const handleEnroll = async () => {
    try {
      await enrollPasskey.mutateAsync();
      setIsOpen(false);
      onSuccess?.();
    } catch (error) {
      // Error is handled by the mutation hook
    }
  };

  return (
    <Dialog onOpenChange={setIsOpen} open={isOpen}>
      <DialogTrigger asChild>
        <Button
          className={className}
          disabled={enrollPasskey.isPending}
          onClick={async () => {
            setIsOpen(true);
            await checkSupport();
          }}
          size={size}
          variant={variant}
        >
          {enrollPasskey.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Setting up...
            </>
          ) : (
            <>
              <Fingerprint className="mr-2 h-4 w-4" />
              Set Up Passkey
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Set Up Passkey Authentication
          </DialogTitle>
          <DialogDescription>
            Passkeys provide a secure and convenient way to sign in without
            passwords.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {isSupported === false && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Your device or browser doesn't support passkeys. Please try a
                different device or update your browser.
              </AlertDescription>
            </Alert>
          )}

          {isSupported === true && (
            <>
              <div className="space-y-2">
                <h4 className="font-medium text-sm">What are passkeys?</h4>
                <ul className="space-y-1 text-muted-foreground text-sm">
                  <li>• Sign in with Face ID, Touch ID, or your device PIN</li>
                  <li>• No passwords to remember or type</li>
                  <li>• Resistant to phishing attacks</li>
                  <li>• Synced across your devices</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-sm">
                  Device: {passkeyUtils.getDeviceName()}
                </h4>
                <p className="text-muted-foreground text-sm">
                  Your passkey will be saved to this device and can be used for
                  future sign-ins.
                </p>
              </div>

              {enrollPasskey.isPending && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              )}

              {enrollPasskey.isError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {enrollPasskey.error?.message ||
                      "Failed to create passkey. Please try again."}
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}

          {isSupported === null && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
        </div>

        {isSupported === true && !enrollPasskey.isPending && (
          <div className="flex justify-end gap-2">
            <Button onClick={() => setIsOpen(false)} variant="outline">
              Cancel
            </Button>
            <Button disabled={enrollPasskey.isPending} onClick={handleEnroll}>
              {enrollPasskey.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Passkey"
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
