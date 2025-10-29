"use client";

import { Alert, AlertDescription } from "@kaa/ui/components/alert";
import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@kaa/ui/components/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@kaa/ui/components/tabs";
import {
  AlertTriangle,
  CheckCircle,
  Plus,
  Search,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AmenityApprovalPanel } from "@/modules/properties";
import {
  useAmenityDataValidation,
  useApprovalStats,
  useAutoDiscoveryStats,
  useAutoPopulationStatus,
  useDiscoverMissingAmenities,
} from "../amenity.queries";
import { CreateAmenityForm } from "./create-amenity-form";

type AmenityManagementDashboardProps = {
  county?: string;
};

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

export function AmenityManagementDashboard({
  county,
}: AmenityManagementDashboardProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // Queries
  const { data: approvalStats } = useApprovalStats(county);
  const { data: autoDiscoveryStats } = useAutoDiscoveryStats(county);
  const { data: dataValidation } = useAmenityDataValidation(county);
  const { data: autoPopulationStatus } = useAutoPopulationStatus();

  // Mutations
  const discoverMissingMutation = useDiscoverMissingAmenities();

  const handleDiscoverMissing = async () => {
    try {
      await discoverMissingMutation.mutateAsync({
        county,
        batchSize: 10,
        maxProperties: 50,
      });
    } catch (error) {
      // Error handled by mutation
    }
  };

  // Prepare chart data
  const approvalChartData = approvalStats
    ? [
        { name: "Pending", value: approvalStats.pending, color: "#FFBB28" },
        { name: "Approved", value: approvalStats.approved, color: "#00C49F" },
        { name: "Rejected", value: approvalStats.rejected, color: "#FF8042" },
      ]
    : [];

  const sourceChartData = autoDiscoveryStats
    ? Object.entries(autoDiscoveryStats.sourceBreakdown).map(
        ([source, count]) => ({
          name: source.replace(/_/g, " "),
          value: count,
        })
      )
    : [];

  const categoryChartData = autoDiscoveryStats
    ? Object.entries(autoDiscoveryStats.categoryCounts).map(
        ([category, count]) => ({
          name: category.charAt(0).toUpperCase() + category.slice(1),
          value: count,
        })
      )
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl">Amenity Management</h1>
          <p className="text-muted-foreground">
            Manage amenities, approvals, and automated discovery
            {county && ` for ${county}`}
          </p>
        </div>
        <div className="flex space-x-2">
          <Dialog onOpenChange={setCreateDialogOpen} open={createDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Amenity
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Amenity</DialogTitle>
                <DialogDescription>
                  Manually add a new amenity to the database
                </DialogDescription>
              </DialogHeader>
              <CreateAmenityForm
                onCancel={() => setCreateDialogOpen(false)}
                onSuccess={() => setCreateDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Auto-Population Status */}
      {autoPopulationStatus && (
        <Alert>
          <Zap className="h-4 w-4" />
          <AlertDescription>
            Auto-discovery service:{" "}
            {autoPopulationStatus.isProcessing ? "Processing" : "Idle"}
            {autoPopulationStatus.queueSize > 0 &&
              ` • ${autoPopulationStatus.queueSize} properties in queue`}
            {autoPopulationStatus.configStatus.googlePlacesConfigured
              ? " • Google Places API configured"
              : " • Using OpenStreetMap only"}
          </AlertDescription>
        </Alert>
      )}

      {/* Main Tabs */}
      <Tabs onValueChange={setActiveTab} value={activeTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger className="relative" value="approvals">
            Approvals
            {(approvalStats as any)?.pending > 0 && (
              <Badge
                className="ml-2 h-5 w-5 rounded-full p-0 text-xs"
                variant="destructive"
              >
                {approvalStats?.pending}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="discovery">Discovery</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent className="space-y-6" value="overview">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-8 w-8 text-yellow-500" />
                  <div>
                    <p className="font-medium text-muted-foreground text-sm">
                      Pending Approval
                    </p>
                    <p className="font-bold text-2xl">
                      {approvalStats?.pending || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-8 w-8 text-green-500" />
                  <div>
                    <p className="font-medium text-muted-foreground text-sm">
                      Total Approved
                    </p>
                    <p className="font-bold text-2xl">
                      {approvalStats?.approved || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Search className="h-8 w-8 text-blue-500" />
                  <div>
                    <p className="font-medium text-muted-foreground text-sm">
                      Auto-Discovered
                    </p>
                    <p className="font-bold text-2xl">
                      {autoDiscoveryStats?.totalAutoDiscovered || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-8 w-8 text-purple-500" />
                  <div>
                    <p className="font-medium text-muted-foreground text-sm">
                      Verification Rate
                    </p>
                    <p className="font-bold text-2xl">
                      {autoDiscoveryStats?.verificationRate || 0}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Button
                  className="h-20 flex-col space-y-2"
                  disabled={discoverMissingMutation.isPending}
                  onClick={handleDiscoverMissing}
                  variant="outline"
                >
                  <Search className="h-6 w-6" />
                  <span className="text-sm">Discover Missing</span>
                </Button>

                <Button
                  className="h-20 flex-col space-y-2"
                  onClick={() => setActiveTab("approvals")}
                  variant="outline"
                >
                  <CheckCircle className="h-6 w-6" />
                  <span className="text-sm">Review Approvals</span>
                  {(approvalStats as any)?.pending > 0 && (
                    <Badge className="text-xs" variant="destructive">
                      {approvalStats?.pending}
                    </Badge>
                  )}
                </Button>

                <Button
                  className="h-20 flex-col space-y-2"
                  onClick={() => setCreateDialogOpen(true)}
                  variant="outline"
                >
                  <Plus className="h-6 w-6" />
                  <span className="text-sm">Add Manual</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Data Quality Alerts */}
          {dataValidation?.suggestions &&
            dataValidation.suggestions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    <span>Data Quality Issues</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {dataValidation.suggestions.map((suggestion, index) => (
                      <Alert key={index.toString()}>
                        <AlertDescription>{suggestion}</AlertDescription>
                      </Alert>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
        </TabsContent>

        {/* Approvals Tab */}
        <TabsContent value="approvals">
          <AmenityApprovalPanel county={county} />
        </TabsContent>

        {/* Discovery Tab */}
        <TabsContent className="space-y-6" value="discovery">
          <Card>
            <CardHeader>
              <CardTitle>Auto-Discovery Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* Service Status */}
                <div className="space-y-4">
                  <h4 className="font-medium">Service Status</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Processing Status</span>
                      <Badge
                        variant={
                          autoPopulationStatus?.isProcessing
                            ? "default"
                            : "outline"
                        }
                      >
                        {autoPopulationStatus?.isProcessing ? "Active" : "Idle"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Queue Size</span>
                      <span className="font-medium text-sm">
                        {autoPopulationStatus?.queueSize || 0} properties
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Google Places API</span>
                      <Badge
                        variant={
                          autoPopulationStatus?.configStatus
                            .googlePlacesConfigured
                            ? "default"
                            : "outline"
                        }
                      >
                        {autoPopulationStatus?.configStatus
                          .googlePlacesConfigured
                          ? "Configured"
                          : "Not Set"}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Discovery Stats */}
                <div className="space-y-4">
                  <h4 className="font-medium">Discovery Statistics</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Total Auto-Discovered</span>
                      <span className="font-medium text-sm">
                        {autoDiscoveryStats?.totalAutoDiscovered || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Verification Rate</span>
                      <span className="font-medium text-sm">
                        {autoDiscoveryStats?.verificationRate || 0}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <Button
                  className="w-full"
                  disabled={discoverMissingMutation.isPending}
                  onClick={handleDiscoverMissing}
                >
                  {discoverMissingMutation.isPending ? (
                    <>
                      <Search className="mr-2 h-4 w-4 animate-spin" />
                      Discovering...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      Discover Missing Amenities
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent className="space-y-6" value="analytics">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Approval Status Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Approval Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {approvalChartData.length > 0 ? (
                  <ResponsiveContainer height={300} width="100%">
                    <PieChart>
                      <Pie
                        cx="50%"
                        cy="50%"
                        data={approvalChartData}
                        dataKey="value"
                        fill="#8884d8"
                        label={({ name, value }) => `${name}: ${value}`}
                        labelLine={false}
                        outerRadius={80}
                      >
                        {approvalChartData.map((entry, index) => (
                          <Cell
                            fill={entry.color}
                            key={`cell-${index.toString()}`}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Category Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Amenities by Category</CardTitle>
              </CardHeader>
              <CardContent>
                {categoryChartData.length > 0 ? (
                  <ResponsiveContainer height={300} width="100%">
                    <BarChart data={categoryChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        angle={-45}
                        dataKey="name"
                        fontSize={12}
                        height={80}
                        textAnchor="end"
                      />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Data Quality Summary */}
          {dataValidation && (
            <Card>
              <CardHeader>
                <CardTitle>Data Quality Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4 grid grid-cols-2 gap-4 md:grid-cols-4">
                  <div className="text-center">
                    <div className="font-bold text-2xl">
                      {dataValidation.totalAmenities}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      Total Amenities
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-2xl text-yellow-600">
                      {dataValidation.unverifiedCount}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      Unverified
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-2xl text-orange-600">
                      {dataValidation.missingContactCount}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      Missing Contact
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-2xl text-red-600">
                      {dataValidation.duplicatesCount}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      Potential Duplicates
                    </div>
                  </div>
                </div>

                {dataValidation.suggestions.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Recommendations</h4>
                    {dataValidation.suggestions.map((suggestion, index) => (
                      <Alert key={index.toString()}>
                        <AlertDescription>{suggestion}</AlertDescription>
                      </Alert>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
