"use client";

import { Button } from "@kaa/ui/components/button";
import { Loader2 } from "lucide-react";
import type React from "react";
import { Google, Microsoft } from "@/components/ui/icons";
import { useInitiateOAuth } from "../oauth.queries";
import type { SupportedOAuthProvider } from "../oauth.type";

type OAuthConnectButtonProps = {
  provider: SupportedOAuthProvider;
  children?: React.ReactNode;
  className?: string;
  variant?:
    | "default"
    | "outline"
    | "secondary"
    | "ghost"
    | "link"
    | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
  disabled?: boolean;
  isLoading?: boolean;
};

export function OAuthConnectButton({
  provider,
  children,
  className,
  variant = "outline",
  size = "default",
  disabled = false,
  isLoading = false,
}: OAuthConnectButtonProps) {
  const { initiateOAuth } = useInitiateOAuth();

  const handleConnect = () => {
    initiateOAuth(provider);
  };

  const getProviderConfig = (provider: SupportedOAuthProvider) => {
    const configs = {
      google: {
        name: "Google",
        icon: <Google />,
        color: "#4285f4",
      },
      microsoft: {
        name: "Microsoft",
        icon: <Microsoft />,
        color: "#00a1f1",
      },
    };

    return configs[provider];
  };

  const config = getProviderConfig(provider);

  return (
    <Button
      className={className}
      disabled={disabled || isLoading}
      onClick={handleConnect}
      size={size}
      variant={variant}
    >
      {isLoading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <span className="mr-2">{config.icon}</span>
      )}
      {children || `Connect with ${config.name}`}
    </Button>
  );
}
