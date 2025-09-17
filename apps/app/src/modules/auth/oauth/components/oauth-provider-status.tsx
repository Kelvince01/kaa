"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@kaa/ui/components/alert-dialog";
import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import { Link as LinkIcon, Loader2, Unlink } from "lucide-react";
import { useInitiateOAuth, useUnlinkOAuthAccount } from "../oauth.queries";
import type { OAuthProvider, SupportedOAuthProvider } from "../oauth.type";

type OAuthProviderStatusProps = {
  provider: OAuthProvider;
  className?: string;
  showConnectButton?: boolean;
  showDisconnectButton?: boolean;
};

export function OAuthProviderStatus({
  provider,
  className,
  showConnectButton = true,
  showDisconnectButton = true,
}: OAuthProviderStatusProps) {
  const { mutate: unlinkAccount, isPending: isUnlinking } =
    useUnlinkOAuthAccount();
  const { initiateOAuth } = useInitiateOAuth();

  const handleConnect = () => {
    initiateOAuth(provider.name as SupportedOAuthProvider);
  };

  const handleDisconnect = () => {
    unlinkAccount({ provider: provider.name });
  };

  return (
    <div className={`flex items-center justify-between ${className}`}>
      <div className="flex items-center space-x-3">
        <div className="text-xl">{provider.icon}</div>
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-medium">{provider.displayName}</span>
            {provider.isConnected ? (
              <Badge
                className="border-green-300 bg-green-100 text-green-800"
                variant="secondary"
              >
                Connected
              </Badge>
            ) : (
              <Badge variant="outline">Not Connected</Badge>
            )}
          </div>
          {provider.isConnected && provider.connectedAt && (
            <p className="text-muted-foreground text-xs">
              Connected on {new Date(provider.connectedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-2">
        {provider.isConnected
          ? showDisconnectButton && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    className="text-red-600 hover:bg-red-50 hover:text-red-700"
                    disabled={isUnlinking}
                    size="sm"
                    variant="outline"
                  >
                    {isUnlinking ? (
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    ) : (
                      <Unlink className="mr-1 h-3 w-3" />
                    )}
                    Disconnect
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Disconnect {provider.displayName}?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to disconnect your{" "}
                      {provider.displayName} account? You won't be able to sign
                      in using this account until you reconnect it.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-red-600 hover:bg-red-700"
                      onClick={handleDisconnect}
                    >
                      Disconnect
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )
          : showConnectButton && (
              <Button
                className="text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                onClick={handleConnect}
                size="sm"
                variant="outline"
              >
                <LinkIcon className="mr-1 h-3 w-3" />
                Connect
              </Button>
            )}
      </div>
    </div>
  );
}
