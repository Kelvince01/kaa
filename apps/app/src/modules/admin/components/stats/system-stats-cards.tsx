"use client";

import { Badge } from "@kaa/ui/components/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import { Skeleton } from "@kaa/ui/components/skeleton";
import { Building, Calendar, TrendingUp, Users } from "lucide-react";
import { useSystemStats } from "../../admin.queries";

export function SystemStatsCards() {
  const { data: stats, isLoading, error } = useSystemStats();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i.toString()}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="mb-2 h-8 w-16" />
              <Skeleton className="h-3 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="py-8 text-center">
        <p className="text-muted-foreground">
          Failed to load system statistics
        </p>
      </div>
    );
  }

  const cards = [
    {
      title: "Total Users",
      value: stats?.stats?.users?.total,
      description: `${stats?.stats?.users?.landlords} landlords, ${stats?.stats?.users?.tenants} tenants`,
      icon: Users,
      trend: "+12% from last month",
    },
    {
      title: "Properties",
      value: stats?.stats?.properties?.total,
      description: `${stats?.stats?.properties?.active} active, ${stats?.stats?.properties?.let} let`,
      icon: Building,
      trend: "+8% from last month",
    },
    {
      title: "Bookings",
      value: stats?.stats?.bookings?.total,
      description: `${stats?.stats?.bookings?.pending} pending approval`,
      icon: Calendar,
      trend: "+23% from last month",
    },
    {
      title: "Growth Rate",
      value: "15.2%",
      description: "Monthly active users",
      icon: TrendingUp,
      trend: "+2.4% from last month",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card key={index.toString()}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="font-medium text-muted-foreground text-sm">
                {card.title}
              </CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="font-bold text-2xl">{card.value}</div>
              <p className="mt-1 text-muted-foreground text-xs">
                {card.description}
              </p>
              <Badge className="mt-2 text-xs" variant="secondary">
                {card.trend}
                {/* 
								{trend && (
												<p className={`text-sm ${trend > 0 ? "text-green-600" : "text-red-600"} flex items-center`}>
													{trend > 0 ? (
														<TrendingUp className="mr-1" />
													) : (
														<TrendingUp className="mr-1 rotate-180 transform" />
													)}
													{Math.abs(trend)}% {trend > 0 ? "increase" : "decrease"} from last month
												</p>
											)}
								*/}
              </Badge>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
