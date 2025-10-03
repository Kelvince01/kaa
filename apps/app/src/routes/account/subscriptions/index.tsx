"use client";

import { AlertCircle, CheckCircle, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuthStore } from "@/modules/auth/auth.store";

// import { SubscriptionDetails, SubscriptionsList } from "../payments";

const SubscriptionsClient = () => {
  const { user, isLoading } = useAuthStore();
  const router = useRouter();
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState<
    string | null
  >(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Handle viewing subscription details
  const handleViewDetails = (subscriptionId: string) => {
    setSelectedSubscriptionId(subscriptionId);
  };

  // Handle back to list view
  const handleBackToList = () => {
    setSelectedSubscriptionId(null);
  };

  // Handle creating a new subscription
  const handleCreateSubscription = () => {
    router.push("/account/subscriptions/new");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
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
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Page header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="font-bold text-2xl text-gray-900">
                Recurring Payments
              </h1>
              <p className="mt-1 text-gray-500 text-sm">
                Manage your recurring payments and subscriptions
              </p>
            </div>
            {!selectedSubscriptionId && (
              <div className="mt-4 md:mt-0">
                <button
                  className="inline-flex items-center rounded-md border border-transparent bg-primary-600 px-4 py-2 font-medium text-sm text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                  onClick={handleCreateSubscription}
                  type="button"
                >
                  <Plus aria-hidden="true" className="-ml-1 mr-2 h-5 w-5" />
                  New Recurring Payment
                </button>
              </div>
            )}
          </div>
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

        {/* Main content */}
        <div className="overflow-hidden bg-white shadow sm:rounded-lg">
          {selectedSubscriptionId
            ? // <SubscriptionDetails
              //   onCancel={handleBackToList}
              //   subscriptionId={selectedSubscriptionId}
              // />
              null
            : // <SubscriptionsList onViewDetails={handleViewDetails} />
              null}
        </div>
      </div>
    </div>
  );
};

export default SubscriptionsClient;
