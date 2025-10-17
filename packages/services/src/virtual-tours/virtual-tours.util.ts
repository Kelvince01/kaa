import {
  type BrandingSettings,
  type HotspotType,
  type TourSettings,
  TourType,
  type ViewAngle,
} from "@kaa/models/types";
import {
  HOTSPOT_TYPE_CONFIG,
  KENYA_TOUR_CONSTANTS,
  TOUR_TYPE_CONFIG,
} from "./virtual-tours.constants";

/**
 * Validate file type and size for tour media
 */
export const validateTourMedia = (
  fileName: string,
  fileSize: number,
  _mimeType: string,
  tourType: TourType
): { isValid: boolean; error?: string } => {
  // @ts-expect-error
  const config = TOUR_TYPE_CONFIG[tourType];

  if (!config) {
    return { isValid: false, error: "Invalid tour type" };
  }

  // Check file size
  if (fileSize > config.maxFileSize) {
    return {
      isValid: false,
      error: `File size exceeds ${config.maxFileSize / 1024 / 1024}MB limit for ${config.name}`,
    };
  }

  // Check file format
  const fileExtension = fileName.split(".").pop()?.toLowerCase();
  if (!(fileExtension && config.supportedFormats.includes(fileExtension))) {
    return {
      isValid: false,
      error: `File format .${fileExtension} not supported for ${config.name}. Supported formats: ${config.supportedFormats.join(", ")}`,
    };
  }

  return { isValid: true };
};

/**
 * Generate default tour settings
 */
export const generateDefaultTourSettings = (
  tourType: TourType
): TourSettings => {
  const defaultView: ViewAngle = {
    yaw: 0,
    pitch: 0,
    fov: KENYA_TOUR_CONSTANTS.DEFAULT_SETTINGS.INITIAL_FOV,
  };

  const defaultBranding: BrandingSettings = {
    showLogo: true,
    logoPosition: "top-right",
    showWatermark: true,
    theme: "light",
  };

  return {
    autoRotate: false,
    autoRotateSpeed: KENYA_TOUR_CONSTANTS.DEFAULT_SETTINGS.AUTO_ROTATE_SPEED,
    initialView: defaultView,
    controlsEnabled: true,
    gyroscopeEnabled: true,
    vrMode: tourType === TourType.VIRTUAL_REALITY,
    arEnabled: tourType === TourType.AUGMENTED_REALITY,
    audioEnabled: false,
    branding: defaultBranding,
  };
};

/**
 * Generate hotspot style based on type
 */
export const generateHotspotStyle = (type: HotspotType) => {
  const config = HOTSPOT_TYPE_CONFIG[type as keyof typeof HOTSPOT_TYPE_CONFIG];

  return {
    icon: config.icon,
    color: config.color,
    size: config.defaultSize,
    animation: "pulse" as const,
    visible: true,
  };
};

/**
 * Calculate tour completion percentage
 */
export const calculateTourCompletion = (tour: {
  scenes: any[];
  hotspots: any[];
  settings: any;
  metadata: any;
}): number => {
  let completionScore = 0;
  const maxScore = 100;

  // Basic info (20%)
  if (tour.metadata) completionScore += 20;

  // Scenes (40%)
  if (tour.scenes.length > 0) {
    completionScore += 20;
    // Additional points for multiple scenes
    if (tour.scenes.length >= 3) completionScore += 10;
    // Points for scene connections
    const hasConnections = tour.scenes.some(
      (scene) => scene.connections?.length > 0
    );
    if (hasConnections) completionScore += 10;
  }

  // Hotspots (20%)
  if (tour.hotspots.length > 0) {
    completionScore += 10;
    // Additional points for multiple hotspots
    if (tour.hotspots.length >= 5) completionScore += 10;
  }

  // Settings configured (20%)
  if (tour.settings) {
    completionScore += 10;
    // Additional points for advanced settings
    if (
      tour.settings.branding ||
      tour.settings.vrMode ||
      tour.settings.arEnabled
    ) {
      completionScore += 10;
    }
  }

  return Math.min(completionScore, maxScore);
};

/**
 * Generate tour URL slug
 */
export const generateTourSlug = (title: string, tourId: string): string => {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single
    .trim();

  return `${slug}-${tourId.slice(-8)}`;
};

/**
 * Calculate estimated processing time
 */
export const estimateProcessingTime = (
  fileSize: number,
  tourType: TourType,
  processingOptions?: any
): number => {
  const baseSizeInMB = fileSize / (1024 * 1024);
  let timeInSeconds = 0;

  switch (tourType) {
    case TourType.PHOTO_360:
      // ~2 seconds per MB for 360 photo processing
      timeInSeconds = baseSizeInMB * 2;
      break;
    case TourType.VIDEO_360:
      // ~10 seconds per MB for 360 video processing
      timeInSeconds = baseSizeInMB * 10;
      break;
    case TourType.THREE_D_MODEL:
      // ~5 seconds per MB for 3D model optimization
      timeInSeconds = baseSizeInMB * 5;
      break;
    default:
      timeInSeconds = baseSizeInMB * 3;
  }

  // Add extra time for quality optimization
  if (processingOptions?.generateMultipleQualities) {
    timeInSeconds *= 2;
  }

  return Math.max(timeInSeconds, 5); // Minimum 5 seconds
};

/**
 * Validate view angle parameters
 */
export const validateViewAngle = (
  viewAngle: ViewAngle
): { isValid: boolean; error?: string } => {
  if (viewAngle.yaw < -180 || viewAngle.yaw > 180) {
    return {
      isValid: false,
      error: "Yaw must be between -180 and 180 degrees",
    };
  }

  if (viewAngle.pitch < -90 || viewAngle.pitch > 90) {
    return {
      isValid: false,
      error: "Pitch must be between -90 and 90 degrees",
    };
  }

  if (viewAngle.fov < 30 || viewAngle.fov > 120) {
    return {
      isValid: false,
      error: "Field of view must be between 30 and 120 degrees",
    };
  }

  return { isValid: true };
};

/**
 * Generate responsive image URLs
 */
export const generateResponsiveImageUrls = (baseUrl: string) => {
  const sizes = [
    { suffix: "_thumb", width: 300, height: 200 },
    { suffix: "_small", width: 800, height: 600 },
    { suffix: "_medium", width: 1200, height: 900 },
    { suffix: "_large", width: 1920, height: 1440 },
    { suffix: "_xl", width: 2560, height: 1920 },
  ];

  return sizes.reduce(
    (urls, size) => {
      const url = baseUrl.replace(
        // biome-ignore lint/performance/useTopLevelRegex: ignore
        /\.(jpg|jpeg|png|webp)$/i,
        `${size.suffix}.$1`
      );
      urls[size.suffix.replace("_", "")] = {
        url,
        width: size.width,
        height: size.height,
      };
      return urls;
    },
    {} as Record<string, { url: string; width: number; height: number }>
  );
};

/**
 * Calculate tour analytics summary
 */
export const calculateAnalyticsSummary = (analytics: any) => {
  const summary = {
    totalEngagement: 0,
    averageSessionDuration: 0,
    topPerformingScene: null as string | null,
    conversionRate: 0,
    devicePreference: "desktop" as "mobile" | "desktop" | "tablet",
    popularHotspots: [] as string[],
  };

  // Calculate total engagement
  summary.totalEngagement =
    analytics.totalViews +
    (analytics.conversionMetrics?.inquiries || 0) * 10 +
    (analytics.conversionMetrics?.bookings || 0) * 50;

  // Find top performing scene
  if (analytics.sceneAnalytics?.length > 0) {
    const topScene = analytics.sceneAnalytics.reduce(
      (prev: any, current: any) => (prev.views > current.views ? prev : current)
    );
    summary.topPerformingScene = topScene.sceneId;
  }

  // Calculate conversion rate
  if (analytics.totalViews > 0) {
    const totalConversions =
      (analytics.conversionMetrics?.inquiries || 0) +
      (analytics.conversionMetrics?.bookings || 0);
    summary.conversionRate = (totalConversions / analytics.totalViews) * 100;
  }

  // Determine device preference
  const deviceBreakdown = analytics.deviceBreakdown || {};
  const maxDevice = Object.keys(deviceBreakdown).reduce((a, b) =>
    deviceBreakdown[a] > deviceBreakdown[b] ? a : b
  );
  summary.devicePreference = maxDevice as "mobile" | "desktop" | "tablet";

  return summary;
};

/**
 * Generate SEO metadata for tour
 */
export const generateTourSEOMetadata = (tour: any) => {
  const metadata = {
    title: tour.title,
    description: tour.description,
    keywords: [] as string[],
    ogImage: "",
    structuredData: {},
  };

  // Generate keywords
  metadata.keywords = [
    tour.metadata?.propertyType,
    tour.metadata?.county,
    tour.metadata?.constituency,
    "virtual tour",
    "property tour",
    "360 tour",
    ...(tour.metadata?.amenities || []),
    ...(tour.metadata?.features || []),
  ].filter(Boolean);

  // Set OG image from first scene
  if (tour.scenes?.length > 0) {
    metadata.ogImage = tour.scenes[0].thumbnailUrl;
  }

  // Generate structured data
  metadata.structuredData = {
    "@context": "https://schema.org",
    "@type": "VirtualLocation",
    name: tour.title,
    description: tour.description,
    image: metadata.ogImage,
    address: {
      "@type": "PostalAddress",
      addressRegion: tour.metadata?.county,
      addressCountry: "Kenya",
    },
    tourBookingPage: `${process.env.APP_URL}/tours/${tour.id}`,
    provider: {
      "@type": "Organization",
      name: "Kaa Rentals",
    },
  };

  return metadata;
};

/**
 * Validate tour data before creation/update
 */
export const validateTourData = (
  tourData: any
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Required fields
  if (!tourData.title || tourData.title.trim().length === 0) {
    errors.push("Tour title is required");
  }

  if (!tourData.description || tourData.description.trim().length === 0) {
    errors.push("Tour description is required");
  }

  if (!tourData.type) {
    errors.push("Tour type is required");
  }

  if (!tourData.propertyId) {
    errors.push("Property ID is required");
  }

  // Length validations
  if (
    tourData.title &&
    tourData.title.length >
      KENYA_TOUR_CONSTANTS.TOUR_LIMITS.MAX_TOUR_TITLE_LENGTH
  ) {
    errors.push(
      `Tour title must be less than ${KENYA_TOUR_CONSTANTS.TOUR_LIMITS.MAX_TOUR_TITLE_LENGTH} characters`
    );
  }

  if (
    tourData.description &&
    tourData.description.length >
      KENYA_TOUR_CONSTANTS.TOUR_LIMITS.MAX_TOUR_DESCRIPTION_LENGTH
  ) {
    errors.push(
      `Tour description must be less than ${KENYA_TOUR_CONSTANTS.TOUR_LIMITS.MAX_TOUR_DESCRIPTION_LENGTH} characters`
    );
  }

  // Metadata validation
  if (tourData.metadata) {
    if (!tourData.metadata.propertyType) {
      errors.push("Property type is required in metadata");
    }

    if (!tourData.metadata.county) {
      errors.push("County is required in metadata");
    }

    if (
      typeof tourData.metadata.totalSize !== "number" ||
      tourData.metadata.totalSize <= 0
    ) {
      errors.push("Valid total size is required in metadata");
    }

    if (
      typeof tourData.metadata.bedrooms !== "number" ||
      tourData.metadata.bedrooms < 0
    ) {
      errors.push("Valid number of bedrooms is required in metadata");
    }

    if (
      typeof tourData.metadata.bathrooms !== "number" ||
      tourData.metadata.bathrooms < 0
    ) {
      errors.push("Valid number of bathrooms is required in metadata");
    }
  }

  // Settings validation
  if (tourData.settings?.initialView) {
    const viewAngleValidation = validateViewAngle(
      tourData.settings.initialView
    );
    if (!viewAngleValidation.isValid) {
      // biome-ignore lint/style/noNonNullAssertion: ignore
      errors.push(viewAngleValidation.error!);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
