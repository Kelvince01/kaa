"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import { Progress } from "@kaa/ui/components/progress";
import {
  Activity,
  Database,
  HardDrive,
  TrendingUp,
  Users,
  Wifi,
} from "lucide-react";
import { useMemberStats } from "../member.queries";

type MemberStatsProps = {
  memberId: string;
};

export function MemberStats({ memberId }: MemberStatsProps) {
  const { data, isLoading } = useMemberStats(memberId);

  if (isLoading) {
    return <div className="p-4 text-center">Loading statistics...</div>;
  }

  if (!data?.data) {
    return <div className="p-4 text-center">No statistics available</div>;
  }

  const stats = data.data;

  return (
    <div className="space-y-6">
      {/* Member Info */}
      <div>
        <h2 className="font-bold text-2xl">{stats.member.name}</h2>
        <p className="text-muted-foreground text-sm">
          Member Statistics Overview
        </p>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{stats.stats.totalUsers}</div>
            <p className="text-muted-foreground text-xs">
              {stats.stats.activeUsers} active users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">API Calls</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              {stats.stats.apiCalls.toLocaleString()}
            </div>
            <p className="text-muted-foreground text-xs">
              {stats.usage.apiCalls.percentage.toFixed(1)}% of limit
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Storage</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              {(stats.stats.storage / 1024 / 1024 / 1024).toFixed(2)} GB
            </div>
            <p className="text-muted-foreground text-xs">
              {stats.usage.storage.percentage.toFixed(1)}% of limit
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Bandwidth</CardTitle>
            <Wifi className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              {(stats.stats.bandwidth / 1024 / 1024 / 1024).toFixed(2)} GB
            </div>
            <p className="text-muted-foreground text-xs">
              {stats.usage.bandwidth.percentage.toFixed(1)}% of limit
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Usage Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Usage
            </CardTitle>
            <CardDescription>Current user count vs limit</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-medium">Users</span>
                <span className="text-muted-foreground">
                  {stats.usage.users.used} / {stats.usage.users.limit}
                </span>
              </div>
              <Progress value={stats.usage.users.percentage} />
              <p className="mt-2 text-muted-foreground text-xs">
                {stats.usage.users.percentage.toFixed(1)}% of total capacity
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              API Call Usage
            </CardTitle>
            <CardDescription>Current API calls vs limit</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-medium">API Calls</span>
                <span className="text-muted-foreground">
                  {stats.usage.apiCalls.used.toLocaleString()} /{" "}
                  {stats.usage.apiCalls.limit.toLocaleString()}
                </span>
              </div>
              <Progress value={stats.usage.apiCalls.percentage} />
              <p className="mt-2 text-muted-foreground text-xs">
                {stats.usage.apiCalls.percentage.toFixed(1)}% of monthly quota
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Storage Usage
            </CardTitle>
            <CardDescription>Current storage vs limit</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-medium">Storage</span>
                <span className="text-muted-foreground">
                  {(stats.usage.storage.used / 1024 / 1024 / 1024).toFixed(2)}{" "}
                  GB /{" "}
                  {(stats.usage.storage.limit / 1024 / 1024 / 1024).toFixed(2)}{" "}
                  GB
                </span>
              </div>
              <Progress value={stats.usage.storage.percentage} />
              <p className="mt-2 text-muted-foreground text-xs">
                {stats.usage.storage.percentage.toFixed(1)}% of storage capacity
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Bandwidth Usage
            </CardTitle>
            <CardDescription>Current bandwidth vs limit</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-medium">Bandwidth</span>
                <span className="text-muted-foreground">
                  {(stats.usage.bandwidth.used / 1024 / 1024 / 1024).toFixed(2)}{" "}
                  GB /{" "}
                  {(stats.usage.bandwidth.limit / 1024 / 1024 / 1024).toFixed(
                    2
                  )}{" "}
                  GB
                </span>
              </div>
              <Progress value={stats.usage.bandwidth.percentage} />
              <p className="mt-2 text-muted-foreground text-xs">
                {stats.usage.bandwidth.percentage.toFixed(1)}% of monthly
                bandwidth
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Limits Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Plan Limits Summary</CardTitle>
          <CardDescription>
            All resource limits for current plan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">Max Users</span>
                <span className="font-medium">{stats.limits.users}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">
                  API Calls/Month
                </span>
                <span className="font-medium">
                  {stats.limits.apiCalls.toLocaleString()}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">
                  Storage Limit
                </span>
                <span className="font-medium">
                  {(stats.limits.storage / 1024 / 1024 / 1024).toFixed(2)} GB
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">
                  Bandwidth Limit
                </span>
                <span className="font-medium">
                  {(stats.limits.bandwidth / 1024 / 1024 / 1024).toFixed(2)} GB
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
