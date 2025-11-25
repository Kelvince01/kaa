"use client";

import { Button } from "@kaa/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import { Building2, Home, Plus, Users, Wallet } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useUserContext } from "@/modules/me";
import { useProperties } from "@/modules/properties";
import { useUnits } from "@/modules/units/unit.queries";
import { EmptyProperties } from "./layout/landlord/empty-states";
import { DashboardOverview } from "./layout/landlord/overview";

export default function LandlordDashboard() {
  const { profile } = useUserContext();
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  const { data, isLoading } = useProperties({
    landlordId: profile?.data._id,
  });
  const [stats] = useState([
    {
      title: "Total Properties",
      value: "12",
      icon: Building2,
      trend: "+2 this month",
    },
    {
      title: "Active Tenants",
      value: "48",
      icon: Users,
      trend: "+5 this month",
    },
    {
      title: "Available Units",
      value: "8",
      icon: Home,
      trend: "-3 this month",
    },
    {
      title: "Revenue Collected",
      value: "KES 580,000",
      icon: Wallet,
      trend: "+12% vs last month",
    },
  ]);
  const { data: unitsData } = useUnits({ property: selectedPropertyId });

  const hasProperties = data?.properties && data.properties.length > 0;

  useEffect(() => {
    if (data?.properties && data.properties.length > 0) {
      setSelectedPropertyId(
        data.properties.filter((property) => property.featured === true)[0]
          ?._id || ""
      );
    }
  }, [data?.properties]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DashboardOverview />

      {hasProperties ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-2xl">Your Properties</h2>
            <Link href="/dashboard/properties/create">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Property
              </Button>
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {data?.properties.map((property) => {
              const propertyUnits =
                unitsData?.items.filter(
                  (unit) => unit.property?._id === property._id
                ) || [];

              return (
                <Card className="relative" key={property._id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Home className="h-5 w-5" />
                      {property.title}
                    </CardTitle>
                    <CardDescription>
                      {property.location.address.town},{" "}
                      {property.location.county}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-muted-foreground text-sm">
                        <p>Type: {property.type}</p>
                        <p>Status: {property.status}</p>
                        <p>Units: {propertyUnits.length}</p>
                      </div>

                      {propertyUnits.length === 0 ? (
                        <Link
                          href={`/dashboard/properties/${property._id}/units/create`}
                        >
                          <Button className="w-full" variant="outline">
                            <Plus className="mr-2 h-4 w-4" />
                            Create First Unit
                          </Button>
                        </Link>
                      ) : (
                        <Link
                          href={`/dashboard/properties/${property._id}/units/create`}
                        >
                          <Button className="w-full" variant="outline">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Unit
                          </Button>
                        </Link>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ) : (
        <EmptyProperties />
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card className="card-hover" key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="font-medium text-muted-foreground text-sm">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-5 w-5 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="font-bold text-2xl">{stat.value}</div>
              <p className="mt-1 text-muted-foreground text-xs">{stat.trend}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <Card className="card-hover">
          <CardHeader>
            <CardTitle>Recent Properties</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  className="flex items-center justify-between rounded-lg bg-secondary/50 p-4"
                  key={i}
                >
                  <div>
                    <h3 className="font-semibold">Green Valley Apartments</h3>
                    <p className="text-muted-foreground text-sm">
                      24 Units • Nairobi
                    </p>
                  </div>
                  <Button size="sm" variant="outline">
                    View Details
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  className="flex items-center gap-4 rounded-lg bg-secondary/50 p-4"
                  key={i}
                >
                  <div className="h-2 w-2 rounded-full bg-accent" />
                  <div>
                    <h3 className="font-semibold">New Tenant Registration</h3>
                    <p className="text-muted-foreground text-sm">
                      John Doe • Unit 4B
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
