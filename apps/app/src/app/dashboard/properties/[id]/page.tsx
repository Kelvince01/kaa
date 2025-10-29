"use client";

import { Button } from "@kaa/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import { Separator } from "@kaa/ui/components/separator";
import { ArrowRight, Calendar, Shield, TrendingUp, Users } from "lucide-react";
import Link from "next/link";
import { use } from "react";
import { PageContainer } from "@/components/page-container";
import { PropertyDetailContainer } from "@/routes/dashboard/properties/property-detail-container";

type PropertyDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

const sections = [
  {
    id: "contractors",
    title: "Contractors",
    description: "Find and manage contractors for maintenance and repairs",
    icon: Users,
    href: (id: string) => `/dashboard/properties/${id}/contractors`,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  {
    id: "insurance",
    title: "Insurance",
    description: "Manage policies, file claims, and track coverage",
    icon: Shield,
    href: (id: string) => `/dashboard/properties/${id}/insurance`,
    color: "text-green-600",
    bgColor: "bg-green-50",
  },
  {
    id: "schedule",
    title: "Schedule",
    description: "Manage appointments, viewings, and maintenance schedules",
    icon: Calendar,
    href: (id: string) => `/dashboard/properties/${id}/schedule`,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
  },
  {
    id: "valuations",
    title: "Valuations",
    description: "Track property value, market trends, and rental estimates",
    icon: TrendingUp,
    href: (id: string) => `/dashboard/properties/${id}/valuations`,
    color: "text-orange-600",
    bgColor: "bg-orange-50",
  },
];

export default function PropertyDetailPage({
  params,
}: PropertyDetailPageProps) {
  const { id: propertyId } = use(params);

  return (
    <PageContainer>
      <div className="space-y-8">
        {/* Property Details */}
        <PropertyDetailContainer propertyId={propertyId} />

        <Separator className="my-8" />

        {/* Management Section Header */}
        <div>
          <h2 className="font-bold text-2xl tracking-tight">
            Property Management
          </h2>
          <p className="text-muted-foreground">
            Access key management features for your property
          </p>
        </div>

        {/* Navigation Cards */}
        <div className="grid gap-6 md:grid-cols-2">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <Card
                className="group transition-all hover:shadow-lg"
                key={section.id}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className={`rounded-lg p-3 ${section.bgColor}`}>
                      <Icon className={`h-6 w-6 ${section.color}`} />
                    </div>
                  </div>
                  <CardTitle className="mt-4 text-xl">
                    {section.title}
                  </CardTitle>
                  <CardDescription>{section.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href={section.href(propertyId)}>
                    <Button
                      className="w-full justify-between group-hover:bg-accent"
                      variant="ghost"
                    >
                      View {section.title}
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Overview</CardTitle>
            <CardDescription>
              Summary of your property management activities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="flex flex-col items-center justify-center rounded-lg bg-muted/50 p-6">
                <div className="font-bold text-2xl text-blue-600">12</div>
                <div className="text-center text-muted-foreground text-sm">
                  Active Contractors
                </div>
              </div>
              <div className="flex flex-col items-center justify-center rounded-lg bg-muted/50 p-6">
                <div className="font-bold text-2xl text-green-600">3</div>
                <div className="text-center text-muted-foreground text-sm">
                  Insurance Policies
                </div>
              </div>
              <div className="flex flex-col items-center justify-center rounded-lg bg-muted/50 p-6">
                <div className="font-bold text-2xl text-purple-600">8</div>
                <div className="text-center text-muted-foreground text-sm">
                  Scheduled Items
                </div>
              </div>
              <div className="flex flex-col items-center justify-center rounded-lg bg-muted/50 p-6">
                <div className="font-bold text-2xl text-orange-600">$2.1M</div>
                <div className="text-center text-muted-foreground text-sm">
                  Current Value
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
