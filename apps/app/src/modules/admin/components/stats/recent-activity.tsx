"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarInitials,
} from "@kaa/ui/components/avatar";
import { Badge } from "@kaa/ui/components/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import { Skeleton } from "@kaa/ui/components/skeleton";
import { formatDistanceToNow } from "date-fns";
import type { SystemStats } from "../../admin.type";

export function RecentActivity({
  stats,
  isLoading,
}: {
  stats: SystemStats | undefined;
  isLoading: boolean;
}) {
  const recentUsers = stats?.recentUsers || [];
  const recentProperties = stats?.recentProperties || [];
  const recentBookings = stats?.recentBookings || [];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i.toString()}>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: 3 }).map((_, j) => (
                <div className="flex items-center space-x-3" key={j.toString()}>
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const getInitials = (firstName: string, lastName: string) =>
    `${firstName.charAt(0)}${lastName.charAt(0)}`;

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      "default" | "secondary" | "destructive" | "outline"
    > = {
      active: "default",
      pending: "secondary",
      let: "default",
      inactive: "destructive",
    };
    return variants[status] || "outline";
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Recent Users */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Users</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {recentUsers.map((user, index) => (
            <div className="flex items-center space-x-3" key={index.toString()}>
              <Avatar className="h-8 w-8">
                <AvatarFallback>
                  <AvatarInitials>
                    {getInitials(user.profile.firstName, user.profile.lastName)}
                  </AvatarInitials>
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-sm">
                  {user.profile.firstName} {user.profile.lastName}
                </p>
                <p className="truncate text-muted-foreground text-xs">
                  {user.contact.email}
                </p>
              </div>
              <div className="text-right">
                {/* <Badge className="text-xs" variant="outline">
                  {user.roleId.name}
                </Badge> */}
                <p className="mt-1 text-muted-foreground text-xs">
                  {formatDistanceToNow(new Date(user.createdAt), {
                    addSuffix: true,
                  })}
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Recent Properties */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Properties</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {recentProperties.map((property) => (
            <div
              className="flex items-center justify-between"
              key={property._id}
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-sm">{property.title}</p>
                <p className="text-muted-foreground text-xs">
                  {formatDistanceToNow(new Date(property.createdAt), {
                    addSuffix: true,
                  })}
                </p>
              </div>
              <Badge className="ml-2" variant={getStatusBadge(property.status)}>
                {property.status}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Recent Bookings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Bookings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {recentBookings?.map((booking) => (
            <div
              className="flex items-center justify-between"
              key={booking._id}
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-sm">
                  {(booking.property as any)?.title}
                </p>
                <p className="text-muted-foreground text-xs">
                  by {(booking?.tenant as any)?.personalInfo?.firstName}{" "}
                  {(booking?.tenant as any)?.personalInfo?.lastName}
                </p>
                <p className="text-muted-foreground text-xs">
                  {formatDistanceToNow(new Date(booking.createdAt), {
                    addSuffix: true,
                  })}
                </p>
              </div>
              <Badge className="ml-2" variant={getStatusBadge(booking.status)}>
                {booking.status}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
