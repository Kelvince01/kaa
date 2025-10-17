/**
 * Tour Management Dashboard Component
 * Displays and manages all virtual tours for a property
 */

"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@kaa/ui/components/card";
import { Button } from "@kaa/ui/components/button";
import { Badge } from "@kaa/ui/components/badge";
import { Input } from "@kaa/ui/components/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@kaa/ui/components/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@kaa/ui/components/tabs";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@kaa/ui/components/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@kaa/ui/components/dropdown-menu";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@kaa/ui/components/tooltip";
import {
	Plus,
	Search,
	Filter,
	MoreVertical,
	Edit,
	Trash2,
	Copy,
	Share,
	Eye,
	Play,
	Settings,
	BarChart3,
	Users,
	Zap,
	Smartphone,
	Monitor,
	Tablet,
	Activity,
	TrendingUp,
	Clock,
	MapPin,
	Camera,
	Video,
	Box,
	Glasses,
	Navigation,
	Plane,
	Accessibility,
	Globe,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useVirtualTours, useServiceCapabilities, useTourAnalytics } from "../virtual-tour.queries";
import {
	useDeleteVirtualTour,
	usePublishVirtualTour,
	useDuplicateVirtualTour,
	useGenerateSmartConnections,
} from "../virtual-tour.mutations";
import { useVirtualTourState, useVirtualTourStore } from "../virtual-tour.store";
import { TourType, TourStatus, type VirtualTour } from "../virtual-tour.type";
import CreateTourForm from "./create-tour-form";
import VirtualTourViewer from "./virtual-tour-viewer";

interface TourManagementDashboardProps {
	propertyId: string;
}

export const TourManagementDashboard: React.FC<TourManagementDashboardProps> = ({ propertyId }) => {
	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState<TourStatus | "all">("all");
	const [typeFilter, setTypeFilter] = useState<TourType | "all">("all");
	const [showCreateForm, setShowCreateForm] = useState(false);
	const [selectedTour, setSelectedTour] = useState<VirtualTour | null>(null);

	// Store state
	// const { tours, filterBy, setTours, setFilterBy, advancedMode } = useVirtualTourState();

	const tours = useVirtualTourStore((state) => state.tours);
	const filterBy = useVirtualTourStore((state) => state.filterBy);
	const setTours = useVirtualTourStore((state) => state.setTours);
	const setFilterBy = useVirtualTourStore((state) => state.setFilterBy);
	const advancedMode = useVirtualTourStore((state) => state.advancedMode);

	// Queries
	const { data: toursResponse, isLoading } = useVirtualTours(propertyId, {
		status: statusFilter !== "all" ? statusFilter : undefined,
		type: typeFilter !== "all" ? typeFilter : undefined,
	});

	const { data: capabilities } = useServiceCapabilities();

	// Mutations
	const deleteTourMutation = useDeleteVirtualTour();
	const publishTourMutation = usePublishVirtualTour();
	const duplicateTourMutation = useDuplicateVirtualTour();
	const generateConnectionsMutation = useGenerateSmartConnections();

	// Update tours when data loads
	useEffect(() => {
		if (toursResponse?.data.tours) {
			setTours(toursResponse.data.tours);
		}
	}, [toursResponse, setTours]);

	// Filter tours based on search
	const filteredTours = tours.filter((tour) => {
		if (
			searchQuery &&
			!tour.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
			!tour.description.toLowerCase().includes(searchQuery.toLowerCase())
		) {
			return false;
		}
		return true;
	});

	// Group tours by status for better organization
	const groupedTours = {
		published: filteredTours.filter((t) => t.status === TourStatus.PUBLISHED),
		draft: filteredTours.filter((t) => t.status === TourStatus.DRAFT),
		processing: filteredTours.filter((t) => t.status === TourStatus.PROCESSING),
		failed: filteredTours.filter((t) => t.status === TourStatus.FAILED),
	};

	const getTourTypeIcon = (type: TourType) => {
		switch (type) {
			case TourType.PHOTO_360:
				return <Camera className="h-4 w-4" />;
			case TourType.VIDEO_360:
				return <Video className="h-4 w-4" />;
			case TourType.THREE_D_MODEL:
				return <Box className="h-4 w-4" />;
			case TourType.VIRTUAL_REALITY:
				return <Glasses className="h-4 w-4" />;
			case TourType.AUGMENTED_REALITY:
				return <Smartphone className="h-4 w-4" />;
			case TourType.INTERACTIVE_WALKTHROUGH:
				return <Navigation className="h-4 w-4" />;
			case TourType.DRONE_AERIAL:
				return <Plane className="h-4 w-4" />;
			default:
				return <Camera className="h-4 w-4" />;
		}
	};

	const getStatusColor = (status: TourStatus) => {
		switch (status) {
			case TourStatus.PUBLISHED:
				return "default";
			case TourStatus.DRAFT:
				return "outline";
			case TourStatus.PROCESSING:
				return "secondary";
			case TourStatus.FAILED:
				return "destructive";
			case TourStatus.ARCHIVED:
				return "outline";
			default:
				return "outline";
		}
	};

	const handleTourAction = async (action: string, tour: VirtualTour) => {
		switch (action) {
			case "edit":
				setSelectedTour(tour);
				break;
			case "delete":
				if (window.confirm("Are you sure you want to delete this tour?")) {
					deleteTourMutation.mutate(tour.id);
				}
				break;
			case "publish":
				publishTourMutation.mutate(tour.id);
				break;
			case "duplicate":
				duplicateTourMutation.mutate({
					tourId: tour.id,
					title: `Copy of ${tour.title}`,
				});
				break;
			case "smart-connections":
				generateConnectionsMutation.mutate(tour.id);
				break;
			case "share":
				// Implement sharing logic
				navigator.share?.({
					title: tour.title,
					text: tour.description,
					url: `${window.location.origin}/tours/${tour.id}`,
				});
				break;
		}
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h2 className="font-bold text-2xl">Virtual Tours</h2>
					<p className="text-muted-foreground">Manage immersive virtual tours for your property</p>
				</div>

				<div className="flex gap-2">
					{/* Advanced Mode Indicator */}
					{advancedMode && (
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger>
									<Badge variant="outline" className="flex items-center gap-1">
										<Zap className="h-3 w-3" />
										Advanced Mode
									</Badge>
								</TooltipTrigger>
								<TooltipContent>
									<p>AI features and advanced analytics enabled</p>
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					)}

					<Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
						<DialogTrigger asChild>
							<Button>
								<Plus className="mr-2 h-4 w-4" />
								Create Tour
							</Button>
						</DialogTrigger>
						<DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
							<DialogHeader>
								<DialogTitle>Create Virtual Tour</DialogTitle>
							</DialogHeader>
							<CreateTourForm
								propertyId={propertyId}
								onSuccess={() => setShowCreateForm(false)}
								onCancel={() => setShowCreateForm(false)}
							/>
						</DialogContent>
					</Dialog>
				</div>
			</div>

			{/* Filters */}
			<div className="flex items-center gap-4">
				<div className="relative max-w-sm flex-1">
					<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 transform text-muted-foreground" />
					<Input
						placeholder="Search tours..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="pl-10"
					/>
				</div>

				<Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
					<SelectTrigger className="w-40">
						<SelectValue placeholder="Status" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All Status</SelectItem>
						<SelectItem value="published">Published</SelectItem>
						<SelectItem value="draft">Draft</SelectItem>
						<SelectItem value="processing">Processing</SelectItem>
						<SelectItem value="failed">Failed</SelectItem>
					</SelectContent>
				</Select>

				<Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as any)}>
					<SelectTrigger className="w-48">
						<SelectValue placeholder="Tour Type" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All Types</SelectItem>
						<SelectItem value="photo_360">Photo 360°</SelectItem>
						<SelectItem value="video_360">Video 360°</SelectItem>
						<SelectItem value="3d_model">3D Model</SelectItem>
						<SelectItem value="virtual_reality">Virtual Reality</SelectItem>
						<SelectItem value="augmented_reality">Augmented Reality</SelectItem>
						<SelectItem value="interactive_walkthrough">Interactive</SelectItem>
						<SelectItem value="drone_aerial">Drone Aerial</SelectItem>
					</SelectContent>
				</Select>
			</div>

			{/* Tours Grid */}
			<Tabs defaultValue="grid" className="space-y-4">
				<TabsList>
					<TabsTrigger value="grid">Grid View</TabsTrigger>
					<TabsTrigger value="list">List View</TabsTrigger>
					{advancedMode && <TabsTrigger value="analytics">Analytics</TabsTrigger>}
				</TabsList>

				<TabsContent value="grid" className="space-y-4">
					{/* Tours by Status */}
					{Object.entries(groupedTours).map(
						([status, statusTours]) =>
							statusTours.length > 0 && (
								<div key={status} className="space-y-3">
									<h3 className="font-semibold text-lg capitalize">
										{status} Tours ({statusTours.length})
									</h3>

									<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
										{statusTours.map((tour) => (
											<TourCard
												key={tour.id}
												tour={tour}
												capabilities={capabilities}
												onAction={handleTourAction}
												onView={() => setSelectedTour(tour)}
											/>
										))}
									</div>
								</div>
							)
					)}

					{filteredTours.length === 0 && !isLoading && (
						<div className="py-12 text-center">
							<Camera className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
							<h3 className="mb-2 font-semibold text-lg">No Virtual Tours</h3>
							<p className="mb-4 text-muted-foreground">
								Create your first virtual tour to showcase this property
							</p>
							<Button onClick={() => setShowCreateForm(true)}>
								<Plus className="mr-2 h-4 w-4" />
								Create Virtual Tour
							</Button>
						</div>
					)}
				</TabsContent>

				{/* Analytics Tab */}
				{advancedMode && (
					<TabsContent value="analytics">
						<TourAnalyticsDashboard tours={filteredTours} />
					</TabsContent>
				)}
			</Tabs>

			{/* Tour Viewer Modal */}
			{selectedTour && (
				<Dialog open={!!selectedTour} onOpenChange={() => setSelectedTour(null)}>
					<DialogContent className="max-h-[90vh] max-w-6xl p-0">
						<VirtualTourViewer
							tourId={selectedTour.id}
							propertyId={propertyId}
							enableCollaboration={capabilities?.features.realTimeCollaboration}
							enableXR={capabilities?.features.webXR}
							showControls={true}
							className="overflow-hidden rounded-lg"
						/>
					</DialogContent>
				</Dialog>
			)}
		</div>
	);
};

// Individual Tour Card Component
interface TourCardProps {
	tour: VirtualTour;
	capabilities?: any;
	onAction: (action: string, tour: VirtualTour) => void;
	onView: () => void;
}

const TourCard: React.FC<TourCardProps> = ({ tour, capabilities, onAction, onView }) => {
	const { data: analytics } = useTourAnalytics(tour.id, capabilities?.features.mlAnalytics);

	const generateConnectionsMutation = useGenerateSmartConnections();

	const getTourTypeIcon = (type: TourType) => {
		switch (type) {
			case TourType.PHOTO_360:
				return <Camera className="h-4 w-4" />;
			case TourType.VIDEO_360:
				return <Video className="h-4 w-4" />;
		}
	};

	const getStatusColor = (status: TourStatus) => {
		switch (status) {
			case TourStatus.PUBLISHED:
				return "default";
			case TourStatus.DRAFT:
				return "outline";
		}
	};

	return (
		<Card className="group transition-shadow hover:shadow-md">
			<div className="relative aspect-video overflow-hidden rounded-t-lg bg-gray-100">
				{/* Thumbnail */}
				{tour.scenes[0]?.thumbnailUrl ? (
					<img
						src={tour.scenes[0].thumbnailUrl}
						alt={tour.title}
						className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
					/>
				) : (
					<div className="flex h-full w-full items-center justify-center bg-gray-200">
						{getTourTypeIcon(tour.type)}
					</div>
				)}

				{/* Overlay Info */}
				<div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/20">
					<div className="absolute top-2 left-2">
						<Badge variant="secondary" className="bg-black/80 text-white">
							{getTourTypeIcon(tour.type)}
							<span className="ml-1">{tour.type.replace("_", " ")}</span>
						</Badge>
					</div>

					<div className="absolute top-2 right-2">
						<Badge variant={getStatusColor(tour.status as TourStatus)}>{tour.status}</Badge>
					</div>

					{/* Play Button Overlay */}
					<div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
						<Button
							size="lg"
							onClick={onView}
							className="h-12 w-12 rounded-full bg-white/90 text-black hover:bg-white"
						>
							<Play className="h-6 w-6" />
						</Button>
					</div>
				</div>

				{/* Scene Count */}
				<div className="absolute bottom-2 left-2">
					<Badge variant="outline" className="border-white/20 bg-black/80 text-white">
						{tour.scenes.length} scenes
					</Badge>
				</div>

				{/* Duration */}
				{analytics && (
					<div className="absolute right-2 bottom-2">
						<Badge variant="outline" className="border-white/20 bg-black/80 text-white">
							<Clock className="mr-1 h-3 w-3" />
							{Math.round(analytics.averageDuration / 60000)}min
						</Badge>
					</div>
				)}
			</div>

			<CardContent className="p-4">
				<div className="space-y-3">
					{/* Title and Description */}
					<div>
						<h3 className="line-clamp-1 font-semibold">{tour.title}</h3>
						<p className="mt-1 line-clamp-2 text-muted-foreground text-sm">{tour.description}</p>
					</div>

					{/* Metadata */}
					<div className="flex items-center gap-3 text-muted-foreground text-xs">
						<div className="flex items-center gap-1">
							<MapPin className="h-3 w-3" />
							<span>{tour.metadata.county}</span>
						</div>
						<div className="flex items-center gap-1">
							<Eye className="h-3 w-3" />
							<span>{tour.analytics.totalViews}</span>
						</div>
						<div className="flex items-center gap-1">
							<Clock className="h-3 w-3" />
							<span>{formatDistanceToNow(new Date(tour.updatedAt))} ago</span>
						</div>
					</div>

					{/* Device Analytics */}
					{analytics && (
						<div className="flex gap-2">
							{analytics.deviceBreakdown.mobile > 0 && (
								<div className="flex items-center gap-1 text-muted-foreground text-xs">
									<Smartphone className="h-3 w-3" />
									<span>{analytics.deviceBreakdown.mobile}</span>
								</div>
							)}
							{analytics.deviceBreakdown.desktop > 0 && (
								<div className="flex items-center gap-1 text-muted-foreground text-xs">
									<Monitor className="h-3 w-3" />
									<span>{analytics.deviceBreakdown.desktop}</span>
								</div>
							)}
							{analytics.deviceBreakdown.tablet > 0 && (
								<div className="flex items-center gap-1 text-muted-foreground text-xs">
									<Tablet className="h-3 w-3" />
									<span>{analytics.deviceBreakdown.tablet}</span>
								</div>
							)}
						</div>
					)}

					{/* Actions */}
					<div className="flex items-center justify-between border-t pt-2">
						<div className="flex gap-1">
							<Button size="sm" variant="ghost" onClick={onView}>
								<Eye className="mr-1 h-3 w-3" />
								View
							</Button>

							{capabilities?.features.aiAnalysis && tour.scenes.length > 1 && (
								<Button
									size="sm"
									variant="ghost"
									onClick={() => onAction("smart-connections", tour)}
									disabled={generateConnectionsMutation.isPending}
								>
									<Zap className="mr-1 h-3 w-3" />
									AI Connect
								</Button>
							)}
						</div>

						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button size="sm" variant="ghost">
									<MoreVertical className="h-4 w-4" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuItem onClick={() => onAction("edit", tour)}>
									<Edit className="mr-2 h-4 w-4" />
									Edit
								</DropdownMenuItem>

								{tour.status === TourStatus.DRAFT && (
									<DropdownMenuItem onClick={() => onAction("publish", tour)}>
										<Share className="mr-2 h-4 w-4" />
										Publish
									</DropdownMenuItem>
								)}

								<DropdownMenuItem onClick={() => onAction("duplicate", tour)}>
									<Copy className="mr-2 h-4 w-4" />
									Duplicate
								</DropdownMenuItem>

								<DropdownMenuItem onClick={() => onAction("share", tour)}>
									<Share className="mr-2 h-4 w-4" />
									Share
								</DropdownMenuItem>

								<DropdownMenuItem onClick={() => onAction("delete", tour)} className="text-red-600">
									<Trash2 className="mr-2 h-4 w-4" />
									Delete
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</div>
			</CardContent>
		</Card>
	);
};

// Tour Analytics Dashboard Component
interface TourAnalyticsDashboardProps {
	tours: VirtualTour[];
}

const TourAnalyticsDashboard: React.FC<TourAnalyticsDashboardProps> = ({ tours }) => {
	const totalViews = tours.reduce((sum, tour) => sum + tour.analytics.totalViews, 0);
	const totalTours = tours.length;
	const avgDuration =
		tours.reduce((sum, tour) => sum + tour.analytics.averageDuration, 0) / tours.length || 0;
	const avgCompletionRate =
		tours.reduce((sum, tour) => sum + tour.analytics.completionRate, 0) / tours.length || 0;

	return (
		<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
			{/* Overview Cards */}
			<Card>
				<CardContent className="p-4">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-muted-foreground text-sm">Total Views</p>
							<p className="font-bold text-2xl">{totalViews.toLocaleString()}</p>
						</div>
						<Eye className="h-8 w-8 text-blue-500" />
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardContent className="p-4">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-muted-foreground text-sm">Active Tours</p>
							<p className="font-bold text-2xl">{totalTours}</p>
						</div>
						<Camera className="h-8 w-8 text-green-500" />
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardContent className="p-4">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-muted-foreground text-sm">Avg Duration</p>
							<p className="font-bold text-2xl">{Math.round(avgDuration / 60000)}min</p>
						</div>
						<Clock className="h-8 w-8 text-purple-500" />
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardContent className="p-4">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-muted-foreground text-sm">Completion Rate</p>
							<p className="font-bold text-2xl">{Math.round(avgCompletionRate * 100)}%</p>
						</div>
						<TrendingUp className="h-8 w-8 text-orange-500" />
					</div>
				</CardContent>
			</Card>
		</div>
	);
};

export default TourManagementDashboard;
