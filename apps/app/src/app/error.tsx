"use client";

import { Button } from "@kaa/ui/components/button";
import { AlertCircle, Home, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    // biome-ignore lint/suspicious/noConsole: <explanation>
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-16">
      <div className="max-w-lg text-center">
        <AlertCircle className="mx-auto h-16 w-16 text-red-500" />
        <h1 className="mt-4 font-bold text-3xl text-gray-900">
          Something went wrong
        </h1>
        <p className="mt-6 text-base text-gray-600">
          We apologize for the inconvenience. An unexpected error has occurred.
          Our team has been notified.
        </p>
        {error.message && process.env.NODE_ENV !== "production" && (
          <div className="mt-6 rounded-md border border-red-200 bg-red-50 p-4">
            <p className="font-mono text-red-800 text-sm">{error.message}</p>
          </div>
        )}
        <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
          <Button onClick={reset} type="button">
            <RefreshCw className="mr-2" />
            Try again
          </Button>
          <Link href="/">
            <Button variant={"outline"}>
              <Home className="mr-2" />
              Go back home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
