"use client";

import { PaymentStatus } from "@kaa/models/types";
import { Button } from "@kaa/ui/components/button";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Calendar, Clock, DollarSign } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { toast } from "sonner";
import { httpClient } from "@/lib/axios";
import type { Payment } from "@/modules/payments/payment.type";
import type { Property } from "@/modules/properties/property.type";
import type { SubscriptionResponse } from "@/modules/subscriptions/subscriptions.type";
import { formatCurrency, formatDate } from "@/shared/utils/format.util";

type SubscriptionDetailsProps = {
  subscriptionId: string;
  onCancel?: () => void;
  className?: string;
};

const SubscriptionDetails: React.FC<SubscriptionDetailsProps> = ({
  subscriptionId,
  onCancel,
  className = "",
}) => {
  const queryClient = useQueryClient();
  const [isConfirmingCancel, setIsConfirmingCancel] = useState(false);
  const [cancelImmediately, setCancelImmediately] = useState(false);

  // Fetch subscription details
  const { data, isLoading, error } = useQuery({
    queryKey: ["subscription", subscriptionId],
    queryFn: async () => {
      const response = await httpClient.api.get<SubscriptionResponse>(
        `/subscriptions/${subscriptionId}`
      );
      return response.data.data.subscription;
    },
  });

  // Cancel subscription mutation
  const cancelMutation = useMutation({
    mutationFn: async () =>
      httpClient.api.post(`/subscriptions/${subscriptionId}/cancel`, {
        cancelImmediately,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["subscription", subscriptionId],
      });
      toast.success(
        cancelImmediately
          ? "Subscription cancelled immediately"
          : "Subscription will be cancelled at the end of the current billing period"
      );
      setIsConfirmingCancel(false);
    },

    onError: (error: any) => {
      toast.error(error.message || "Failed to cancel subscription");
    },
  });

  const handleCancelClick = () => {
    setIsConfirmingCancel(true);
  };

  const handleConfirmCancel = () => {
    cancelMutation.mutate();
  };

  const handleCancelConfirmation = () => {
    setIsConfirmingCancel(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <span className="rounded-full bg-green-100 px-2 py-1 text-green-800 text-xs">
            Active
          </span>
        );
      case "past_due":
        return (
          <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs text-yellow-800">
            Past Due
          </span>
        );
      case "canceled":
        return (
          <span className="rounded-full bg-red-100 px-2 py-1 text-red-800 text-xs">
            Cancelled
          </span>
        );
      case "unpaid":
        return (
          <span className="rounded-full bg-red-100 px-2 py-1 text-red-800 text-xs">
            Unpaid
          </span>
        );
      default:
        return (
          <span className="rounded-full bg-gray-100 px-2 py-1 text-gray-800 text-xs">
            {status}
          </span>
        );
    }
  };

  const getBillingCycleText = (interval: string, intervalCount: number) => {
    if (interval === "month") {
      return intervalCount === 1 ? "Monthly" : `Every ${intervalCount} months`;
    }
    if (interval === "week") {
      return intervalCount === 1 ? "Weekly" : `Every ${intervalCount} weeks`;
    }
    if (interval === "year") {
      return intervalCount === 1 ? "Yearly" : `Every ${intervalCount} years`;
    }
    return `Every ${intervalCount} ${interval}(s)`;
  };

  if (isLoading) {
    return (
      <div className="py-4 text-center">Loading subscription details...</div>
    );
  }

  if (error || !data) {
    return (
      <div className="py-4 text-center text-red-500">
        <AlertTriangle className="mr-2 inline-block" />
        Error loading subscription details
      </div>
    );
  }

  const subscription = data;
  const isCancelled = subscription.status === "canceled";
  const isActive = subscription.status === "active";

  return (
    <div className={`overflow-hidden rounded-lg border bg-white ${className}`}>
      <div className="border-b bg-gray-50 px-6 py-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-gray-900 text-lg">
            Subscription Details
          </h3>
          {getStatusBadge(subscription.status)}
        </div>
      </div>

      <div className="space-y-6 p-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-500 text-sm">Property</h4>
              <p className="mt-1 text-gray-900 text-sm">
                {(subscription.property as Property)?.title || "N/A"}
              </p>
              {(subscription.property as Property)?.location.address && (
                <p className="text-gray-500 text-sm">
                  {(subscription.property as Property).location.address.line1},{" "}
                  {(subscription.property as Property).location.address.town}
                </p>
              )}
            </div>

            <div>
              <h4 className="font-medium text-gray-500 text-sm">
                Billing Cycle
              </h4>
              <div className="mt-1 flex items-center text-gray-900 text-sm">
                <Clock className="mr-2 h-4 w-4 text-gray-400" />
                {getBillingCycleText(
                  subscription.interval,
                  subscription.intervalCount
                )}
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-500 text-sm">Amount</h4>
              <div className="mt-1 flex items-center text-gray-900 text-sm">
                <DollarSign className="mr-2 h-4 w-4 text-gray-400" />
                {formatCurrency(
                  subscription.amount / 100,
                  subscription.currency
                )}
                <span className="ml-1 text-gray-500">
                  per {subscription.interval}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-500 text-sm">Start Date</h4>
              <div className="mt-1 flex items-center text-gray-900 text-sm">
                <Calendar className="mr-2 h-4 w-4 text-gray-400" />
                {formatDate(subscription.startDate)}
              </div>
            </div>

            {subscription.endDate && (
              <div>
                <h4 className="font-medium text-gray-500 text-sm">End Date</h4>
                <div className="mt-1 flex items-center text-gray-900 text-sm">
                  <Calendar className="mr-2 h-4 w-4 text-gray-400" />
                  {formatDate(subscription.endDate)}
                </div>
              </div>
            )}

            {isActive && (
              <div>
                <h4 className="font-medium text-gray-500 text-sm">
                  Next Billing Date
                </h4>
                <div className="mt-1 flex items-center text-gray-900 text-sm">
                  <Calendar className="mr-2 h-4 w-4 text-gray-400" />
                  {formatDate(subscription.nextBillingDate as string)}
                </div>
              </div>
            )}

            {subscription.canceledAt && (
              <div>
                <h4 className="font-medium text-gray-500 text-sm">
                  Cancelled On
                </h4>
                <div className="mt-1 flex items-center text-gray-900 text-sm">
                  <Calendar className="mr-2 h-4 w-4 text-gray-400" />
                  {formatDate(subscription.canceledAt)}
                </div>
              </div>
            )}
          </div>
        </div>

        {subscription.payments && subscription.payments.length > 0 && (
          <div className="mt-6">
            <h4 className="mb-3 font-medium text-gray-500 text-sm">
              Recent Payments
            </h4>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      className="px-4 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider"
                      scope="col"
                    >
                      Date
                    </th>
                    <th
                      className="px-4 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider"
                      scope="col"
                    >
                      Amount
                    </th>
                    <th
                      className="px-4 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider"
                      scope="col"
                    >
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {subscription.payments.map((payment: Payment) => (
                    <tr key={payment.id}>
                      <td className="whitespace-nowrap px-4 py-2 text-gray-900 text-sm">
                        {formatDate(payment.createdAt)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2 text-gray-900 text-sm">
                        {formatCurrency(payment.amount / 100, payment.currency)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2">
                        <span
                          className={`inline-flex rounded-full px-2 font-semibold text-xs leading-5 ${
                            payment.status === PaymentStatus.COMPLETED
                              ? "bg-green-100 text-green-800"
                              : payment.status === PaymentStatus.FAILED
                                ? "bg-red-100 text-red-800"
                                : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {payment.status.charAt(0).toUpperCase() +
                            payment.status.slice(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-3 border-t pt-4">
          {isConfirmingCancel ? (
            <div className="w-full space-y-4">
              <div className="border-yellow-400 border-l-4 bg-yellow-50 p-4">
                <div className="flex">
                  <div className="shrink-0">
                    <AlertTriangle className="h-5 w-5 text-yellow-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                      Are you sure you want to cancel this subscription?
                    </p>
                  </div>
                </div>
              </div>

              <div className="mb-4 flex items-center">
                <input
                  checked={cancelImmediately}
                  className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  id="cancelImmediately"
                  name="cancelImmediately"
                  onChange={(e) => setCancelImmediately(e.target.checked)}
                  type="checkbox"
                />
                <label
                  className="ml-2 block text-gray-900 text-sm"
                  htmlFor="cancelImmediately"
                >
                  Cancel immediately (otherwise will end at current billing
                  period)
                </label>
              </div>

              <div className="flex justify-end space-x-3">
                <Button
                  disabled={cancelMutation.isPending}
                  onClick={handleCancelConfirmation}
                  variant="outline"
                >
                  No, Keep Subscription
                </Button>
                <Button
                  onClick={handleConfirmCancel}
                  variant="destructive"
                  // loading={cancelMutation.isPending}
                >
                  Yes, Cancel Subscription
                </Button>
              </div>
            </div>
          ) : (
            <>
              {onCancel && (
                <Button onClick={onCancel} variant="outline">
                  Back
                </Button>
              )}

              {isActive && (
                <Button onClick={handleCancelClick} variant="destructive">
                  Cancel Subscription
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubscriptionDetails;
