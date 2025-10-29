"use client";

import { Button } from "@kaa/ui/components/button";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Calendar, DollarSign } from "lucide-react";
import Link from "next/link";
import type React from "react";
import { httpClient } from "@/lib/axios";
import type { Subscription } from "@/modules/subscriptions/subscriptions.type";
import { formatCurrency, formatDate } from "@/shared/utils/format.util";

type SubscriptionsListResponse = {
  subscriptions: Subscription[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
};

type SubscriptionsListProps = {
  propertyId?: string;
  limit?: number;
  onViewDetails?: (subscriptionId: string) => void;
  className?: string;
};

const SubscriptionsList: React.FC<SubscriptionsListProps> = ({
  propertyId,
  limit = 10,
  onViewDetails,
  className = "",
}) => {
  // Fetch subscriptions
  const { data, isLoading, error } = useQuery({
    queryKey: ["subscriptions", propertyId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (propertyId) params.append("propertyId", propertyId);
      params.append("limit", limit.toString());

      const response = await httpClient.api.get<SubscriptionsListResponse>(
        `/subscriptions?${params.toString()}`
      );
      return response;
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "past_due":
        return "bg-yellow-100 text-yellow-800";
      case "canceled":
        return "bg-red-100 text-red-800";
      case "unpaid":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
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
    return <div className="py-4 text-center">Loading subscriptions...</div>;
  }

  if (error) {
    return (
      <div className="py-4 text-center text-red-500">
        <AlertTriangle className="mr-2 inline-block" />
        Error loading subscriptions
      </div>
    );
  }

  const { subscriptions = [] } = (data?.data as any) || ({} as any);

  if (subscriptions.length === 0) {
    return (
      <div className="rounded-lg border bg-white py-8 text-center">
        <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 font-medium text-gray-900 text-sm">
          No recurring payments
        </h3>
        <p className="mt-1 text-gray-500 text-sm">
          You don't have any active recurring payments set up.
        </p>
        <div className="mt-6">
          <Link href="/account/subscriptions/new">
            <Button variant="default">Set Up Recurring Payment</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {subscriptions.map((subscription: Subscription | any) => (
        <div
          className="overflow-hidden rounded-lg border bg-white transition-shadow hover:shadow-md"
          key={subscription._id}
        >
          <div className="flex items-center justify-between border-b px-6 py-4">
            <div className="flex items-center">
              <DollarSign className="mr-2 text-gray-400" />
              <h3 className="font-medium text-gray-900 text-lg">
                {/* TODO: Type property */}
                {(subscription.property as any)?.title || "Recurring Payment"}
              </h3>
            </div>
            <span
              className={`rounded-full px-2 py-1 text-xs ${getStatusColor(subscription.status)}`}
            >
              {subscription.status.charAt(0).toUpperCase() +
                subscription.status.slice(1)}
            </span>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <h4 className="font-medium text-gray-500 text-xs">Amount</h4>
                <p className="mt-1 font-medium text-gray-900 text-sm">
                  {formatCurrency(
                    subscription.amount / 100,
                    subscription.currency
                  )}
                </p>
              </div>

              <div>
                <h4 className="font-medium text-gray-500 text-xs">
                  Billing Cycle
                </h4>
                <p className="mt-1 text-gray-900 text-sm">
                  {getBillingCycleText(
                    subscription.interval,
                    subscription.intervalCount
                  )}
                </p>
              </div>

              {subscription.status === "active" && (
                <div>
                  <h4 className="font-medium text-gray-500 text-xs">
                    Next Payment
                  </h4>
                  <p className="mt-1 flex items-center text-gray-900 text-sm">
                    <Calendar className="mr-1 text-gray-400" />
                    {formatDate(subscription.nextBillingDate as string)}
                  </p>
                </div>
              )}

              {subscription.status === "canceled" &&
                subscription.canceledAt && (
                  <div>
                    <h4 className="font-medium text-gray-500 text-xs">
                      Cancelled On
                    </h4>
                    <p className="mt-1 flex items-center text-gray-900 text-sm">
                      <Calendar className="mr-1 text-gray-400" />
                      {formatDate(subscription.canceledAt)}
                    </p>
                  </div>
                )}
            </div>

            <div className="mt-6 flex justify-end">
              <Button
                onClick={() => onViewDetails?.(subscription._id)}
                size="sm"
                variant="outline"
              >
                View Details
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SubscriptionsList;
