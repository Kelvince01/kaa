import { Button } from "@kaa/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import { Building2, Home, Users, Wallet } from "lucide-react";
import { useState } from "react";

const Index = () => {
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

  return (
    <div className="min-h-screen bg-background">
      <div className="container px-4 py-8">
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="animate-in font-bold text-4xl text-primary">
                Welcome Back
              </h1>
              <p className="mt-2 text-muted-foreground">
                Manage your properties efficiently
              </p>
            </div>
            <Button className="bg-accent text-white hover:bg-accent/90">
              Add Property
            </Button>
          </div>
        </header>

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
                <p className="mt-1 text-muted-foreground text-xs">
                  {stat.trend}
                </p>
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
    </div>
  );
};

export default Index;
