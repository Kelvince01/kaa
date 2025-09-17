"use client";

// import { usePropertiesByLandlord } from "@/modules/properties";
// import {
// 	getPropertiesByLandlord,
// 	getPropertiesByUser,
// } from "@/modules/properties/property.service";
// import { getUnits } from "@/modules/units/unit.service";
// import { useQuery } from "@tanstack/react-query";
// import { Building, Home, Plus } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/modules/auth/use-auth";
import { DashboardAiInsightsAndRecommendations } from "./layout/ai-insights-and-recommendations";
import { FeaturedPropertyInfo } from "./layout/featured-property-info";
import { MonthlyRevenueChart } from "./layout/monthly-revenue-chart";
import { DashboardOverview } from "./layout/overview";
import { QuickActions } from "./layout/quick-actions";
import { RecentActivities } from "./layout/recent-activities";
import { DashboardStats } from "./layout/stats";

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

    <div className="space-y-6">
      <DashboardOverview />
      <DashboardStats />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <DashboardAiInsightsAndRecommendations />

        <MonthlyRevenueChart />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <RecentActivities />
        <QuickActions />
        <FeaturedPropertyInfo />
      </div>
    </div>
  );
}
