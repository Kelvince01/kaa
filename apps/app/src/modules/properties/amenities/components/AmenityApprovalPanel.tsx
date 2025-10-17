"use client";

import { Alert, AlertDescription } from "@kaa/ui/components/alert";
import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@kaa/ui/components/card";
import { Checkbox } from "@kaa/ui/components/checkbox";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@kaa/ui/components/dialog";
import { Input } from "@kaa/ui/components/input";
import { Label } from "@kaa/ui/components/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@kaa/ui/components/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@kaa/ui/components/tabs";
import { Textarea } from "@kaa/ui/components/textarea";
import {
	AlertTriangle,
	CheckCircle,
	Clock,
	Filter,
	MapPin,
	RefreshCw,
	Search,
	XCircle,
} from "lucide-react";
import { useState } from "react";
import {
	useAmenitiesByDiscoveryStatus,
	useApprovalStats,
	useApproveAmenity,
	useBulkApproveAmenities,
	usePendingAmenities,
	useRejectAmenity,
	useVerificationStats,
} from "../amenity.queries";
import type { Amenity, AmenitySource } from "../amenity.type";
import { AmenityCard } from "./AmenityCard";
import { VerificationDialog } from "./VerificationDialog";

interface AmenityApprovalPanelProps {
	county?: string;
	onAmenityApproved?: (amenity: Amenity) => void;
	onAmenityRejected?: (amenity: Amenity) => void;
}

export function AmenityApprovalPanel({
	county,
	onAmenityApproved,
	onAmenityRejected,
}: AmenityApprovalPanelProps) {
	const [selectedSource, setSelectedSource] = useState<AmenitySource | "all">("all");
	const [selectedAmenities, setSelectedAmenities] = useState<Set<string>>(new Set());
	const [searchQuery, setSearchQuery] = useState("");
	const [discoveryFilter, setDiscoveryFilter] = useState<"all" | "auto" | "manual">("all");
	const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
	const [rejectingAmenity, setRejectingAmenity] = useState<Amenity | null>(null);
	const [rejectionReason, setRejectionReason] = useState("");
	const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
	const [verifyingAmenity, setVerifyingAmenity] = useState<Amenity | null>(null);

	// Queries
	const {
		data: pendingData,
		isLoading,
		refetch,
	} = usePendingAmenities({
		county,
		source: selectedSource === "all" ? undefined : selectedSource,
		limit: 50,
	});

	const { data: approvalStats } = useApprovalStats(county);
	const { data: verificationStats } = useVerificationStats(county);

	// Mutations
	const approveMutation = useApproveAmenity();
	const rejectMutation = useRejectAmenity();
	const bulkApproveMutation = useBulkApproveAmenities();

	const amenities = pendingData?.amenities || [];
	const filteredAmenities = amenities.filter((amenity) => {
		// Search filter
		const matchesSearch =
			!searchQuery ||
			amenity.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			amenity.type.toLowerCase().includes(searchQuery.toLowerCase());

		// Discovery filter
		const matchesDiscovery =
			discoveryFilter === "all" ||
			(discoveryFilter === "auto" && amenity.isAutoDiscovered) ||
			(discoveryFilter === "manual" && !amenity.isAutoDiscovered);

		return matchesSearch && matchesDiscovery;
	});

	const handleApprove = async (amenityId: string) => {
		try {
			const result = await approveMutation.mutateAsync({ amenityId });
			onAmenityApproved?.(result);
			setSelectedAmenities((prev) => {
				const newSet = new Set(prev);
				newSet.delete(amenityId);
				return newSet;
			});
		} catch (error) {
			// Error handled by mutation
		}
	};

	const handleReject = (amenity: Amenity) => {
		setRejectingAmenity(amenity);
		setRejectDialogOpen(true);
	};

	const handleVerify = (amenity: Amenity) => {
		setVerifyingAmenity(amenity);
		setVerifyDialogOpen(true);
	};

	const confirmReject = async () => {
		if (!rejectingAmenity || !rejectionReason.trim()) return;

		try {
			const result = await rejectMutation.mutateAsync({
				amenityId: rejectingAmenity._id,
				reason: rejectionReason,
			});
			onAmenityRejected?.(result);
			setSelectedAmenities((prev) => {
				const newSet = new Set(prev);
				newSet.delete(rejectingAmenity._id);
				return newSet;
			});
			setRejectDialogOpen(false);
			setRejectingAmenity(null);
			setRejectionReason("");
		} catch (error) {
			// Error handled by mutation
		}
	};

	const handleBulkApprove = async () => {
		if (selectedAmenities.size === 0) return;

		try {
			await bulkApproveMutation.mutateAsync(Array.from(selectedAmenities));
			setSelectedAmenities(new Set());
		} catch (error) {
			// Error handled by mutation
		}
	};

	const handleSelectAll = () => {
		if (selectedAmenities.size === filteredAmenities.length) {
			setSelectedAmenities(new Set());
		} else {
			setSelectedAmenities(new Set(filteredAmenities.map((a) => a._id)));
		}
	};

	const handleSelectAmenity = (amenityId: string) => {
		setSelectedAmenities((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(amenityId)) {
				newSet.delete(amenityId);
			} else {
				newSet.add(amenityId);
			}
			return newSet;
		});
	};

	return (
		<div className="space-y-6">
			{/* Header with Stats */}
			<div className="flex items-center justify-between">
				<div>
					<h2 className="font-bold text-2xl">Amenity Approval</h2>
					<p className="text-muted-foreground">Review and approve auto-discovered amenities</p>
				</div>
				<Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
					<RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
					Refresh
				</Button>
			</div>

			{/* Approval Statistics */}
			{approvalStats && (
				<div className="grid grid-cols-1 gap-4 md:grid-cols-4">
					<Card>
						<CardContent className="p-4">
							<div className="flex items-center space-x-2">
								<AlertTriangle className="h-5 w-5 text-yellow-500" />
								<div>
									<p className="font-medium text-sm">Pending Approval</p>
									<p className="font-bold text-2xl">{approvalStats.pending}</p>
								</div>
							</div>
						</CardContent>
					</Card>
					<Card>
						<CardContent className="p-4">
							<div className="flex items-center space-x-2">
								<CheckCircle className="h-5 w-5 text-green-500" />
								<div>
									<p className="font-medium text-sm">Approved</p>
									<p className="font-bold text-2xl">{approvalStats.approved}</p>
								</div>
							</div>
						</CardContent>
					</Card>
					<Card>
						<CardContent className="p-4">
							<div className="flex items-center space-x-2">
								<XCircle className="h-5 w-5 text-red-500" />
								<div>
									<p className="font-medium text-sm">Rejected</p>
									<p className="font-bold text-2xl">{approvalStats.rejected}</p>
								</div>
							</div>
						</CardContent>
					</Card>
					{verificationStats && (
						<Card>
							<CardContent className="p-4">
								<div className="flex items-center space-x-2">
									<CheckCircle className="h-5 w-5 text-blue-500" />
									<div>
										<p className="font-medium text-sm">Verification Rate</p>
										<p className="font-bold text-2xl">{verificationStats.verificationRate}%</p>
									</div>
								</div>
							</CardContent>
						</Card>
					)}
				</div>
			)}

			{/* Filters and Search */}
			<Card>
				<CardHeader>
					<CardTitle className="text-lg">Filters</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex flex-col gap-4 md:flex-row">
						<div className="flex-1">
							<Label htmlFor="search">Search Amenities</Label>
							<div className="relative">
								<Search className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
								<Input
									id="search"
									placeholder="Search by name or type..."
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									className="pl-10"
								/>
							</div>
						</div>
						<div className="w-full md:w-48">
							<Label htmlFor="discovery">Discovery Type</Label>
							<Select
								value={discoveryFilter}
								onValueChange={(value) => setDiscoveryFilter(value as any)}
							>
								<SelectTrigger>
									<SelectValue placeholder="All types" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Types</SelectItem>
									<SelectItem value="auto">Auto-Discovered</SelectItem>
									<SelectItem value="manual">Manual Entry</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="w-full md:w-48">
							<Label htmlFor="source">Source</Label>
							<Select
								value={selectedSource}
								onValueChange={(value) => setSelectedSource(value as any)}
							>
								<SelectTrigger>
									<SelectValue placeholder="All sources" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Sources</SelectItem>
									<SelectItem value={"auto_discovered_google"}>Google Places</SelectItem>
									<SelectItem value={"auto_discovered_osm"}>OpenStreetMap</SelectItem>
									<SelectItem value={"user_submitted"}>User Submitted</SelectItem>
									<SelectItem value={"manual"}>Manual Entry</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Bulk Actions */}
			{filteredAmenities.length > 0 && (
				<Card>
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div className="flex items-center space-x-4">
								<Checkbox
									checked={selectedAmenities.size === filteredAmenities.length}
									onCheckedChange={handleSelectAll}
								/>
								<span className="text-sm">
									{selectedAmenities.size} of {filteredAmenities.length} selected
								</span>
							</div>
							{selectedAmenities.size > 0 && (
								<Button
									onClick={handleBulkApprove}
									disabled={bulkApproveMutation.isPending}
									className="bg-green-600 hover:bg-green-700"
								>
									<CheckCircle className="mr-2 h-4 w-4" />
									Approve Selected ({selectedAmenities.size})
								</Button>
							)}
						</div>
					</CardContent>
				</Card>
			)}

			{/* Amenities List */}
			<div className="space-y-4">
				{isLoading ? (
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
						{Array.from({ length: 6 }).map((_, i) => (
							<Card key={i} className="animate-pulse">
								<CardHeader>
									<div className="h-4 w-3/4 rounded bg-gray-200" />
									<div className="h-3 w-1/2 rounded bg-gray-200" />
								</CardHeader>
								<CardContent>
									<div className="space-y-2">
										<div className="h-3 rounded bg-gray-200" />
										<div className="h-3 w-2/3 rounded bg-gray-200" />
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				) : filteredAmenities.length > 0 ? (
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
						{filteredAmenities.map((amenity) => (
							<div key={amenity._id} className="relative">
								<Checkbox
									checked={selectedAmenities.has(amenity._id)}
									onCheckedChange={() => handleSelectAmenity(amenity._id)}
									className="absolute top-2 left-2 z-10"
								/>
								<AmenityCard
									amenity={amenity}
									showApprovalStatus={true}
									showActions={true}
									onApprove={handleApprove}
									onReject={() => handleReject(amenity)}
									onView={handleVerify}
									className="ml-6"
								/>
							</div>
						))}
					</div>
				) : (
					<Alert>
						<AlertTriangle className="h-4 w-4" />
						<AlertDescription>
							No pending amenities found.
							{searchQuery && " Try adjusting your search or filters."}
						</AlertDescription>
					</Alert>
				)}
			</div>

			{/* Reject Dialog */}
			<Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Reject Amenity</DialogTitle>
						<DialogDescription>
							Please provide a reason for rejecting "{rejectingAmenity?.name}".
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4">
						<div>
							<Label htmlFor="rejection-reason">Rejection Reason</Label>
							<Textarea
								id="rejection-reason"
								placeholder="e.g., Incorrect location, duplicate entry, outdated information..."
								value={rejectionReason}
								onChange={(e) => setRejectionReason(e.target.value)}
								rows={3}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => {
								setRejectDialogOpen(false);
								setRejectingAmenity(null);
								setRejectionReason("");
							}}
						>
							Cancel
						</Button>
						<Button
							variant="destructive"
							onClick={confirmReject}
							disabled={!rejectionReason.trim() || rejectMutation.isPending}
						>
							<XCircle className="mr-2 h-4 w-4" />
							Reject Amenity
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Enhanced Verification Dialog */}
			<VerificationDialog
				amenity={verifyingAmenity}
				open={verifyDialogOpen}
				onOpenChange={setVerifyDialogOpen}
				onVerified={async (amenity) => {
					setVerifyingAmenity(null);
					// Refresh data
					await refetch();
				}}
			/>
		</div>
	);
}
