"use client";

import { Alert, AlertDescription } from "@kaa/ui/components/alert";
import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import { cn } from "@kaa/ui/lib/utils";
import {
  AlertTriangle,
  Calendar,
  CheckCircle,
  Clock,
  CreditCard,
  Loader2,
  XCircle,
} from "lucide-react";
import {
  useCancelSubscription,
  useSubscriptionStatus,
} from "../subscriptions.queries";
import {
  formatDate,
  formatRelativeDate,
  getDaysUntilTrialEnd,
  getSubscriptionStatusInfo,
  subscriptionNeedsPayment,
} from "../subscriptions.utils";

type SubscriptionStatusProps = {
  className?: string;
  showUpgradeButton?: boolean;
  onUpgrade?: () => void;
};

export function SubscriptionStatus({
  className,
  showUpgradeButton = true,
  onUpgrade,
}: SubscriptionStatusProps) {
  const {
    subscription,
    currentPlan,
    isActive,
    isTrialing,
    isCanceled,
    isPastDue,
    isTrialExpiring,
    isLoading,
  } = useSubscriptionStatus();

  const { mutate: cancelSubscription, isPending: isCanceling } =
    useCancelSubscription();

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Loading subscription...</span>
        </CardContent>
      </Card>
    );
  }

  if (!(subscription && currentPlan)) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>No Active Subscription</CardTitle>
          <CardDescription>
            You don't have an active subscription. Choose a plan to get started.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {showUpgradeButton && (
            <Button className="w-full" onClick={onUpgrade}>
              View Plans
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  const statusInfo = getSubscriptionStatusInfo(subscription.status);
  const daysUntilTrialEnd = getDaysUntilTrialEnd(subscription);
  const nextBillingDate = subscription.endDate
    ? new Date(subscription.endDate)
    : null;

  const getStatusIcon = () => {
    switch (subscription.status) {
      case "active":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "trialing":
        return <Clock className="h-5 w-5 text-blue-500" />;
      case "past_due":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case "canceled":
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              {getStatusIcon()}
              <span>Current Subscription</span>
            </CardTitle>
            <CardDescription>{statusInfo.description}</CardDescription>
          </div>
          <Badge
            variant={
              statusInfo.color === "success"
                ? "default"
                : statusInfo.color === "warning"
                  ? "secondary"
                  : "destructive"
            }
          >
            {statusInfo.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Plan Information */}
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-lg">{currentPlan.name} Plan</h3>
            <p className="text-muted-foreground text-sm">
              {currentPlan.description}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="font-medium text-sm">Plan Type</p>
              <p className="text-muted-foreground capitalize">
                {subscription.plan}
              </p>
            </div>
            <div>
              <p className="font-medium text-sm">Status</p>
              <p className="text-muted-foreground">{statusInfo.label}</p>
            </div>
          </div>
        </div>

        {/* Trial Information */}
        {isTrialing && daysUntilTrialEnd !== null && (
          <Alert
            className={cn(isTrialExpiring && "border-yellow-500 bg-yellow-50")}
          >
            <Clock className="h-4 w-4" />
            <AlertDescription>
              {daysUntilTrialEnd > 0 ? (
                <>
                  Your trial ends in <strong>{daysUntilTrialEnd} days</strong>
                  {isTrialExpiring &&
                    " - consider upgrading to avoid interruption"}
                </>
              ) : (
                "Your trial has ended"
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Past Due Warning */}
        {isPastDue && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Your payment is past due. Please update your payment method to
              continue using our services.
            </AlertDescription>
          </Alert>
        )}

        {/* Billing Information */}
        {isActive && nextBillingDate && (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-sm">Next billing date</span>
            </div>
            <p className="ml-6 text-muted-foreground text-sm">
              {formatDate(subscription.endDate)} (
              {formatRelativeDate(subscription.endDate)})
            </p>
          </div>
        )}

        {/* Canceled Information */}
        {isCanceled && subscription.canceledAt && (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <XCircle className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-sm">Canceled on</span>
            </div>
            <p className="ml-6 text-muted-foreground text-sm">
              {formatDate(subscription.canceledAt)}
            </p>
            {nextBillingDate && nextBillingDate > new Date() && (
              <p className="ml-6 text-muted-foreground text-sm">
                Access until {formatDate(subscription.endDate)}
              </p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 sm:flex-row">
          {showUpgradeButton && !isCanceled && (
            <Button className="flex-1" onClick={onUpgrade} variant="outline">
              {currentPlan.type === "free" ? "Upgrade Plan" : "Change Plan"}
            </Button>
          )}

          {isActive && !isCanceled && (
            <Button
              className="flex-1 text-red-600 hover:bg-red-50 hover:text-red-700"
              disabled={isCanceling}
              onClick={() => cancelSubscription()}
              size="sm"
              variant="ghost"
            >
              {isCanceling ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Canceling...
                </>
              ) : (
                "Cancel Subscription"
              )}
            </Button>
          )}

          {subscriptionNeedsPayment(subscription) && (
            <Button className="flex-1">
              <CreditCard className="mr-2 h-4 w-4" />
              Update Payment
            </Button>
          )}
        </div>

        {/* Features Summary */}
        {currentPlan.features.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Included Features</h4>
            <div className="grid grid-cols-2 gap-1">
              {currentPlan.features.slice(0, 6).map((feature, index) => (
                <div
                  className="flex items-center text-muted-foreground text-xs"
                  key={index.toString()}
                >
                  <CheckCircle className="mr-1 h-3 w-3 text-green-500" />
                  {feature}
                </div>
              ))}
              {currentPlan.features.length > 6 && (
                <div className="text-muted-foreground text-xs">
                  +{currentPlan.features.length - 6} more
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
