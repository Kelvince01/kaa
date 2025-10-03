// import { KENYAN_COUNTIES, PROPERTY_TYPES, AMENITIES } from '@/lib/constants';
// import type { Property, PropertyStatus, KenyaSpecificFeatures, PropertyUtilities } from './property.types';

import type { Property } from "./property.type";

// Property display helpers
export const getPropertyTitle = (property: Property): string =>
  property.title || `${property.type} in ${property.location.address.town}`;

export const getPropertyAddress = (property: Property): string => {
  const { location } = property;
  const parts: string[] = [];

  if (location.estate) parts.push(location.estate);
  if (location.address.town) parts.push(location.address.town);
  if (location.county && location.county !== location.address.town)
    parts.push(location.county);

  return parts.join(", ") || "Address not specified";
};

export const getFullPropertyAddress = (property: Property): string => {
  const { location } = property;
  const parts: string[] = [];

  if (location.plotNumber) parts.push(`Plot ${location.plotNumber}`);
  if (location.address.line1) parts.push(location.address.line1);
  if (location.estate) parts.push(location.estate);
  if (location.address.town) parts.push(location.address.town);
  if (location.county && location.county !== location.address.town)
    parts.push(location.county);

  return parts.join(", ") || "Address not specified";
};

// Property type and status helpers
export const formatPropertyType = (type: Property["type"]): string => {
  const typeLabels = {
    Bedsitter: "Bedsitter",
    "One Bedroom": "1 Bedroom",
    "Two Bedroom": "2 Bedroom",
    "Three Bedroom": "3 Bedroom",
    "Four Bedroom": "4 Bedroom",
    "Five+ Bedroom": "5+ Bedroom",
    Studio: "Studio",
    Penthouse: "Penthouse",
    Villa: "Villa",
    Townhouse: "Townhouse",
    Duplex: "Duplex",
    Maisonette: "Maisonette",
  };

  return typeLabels[type as keyof typeof typeLabels] || type;
};

export const getPropertyStatusColor = (status: Property["status"]): string => {
  const colors = {
    draft: "bg-gray-100 text-gray-800",
    active: "bg-green-100 text-green-800",
    inactive: "bg-yellow-100 text-yellow-800",
    rented: "bg-blue-100 text-blue-800",
    maintenance: "bg-orange-100 text-orange-800",
    suspended: "bg-red-100 text-red-800",
  };

  return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800";
};

export const formatPropertyStatus = (status: Property["status"]): string => {
  const statusLabels = {
    draft: "Draft",
    active: "Active",
    inactive: "Inactive",
    rented: "Rented",
    maintenance: "Under Maintenance",
    suspended: "Suspended",
  };

  return statusLabels[status as keyof typeof statusLabels] || status;
};

// Pricing helpers
export const formatPrice = (
  amount: number,
  currency: "KES" | "USD" = "KES"
): string => {
  const formatter = new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  return formatter.format(amount);
};

export const formatRentAmount = (property: Property): string =>
  formatPrice(property.pricing.rentAmount, property.pricing.currency);

export const formatDepositAmount = (property: Property): string =>
  formatPrice(property.pricing.securityDeposit, property.pricing.currency);

export const getTotalMonthlyCost = (property: Property): number => {
  let total = property.pricing.rentAmount;

  // Add utilities if not included
  if (!property.pricing.electricityBill && property.pricing.electricityBill) {
    total += property.pricing.electricityBill;
  }
  // if (!property.pricing.waterBill && property.pricing.waterBill) {
  // 	total += property.utilities.water.cost;
  // }
  // if (property.pricing.internetReady && property.pricing.internetReady) {
  // 	total += property.pricing.internet.cost;
  // }
  // if (property.utilities.cable.available && property.utilities.cable.cost) {
  // 	total += property.pricing.cable.cost;
  // }
  // if (!property.utilities.garbage.included && property.utilities.garbage.cost) {
  // 	total += property.pricing.garbage.cost;
  // }

  // // Add mandatory additional costs
  // property.additionalCosts?.forEach((cost) => {
  // 	if (cost.mandatory && cost.frequency === "monthly") {
  // 		total += cost.amount;
  // 	}
  // });

  return total;
};

export const formatTotalMonthlyCost = (property: Property): string =>
  formatPrice(getTotalMonthlyCost(property), property.pricing.currency);

// Property details helpers
export const getBedroomsBathroomsText = (property: Property): string => {
  const bedrooms =
    property.details.bedrooms === 0
      ? "Studio"
      : `${property.details.bedrooms} bed`;
  const bathrooms = `${property.details.bathrooms} bath`;
  return `${bedrooms}, ${bathrooms}`;
};

export const formatPropertySize = (size?: number): string => {
  if (!size) return "Size not specified";

  if (size >= 1000) {
    return `${(size / 1000).toFixed(1)}k sq ft`;
  }

  return `${size} sq ft`;
};

export const getFurnishedStatus = (furnished: boolean): string =>
  furnished ? "Furnished" : "Unfurnished";

// Amenities helpers
export const formatAmenities = (amenities: string[]): string => {
  if (amenities.length === 0) return "No amenities listed";

  if (amenities.length <= 3) {
    return amenities.join(", ");
  }

  return `${amenities.slice(0, 2).join(", ")} and ${amenities.length - 2} more`;
};

export const getPopularAmenities = (amenities: string[]): string[] => {
  const popular = [
    "Parking",
    "Security",
    "WiFi",
    "Swimming Pool",
    "Gym",
    "Backup Generator",
  ];
  return amenities.filter((amenity) => popular.includes(amenity));
};

export const hasEssentialAmenities = (amenities: string[]): boolean => {
  const essential = ["Parking", "Security", "Backup Generator", "Water Tank"];
  return essential.some((amenity) => amenities.includes(amenity));
};

// Location and transportation helpers
export const getDistanceText = (distance?: number): string => {
  if (!distance) return "";

  if (distance < 1000) {
    return `${Math.round(distance)}m away`;
  }

  return `${(distance / 1000).toFixed(1)}km away`;
};

// export const getNearbyLandmarks = (property: Property): string => {
// 	if (!property.location.nearbyLandmarks?.length) return "No landmarks listed";

// 	return property.location.nearbyLandmarks.slice(0, 3).join(", ");
// };

// export const getTransportationInfo = (property: Property): string => {
// 	const parts: string[] = [];

// 	if (property.location.nearestMatatu) {
// 		parts.push(`Near ${property.location.nearestMatatu} matatu stage`);
// 	}

// 	if (property.location.distanceToTown) {
// 		parts.push(`${property.location.distanceToTown}km to town`);
// 	}

// 	return parts.join(" • ") || "Transportation info not available";
// };

// Kenya-specific features helpers
// export const getSecurityLevel = (kenyaSpecific: KenyaSpecificFeatures): string => {
// 	const levels = {
// 		basic: "Basic Security",
// 		standard: "Standard Security",
// 		high: "High Security",
// 	};

// 	return levels[kenyaSpecific.security.level];
// };

// export const getSecurityFeatures = (kenyaSpecific: KenyaSpecificFeatures): string => {
// 	const features = kenyaSpecific.security.features;

// 	if (features.length === 0) return "Security features not specified";
// 	if (features.length <= 2) return features.join(", ");

// 	return `${features.slice(0, 2).join(", ")} and ${features.length - 2} more`;
// };

// export const getParkingInfo = (kenyaSpecific: KenyaSpecificFeatures): string => {
// 	const { infrastructure } = kenyaSpecific;

// 	if (infrastructure.parkingType === "none") {
// 		return "No parking available";
// 	}

// 	const typeLabels = {
// 		open: "Open parking",
// 		covered: "Covered parking",
// 		garage: "Garage parking",
// 		none: "No parking",
// 	};

// 	const type = typeLabels[infrastructure.parkingType];
// 	const spaces =
// 		infrastructure.parkingSpaces > 0
// 			? ` (${infrastructure.parkingSpaces} space${infrastructure.parkingSpaces > 1 ? "s" : ""})`
// 			: "";

// 	return `${type}${spaces}`;
// };

// export const getRoadAccess = (kenyaSpecific: KenyaSpecificFeatures): string => {
// 	const accessLabels = {
// 		tarmac: "Tarmac road access",
// 		murram: "Murram road access",
// 		footpath: "Footpath access only",
// 	};

// 	return accessLabels[kenyaSpecific.infrastructure.roadAccess];
// };

// export const getUtilitiesInfo = (kenyaSpecific: KenyaSpecificFeatures): string[] => {
// 	const info: string[] = [];

// 	if (kenyaSpecific.infrastructure.powerBackup) {
// 		info.push("Backup power available");
// 	}

// 	if (kenyaSpecific.infrastructure.waterBackup) {
// 		info.push("Water backup available");
// 	}

// 	return info;
// };

// export const getCommunityInfo = (kenyaSpecific: KenyaSpecificFeatures): string => {
// 	const { community } = kenyaSpecific;
// 	const info: string[] = [];

// 	if (community.familyFriendly) {
// 		info.push("Family-friendly");
// 	}

// 	const petLabels = {
// 		allowed: "Pets allowed",
// 		not_allowed: "No pets",
// 		restricted: "Pets restricted",
// 	};
// 	info.push(petLabels[community.petPolicy]);

// 	const noiseLabels = {
// 		quiet: "Quiet area",
// 		moderate: "Moderate noise",
// 		busy: "Busy area",
// 	};
// 	info.push(noiseLabels[community.noiseLevel]);

// 	return info.join(" • ");
// };

// export const isPlotProperty = (kenyaSpecific: KenyaSpecificFeatures): boolean => {
// 	return kenyaSpecific.isPlotProperty;
// };

// export const getPlotInfo = (kenyaSpecific: KenyaSpecificFeatures): string => {
// 	if (!kenyaSpecific.isPlotProperty || !kenyaSpecific.plotDetails) {
// 		return "";
// 	}

// 	const { plotDetails } = kenyaSpecific;
// 	return `${plotDetails.availableUnits} of ${plotDetails.totalUnits} units available`;
// };

// // Analytics and insights helpers
// export const getPopularityScore = (property: Property): number => {
// 	// Simple popularity calculation based on views, inquiries, and applications
// 	const viewWeight = 0.1;
// 	const inquiryWeight = 0.5;
// 	const applicationWeight = 1.0;

// 	return (
// 		property.views * viewWeight +
// 		property.inquiries * inquiryWeight +
// 		property.applications * applicationWeight
// 	);
// };

// export const getEngagementRate = (property: Property): number => {
// 	if (property.views === 0) return 0;
// 	return ((property.inquiries + property.applications) / property.views) * 100;
// };

// export const formatEngagementRate = (property: Property): string => {
// 	const rate = getEngagementRate(property);
// 	return `${rate.toFixed(1)}%`;
// };

// Comparison helpers
export const comparePropertiesByPrice = (a: Property, b: Property): number =>
  a.pricing.rentAmount - b.pricing.rentAmount;

export const comparePropertiesBySize = (a: Property, b: Property): number => {
  const sizeA = a.details.size || 0;
  const sizeB = b.details.size || 0;
  return sizeB - sizeA;
};

// export const comparePropertiesByPopularity = (a: Property, b: Property): number => {
// 	return getPopularityScore(b) - getPopularityScore(a);
// };

export const comparePropertiesByDate = (a: Property, b: Property): number =>
  new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();

// Availability helpers
export const getAvailabilityText = (property: Property): string => {
  const availableDate = new Date(property.availableFrom);
  const today = new Date();

  if (availableDate <= today) {
    return "Available now";
  }

  const diffDays = Math.ceil(
    (availableDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays <= 7) {
    return `Available in ${diffDays} day${diffDays > 1 ? "s" : ""}`;
  }

  if (diffDays <= 30) {
    const weeks = Math.ceil(diffDays / 7);
    return `Available in ${weeks} week${weeks > 1 ? "s" : ""}`;
  }

  return `Available from ${availableDate.toLocaleDateString()}`;
};

export const isAvailableNow = (property: Property): boolean =>
  new Date(property.availableFrom) <= new Date();

// export const getLeaseTerm = (property: Property): string => {
// 	return property.leaseTerm || "Negotiable";
// };

// Image and media helpers
export const getPrimaryImage = (property: Property): string | undefined => {
  const primaryImage = property.media.photos.find((img) => img.isPrimary);
  return primaryImage?.url || property.media.photos[0]?.url;
};

// export const getThumbnailImage = (property: Property): string | undefined => {
// 	const primaryImage = property.media.photos.find((img) => img.isPrimary);
// 	return (
// 		primaryImage?.thumbnailUrl || property.media.photos[0]?.thumbnailUrl || getPrimaryImage(property)
// 	);
// };

export const getImageCount = (property: Property): number =>
  property.media.photos.length;

export const hasVideo = (property: Property): boolean =>
  !!(property.media.videos && property.media.videos.length > 0);

// Contact and owner helpers
export const getOwnerName = (property: Property): string =>
  // biome-ignore lint/suspicious/noConstantBinaryExpressions: false positive
  `${property.landlord.firstName} ${property.landlord.lastName}` || "Owner";

export const getOwnerContact = (property: Property): string =>
  property.landlord.phone ||
  property.landlord.email ||
  "Contact through platform";

export const canContactOwnerDirectly = (property: Property): boolean =>
  !!(property.landlord.phone || property.landlord.email);

// Utilities formatting helpers
// export const formatUtilities = (utilities: PropertyUtilities): string[] => {
// 	const included: string[] = [];
// 	const extra: string[] = [];

// 	if (utilities.electricity.included) {
// 		included.push("Electricity");
// 	} else if (utilities.electricity.cost) {
// 		extra.push(`Electricity (KES ${utilities.electricity.cost}/month)`);
// 	}

// 	if (utilities.water.included) {
// 		included.push("Water");
// 	} else if (utilities.water.cost) {
// 		extra.push(`Water (KES ${utilities.water.cost}/month)`);
// 	}

// 	if (utilities.internet.available) {
// 		if (utilities.internet.cost) {
// 			extra.push(`Internet (KES ${utilities.internet.cost}/month)`);
// 		} else {
// 			included.push("Internet");
// 		}
// 	}

// 	if (utilities.gas.available) {
// 		if (utilities.gas.cost) {
// 			extra.push(`Gas (KES ${utilities.gas.cost}/month)`);
// 		} else {
// 			included.push("Gas");
// 		}
// 	}

// 	if (utilities.garbage.included) {
// 		included.push("Garbage collection");
// 	} else if (utilities.garbage.cost) {
// 		extra.push(`Garbage (KES ${utilities.garbage.cost}/month)`);
// 	}

// 	const result: string[] = [];

// 	if (included.length > 0) {
// 		result.push(`Included: ${included.join(", ")}`);
// 	}

// 	if (extra.length > 0) {
// 		result.push(`Extra: ${extra.join(", ")}`);
// 	}

// 	return result.length > 0 ? result : ["Utilities information not available"];
// };

// export const getWaterSource = (utilities: PropertyUtilities): string => {
// 	const sourceLabels = {
// 		mains: "Mains water",
// 		borehole: "Borehole water",
// 		tank: "Tank water",
// 		well: "Well water",
// 	};

// 	return sourceLabels[utilities.water.source];
// };

// Search and filtering helpers
export const matchesSearchQuery = (
  property: Property,
  query: string
): boolean => {
  if (!query) return true;

  const searchText = query.toLowerCase();

  return (
    property.title.toLowerCase().includes(searchText) ||
    property.description.toLowerCase().includes(searchText) ||
    property.location.address.town.toLowerCase().includes(searchText) ||
    property.location.county.toLowerCase().includes(searchText) ||
    property.location.estate?.toLowerCase().includes(searchText) ||
    property.type.toLowerCase().includes(searchText) ||
    property.amenities.some((amenity) =>
      amenity.name.toLowerCase().includes(searchText)
    )
  );
};

// Quality score helpers
export const calculatePropertyQuality = (property: Property): number => {
  let score = 0;
  const maxScore = 100;

  // Basic information completeness (30 points)
  if (property.title) score += 5;
  if (property.description.length >= 50) score += 10;
  if (property.details.size) score += 5;
  if (property.amenities.length >= 3) score += 10;

  // Images and media (25 points)
  if (property.media.photos.length >= 5) score += 15;
  else if (property.media.photos.length >= 3) score += 10;
  else if (property.media.photos.length >= 1) score += 5;

  if (property.media.videos && property.media.videos.length > 0) score += 10;

  // Location details (20 points)
  if (property.location.estate) score += 5;
  // if (property.location.nearbyLandmarks && property.location.nearbyLandmarks.length > 0) score += 5;
  // if (property.location.nearestMatatu) score += 5;
  // if (property.location.distanceToTown) score += 5;

  // Kenya-specific features (15 points)
  // if (property.kenyaSpecific.security.features.length >= 2) score += 5;
  // if (property.kenyaSpecific.infrastructure.powerBackup) score += 5;
  // if (property.kenyaSpecific.infrastructure.waterBackup) score += 5;

  // Contact and verification (10 points)
  if (property.landlord.phone) score += 5;
  if (property.landlord.avatar) score += 5;

  return Math.round((score / maxScore) * 100);
};

export const getQualityScoreColor = (score: number): string => {
  if (score >= 80) return "text-green-600";
  if (score >= 60) return "text-yellow-600";
  return "text-red-600";
};

export const getQualityScoreLabel = (score: number): string => {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Good";
  if (score >= 40) return "Fair";
  return "Needs improvement";
};
