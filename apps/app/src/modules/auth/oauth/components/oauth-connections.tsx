"use client";

import { Alert, AlertDescription } from "@kaa/ui/components/alert";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import { AlertCircle, Link as LinkIcon, Loader2, Unlink } from "lucide-react";
import {
  useInitiateOAuth,
  useOAuthProviders,
  useUnlinkOAuthAccount,
} from "../oauth.queries";
import type { SupportedOAuthProvider } from "../oauth.type";

type OAuthConnectionsProps = {
  className?: string;
  showTitle?: boolean;
};

export function OAuthConnections({
  className,
  showTitle = true,
}: OAuthConnectionsProps) {
  const { providers, isLoading, connections } = useOAuthProviders();
  const { mutate: unlinkAccount, isPending: isUnlinking } =
    useUnlinkOAuthAccount();
  const { initiateOAuth } = useInitiateOAuth();

  const handleConnect = (provider: SupportedOAuthProvider) => {
    initiateOAuth(provider);
  };

  const handleDisconnect = (provider: string) => {
    unlinkAccount({ provider });
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          {showTitle && (
            <>
              <CardTitle>Connected Accounts</CardTitle>
              <CardDescription>
                Link your social accounts for easier sign-in and enhanced
                security.
              </CardDescription>
            </>
          )}
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading connections...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        {showTitle && (
          <>
            <CardTitle>Connected Accounts</CardTitle>
            <CardDescription>
              Link your social accounts for easier sign-in and enhanced
              security.
            </CardDescription>
          </>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {connections.length === 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No accounts connected yet. Connect your social accounts to make
              signing in easier.
            </AlertDescription>
          </Alert>
        )}

        {providers.map((provider) => (
          <div
            className="flex items-center justify-between rounded-lg border p-4"
            key={provider.name}
            style={{ borderLeftColor: provider.color, borderLeftWidth: "4px" }}
          >
            <div className="flex items-center space-x-3">
              <div className="text-2xl">{provider.icon}</div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-medium">{provider.displayName}</h3>
                  {provider.isConnected ? (
                    <Badge
                      className="bg-green-100 text-green-800"
                      variant="secondary"
                    >
                      Connected
                    </Badge>
                  ) : (
                    <Badge variant="outline">Not Connected</Badge>
                  )}
                </div>
                {provider.isConnected && provider.connectedAt && (
                  <p className="text-muted-foreground text-sm">
                    Connected on{" "}
                    {new Date(provider.connectedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {provider.isConnected ? (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      className="text-red-600 hover:text-red-700"
                      disabled={isUnlinking}
                      size="sm"
                      variant="outline"
                    >
                      {isUnlinking ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Unlink className="mr-2 h-4 w-4" />
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
                        {provider.displayName} account? You won't be able to
                        sign in using this account until you reconnect it.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-red-600 hover:bg-red-700"
                        onClick={() => handleDisconnect(provider.name)}
                      >
                        Disconnect
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              ) : (
                <Button
                  className="text-blue-600 hover:text-blue-700"
                  onClick={() =>
                    handleConnect(provider.name as SupportedOAuthProvider)
                  }
                  size="sm"
                  variant="outline"
                >
                  <LinkIcon className="mr-2 h-4 w-4" />
                  Connect
                </Button>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
