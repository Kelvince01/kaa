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
import { formatDistanceToNow } from "date-fns";
import {
  AlertCircle,
  CheckCircle,
  Fingerprint,
  Laptop,
  Loader2,
  Smartphone,
  Trash2,
} from "lucide-react";
import type React from "react";
import { useAuthStore } from "@/modules/auth";
import { useDeletePasskey, useListPasskeys } from "../passkey.queries";
import { PasskeyEnrollButton } from "./passkey-enroll-button";

export const PasskeyManager: React.FC = () => {
  const { user } = useAuthStore();
  const { data, isLoading, error, refetch } = useListPasskeys(user?.id || "");
  const deletePasskey = useDeletePasskey();

  const handleDelete = async (passkeyId: string) => {
    try {
      await deletePasskey.mutateAsync(passkeyId);
      await refetch();
    } catch (error) {
      // Error is handled by the mutation hook
    }
  };

  const getDeviceIcon = (deviceType: string) => {
    if (
      deviceType.toLowerCase().includes("mobile") ||
      deviceType === "singleDevice"
    ) {
      return <Smartphone className="h-4 w-4" />;
    }
    return <Laptop className="h-4 w-4" />;
  };

  if (!user) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Please sign in to manage your passkeys.
        </AlertDescription>
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load passkeys. Please try again.
        </AlertDescription>
      </Alert>
    );
  }

  const passkeys = data?.passkeys || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Fingerprint className="h-5 w-5" />
          Passkeys
        </CardTitle>
        <CardDescription>
          Manage your passkeys for passwordless authentication. Passkeys are
          more secure than passwords and can't be phished.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {passkeys.length === 0 ? (
          <div className="space-y-4 py-8 text-center">
            <div className="text-muted-foreground">
              <Fingerprint className="mx-auto mb-4 h-12 w-12 opacity-50" />
              <p className="text-sm">You haven't set up any passkeys yet.</p>
              <p className="text-sm">
                Add a passkey to enable secure, passwordless sign-in.
              </p>
            </div>
            <PasskeyEnrollButton onSuccess={refetch} variant="default" />
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {passkeys.map((passkey) => (
                <div
                  className="flex items-center justify-between rounded-lg border p-4"
                  key={passkey.id}
                >
                  <div className="flex items-center gap-3">
                    {getDeviceIcon(passkey.credentialDeviceType)}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{passkey.name}</span>
                        {passkey.credentialBackedUp && (
                          <Badge className="text-xs" variant="outline">
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Synced
                          </Badge>
                        )}
                      </div>
                      <div className="text-muted-foreground text-sm">
                        Created{" "}
                        {formatDistanceToNow(new Date(passkey.createdAt), {
                          addSuffix: true,
                        })}
                        {passkey.lastUsed && (
                          <span>
                            {" • "}
                            Last used{" "}
                            {formatDistanceToNow(new Date(passkey.lastUsed), {
                              addSuffix: true,
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        disabled={deletePasskey.isPending}
                        size="icon"
                        variant="ghost"
                      >
                        {deletePasskey.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Passkey</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this passkey? You
                          won't be able to use it to sign in anymore.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          onClick={() => handleDelete(passkey.id)}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
            </div>

            <div className="border-t pt-4">
              <PasskeyEnrollButton
                className="w-full sm:w-auto"
                onSuccess={refetch}
                variant="outline"
              />
            </div>
          </>
        )}

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Tip:</strong> Passkeys are stored on your device and can be
            synced across your devices using your platform's cloud service
            (iCloud Keychain, Google Password Manager, etc.).
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};
