"use client";

import { Alert, AlertDescription } from "@kaa/ui/components/alert";
import { Badge } from "@kaa/ui/components/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import { Progress } from "@kaa/ui/components/progress";
import { cn } from "@kaa/ui/lib/utils";
import {
  Activity,
  AlertTriangle,
  Clock,
  Database,
  Loader2,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import type React from "react";
import { useSubscriptionStatus, useUsage } from "../subscriptions.queries";
import {
  calculateUsagePercentage,
  getUsageStatusColor,
} from "../subscriptions.utils";

type UsageDashboardProps = {
  className?: string;
};

type UsageMetricProps = {
  title: string;
  icon: React.ReactNode;
  current: number;
  limit?: number;
  unit: string;
  description: string;
};

function UsageMetric({
  title,
  icon,
  current,
  limit,
  unit,
  description,
}: UsageMetricProps) {
  const percentage = calculateUsagePercentage(current, limit);
  const statusColor = getUsageStatusColor(percentage);

  const isUnlimited = !limit || limit === 0;
  const isOverLimit = limit && current > limit;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2 font-medium text-sm">
            {icon}
            <span>{title}</span>
          </CardTitle>
          {isOverLimit && (
            <Badge className="text-xs" variant="destructive">
              Over Limit
            </Badge>
          )}
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-baseline space-x-2">
          <span className="font-bold text-2xl">{current.toLocaleString()}</span>
          <span className="text-muted-foreground text-sm">{unit}</span>
          {!isUnlimited && (
            <span className="text-muted-foreground text-sm">
              of {limit?.toLocaleString()} {unit}
            </span>
          )}
        </div>

        {!isUnlimited && (
          <>
            <Progress
              className={cn(
                "h-2",
                statusColor === "error" && "bg-red-100",
                statusColor === "warning" && "bg-yellow-100"
              )}
              value={percentage}
            />
            <div className="flex justify-between text-muted-foreground text-xs">
              <span>{percentage}% used</span>
              {limit && (
                <span>
                  {Math.max(0, limit - current).toLocaleString()} {unit}{" "}
                  remaining
                </span>
              )}
            </div>
          </>
        )}

        {isUnlimited && <p className="text-green-600 text-xs">Unlimited</p>}
      </CardContent>
    </Card>
  );
}

export function UsageDashboard({ className }: UsageDashboardProps) {
  const { data: usageData, isLoading, error } = useUsage();
  const { currentPlan } = useSubscriptionStatus();

  if (isLoading) {
    return (
      <div className={cn("space-y-6", className)}>
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading usage data...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("space-y-6", className)}>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Failed to load usage data. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const usage = usageData?.usage;
  const summary = usage?.summary;
  const limits = usage?.limits || {};

  if (!(usage && summary)) {
    return (
      <div className={cn("space-y-6", className)}>
        <Card>
          <CardContent className="flex items-center justify-center py-8 text-muted-foreground">
            <Activity className="mr-2 h-6 w-6" />
            No usage data available
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check for high usage warnings
  const highUsageMetrics: string[] = [];
  if (
    limits.apiCalls &&
    calculateUsagePercentage(summary.apiCalls, limits.apiCalls) >= 80
  ) {
    highUsageMetrics.push("API calls");
  }
  if (
    limits.storage &&
    calculateUsagePercentage(summary.storage, limits.storage) >= 80
  ) {
    highUsageMetrics.push("storage");
  }
  if (
    limits.users &&
    calculateUsagePercentage(summary.users, limits.users) >= 80
  ) {
    highUsageMetrics.push("users");
  }

  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="flex items-center space-x-2 font-bold text-2xl tracking-tight">
            <Activity className="h-6 w-6" />
            <span>Usage Dashboard</span>
          </h2>
          <p className="text-muted-foreground">
            Monitor your current usage and limits
          </p>
        </div>
        {currentPlan && (
          <Badge className="text-sm" variant="outline">
            {currentPlan.name} Plan
          </Badge>
        )}
      </div>

      {/* High Usage Warnings */}
      {highUsageMetrics.length > 0 && (
        <Alert className="border-yellow-500 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription>
            You're approaching the limit for {highUsageMetrics.join(", ")}.
            Consider upgrading your plan to avoid service interruptions.
          </AlertDescription>
        </Alert>
      )}

      {/* Usage Metrics Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <UsageMetric
          current={summary.apiCalls}
          description="API requests made this month"
          icon={<Zap className="h-4 w-4" />}
          limit={limits.apiCalls}
          title="API Calls"
          unit="calls"
        />

        <UsageMetric
          current={summary.storage}
          description="Data storage consumed"
          icon={<Database className="h-4 w-4" />}
          limit={limits.storage}
          title="Storage Used"
          unit="GB"
        />

        <UsageMetric
          current={summary.users}
          description="Number of active users"
          icon={<Users className="h-4 w-4" />}
          limit={limits.users}
          title="Active Users"
          unit="users"
        />

        <UsageMetric
          current={summary.bandwidth}
          description="Data transfer this month"
          icon={<TrendingUp className="h-4 w-4" />}
          limit={limits.bandwidth}
          title="Bandwidth"
          unit="GB"
        />
      </div>

      {/* Usage History Summary */}
      {usage.current && usage.current.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Recent Activity</span>
            </CardTitle>
            <CardDescription>
              Latest usage activities from your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {usage.current.slice(0, 5).map((record, index) => (
                <div
                  className="flex items-center justify-between border-b py-2 last:border-0"
                  key={index.toString()}
                >
                  <div className="flex items-center space-x-3">
                    <div className="h-2 w-2 rounded-full bg-blue-500" />
                    <div>
                      <p className="font-medium text-sm capitalize">
                        {record.type.replace("_", " ")}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {new Date(record.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-sm">
                      {record.amount.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Plan Limits Summary */}
      {currentPlan && (
        <Card>
          <CardHeader>
            <CardTitle>Plan Limits</CardTitle>
            <CardDescription>
              Your current plan includes the following limits
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {currentPlan.limits.apiCalls && (
                <div className="text-center">
                  <p className="font-bold text-2xl">
                    {currentPlan.limits.apiCalls.toLocaleString()}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    API Calls/month
                  </p>
                </div>
              )}
              {currentPlan.limits.storage && (
                <div className="text-center">
                  <p className="font-bold text-2xl">
                    {currentPlan.limits.storage}GB
                  </p>
                  <p className="text-muted-foreground text-xs">Storage</p>
                </div>
              )}
              {currentPlan.limits.users && (
                <div className="text-center">
                  <p className="font-bold text-2xl">
                    {currentPlan.limits.users}
                  </p>
                  <p className="text-muted-foreground text-xs">Users</p>
                </div>
              )}
              <div className="text-center">
                <p className="font-bold text-2xl">∞</p>
                <p className="text-muted-foreground text-xs">Support</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
