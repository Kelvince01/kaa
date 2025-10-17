/**
 * Tour Analytics Dashboard Component
 * Displays comprehensive analytics and ML insights for virtual tours
 */

"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@kaa/ui/components/card";
import { Button } from "@kaa/ui/components/button";
import { Badge } from "@kaa/ui/components/badge";
import { Progress } from "@kaa/ui/components/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@kaa/ui/components/tabs";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@kaa/ui/components/select";
import {
	BarChart,
	Bar,
	LineChart,
	Line,
	PieChart,
	Pie,
	Cell,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
	ReferenceLine,
} from "recharts";
import {
	Eye,
	Clock,
	TrendingUp,
	TrendingDown,
	Users,
	MousePointer,
	Smartphone,
	Monitor,
	Tablet,
	Globe,
	Target,
	Zap,
	Brain,
	Activity,
	Calendar,
	MapPin,
	Star,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { useTourAnalytics, useRealTimeMetrics, useServiceCapabilities } from "@/modules/properties";
import type { VirtualTour, MLAnalytics } from "../virtual-tour.type";

interface TourAnalyticsDashboardProps {
	tourId: string;
	tour?: VirtualTour;
	showMLInsights?: boolean;
}

export const TourAnalyticsDashboard: React.FC<TourAnalyticsDashboardProps> = ({
	tourId,
	tour,
	showMLInsights = false,
}) => {
	const [timeRange, setTimeRange] = useState("7d");
	const [selectedMetric, setSelectedMetric] = useState("views");

	// Queries
	const { data: analytics, isLoading } = useTourAnalytics(tourId, showMLInsights);
	const { data: realTimeMetrics } = useRealTimeMetrics(tourId);
	const { data: capabilities } = useServiceCapabilities();

	const mlAnalytics = analytics as MLAnalytics;
	const isMLAnalytics = showMLInsights && mlAnalytics?.predictions;

	// Device breakdown data for charts
	const deviceData = analytics
		? [
				{ name: "Mobile", value: analytics.deviceBreakdown.mobile, color: "#3B82F6" },
				{ name: "Desktop", value: analytics.deviceBreakdown.desktop, color: "#10B981" },
				{ name: "Tablet", value: analytics.deviceBreakdown.tablet, color: "#F59E0B" },
				{ name: "VR", value: analytics.deviceBreakdown.vr, color: "#8B5CF6" },
				{ name: "AR", value: analytics.deviceBreakdown.ar, color: "#EF4444" },
			].filter((item) => item.value > 0)
		: [];

	// Scene performance data
	const sceneData =
		analytics?.sceneAnalytics.map((scene, index) => ({
			name: `Scene ${index + 1}`,
			sceneId: scene.sceneId,
			views: scene.views,
			avgTime: Math.round(scene.averageTime / 1000), // Convert to seconds
			exitRate: Math.round(scene.exitRate * 100),
			engagement: Math.round(scene.hotspotEngagement * 100),
		})) || [];

	// Time series data for engagement
	const engagementData =
		isMLAnalytics && mlAnalytics.insights?.seasonalTrends
			? mlAnalytics.insights.seasonalTrends.map((trend) => ({
					month: new Date(2024, trend.month - 1).toLocaleString("default", { month: "short" }),
					views: trend.averageViews,
					conversion: Math.round(trend.conversionRate * 100),
				}))
			: [];

	if (isLoading) {
		return <AnalyticsSkeleton />;
	}

	if (!analytics) {
		return (
			<Card>
				<CardContent className="p-6 text-center">
					<BarChart className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
					<h3 className="mb-2 font-semibold">No Analytics Available</h3>
					<p className="text-muted-foreground">
						Analytics data will appear once the tour receives views
					</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="space-y-6">
			{/* Overview Cards */}
			<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
				<Card>
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-muted-foreground text-sm">Total Views</p>
								<p className="font-bold text-2xl">{analytics.totalViews.toLocaleString()}</p>
								{isMLAnalytics && mlAnalytics.predictions && (
									<p className="mt-1 flex items-center gap-1 text-green-600 text-xs">
										<TrendingUp className="h-3 w-3" />+{mlAnalytics.predictions.expectedViews}{" "}
										predicted
									</p>
								)}
							</div>
							<Eye className="h-8 w-8 text-blue-500" />
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-muted-foreground text-sm">Unique Visitors</p>
								<p className="font-bold text-2xl">{analytics.uniqueVisitors.toLocaleString()}</p>
								<p className="mt-1 text-muted-foreground text-xs">
									{Math.round((analytics.uniqueVisitors / Math.max(analytics.totalViews, 1)) * 100)}
									% unique
								</p>
							</div>
							<Users className="h-8 w-8 text-green-500" />
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-muted-foreground text-sm">Avg Duration</p>
								<p className="font-bold text-2xl">
									{Math.round(analytics.averageDuration / 60000)}min
								</p>
								<p className="mt-1 text-muted-foreground text-xs">
									{Math.round(analytics.completionRate * 100)}% completion
								</p>
							</div>
							<Clock className="h-8 w-8 text-purple-500" />
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-muted-foreground text-sm">Conversion Rate</p>
								<p className="font-bold text-2xl">
									{Math.round(analytics.conversionMetrics.conversionRate * 100)}%
								</p>
								{isMLAnalytics && mlAnalytics.predictions && (
									<p className="mt-1 flex items-center gap-1 text-blue-600 text-xs">
										<Brain className="h-3 w-3" />
										{Math.round(mlAnalytics.predictions.conversionProbability * 100)}% predicted
									</p>
								)}
							</div>
							<Target className="h-8 w-8 text-orange-500" />
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Real-time Metrics */}
			{realTimeMetrics && (
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Activity className="h-5 w-5" />
							Real-time Metrics
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
							<div className="text-center">
								<p className="font-bold text-2xl text-green-600">
									{realTimeMetrics.realTimeMetrics?.activeViewers || 0}
								</p>
								<p className="text-muted-foreground text-sm">Active Viewers</p>
							</div>
							<div className="text-center">
								<p className="font-bold text-2xl text-blue-600">
									{Math.round((realTimeMetrics.realTimeMetrics?.currentEngagementRate || 0) * 100)}%
								</p>
								<p className="text-muted-foreground text-sm">Engagement Rate</p>
							</div>
							<div className="text-center">
								<p className="font-bold text-2xl text-purple-600">
									{realTimeMetrics.realTimeMetrics?.performanceHealth?.overall || 0}
								</p>
								<p className="text-muted-foreground text-sm">Performance Score</p>
							</div>
							<div className="text-center">
								<p className="font-bold text-2xl text-orange-600">
									{realTimeMetrics.iotMetrics?.temperature || "--"}°C
								</p>
								<p className="text-muted-foreground text-sm">Property Temp</p>
							</div>
						</div>
					</CardContent>
				</Card>
			)}

			{/* Detailed Analytics */}
			<Tabs defaultValue="overview" className="space-y-4">
				<div className="flex items-center justify-between">
					<TabsList>
						<TabsTrigger value="overview">Overview</TabsTrigger>
						<TabsTrigger value="devices">Devices</TabsTrigger>
						<TabsTrigger value="scenes">Scenes</TabsTrigger>
						{isMLAnalytics && <TabsTrigger value="ml-insights">AI Insights</TabsTrigger>}
						<TabsTrigger value="conversions">Conversions</TabsTrigger>
					</TabsList>

					<Select value={timeRange} onValueChange={setTimeRange}>
						<SelectTrigger className="w-32">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="24h">Last 24h</SelectItem>
							<SelectItem value="7d">Last 7 days</SelectItem>
							<SelectItem value="30d">Last 30 days</SelectItem>
							<SelectItem value="90d">Last 90 days</SelectItem>
						</SelectContent>
					</Select>
				</div>

				{/* Overview Tab */}
				<TabsContent value="overview" className="space-y-4">
					<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
						{/* Views Over Time */}
						<Card>
							<CardHeader>
								<CardTitle className="text-base">Views Over Time</CardTitle>
							</CardHeader>
							<CardContent>
								<ResponsiveContainer width="100%" height={200}>
									<LineChart data={engagementData}>
										<CartesianGrid strokeDasharray="3 3" />
										<XAxis dataKey="month" />
										<YAxis />
										<Tooltip />
										<Line type="monotone" dataKey="views" stroke="#3B82F6" strokeWidth={2} />
									</LineChart>
								</ResponsiveContainer>
							</CardContent>
						</Card>

						{/* Device Breakdown */}
						<Card>
							<CardHeader>
								<CardTitle className="text-base">Device Breakdown</CardTitle>
							</CardHeader>
							<CardContent>
								<ResponsiveContainer width="100%" height={200}>
									<PieChart>
										<Pie
											dataKey="value"
											data={deviceData}
											cx="50%"
											cy="50%"
											outerRadius={60}
											fill="#8884d8"
										>
											{deviceData.map((entry, index) => (
												<Cell key={`cell-${index}`} fill={entry.color} />
											))}
										</Pie>
										<Tooltip />
									</PieChart>
								</ResponsiveContainer>

								<div className="mt-4 flex flex-wrap gap-2">
									{deviceData.map((device) => (
										<div key={device.name} className="flex items-center gap-2 text-sm">
											<div
												className="h-3 w-3 rounded-full"
												style={{ backgroundColor: device.color }}
											/>
											<span>
												{device.name}: {device.value}
											</span>
										</div>
									))}
								</div>
							</CardContent>
						</Card>
					</div>
				</TabsContent>

				{/* Devices Tab */}
				<TabsContent value="devices" className="space-y-4">
					<div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
						{/* Device Stats Cards */}
						<Card>
							<CardContent className="p-4">
								<div className="flex items-center justify-between">
									<div>
										<p className="text-muted-foreground text-sm">Mobile Views</p>
										<p className="font-bold text-xl">{analytics.deviceBreakdown.mobile}</p>
										<p className="text-muted-foreground text-xs">
											{Math.round(
												(analytics.deviceBreakdown.mobile / Math.max(analytics.totalViews, 1)) * 100
											)}
											%
										</p>
									</div>
									<Smartphone className="h-8 w-8 text-blue-500" />
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardContent className="p-4">
								<div className="flex items-center justify-between">
									<div>
										<p className="text-muted-foreground text-sm">Desktop Views</p>
										<p className="font-bold text-xl">{analytics.deviceBreakdown.desktop}</p>
										<p className="text-muted-foreground text-xs">
											{Math.round(
												(analytics.deviceBreakdown.desktop / Math.max(analytics.totalViews, 1)) *
													100
											)}
											%
										</p>
									</div>
									<Monitor className="h-8 w-8 text-green-500" />
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardContent className="p-4">
								<div className="flex items-center justify-between">
									<div>
										<p className="text-muted-foreground text-sm">XR Views</p>
										<p className="font-bold text-xl">
											{analytics.deviceBreakdown.vr + analytics.deviceBreakdown.ar}
										</p>
										<p className="text-muted-foreground text-xs">
											VR: {analytics.deviceBreakdown.vr}, AR: {analytics.deviceBreakdown.ar}
										</p>
									</div>
									<div className="text-purple-500">🥽</div>
								</div>
							</CardContent>
						</Card>
					</div>
				</TabsContent>

				{/* Scenes Tab */}
				<TabsContent value="scenes" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle className="text-base">Scene Performance</CardTitle>
						</CardHeader>
						<CardContent>
							<ResponsiveContainer width="100%" height={300}>
								<BarChart data={sceneData}>
									<CartesianGrid strokeDasharray="3 3" />
									<XAxis dataKey="name" />
									<YAxis />
									<Tooltip />
									<Bar dataKey="views" fill="#3B82F6" name="Views" />
									<Bar dataKey="avgTime" fill="#10B981" name="Avg Time (s)" />
								</BarChart>
							</ResponsiveContainer>
						</CardContent>
					</Card>

					{/* Scene Details Table */}
					<Card>
						<CardHeader>
							<CardTitle className="text-base">Scene Details</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-3">
								{analytics.sceneAnalytics.map((scene, index) => {
									const sceneInfo = tour?.scenes.find((s) => s.id === scene.sceneId);
									return (
										<div
											key={scene.sceneId}
											className="flex items-center justify-between rounded-lg border p-3"
										>
											<div className="flex items-center gap-3">
												<div className="h-8 w-12 overflow-hidden rounded bg-gray-100">
													{sceneInfo?.thumbnailUrl && (
														<img
															src={sceneInfo.thumbnailUrl}
															alt=""
															className="h-full w-full object-cover"
														/>
													)}
												</div>
												<div>
													<p className="font-medium">{sceneInfo?.name || `Scene ${index + 1}`}</p>
													<p className="text-muted-foreground text-sm">{sceneInfo?.description}</p>
												</div>
											</div>

											<div className="flex gap-4 text-sm">
												<div className="text-center">
													<p className="font-medium">{scene.views}</p>
													<p className="text-muted-foreground">Views</p>
												</div>
												<div className="text-center">
													<p className="font-medium">{Math.round(scene.averageTime / 1000)}s</p>
													<p className="text-muted-foreground">Avg Time</p>
												</div>
												<div className="text-center">
													<p className="font-medium">{Math.round(scene.exitRate * 100)}%</p>
													<p className="text-muted-foreground">Exit Rate</p>
												</div>
												<div className="text-center">
													<p className="font-medium">
														{Math.round(scene.hotspotEngagement * 100)}%
													</p>
													<p className="text-muted-foreground">Engagement</p>
												</div>
											</div>
										</div>
									);
								})}
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				{/* ML Insights Tab */}
				{isMLAnalytics && (
					<TabsContent value="ml-insights" className="space-y-4">
						{/* Predictions */}
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Brain className="h-5 w-5" />
									AI Predictions
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
									<div className="rounded-lg border p-4 text-center">
										<p className="font-bold text-blue-600 text-lg">
											{mlAnalytics.predictions.expectedViews}
										</p>
										<p className="text-muted-foreground text-sm">Expected Views</p>
									</div>
									<div className="rounded-lg border p-4 text-center">
										<p className="font-bold text-green-600 text-lg">
											{Math.round(mlAnalytics.predictions.conversionProbability * 100)}%
										</p>
										<p className="text-muted-foreground text-sm">Conversion Prob.</p>
									</div>
									<div className="rounded-lg border p-4 text-center">
										<p className="font-bold text-lg text-purple-600">
											{Math.round(mlAnalytics.predictions.performanceScore * 100)}
										</p>
										<p className="text-muted-foreground text-sm">Performance Score</p>
									</div>
									<div className="rounded-lg border p-4 text-center">
										<p className="font-bold text-lg text-orange-600">
											{format(new Date(mlAnalytics.predictions.engagementForecast.peak), "MMM dd")}
										</p>
										<p className="text-muted-foreground text-sm">Peak Date</p>
									</div>
								</div>
							</CardContent>
						</Card>

						{/* User Behavior Patterns */}
						{mlAnalytics.insights?.userBehaviorPatterns && (
							<Card>
								<CardHeader>
									<CardTitle className="text-base">User Behavior Patterns</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="space-y-3">
										{mlAnalytics.insights.userBehaviorPatterns.map((pattern, index) => (
											<div
												key={index}
												className="flex items-center justify-between rounded-lg border p-3"
											>
												<div>
													<p className="font-medium">{pattern.pattern}</p>
													<p className="text-muted-foreground text-sm">
														{Math.round(pattern.frequency * 100)}% frequency • Impact:{" "}
														{Math.round(pattern.impact * 100)}%
													</p>
												</div>
												<div className="flex items-center gap-2">
													<Progress value={pattern.frequency * 100} className="w-16" />
													<Star
														className={`h-4 w-4 ${pattern.impact > 0.5 ? "text-yellow-500" : "text-gray-400"}`}
													/>
												</div>
											</div>
										))}
									</div>
								</CardContent>
							</Card>
						)}

						{/* Market Insights */}
						{mlAnalytics.insights?.marketInsights && (
							<Card>
								<CardHeader>
									<CardTitle className="text-base">Market Insights</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
										<div>
											<h4 className="mb-3 font-medium">Target Audience</h4>
											<div className="space-y-2">
												{mlAnalytics.insights.marketInsights.targetAudience.map(
													(segment, index) => (
														<div key={index} className="rounded-lg border p-3">
															<div className="mb-2 flex items-center justify-between">
																<span className="font-medium">{segment.segment}</span>
																<Badge variant="outline">{segment.percentage}%</Badge>
															</div>
															<p className="mb-2 text-muted-foreground text-sm">
																{segment.characteristics.join(", ")}
															</p>
															<div className="text-xs">
																<strong>Recommendations:</strong>
																<ul className="mt-1 list-inside list-disc">
																	{segment.recommendations.map((rec, i) => (
																		<li key={i}>{rec}</li>
																	))}
																</ul>
															</div>
														</div>
													)
												)}
											</div>
										</div>

										<div>
											<h4 className="mb-3 font-medium">Market Data</h4>
											<div className="space-y-3">
												<div className="rounded-lg border p-3">
													<p className="font-medium">Demand Score</p>
													<div className="mt-1 flex items-center gap-2">
														<Progress
															value={mlAnalytics.insights.marketInsights.demandScore * 100}
															className="flex-1"
														/>
														<span className="text-sm">
															{Math.round(mlAnalytics.insights.marketInsights.demandScore * 100)}%
														</span>
													</div>
												</div>

												<div className="rounded-lg border p-3">
													<p className="font-medium">Price Recommendation</p>
													<p className="text-green-600 text-lg">
														KSh{" "}
														{mlAnalytics.insights.marketInsights.priceRecommendation.toLocaleString()}
													</p>
												</div>

												<div className="rounded-lg border p-3">
													<p className="font-medium">Optimal Listing</p>
													<p className="text-sm">
														{format(
															new Date(mlAnalytics.insights.marketInsights.optimalListingTime),
															"PPP"
														)}
													</p>
												</div>
											</div>
										</div>
									</div>
								</CardContent>
							</Card>
						)}
					</TabsContent>
				)}

				{/* Conversions Tab */}
				<TabsContent value="conversions" className="space-y-4">
					<div className="grid grid-cols-2 gap-4 md:grid-cols-5">
						<Card>
							<CardContent className="p-4 text-center">
								<p className="font-bold text-xl">{analytics.conversionMetrics.inquiries}</p>
								<p className="text-muted-foreground text-sm">Inquiries</p>
							</CardContent>
						</Card>

						<Card>
							<CardContent className="p-4 text-center">
								<p className="font-bold text-xl">{analytics.conversionMetrics.bookings}</p>
								<p className="text-muted-foreground text-sm">Bookings</p>
							</CardContent>
						</Card>

						<Card>
							<CardContent className="p-4 text-center">
								<p className="font-bold text-xl">{analytics.conversionMetrics.phoneClicks}</p>
								<p className="text-muted-foreground text-sm">Phone Clicks</p>
							</CardContent>
						</Card>

						<Card>
							<CardContent className="p-4 text-center">
								<p className="font-bold text-xl">{analytics.conversionMetrics.emailClicks}</p>
								<p className="text-muted-foreground text-sm">Email Clicks</p>
							</CardContent>
						</Card>

						<Card>
							<CardContent className="p-4 text-center">
								<p className="font-bold text-xl">{analytics.conversionMetrics.whatsappClicks}</p>
								<p className="text-muted-foreground text-sm">WhatsApp</p>
							</CardContent>
						</Card>
					</div>
				</TabsContent>
			</Tabs>
		</div>
	);
};

// Loading skeleton
const AnalyticsSkeleton: React.FC = () => {
	return (
		<div className="space-y-6">
			{/* Overview cards skeleton */}
			<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
				{Array.from({ length: 4 }).map((_, i) => (
					<Card key={i}>
						<CardContent className="p-4">
							<div className="flex items-center justify-between">
								<div className="space-y-2">
									<div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
									<div className="h-8 w-16 animate-pulse rounded bg-gray-200" />
									<div className="h-3 w-24 animate-pulse rounded bg-gray-200" />
								</div>
								<div className="h-8 w-8 animate-pulse rounded bg-gray-200" />
							</div>
						</CardContent>
					</Card>
				))}
			</div>

			{/* Charts skeleton */}
			<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
				<Card>
					<CardHeader>
						<div className="h-6 w-32 animate-pulse rounded bg-gray-200" />
					</CardHeader>
					<CardContent>
						<div className="h-48 animate-pulse rounded bg-gray-100" />
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<div className="h-6 w-32 animate-pulse rounded bg-gray-200" />
					</CardHeader>
					<CardContent>
						<div className="h-48 animate-pulse rounded bg-gray-100" />
					</CardContent>
				</Card>
			</div>
		</div>
	);
};

export default TourAnalyticsDashboard;
