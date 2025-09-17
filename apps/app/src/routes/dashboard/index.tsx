"use client";

// import { usePropertiesByLandlord } from "@/modules/properties";
// import {
// 	getPropertiesByLandlord,
// 	getPropertiesByUser,
// } from "@/modules/properties/property.service";
// import { getUnits } from "@/modules/units/unit.service";
import { Icon } from "@iconify/react";
import { Button } from "@kaa/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import { ChartContainer } from "@kaa/ui/components/chart";
import Image from "next/image";
// import { useQuery } from "@tanstack/react-query";
// import { Building, Home, Plus } from "lucide-react";
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
// import { useCurrentUser } from "@/modules/auth/auth.queries";
import { useAuth } from "@/modules/auth/use-auth";

export default function LandlordDashboard() {
  const [showPropertyForm, setShowPropertyForm] = useState(false);
  const [showUnitForm, setShowUnitForm] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");

  // Get current user
  const { user: currentUser } = useAuth();

  // Get user's properties
  // const { data: propertiesData, isLoading: isLoadingProperties } = useQuery({
  // 	queryKey: ["userProperties", currentUser?.id],
  // 	queryFn: () => getPropertiesByLandlord(currentUser?.id || ""),
  // 	enabled: !!currentUser?.id,
  // });

  // Get user's units for selected property
  // const { data: unitsData } = useQuery({
  // 	queryKey: ["propertyUnits", selectedPropertyId],
  // 	queryFn: () => getUnits({ property: selectedPropertyId }),
  // 	enabled: !!selectedPropertyId,
  // });

  // const hasProperties = propertiesData?.properties && propertiesData.properties.length > 0;

  // if (isLoadingProperties) {
  // 	return (
  // 		<div className="flex min-h-screen items-center justify-center">
  // 			<div className="text-lg">Loading...</div>
  // 		</div>
  // 	);
  // }

  if (showPropertyForm) {
    return (
      // <PropertyCreateForm
      // 	onSuccess={() => setShowPropertyForm(false)}
      // 	onCancel={() => setShowPropertyForm(false)}
      // />
      <div>Form</div>
    );
  }

  if (showUnitForm && selectedPropertyId) {
    return (
      // <UnitCreateForm
      // 	propertyId={selectedPropertyId}
      // 	onSuccess={() => setShowUnitForm(false)}
      // 	onCancel={() => setShowUnitForm(false)}
      // />
      <div>Form</div>
    );
  }

  return (
    // <div className="container mx-auto space-y-6 p-6">
    // 	<div className="flex items-center justify-between">
    // 		<h1 className="font-bold text-3xl">Landlord Dashboard</h1>
    // 	</div>

    // 	{!hasProperties ? (
    // 		<Card className="mx-auto w-full max-w-2xl">
    // 			<CardHeader className="text-center">
    // 				<Building className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
    // 				<CardTitle>No Properties Found</CardTitle>
    // 				<CardDescription>
    // 					You don't have any properties yet. Create your first property to get started.
    // 				</CardDescription>
    // 			</CardHeader>
    // 			<CardContent className="text-center">
    // 				<Button onClick={() => setShowPropertyForm(true)} className="w-full max-w-xs">
    // 					<Plus className="mr-2 h-4 w-4" />
    // 					Create Property
    // 				</Button>
    // 			</CardContent>
    // 		</Card>
    // 	) : (
    // 		<div className="space-y-6">
    // 			<div className="flex items-center justify-between">
    // 				<h2 className="font-semibold text-2xl">Your Properties</h2>
    // 				<Button onClick={() => setShowPropertyForm(true)}>
    // 					<Plus className="mr-2 h-4 w-4" />
    // 					Add Property
    // 				</Button>
    // 			</div>

    // 			<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
    // 				{propertiesData?.properties.map((property) => {
    // 					const propertyUnits =
    // 						unitsData?.items.filter((unit) => unit.property === property._id) || [];

    // 					return (
    // 						<Card key={property._id} className="relative">
    // 							<CardHeader>
    // 								<CardTitle className="flex items-center gap-2">
    // 									<Home className="h-5 w-5" />
    // 									{property.title}
    // 								</CardTitle>
    // 								<CardDescription>
    // 									{property.location.address.town}, {property.location.county}
    // 								</CardDescription>
    // 							</CardHeader>
    // 							<CardContent>
    // 								<div className="space-y-4">
    // 									<div className="text-muted-foreground text-sm">
    // 										<p>Type: {property.type}</p>
    // 										<p>Status: {property.status}</p>
    // 										<p>Units: {propertyUnits.length}</p>
    // 									</div>

    // 									{propertyUnits.length === 0 ? (
    // 										<Button
    // 											variant="outline"
    // 											className="w-full"
    // 											onClick={() => {
    // 												setSelectedPropertyId(property._id);
    // 												setShowUnitForm(true);
    // 											}}
    // 										>
    // 											<Plus className="mr-2 h-4 w-4" />
    // 											Create First Unit
    // 										</Button>
    // 									) : (
    // 										<Button
    // 											variant="outline"
    // 											className="w-full"
    // 											onClick={() => {
    // 												setSelectedPropertyId(property._id);
    // 												setShowUnitForm(true);
    // 											}}
    // 										>
    // 											<Plus className="mr-2 h-4 w-4" />
    // 											Add Unit
    // 										</Button>
    // 									)}
    // 								</div>
    // 							</CardContent>
    // 						</Card>
    // 					);
    // 				})}
    // 			</div>
    // 		</div>
    // 	)}
    // </div>

    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-50">
      <header className="sticky top-0 z-50 border-emerald-200 border-b bg-white/80 backdrop-blur-sm">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="font-bold font-heading text-2xl text-emerald-900">
                Welcome back, John!
              </h1>
              <p className="text-emerald-600">
                Your smart home dashboard powered by AI
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button
              className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
              size="sm"
              variant="outline"
            >
              <Icon
                className="mr-2 h-4 w-4"
                icon="material-symbols:notifications"
              />
              3 New
            </Button>
            <Button
              className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
              size="sm"
            >
              <Icon
                className="mr-2 h-4 w-4"
                icon="material-symbols:smart-toy"
              />
              Ask AI
            </Button>
          </div>
        </div>
      </header>
      <main className="space-y-6 p-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-0 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
            <CardContent className="px-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-emerald-100 text-sm">
                    Next Rent Due
                  </p>
                  <p className="font-bold text-2xl">KES 45,000</p>
                  <p className="text-emerald-200 text-sm">Due in 12 days</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
                  <Icon
                    className="h-6 w-6"
                    icon="material-symbols:calendar-month"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 bg-gradient-to-br from-amber-500 to-orange-500 text-white">
            <CardContent className="px-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-amber-100 text-sm">
                    Utilities
                  </p>
                  <p className="font-bold text-2xl">KES 3,200</p>
                  <p className="text-amber-200 text-sm">This month</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
                  <Icon className="h-6 w-6" icon="material-symbols:bolt" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
            <CardContent className="px-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-blue-100 text-sm">
                    Maintenance
                  </p>
                  <p className="font-bold text-2xl">2 Active</p>
                  <p className="text-blue-200 text-sm">1 in progress</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
                  <Icon className="h-6 w-6" icon="material-symbols:build" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 bg-gradient-to-br from-purple-500 to-pink-500 text-white">
            <CardContent className="px-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-purple-100 text-sm">
                    AI Score
                  </p>
                  <p className="font-bold text-2xl">98%</p>
                  <p className="text-purple-200 text-sm">Excellent tenant</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
                  <Icon className="h-6 w-6" icon="material-symbols:stars" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card className="border-emerald-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-heading text-emerald-900">
                <Icon
                  className="h-5 w-5 text-emerald-600"
                  icon="material-symbols:smart-toy"
                />
                AI Insights & Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 px-6">
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500">
                    <Icon
                      className="h-4 w-4 text-white"
                      icon="material-symbols:lightbulb"
                    />
                  </div>
                  <div>
                    <h4 className="font-medium text-emerald-900">
                      Energy Savings Opportunity
                    </h4>
                    <p className="mt-1 text-emerald-700 text-sm">
                      You can save up to KES 800 monthly by adjusting your AC
                      usage during peak hours. Would you like me to create an
                      automated schedule?
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-500">
                    <Icon
                      className="h-4 w-4 text-white"
                      icon="material-symbols:water-drop"
                    />
                  </div>
                  <div>
                    <h4 className="font-medium text-blue-900">
                      Water Usage Alert
                    </h4>
                    <p className="mt-1 text-blue-700 text-sm">
                      Your water consumption is 15% higher than similar units.
                      I've detected a possible leak in the bathroom tap.
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-purple-500">
                    <Icon
                      className="h-4 w-4 text-white"
                      icon="material-symbols:event"
                    />
                  </div>
                  <div>
                    <h4 className="font-medium text-purple-900">
                      Community Event
                    </h4>
                    <p className="mt-1 text-purple-700 text-sm">
                      There's a building meeting this Saturday at 2 PM. Based on
                      your schedule, you're likely available.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-emerald-200">
            <CardHeader>
              <CardTitle className="font-heading text-emerald-900">
                Monthly Expenses
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 pl-0">
              <ChartContainer
                className="h-[300px] w-full"
                config={{
                  rent: { color: "var(--chart-1)", label: "Rent" },
                  internet: { color: "var(--chart-3)", label: "Internet" },
                  utilities: { color: "var(--chart-2)", label: "Utilities" },
                }}
              >
                <BarChart
                  data={[
                    {
                      rent: 45_000,
                      month: "Jan",
                      internet: 2500,
                      utilities: 3200,
                    },
                    {
                      rent: 45_000,
                      month: "Feb",
                      internet: 2500,
                      utilities: 2800,
                    },
                    {
                      rent: 45_000,
                      month: "Mar",
                      internet: 2500,
                      utilities: 3500,
                    },
                    {
                      rent: 45_000,
                      month: "Apr",
                      internet: 2500,
                      utilities: 3100,
                    },
                    {
                      rent: 45_000,
                      month: "May",
                      internet: 2500,
                      utilities: 3400,
                    },
                    {
                      rent: 45_000,
                      month: "Jun",
                      internet: 2500,
                      utilities: 3200,
                    },
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Bar dataKey="rent" fill="var(--chart-1)" />
                  <Bar dataKey="utilities" fill="var(--chart-2)" />
                  <Bar dataKey="internet" fill="var(--chart-3)" />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="border-emerald-200">
            <CardHeader>
              <CardTitle className="font-heading text-emerald-900">
                Recent Activities
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 px-6">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100">
                  <Icon
                    className="h-4 w-4 text-emerald-600"
                    icon="material-symbols:payment"
                  />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-emerald-900 text-sm">
                    Rent Payment
                  </p>
                  <p className="text-emerald-600 text-xs">
                    Paid KES 45,000 • 2 days ago
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                  <Icon
                    className="h-4 w-4 text-blue-600"
                    icon="material-symbols:build"
                  />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-emerald-900 text-sm">
                    Maintenance Request
                  </p>
                  <p className="text-emerald-600 text-xs">
                    AC repair completed • 1 week ago
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100">
                  <Icon
                    className="h-4 w-4 text-purple-600"
                    icon="material-symbols:smart-toy"
                  />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-emerald-900 text-sm">
                    AI Recommendation
                  </p>
                  <p className="text-emerald-600 text-xs">
                    Energy saving tip • 3 days ago
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-emerald-200">
            <CardHeader>
              <CardTitle className="font-heading text-emerald-900">
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 px-6">
              <Button className="w-full bg-emerald-500 text-white hover:bg-emerald-600">
                <Icon
                  className="mr-2 h-4 w-4"
                  icon="material-symbols:payment"
                />
                Pay Rent
              </Button>
              <Button
                className="w-full border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                variant="outline"
              >
                <Icon className="mr-2 h-4 w-4" icon="material-symbols:build" />
                Request Maintenance
              </Button>
              <Button
                className="w-full border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                variant="outline"
              >
                <Icon
                  className="mr-2 h-4 w-4"
                  icon="material-symbols:receipt-long"
                />
                View Bills
              </Button>
              <Button
                className="w-full border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                variant="outline"
              >
                <Icon
                  className="mr-2 h-4 w-4"
                  icon="material-symbols:smart-toy"
                />
                Chat with AI
              </Button>
            </CardContent>
          </Card>
          <Card className="border-emerald-200">
            <CardHeader>
              <CardTitle className="font-heading text-emerald-900">
                Property Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 px-6">
              <div className="aspect-video overflow-hidden rounded-lg bg-gradient-to-br from-emerald-100 to-emerald-200">
                <Image
                  alt="Property"
                  className="h-full w-full object-cover"
                  src="https://wqnmyfkavrotpmupbtou.supabase.co/storage/v1/object/public/reweb/blocks/placeholder.png"
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-emerald-600">Unit:</span>
                  <span className="font-medium text-emerald-900">3B</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-emerald-600">Building:</span>
                  <span className="font-medium text-emerald-900">
                    Kileleshwa Heights
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-emerald-600">Lease:</span>
                  <span className="font-medium text-emerald-900">
                    Until Dec 2024
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-emerald-600">Manager:</span>
                  <span className="font-medium text-emerald-900">
                    Sarah Wanjiku
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
