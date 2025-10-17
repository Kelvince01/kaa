"use client";

import { Alert, AlertDescription } from "@kaa/ui/components/alert";
import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@kaa/ui/components/card";
import { Progress } from "@kaa/ui/components/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@kaa/ui/components/tabs";
import { Clock, MapPin, Navigation, Plus, RefreshCw, Search, TrendingUp, Zap } from "lucide-react";
import { useState } from "react";
import {
	useAmenityScore,
	useDiscoverPropertyAmenities,
	usePropertyAmenities,
} from "../amenity.queries";
import { AmenityCategory, GroupedAmenities } from "../amenity.type";
import { AmenityCard } from "./AmenityCard";

interface PropertyAmenitiesViewProps {
	propertyId: string;
	propertyLocation?: {
		latitude: number;
		longitude: number;
		county: string;
		address: string;
	};
	radius?: number;
	onDiscoverMore?: () => void;
}

/**
 * Get category display info
 */
const getCategoryInfo = (category: AmenityCategory) => {
	const info: Record<AmenityCategory, { icon: string; color: string; priority: number }> = {
		[AmenityCategory.EDUCATION]: { icon: "🎓", color: "bg-blue-100 text-blue-800", priority: 1 },
		[AmenityCategory.HEALTHCARE]: { icon: "🏥", color: "bg-red-100 text-red-800", priority: 2 },
		[AmenityCategory.TRANSPORT]: { icon: "🚌", color: "bg-green-100 text-green-800", priority: 3 },
		[AmenityCategory.SHOPPING]: { icon: "🛒", color: "bg-purple-100 text-purple-800", priority: 4 },
		[AmenityCategory.BANKING]: { icon: "🏦", color: "bg-yellow-100 text-yellow-800", priority: 5 },
		[AmenityCategory.ENTERTAINMENT]: {
			icon: "🎬",
			color: "bg-pink-100 text-pink-800",
			priority: 6,
		},
		[AmenityCategory.RELIGIOUS]: {
			icon: "⛪",
			color: "bg-indigo-100 text-indigo-800",
			priority: 7,
		},
		[AmenityCategory.GOVERNMENT]: { icon: "🏛️", color: "bg-gray-100 text-gray-800", priority: 8 },
		[AmenityCategory.UTILITIES]: {
			icon: "⚡",
			color: "bg-orange-100 text-orange-800",
			priority: 9,
		},
		[AmenityCategory.FOOD]: { icon: "🍽️", color: "bg-amber-100 text-amber-800", priority: 10 },
		[AmenityCategory.SECURITY]: { icon: "🛡️", color: "bg-slate-100 text-slate-800", priority: 11 },
		[AmenityCategory.SPORTS]: {
			icon: "⚽",
			color: "bg-emerald-100 text-emerald-800",
			priority: 12,
		},
	};
	return info[category] || { icon: "📍", color: "bg-gray-100 text-gray-800", priority: 99 };
};

export function PropertyAmenitiesView({
	propertyId,
	propertyLocation,
	radius = 2,
	onDiscoverMore,
}: PropertyAmenitiesViewProps) {
	const [selectedCategory, setSelectedCategory] = useState<string>("all");

	// Queries
	const {
		data: amenitiesData,
		isLoading: amenitiesLoading,
		refetch: refetchAmenities,
	} = usePropertyAmenities(propertyId, radius);

	const { data: scoreData, isLoading: scoreLoading } = useAmenityScore(
		propertyLocation?.latitude || 0,
		propertyLocation?.longitude || 0,
		radius
	);

	const discoverMutation = useDiscoverPropertyAmenities();

	const amenityGroups = amenitiesData || [];
	const filteredGroups =
		selectedCategory === "all"
			? amenityGroups
			: amenityGroups.filter((group) => group.category === selectedCategory);

	// Sort groups by priority
	const sortedGroups = [...filteredGroups].sort((a, b) => {
		const aInfo = getCategoryInfo(a.category);
		const bInfo = getCategoryInfo(b.category);
		return aInfo.priority - bInfo.priority;
	});

	const totalAmenities = amenityGroups.reduce((sum, group) => sum + group.count, 0);

	const handleDiscoverAmenities = async () => {
		try {
			await discoverMutation.mutateAsync({
				propertyId,
				radius: radius * 1000, // Convert to meters
				autoSave: true,
			});
			refetchAmenities();
		} catch (error) {
			// Error handled by mutation
		}
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h3 className="font-semibold text-xl">Nearby Amenities</h3>
					<p className="text-muted-foreground text-sm">Within {radius}km of this property</p>
				</div>
				<div className="flex space-x-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => refetchAmenities()}
						disabled={amenitiesLoading}
					>
						<RefreshCw className={`mr-2 h-4 w-4 ${amenitiesLoading ? "animate-spin" : ""}`} />
						Refresh
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={handleDiscoverAmenities}
						disabled={discoverMutation.isPending || !propertyLocation}
					>
						{discoverMutation.isPending ? (
							<RefreshCw className="mr-2 h-4 w-4 animate-spin" />
						) : (
							<Search className="mr-2 h-4 w-4" />
						)}
						Discover More
					</Button>
				</div>
			</div>

			{/* Amenity Score */}
			{scoreData && (
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center space-x-2">
							<TrendingUp className="h-5 w-5" />
							<span>Location Score</span>
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							<div className="flex items-center justify-between">
								<span className="font-medium text-sm">Overall Amenity Score</span>
								<span className="font-bold text-2xl">{scoreData.score}/100</span>
							</div>
							<Progress value={scoreData.score} className="h-2" />
							<p className="text-muted-foreground text-xs">
								Based on {scoreData.totalAmenities} nearby amenities across{" "}
								{Object.keys(scoreData.breakdown).length} categories
							</p>
						</div>
					</CardContent>
				</Card>
			)}

			{/* Summary Stats */}
			<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
				<Card>
					<CardContent className="p-4 text-center">
						<div className="font-bold text-2xl">{totalAmenities}</div>
						<div className="text-muted-foreground text-xs">Total Amenities</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="p-4 text-center">
						<div className="font-bold text-2xl">{amenityGroups.length}</div>
						<div className="text-muted-foreground text-xs">Categories</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="p-4 text-center">
						<div className="font-bold text-2xl">{radius}km</div>
						<div className="text-muted-foreground text-xs">Search Radius</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="p-4 text-center">
						<div className="font-bold text-2xl">
							{amenityGroups.filter((g) => g.amenities.some((a) => a.verified)).length}
						</div>
						<div className="text-muted-foreground text-xs">Verified</div>
					</CardContent>
				</Card>
			</div>

			{/* Category Filter Tabs */}
			<Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
				<TabsList className="grid w-full grid-cols-4 lg:grid-cols-6">
					<TabsTrigger value="all" className="text-xs">
						All ({totalAmenities})
					</TabsTrigger>
					{amenityGroups.slice(0, 5).map((group) => {
						const categoryInfo = getCategoryInfo(group.category);
						return (
							<TabsTrigger key={group.category} value={group.category} className="text-xs">
								{categoryInfo.icon} {group.count}
							</TabsTrigger>
						);
					})}
				</TabsList>

				<TabsContent value="all" className="mt-6">
					{amenitiesLoading ? (
						<div className="space-y-6">
							{Array.from({ length: 3 }).map((_, i) => (
								<Card key={i} className="animate-pulse">
									<CardHeader>
										<div className="h-4 w-1/4 rounded bg-gray-200" />
									</CardHeader>
									<CardContent>
										<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
											{Array.from({ length: 3 }).map((_, j) => (
												<div key={j} className="h-32 rounded bg-gray-200" />
											))}
										</div>
									</CardContent>
								</Card>
							))}
						</div>
					) : sortedGroups.length > 0 ? (
						<div className="space-y-6">
							{sortedGroups.map((group) => {
								const categoryInfo = getCategoryInfo(group.category);
								return (
									<Card key={group.category}>
										<CardHeader>
											<CardTitle className="flex items-center justify-between">
												<div className="flex items-center space-x-2">
													<span className="text-lg">{categoryInfo.icon}</span>
													<span className="capitalize">{group.category.replace(/_/g, " ")}</span>
													<Badge variant="outline" className={categoryInfo.color}>
														{group.count} found
													</Badge>
												</div>
											</CardTitle>
										</CardHeader>
										<CardContent>
											<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
												{group.amenities.map((amenity) => (
													<AmenityCard
														key={amenity._id}
														amenity={amenity}
														showDistance={true}
														showApprovalStatus={false}
														showActions={false}
													/>
												))}
											</div>
										</CardContent>
									</Card>
								);
							})}
						</div>
					) : (
						<Alert>
							<MapPin className="h-4 w-4" />
							<AlertDescription>
								No amenities found within {radius}km of this property.
								<Button
									variant="link"
									className="ml-2 h-auto p-0"
									onClick={handleDiscoverAmenities}
									disabled={discoverMutation.isPending || !propertyLocation}
								>
									Discover amenities automatically
								</Button>
							</AlertDescription>
						</Alert>
					)}
				</TabsContent>

				{/* Individual category tabs */}
				{amenityGroups.map((group) => (
					<TabsContent key={group.category} value={group.category} className="mt-6">
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center space-x-2">
									<span className="text-lg">{getCategoryInfo(group.category).icon}</span>
									<span className="capitalize">
										{group.category.replace(/_/g, " ")} ({group.count})
									</span>
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
									{group.amenities.map((amenity) => (
										<AmenityCard
											key={amenity._id}
											amenity={amenity}
											showDistance={true}
											showApprovalStatus={false}
											showActions={false}
										/>
									))}
								</div>
							</CardContent>
						</Card>
					</TabsContent>
				))}
			</Tabs>
		</div>
	);
}
