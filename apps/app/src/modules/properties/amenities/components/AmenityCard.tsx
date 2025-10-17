"use client";

import { Avatar, AvatarFallback } from "@kaa/ui/components/avatar";
import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import { Card, CardContent, CardFooter, CardHeader } from "@kaa/ui/components/card";
import { cn } from "@kaa/ui/lib/utils";
import { AlertCircle, CheckCircle, Clock, Globe, MapPin, Phone, Star, XCircle } from "lucide-react";
import {
	type Amenity,
	AmenityApprovalStatus,
	AmenitySource,
	type AmenityWithDistance,
} from "../amenity.type";

interface AmenityCardProps {
	amenity: Amenity | AmenityWithDistance;
	showDistance?: boolean;
	showApprovalStatus?: boolean;
	showActions?: boolean;
	onApprove?: (amenityId: string) => void;
	onReject?: (amenityId: string) => void;
	onEdit?: (amenity: Amenity) => void;
	onView?: (amenity: Amenity) => void;
	className?: string;
}

/**
 * Get category icon based on amenity category
 */
const getCategoryIcon = (category: string): string => {
	const icons: Record<string, string> = {
		education: "🎓",
		healthcare: "🏥",
		shopping: "🛒",
		transport: "🚌",
		banking: "🏦",
		entertainment: "🎬",
		religious: "⛪",
		government: "🏛️",
		utilities: "⚡",
		food: "🍽️",
		security: "🛡️",
		sports: "⚽",
	};
	return icons[category] || "📍";
};

/**
 * Get source badge variant
 */
const getSourceBadgeVariant = (isAutoDiscovered: boolean): "default" | "secondary" | "outline" => {
	return isAutoDiscovered ? "secondary" : "default";
};

/**
 * Get verification level badge
 */
const getVerificationLevelBadge = (verificationLevel: string) => {
	const levels: Record<string, { variant: "default" | "secondary" | "outline"; color: string }> = {
		unverified: { variant: "outline", color: "text-gray-600" },
		basic: { variant: "secondary", color: "text-blue-600" },
		full: { variant: "default", color: "text-green-600" },
		community_verified: { variant: "default", color: "text-purple-600" },
	};
	return levels[verificationLevel] || levels.unverified;
};

/**
 * Get approval status icon and color
 */
const getApprovalStatusDisplay = (status: AmenityApprovalStatus) => {
	switch (status) {
		case AmenityApprovalStatus.APPROVED:
			return { icon: CheckCircle, color: "text-green-600", label: "Approved" };
		case AmenityApprovalStatus.REJECTED:
			return { icon: XCircle, color: "text-red-600", label: "Rejected" };
		case AmenityApprovalStatus.PENDING:
			return { icon: AlertCircle, color: "text-yellow-600", label: "Pending" };
		case AmenityApprovalStatus.NEEDS_REVIEW:
			return { icon: AlertCircle, color: "text-orange-600", label: "Needs Review" };
		default:
			return { icon: AlertCircle, color: "text-gray-600", label: "Unknown" };
	}
};

export function AmenityCard({
	amenity,
	showDistance = false,
	showApprovalStatus = false,
	showActions = false,
	onApprove,
	onReject,
	onEdit,
	onView,
	className,
}: AmenityCardProps) {
	const distance = "distance" in amenity ? amenity.distance : undefined;
	const walkingTime = "walkingTime" in amenity ? amenity.walkingTime : undefined;
	const drivingTime = "drivingTime" in amenity ? amenity.drivingTime : undefined;

	const categoryIcon = getCategoryIcon(amenity.category);
	const approvalStatus = getApprovalStatusDisplay(amenity.approvalStatus);

	return (
		<Card className={cn("h-full transition-all hover:shadow-md", className)}>
			<CardHeader className="pb-3">
				<div className="flex items-start justify-between">
					<div className="flex items-center space-x-3">
						<Avatar className="h-10 w-10">
							<AvatarFallback className="text-lg">{categoryIcon}</AvatarFallback>
						</Avatar>
						<div className="min-w-0 flex-1">
							<h3 className="truncate font-semibold text-sm leading-tight">{amenity.name}</h3>
							<p className="text-muted-foreground text-xs capitalize">
								{amenity.type.replace(/_/g, " ")}
							</p>
						</div>
					</div>

					{showApprovalStatus && (
						<div className="flex items-center space-x-1">
							<approvalStatus.icon className={cn("h-4 w-4", approvalStatus.color)} />
							<span className={cn("font-medium text-xs", approvalStatus.color)}>
								{approvalStatus.label}
							</span>
						</div>
					)}
				</div>

				<div className="mt-2 flex flex-wrap gap-1">
					<Badge variant={getSourceBadgeVariant(amenity.isAutoDiscovered)} className="text-xs">
						{amenity.isAutoDiscovered ? "Auto-Discovered" : "Manual Entry"}
					</Badge>
					{amenity.isAutoDiscovered && (
						<Badge variant="outline" className="text-xs">
							{amenity.source === AmenitySource.AUTO_DISCOVERED_GOOGLE ? "Google" : "OSM"}
						</Badge>
					)}
					{amenity.verified && (
						<Badge
							variant={
								getVerificationLevelBadge(amenity.verificationLevel || "unverified")?.variant
							}
							className={`text-xs ${getVerificationLevelBadge(amenity.verificationLevel || "unverified")?.color}`}
						>
							{amenity.verificationLevel?.replace(/_/g, " ")}
						</Badge>
					)}
					{showDistance && distance !== undefined && (
						<Badge variant="outline" className="text-xs">
							{distance.toFixed(1)}km
						</Badge>
					)}
				</div>
			</CardHeader>

			<CardContent className="pt-0 pb-3">
				{/* Location */}
				<div className="mb-2 flex items-start space-x-2 text-muted-foreground text-xs">
					<MapPin className="mt-0.5 h-3 w-3 flex-shrink-0" />
					<div className="min-w-0 flex-1">
						<p className="truncate">{amenity.location.address.line1}</p>
						<p className="truncate">
							{amenity.location.ward && `${amenity.location.ward}, `}
							{amenity.location.county}
						</p>
					</div>
				</div>

				{/* Contact Info */}
				{(amenity.contact?.phone || amenity.contact?.website) && (
					<div className="mb-2 space-y-1">
						{amenity.contact.phone && (
							<div className="flex items-center space-x-2 text-muted-foreground text-xs">
								<Phone className="h-3 w-3" />
								<span>{amenity.contact.phone}</span>
							</div>
						)}
						{amenity.contact.website && (
							<div className="flex items-center space-x-2 text-muted-foreground text-xs">
								<Globe className="h-3 w-3" />
								<a
									href={amenity.contact.website}
									target="_blank"
									rel="noopener noreferrer"
									className="truncate hover:text-primary"
								>
									Website
								</a>
							</div>
						)}
					</div>
				)}

				{/* Travel Times */}
				{showDistance && (walkingTime || drivingTime) && (
					<div className="mb-2 flex items-center space-x-4 text-muted-foreground text-xs">
						<Clock className="h-3 w-3" />
						<div className="flex space-x-3">
							{walkingTime && <span>🚶 {walkingTime}min</span>}
							{drivingTime && <span>🚗 {drivingTime}min</span>}
						</div>
					</div>
				)}

				{/* Rating */}
				{amenity.rating && amenity.rating > 0 && (
					<div className="flex items-center space-x-1 text-xs">
						<Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
						<span className="font-medium">{amenity.rating.toFixed(1)}</span>
						{amenity.reviewCount && (
							<span className="text-muted-foreground">({amenity.reviewCount} reviews)</span>
						)}
					</div>
				)}

				{/* Operating Hours Preview */}
				{amenity.operatingHours?.monday && (
					<div className="mt-2 text-muted-foreground text-xs">
						<Clock className="mr-1 inline h-3 w-3" />
						Today: {amenity.operatingHours.monday}
					</div>
				)}

				{/* Description */}
				{amenity.description && (
					<p className="mt-2 line-clamp-2 text-muted-foreground text-xs">{amenity.description}</p>
				)}
			</CardContent>

			{showActions && (
				<CardFooter className="flex justify-between pt-0">
					<div className="flex space-x-2">
						{amenity.approvalStatus === AmenityApprovalStatus.PENDING && (
							<>
								<Button
									size="sm"
									variant="outline"
									className="text-green-600 hover:text-green-700"
									onClick={() => onApprove?.(amenity._id)}
								>
									<CheckCircle className="mr-1 h-3 w-3" />
									Approve
								</Button>
								<Button
									size="sm"
									variant="outline"
									className="text-red-600 hover:text-red-700"
									onClick={() => onReject?.(amenity._id)}
								>
									<XCircle className="mr-1 h-3 w-3" />
									Reject
								</Button>
							</>
						)}
						{amenity.approvalStatus === AmenityApprovalStatus.APPROVED && (
							<Button size="sm" variant="outline" onClick={() => onEdit?.(amenity)}>
								Edit
							</Button>
						)}
					</div>
					<Button size="sm" variant="ghost" onClick={() => onView?.(amenity)}>
						View Details
					</Button>
				</CardFooter>
			)}
		</Card>
	);
}
