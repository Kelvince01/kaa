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
  Info,
  Key,
  Laptop,
  Loader2,
  Shield,
  Smartphone,
  Trash2,
} from "lucide-react";
import { PasskeyEnrollButton } from "@/modules/auth/passkey/components/passkey-enroll-button";
import {
  useDeletePasskey,
  useListPasskeys,
} from "@/modules/auth/passkey/passkey.queries";
import { useAuth } from "@/modules/auth/use-auth";

export default function PasskeySecurity() {
  const { user } = useAuth();
  const { data, isLoading, error, refetch } = useListPasskeys(user?.id || "");
  const deletePasskey = useDeletePasskey();

  const handleDelete = async (passkeyId: string) => {
    try {
      await deletePasskey.mutateAsync(passkeyId);
      refetch();
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

  const passkeys = data?.passkeys || [];

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Fingerprint className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 text-lg">
            Passkey Authentication
          </h3>
          <p className="text-gray-600 text-sm">
            Secure, passwordless authentication for your account
          </p>
        </div>
      </div>

      {/* Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Passkeys are a secure, passwordless way to sign in to your account.
          They use your device's built-in security features like Face ID, Touch
          ID, or Windows Hello.
        </AlertDescription>
      </Alert>

      {/* Main Passkey Management Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Your Passkeys ({passkeys.length})
              </CardTitle>
              <CardDescription>
                Manage passkeys for secure, passwordless access to your account
              </CardDescription>
            </div>
            {passkeys.length > 0 && (
              <PasskeyEnrollButton
                onSuccess={refetch}
                size="sm"
                variant="outline"
              />
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Failed to load passkeys. Please try again.
              </AlertDescription>
            </Alert>
          ) : passkeys.length === 0 ? (
            <div className="space-y-6 py-8 text-center">
              <div className="flex flex-col items-center text-muted-foreground">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                  <Fingerprint className="h-8 w-8 opacity-50" />
                </div>
                <h4 className="mb-2 font-medium text-gray-900 text-lg">
                  No passkeys yet
                </h4>
                <p className="max-w-sm text-sm">
                  Create your first passkey to enable secure, passwordless
                  sign-in to your account.
                </p>
              </div>
              <PasskeyEnrollButton
                className="w-full sm:w-auto"
                onSuccess={refetch}
                variant="default"
              />
            </div>
          ) : (
            <div className="space-y-3">
              {passkeys.map((passkey) => (
                <div
                  className="flex items-center justify-between rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50"
                  key={passkey.id}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                      {getDeviceIcon(passkey.credentialDeviceType)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">
                          {passkey.name}
                        </span>
                        {passkey.credentialBackedUp && (
                          <Badge className="text-xs" variant="outline">
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Synced
                          </Badge>
                        )}
                      </div>
                      <div className="text-gray-500 text-sm">
                        <span>
                          Created{" "}
                          {formatDistanceToNow(new Date(passkey.createdAt), {
                            addSuffix: true,
                          })}
                        </span>
                        {passkey.lastUsed && (
                          <span className="ml-2">
                            • Last used{" "}
                            {formatDistanceToNow(new Date(passkey.lastUsed), {
                              addSuffix: true,
                            })}
                          </span>
                        )}
                      </div>
                      <div className="mt-1 text-gray-400 text-xs">
                        Device type: {passkey.credentialDeviceType}
                      </div>
                    </div>
                  </div>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
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
                          won't be able to use it to sign in anymore. This
                          action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          onClick={() => handleDelete(passkey.id)}
                        >
                          Delete Passkey
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Benefits Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Why Use Passkeys?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">More Secure</h4>
                <p className="text-gray-600 text-sm">
                  Can't be phished, stolen, or guessed like passwords
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
                <Fingerprint className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Faster Login</h4>
                <p className="text-gray-600 text-sm">
                  Sign in with just your fingerprint, face, or device PIN
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100">
                <Smartphone className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Cross-Device</h4>
                <p className="text-gray-600 text-sm">
                  Works across all your devices with sync enabled
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-100">
                <Key className="h-4 w-4 text-yellow-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">No Passwords</h4>
                <p className="text-gray-600 text-sm">
                  Never worry about forgotten or leaked passwords
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Help Section */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Tip:</strong> Passkeys are stored on your device and can be
          synced across your devices using your platform's cloud service (iCloud
          Keychain, Google Password Manager, etc.). They work with Face ID,
          Touch ID, Windows Hello, and other biometric authentication methods.
        </AlertDescription>
      </Alert>
    </div>
  );
}
