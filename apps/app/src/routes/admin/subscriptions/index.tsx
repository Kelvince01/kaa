"use client";

import { Badge } from "@kaa/ui/components/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@kaa/ui/components/tabs";
import { cn } from "@kaa/ui/lib/utils";
import {
  Activity,
  CreditCard,
  Crown,
  Receipt,
  Settings,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";
import {
  InvoiceHistory,
  PaymentMethods,
  PricingPlans,
  SubscriptionStatus,
  UsageDashboard,
} from "@/modules/subscriptions";
import { useSubscriptionStatus } from "@/modules/subscriptions/subscriptions.queries";

type SubscriptionManagementProps = {
  className?: string;
  defaultTab?: string;
};

export default function SubscriptionManagement({
  className,
  defaultTab = "overview",
}: SubscriptionManagementProps) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const { subscription, currentPlan } = useSubscriptionStatus();
  const currentSubscription = subscription;

  const getSubscriptionStatusBadge = () => {
    if (!currentSubscription) return null;

    const status = currentSubscription.status;
    let variant: "default" | "secondary" | "destructive" | "outline" =
      "outline";

    switch (status) {
      case "active":
        variant = "default";
        break;
      case "trialing":
        variant = "secondary";
        break;
      case "past_due":
      case "canceled":
        variant = "destructive";
        break;
      default:
        variant = "outline";
    }

    return (
      <Badge className="capitalize" variant={variant}>
        {status}
      </Badge>
    );
  };

  return (
    <div className={cn("mx-auto max-w-7xl space-y-6 p-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center space-x-3 font-bold text-3xl tracking-tight">
            <Crown className="h-8 w-8" />
            <span>Subscription Management</span>
          </h1>
          <p className="mt-2 text-muted-foreground">
            Manage your subscription, billing, and usage
          </p>
        </div>

        {/* Current Plan Info */}
        {currentPlan && (
          <div className="text-right">
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-lg">
                {currentPlan.name} Plan
              </span>
              {getSubscriptionStatusBadge()}
            </div>
            <p className="text-muted-foreground text-sm">
              {currentPlan.price.monthly > 0
                ? `$${currentPlan.price.monthly}/${currentPlan.price.interval}`
                : "Free plan"}
            </p>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <Tabs
        className="space-y-6"
        onValueChange={setActiveTab}
        value={activeTab}
      >
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger className="flex items-center space-x-2" value="overview">
            <Settings className="h-4 w-4" />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger className="flex items-center space-x-2" value="usage">
            <Activity className="h-4 w-4" />
            <span>Usage</span>
          </TabsTrigger>
          <TabsTrigger className="flex items-center space-x-2" value="plans">
            <Crown className="h-4 w-4" />
            <span>Plans</span>
          </TabsTrigger>
          <TabsTrigger className="flex items-center space-x-2" value="billing">
            <Receipt className="h-4 w-4" />
            <span>Billing</span>
          </TabsTrigger>
          <TabsTrigger className="flex items-center space-x-2" value="payment">
            <CreditCard className="h-4 w-4" />
            <span>Payment</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent className="space-y-6" value="overview">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Subscription Status */}
            <div className="lg:col-span-2">
              <SubscriptionStatus />
            </div>

            {/* Quick Stats */}
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center space-x-2 text-base">
                    <TrendingUp className="h-4 w-4" />
                    <span>Quick Stats</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">Plan</span>
                    <span className="font-medium">
                      {currentPlan?.name || "No active plan"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">
                      Status
                    </span>
                    {getSubscriptionStatusBadge() || (
                      <span className="text-muted-foreground text-sm">
                        No subscription
                      </span>
                    )}
                  </div>
                  {/* {currentSubscription?.trialEnd && (
										<div className="flex justify-between">
											<span className="text-muted-foreground text-sm">Trial Ends</span>
											<span className="font-medium text-sm">
												{new Date(currentSubscription.trialEnd).toLocaleDateString()}
											</span>
										</div>
									)}
									{currentSubscription?.currentPeriodEnd && (
										<div className="flex justify-between">
											<span className="text-muted-foreground text-sm">Next Billing</span>
											<span className="font-medium text-sm">
												{new Date(currentSubscription.currentPeriodEnd).toLocaleDateString()}
											</span>
										</div>
									)} */}
                </CardContent>
              </Card>

              {!currentSubscription && (
                <Card>
                  <CardContent className="py-6 text-center">
                    <Crown className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                    <h3 className="mb-1 font-medium">No Active Subscription</h3>
                    <p className="mb-4 text-muted-foreground text-sm">
                      Choose a plan to get started
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Usage Tab */}
        <TabsContent className="space-y-6" value="usage">
          <UsageDashboard />
        </TabsContent>

        {/* Plans Tab */}
        <TabsContent className="space-y-6" value="plans">
          <Card>
            <CardHeader>
              <CardTitle>Available Plans</CardTitle>
              <CardDescription>
                Choose the plan that best fits your needs. You can upgrade or
                downgrade at any time.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PricingPlans />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent className="space-y-6" value="billing">
          <InvoiceHistory />
        </TabsContent>

        {/* Payment Tab */}
        <TabsContent className="space-y-6" value="payment">
          <PaymentMethods />
        </TabsContent>
      </Tabs>
    </div>
  );
}
