"use client";

import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import { Label } from "@kaa/ui/components/label";
import { Switch } from "@kaa/ui/components/switch";
import { cn } from "@kaa/ui/lib/utils";
import { Check, Loader2, Star } from "lucide-react";
import { useState } from "react";
import {
  useCreateSubscription,
  useSubscriptionPlans,
} from "../subscriptions.queries";
import type { PlanInterval, SubscriptionPlan } from "../subscriptions.type";
import {
  formatCurrency,
  getAnnualSavings,
  getPlanPrice,
  getSavingsPercentage,
  sortPlansByPrice,
} from "../subscriptions.utils";

type PricingPlansProps = {
  className?: string;
  showTrialInfo?: boolean;
  onPlanSelect?: (plan: SubscriptionPlan, interval: PlanInterval) => void;
  defaultInterval?: PlanInterval;
};

export function PricingPlans({
  className,
  showTrialInfo = true,
  onPlanSelect,
  defaultInterval = "monthly",
}: PricingPlansProps) {
  const [billingInterval, setBillingInterval] =
    useState<PlanInterval>(defaultInterval);
  const { data: plansData, isLoading } = useSubscriptionPlans();
  const { mutate: createSubscription, isPending: isCreating } =
    useCreateSubscription();

  const plans = plansData?.plans
    ? sortPlansByPrice(plansData.plans, billingInterval)
    : [];

  const handlePlanSelect = (plan: SubscriptionPlan) => {
    if (onPlanSelect) {
      onPlanSelect(plan, billingInterval);
    } else {
      // Default behavior: create subscription
      createSubscription({
        plan: plan.type,
        interval: billingInterval,
        trialDays: plan.trialDays,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!plans.length) {
    return (
      <div className="py-8 text-center">
        <p className="text-muted-foreground">No pricing plans available</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-8", className)}>
      {/* Billing Toggle */}
      <div className="flex items-center justify-center space-x-4">
        <Label
          className={cn(billingInterval === "monthly" && "font-semibold")}
          htmlFor="billing-toggle"
        >
          Monthly
        </Label>
        <Switch
          checked={billingInterval === "yearly"}
          id="billing-toggle"
          onCheckedChange={(checked) =>
            setBillingInterval(checked ? "yearly" : "monthly")
          }
        />
        <Label
          className={cn(billingInterval === "yearly" && "font-semibold")}
          htmlFor="billing-toggle"
        >
          Yearly
          <Badge className="ml-2" variant="secondary">
            Save up to 20%
          </Badge>
        </Label>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {plans.map((plan) => {
          const price = getPlanPrice(plan, billingInterval);
          const savings =
            billingInterval === "yearly" ? getAnnualSavings(plan) : 0;
          const savingsPercentage =
            billingInterval === "yearly" ? getSavingsPercentage(plan) : 0;
          const isPopular = plan.isPopular;
          const isFree = price === 0;

          return (
            <Card
              className={cn(
                "relative",
                isPopular &&
                  "scale-105 border-primary shadow-lg ring-1 ring-primary"
              )}
              key={plan.id}
            >
              {isPopular && (
                <div className="-top-3 -translate-x-1/2 absolute left-1/2 transform">
                  <Badge className="bg-primary text-primary-foreground">
                    <Star className="mr-1 h-3 w-3" />
                    Most Popular
                  </Badge>
                </div>
              )}

              <CardHeader className="pb-4">
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription className="text-sm">
                  {plan.description}
                </CardDescription>

                <div className="pt-4">
                  <div className="flex items-baseline space-x-2">
                    <span className="font-bold text-3xl">
                      {isFree ? "Free" : formatCurrency(price)}
                    </span>
                    {!isFree && (
                      <span className="text-muted-foreground">
                        /{billingInterval === "monthly" ? "month" : "year"}
                      </span>
                    )}
                  </div>

                  {billingInterval === "yearly" && !isFree && savings > 0 && (
                    <p className="mt-1 text-green-600 text-sm">
                      Save {formatCurrency(savings)} ({savingsPercentage}% off)
                    </p>
                  )}

                  {billingInterval === "monthly" && !isFree && (
                    <p className="mt-1 text-muted-foreground text-xs">
                      {formatCurrency(plan.price.yearly)} billed yearly
                    </p>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Features List */}
                <ul className="space-y-2">
                  {plan.features.slice(0, 6).map((feature, index) => (
                    <li
                      className="flex items-center space-x-2"
                      key={index.toString()}
                    >
                      <Check className="h-4 w-4 flex-shrink-0 text-green-500" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                  {plan.features.length > 6 && (
                    <li className="text-muted-foreground text-xs">
                      +{plan.features.length - 6} more features
                    </li>
                  )}
                </ul>

                {/* Limits Display */}
                {(plan.limits.users ||
                  plan.limits.storage ||
                  plan.limits.apiCalls) && (
                  <div className="space-y-1 pt-2">
                    {plan.limits.users && (
                      <p className="text-muted-foreground text-xs">
                        Up to {plan.limits.users} users
                      </p>
                    )}
                    {plan.limits.storage && (
                      <p className="text-muted-foreground text-xs">
                        {plan.limits.storage}GB storage
                      </p>
                    )}
                    {plan.limits.apiCalls && (
                      <p className="text-muted-foreground text-xs">
                        {plan.limits.apiCalls.toLocaleString()} API calls/month
                      </p>
                    )}
                  </div>
                )}

                {/* CTA Button */}
                <Button
                  className="w-full"
                  disabled={isCreating}
                  onClick={() => handlePlanSelect(plan)}
                  variant={isPopular ? "default" : "outline"}
                >
                  {isCreating ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  {isFree ? "Get Started" : "Choose Plan"}
                </Button>

                {/* Trial Info */}
                {showTrialInfo &&
                  plan.trialDays &&
                  plan.trialDays > 0 &&
                  !isFree && (
                    <p className="text-center text-muted-foreground text-xs">
                      {plan.trialDays}-day free trial included
                    </p>
                  )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Additional Info */}
      <div className="space-y-2 text-center">
        <p className="text-muted-foreground text-sm">
          All plans include 24/7 support and a 30-day money-back guarantee
        </p>
        <p className="text-muted-foreground text-xs">
          Prices shown in USD. Taxes may apply based on your location.
        </p>
      </div>
    </div>
  );
}
