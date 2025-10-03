"use client";

import { AlertCircle, ArrowLeft, CheckCircle } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
// import { SubscriptionForm } from "@/modules/subscriptions";
import { useAuthStore } from "@/modules/auth/auth.store";

const NewSubscriptionClient = () => {
  const { user, isLoading } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [propertyId, setPropertyId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Get propertyId from URL parameters
  useEffect(() => {
    const id = searchParams.get("propertyId");
    if (id) {
      setErrorMessage(
        "Property ID is required. Please select a property first."
      );
    } else {
      setPropertyId(id);
    }
  }, [searchParams]);

  // Handle subscription creation success
  const handleSuccess = (subscriptionId: string) => {
    setSuccessMessage("Recurring payment set up successfully!");

    // Redirect to subscription details after a short delay
    setTimeout(() => {
      router.push(`/account/subscriptions?id=${subscriptionId}`);
    }, 2000);
  };

  // Handle subscription creation error
  const handleError = (error: string) => {
    setErrorMessage(
      error || "Failed to set up recurring payment. Please try again."
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-gray-500">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    router.push("/accounts/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        {/* Page header */}
        <div className="mb-8">
          <div className="flex items-center">
            <Link
              className="mr-4 flex items-center text-primary-600 hover:text-primary-700"
              href="/account/subscriptions"
            >
              <ArrowLeft className="mr-1 h-5 w-5" />
              <span>Back to Recurring Payments</span>
            </Link>
          </div>
          <h1 className="mt-4 font-bold text-2xl text-gray-900">
            Set Up Recurring Payment
          </h1>
          <p className="mt-1 text-gray-500 text-sm">
            Create a new recurring payment for your rental property
          </p>
        </div>

        {/* Success and error messages */}
        {successMessage && (
          <div className="mb-4 rounded-md bg-green-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <CheckCircle
                  aria-hidden="true"
                  className="h-5 w-5 text-green-400"
                />
              </div>
              <div className="ml-3">
                <p className="font-medium text-green-800 text-sm">
                  {successMessage}
                </p>
              </div>
              <div className="ml-auto pl-3">
                <div className="-mx-1.5 -my-1.5">
                  <button
                    className="inline-flex rounded-md bg-green-50 p-1.5 text-green-500 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2 focus:ring-offset-green-50"
                    onClick={() => setSuccessMessage(null)}
                    type="button"
                  >
                    <span className="sr-only">Dismiss</span>
                    <svg
                      aria-hidden="true"
                      className="h-5 w-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="mb-4 rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle
                  aria-hidden="true"
                  className="h-5 w-5 text-red-400"
                />
              </div>
              <div className="ml-3">
                <p className="font-medium text-red-800 text-sm">
                  {errorMessage}
                </p>
              </div>
              <div className="ml-auto pl-3">
                <div className="-mx-1.5 -my-1.5">
                  <button
                    className="inline-flex rounded-md bg-red-50 p-1.5 text-red-500 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 focus:ring-offset-red-50"
                    onClick={() => setErrorMessage(null)}
                    type="button"
                  >
                    <span className="sr-only">Dismiss</span>
                    <svg
                      aria-hidden="true"
                      className="h-5 w-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Subscription form */}
        <div className="overflow-hidden bg-white shadow sm:rounded-lg">
          {propertyId ? // <SubscriptionForm
          // 	propertyId={propertyId}
          // 	onSuccess={handleSuccess}
          // 	onError={handleError}
          // />

          null : (
            <div className="p-6 text-center">
              <p className="mb-4 text-red-600">
                <AlertCircle className="mr-2 inline-block h-5 w-5" />
                Property ID is missing
              </p>
              <p className="mb-4">
                Please select a property to set up a recurring payment for.
              </p>
              <Link
                className="inline-flex items-center rounded-md border border-transparent bg-primary-600 px-4 py-2 font-medium text-sm text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                href="/properties"
              >
                Select a Property
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewSubscriptionClient;
