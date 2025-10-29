"use client";

import { Button } from "@kaa/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import { Calendar, CreditCard, FileText, Home, Wrench } from "lucide-react";
import Link from "next/link";
import { useUserContext } from "@/modules/me";

/**
 * Tenant-specific dashboard
 * Shows tenant's rented property, payment status, maintenance requests, etc.
 */
export default function TenantDashboard() {
  const { profile, context } = useUserContext();

  // Get tenant-specific data from profile
  const tenantData = profile?.data;

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="font-bold text-3xl tracking-tight">Welcome Back!</h1>
        <p className="text-muted-foreground">
          Here's an overview of your rental and activities
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">My Property</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              {tenantData?.property?.name ?? "No Property"}
            </div>
            <p className="text-muted-foreground text-xs">
              {tenantData?.unit?.name ?? "Unit N/A"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Rent Status</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">Paid</div>
            <p className="text-muted-foreground text-xs">
              Next payment: {new Date().toLocaleDateString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">
              Maintenance Requests
            </CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">0</div>
            <p className="text-muted-foreground text-xs">Active requests</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              {tenantData?.documents?.length ?? 0}
            </div>
            <p className="text-muted-foreground text-xs">Available documents</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Button asChild className="w-full" variant="outline">
            <Link href="/dashboard/payments">
              <CreditCard className="mr-2 h-4 w-4" />
              Pay Rent
            </Link>
          </Button>
          <Button asChild className="w-full" variant="outline">
            <Link href="/dashboard/maintenance">
              <Wrench className="mr-2 h-4 w-4" />
              Request Maintenance
            </Link>
          </Button>
          <Button asChild className="w-full" variant="outline">
            <Link href="/dashboard/bookings">
              <Calendar className="mr-2 h-4 w-4" />
              View Bookings
            </Link>
          </Button>
          <Button asChild className="w-full" variant="outline">
            <Link href="/dashboard/documents">
              <FileText className="mr-2 h-4 w-4" />
              My Documents
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Property Information */}
      {tenantData?.property && (
        <Card>
          <CardHeader>
            <CardTitle>My Property</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Property:</span>
                <span className="font-medium">{tenantData.property.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Unit:</span>
                <span className="font-medium">{tenantData.unit?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Lease Start:</span>
                <span className="font-medium">
                  {tenantData.startDate
                    ? new Date(tenantData.startDate).toLocaleDateString()
                    : "N/A"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Lease End:</span>
                <span className="font-medium">
                  {tenantData.endDate
                    ? new Date(tenantData.endDate).toLocaleDateString()
                    : "N/A"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activities */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center">
              <div className="ml-4 space-y-1">
                <p className="font-medium text-sm leading-none">
                  Rent payment received
                </p>
                <p className="text-muted-foreground text-sm">2 days ago</p>
              </div>
            </div>
            <div className="flex items-center">
              <div className="ml-4 space-y-1">
                <p className="font-medium text-sm leading-none">
                  Maintenance request completed
                </p>
                <p className="text-muted-foreground text-sm">1 week ago</p>
              </div>
            </div>
            <div className="flex items-center">
              <div className="ml-4 space-y-1">
                <p className="font-medium text-sm leading-none">
                  Lease agreement signed
                </p>
                <p className="text-muted-foreground text-sm">2 weeks ago</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
