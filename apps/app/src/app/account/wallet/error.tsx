"use client";

import { Alert, AlertDescription, AlertTitle } from "@kaa/ui/components/alert";
import { Button } from "@kaa/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import { AlertCircle, Home, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Error boundary for the wallet page.
 * Catches and displays errors that occur in the wallet component tree.
 *
 * @component
 * @param {Object} props - Component props
 * @param {Error & { digest?: string }} props.error - The error that was thrown
 * @param {() => void} props.reset - Function to reset the error boundary
 * @returns {JSX.Element} The error page
 */
export default function WalletError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Wallet page error:", error);
  }, [error]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-bold text-3xl tracking-tight">Wallet</h1>
        <p className="mt-2 text-muted-foreground">
          Manage your funds, make payments, and view transaction history
        </p>
      </div>

      {/* Error Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            Something went wrong
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error Loading Wallet</AlertTitle>
            <AlertDescription>
              We encountered an error while loading your wallet. This could be
              due to a temporary connection issue or a problem with the service.
            </AlertDescription>
          </Alert>

          {/* Error Details (only show in development) */}
          {process.env.NODE_ENV === "development" && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4">
              <p className="mb-2 font-medium text-destructive text-sm">
                Error Details (Development Only):
              </p>
              <pre className="max-h-40 overflow-auto rounded bg-muted p-2 text-xs">
                {error.message}
              </pre>
              {error.digest && (
                <p className="mt-2 text-muted-foreground text-xs">
                  Error ID: {error.digest}
                </p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button className="flex-1 sm:flex-none" onClick={reset}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            <Button
              className="flex-1 sm:flex-none"
              onClick={() => router.push("/account/profile")}
              variant="outline"
            >
              <Home className="mr-2 h-4 w-4" />
              Go to Profile
            </Button>
          </div>

          {/* Help Text */}
          <div className="text-muted-foreground text-sm">
            <p className="mb-2">If the problem persists, please try:</p>
            <ul className="ml-2 list-inside list-disc space-y-1">
              <li>Refreshing the page</li>
              <li>Clearing your browser cache</li>
              <li>Checking your internet connection</li>
              <li>Contacting support if the issue continues</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
