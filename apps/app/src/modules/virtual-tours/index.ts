/**
 * Virtual Tours Module - Frontend Implementation
 *
 * This module provides comprehensive virtual tour functionality including:
 * - AI-powered tour creation and management
 * - WebXR (VR/AR) immersive experiences
 * - Real-time collaboration and live streaming
 * - Advanced analytics and ML insights
 * - Accessibility features and inclusive design
 * - Mobile PWA optimization
 * - Kenya-specific integrations (M-Pesa, SMS, USSD)
 */

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

export type {
	VirtualTour,
	TourType,
	TourStatus,
	SceneType,
	HotspotType,
	TourSettings,
	TourScene,
	Hotspot,
	TourAnalytics,
	MLAnalytics,
	TourMetadata,
	ViewAngle,
	BrandingSettings,
	ScenePosition,
	SceneConnection,
	HotspotPosition,
	HotspotContent,
	HotspotStyle,
	DeviceAnalytics,
	LocationAnalytics,
	ConversionMetrics,
	TourCreationRequest,
	MediaUploadRequest,
	TourListResponse,
	TourEmbedOptions,
	AIGeneratedContent,
	HotspotSuggestion,
	SceneConnectionSuggestion,
	VoiceScript,
	CollaborationSession,
	Participant,
	ParticipantPermissions,
	ChatMessage,
	LiveAnnotation,
	EngagementForecast,
	BehaviorPattern,
	UserSegment,
	VirtualTourCapabilities,
	TourPayment,
	KenyaPropertyTaxes,
	KenyaFinancingOptions,
	CreateTourFormData,
	SceneFormData,
	HotspotFormData,
	ApiResponse,
	PaginatedResponse,
} from "./virtual-tour.type";

// =============================================================================
// SERVICES & API
// =============================================================================

export {
	// Core tour operations
	getVirtualTours,
	getVirtualTour,
	createVirtualTour,
	updateVirtualTour,
	deleteVirtualTour,
	publishVirtualTour,
	duplicateVirtualTour,
	// Scene operations
	addScene,
	updateScene,
	deleteScene,
	// Hotspot operations
	addHotspot,
	updateHotspot,
	deleteHotspot,
	// Media operations
	uploadMedia,
	// Analytics operations
	getTourAnalytics,
	getRealTimeMetrics,
	trackTourView,
	trackSceneView,
	trackHotspotInteraction,
	// Advanced features
	getServiceCapabilities,
	enableAdvancedMode,
	disableAdvancedMode,
	startXRSession,
	generateSmartConnections,
	getAccessibilityReport,
	enableVoiceControl,
	getOptimizedContentUrl,
	getTourRecommendations,
	// Embed operations
	getTourEmbedCode,
	// Search and discovery
	searchTours,
	getPopularTours,
	getUserTours,
	// Service health
	getVirtualToursHealth,
	getAdvancedServicesHealth,
	restartAdvancedService,
	// Collaboration operations
	createCollaborationSession,
	getCollaborationSession,
	endCollaborationSession,
	// Payment integration
	processVirtualTourPayment,
	// Kenya-specific features
	calculatePropertyTaxes,
	getFinancingOptions,
	getCountyMarketData,
	// Communication services
	getUSSDStats,
	getUSSDHealth,
} from "./virtual-tour.service";

// =============================================================================
// QUERIES & MUTATIONS
// =============================================================================

export {
	// Queries
	useVirtualTours,
	useVirtualTour,
	useTourAnalytics,
	useRealTimeMetrics,
	useServiceCapabilities,
	useAdvancedServicesHealth,
	useVirtualToursHealth,
	useSearchTours,
	usePopularTours,
	useUserTours,
	useCollaborationSession,
	usePropertyTaxes,
	useFinancingOptions,
	useCountyMarketData,
	useAccessibilityReport,
	useTourRecommendations,
	useTourEmbedCode,
	useUSSDStats,
	useUSSDHealth,
} from "./virtual-tour.queries";

export {
	// Tour mutations
	useCreateVirtualTour,
	useUpdateVirtualTour,
	useDeleteVirtualTour,
	usePublishVirtualTour,
	useDuplicateVirtualTour,
	// Scene mutations
	useAddScene,
	useUpdateScene,
	useDeleteScene,
	// Hotspot mutations
	useAddHotspot,
	useUpdateHotspot,
	useDeleteHotspot,
	// Media mutations
	useUploadMedia,
	// Advanced feature mutations
	useEnableAdvancedMode,
	useDisableAdvancedMode,
	useStartXRSession,
	useGenerateSmartConnections,
	useEnableVoiceControl,
	useRestartAdvancedService,
	// Collaboration mutations
	useCreateCollaborationSession,
	useEndCollaborationSession,
	// Payment mutations
	useProcessTourPayment,
	// Tracking mutations
	useTrackTourView,
	useTrackSceneView,
	useTrackHotspotInteraction,
} from "./virtual-tour.mutations";

// =============================================================================
// STATE MANAGEMENT
// =============================================================================

export {
	useVirtualTourStore,
	useVirtualTourSelectors,
	useVirtualTourActions,
	useVirtualTourState,
} from "./virtual-tour.store";

// =============================================================================
// COMPONENTS
// =============================================================================

export { default as VirtualTourViewer } from "./components/virtual-tour-viewer";
export { default as TourManagementDashboard } from "./components/tour-management-dashboard";
export { default as CreateTourForm } from "./components/create-tour-form";
export { default as TourPlayer } from "./components/tour-player";
export { default as CollaborationPanel } from "./components/collaboration-panel";
export { default as TourAnalyticsDashboard } from "./components/tour-analytics-dashboard";

// =============================================================================
// HOOKS & UTILITIES
// =============================================================================

export { default as useVirtualTourIntegration } from "./hooks/use-virtual-tour-integration";

// =============================================================================
// FRONTEND SERVICE INTEGRATIONS
// =============================================================================

// WebXR Integration
export {
	WebXRService,
	isWebXRSupported,
	isVRSupported,
	isARSupported,
	getXRCapabilities,
} from "@/lib/webxr";

// Mobile PWA Integration
export {
	MobilePWAService,
	isMobileDevice,
	isTabletDevice,
	isTouchDevice,
	hasGyroscope,
	getNetworkInfo,
} from "@/lib/mobile";

// Accessibility Integration
export {
	AccessibilityService,
	isScreenReaderActive,
	hasVoiceRecognition,
	supportsTextToSpeech,
	getVoices,
	announceToScreenReader,
} from "@/lib/accessibility";

// Collaboration Integration
export {
	CollaborationClient,
	isWebRTCSupported,
	isWebSocketSupported,
	getMediaDevices,
	requestMediaPermissions,
} from "@/lib/collaboration";

// =============================================================================
// MODULE CONFIGURATION
// =============================================================================

/**
 * Virtual Tours module configuration
 */
export const virtualToursModuleConfig = {
	name: "virtual-tours",
	version: "2.0.0-advanced",
	description: "Advanced virtual tours with AI, XR, and real-time collaboration",

	features: {
		// Core features
		tourCreation: { implemented: true, version: "2.0.0" },
		sceneManagement: { implemented: true, version: "2.0.0" },
		hotspotSystem: { implemented: true, version: "2.0.0" },
		analytics: { implemented: true, version: "2.0.0" },

		// Advanced features
		aiPowered: { implemented: true, version: "2.0.0" },
		webXR: { implemented: true, version: "2.0.0" },
		realTimeCollaboration: { implemented: true, version: "2.0.0" },
		mlAnalytics: { implemented: true, version: "2.0.0" },
		accessibility: { implemented: true, version: "2.0.0" },
		mobilePWA: { implemented: true, version: "2.0.0" },

		// Kenya-specific features
		kenyaIntegration: { implemented: true, version: "2.0.0" },
		mpesaPayments: { implemented: true, version: "2.0.0" },
		airtelMoney: { implemented: true, version: "2.0.0" },
		ussdSupport: { implemented: true, version: "2.0.0" },
		smsNotifications: { implemented: true, version: "2.0.0" },
	},

	services: {
		backend: [
			"ai-service",
			"collaboration-backend",
			"ml-analytics",
			"edge-computing",
			"iot-integration",
			"security",
			"kenya-features",
		],
		frontend: [
			"webxr-service",
			"mobile-pwa-service",
			"accessibility-service",
			"collaboration-client",
		],
	},

	integrations: {
		payments: ["mpesa", "airtel-money", "stripe"],
		communications: ["sms", "ussd", "email", "whatsapp"],
		ai: ["openai", "google-ai", "elevenlabs"],
		xr: ["webxr", "threejs", "aframe"],
		analytics: ["tensorflow", "custom-ml"],
	},
} as const;

/**
 * Get available features
 */
export const getAvailableFeatures = () => {
	return Object.entries(virtualToursModuleConfig.features)
		.filter(([_, config]) => config.implemented)
		.map(([name, config]) => ({ name, ...config }));
};

/**
 * Check if feature is implemented
 */
export const isFeatureImplemented = (featureName: string): boolean => {
	const feature =
		virtualToursModuleConfig.features[
			featureName as keyof typeof virtualToursModuleConfig.features
		];
	return feature?.implemented || false;
};

/**
 * Get advanced features
 */
export const getAdvancedFeatures = () => {
	return [
		"aiPowered",
		"webXR",
		"realTimeCollaboration",
		"mlAnalytics",
		"accessibility",
		"mobilePWA",
		"kenyaIntegration",
	];
};

/**
 * Check if all advanced features are available
 */
export const hasAllAdvancedFeatures = (): boolean => {
	return getAdvancedFeatures().every((feature) => isFeatureImplemented(feature));
};

/**
 * Get Kenya-specific features
 */
export const getKenyaFeatures = () => {
	return ["kenyaIntegration", "mpesaPayments", "airtelMoney", "ussdSupport", "smsNotifications"];
};

/**
 * Check if Kenya features are available
 */
export const hasKenyaFeatures = (): boolean => {
	return getKenyaFeatures().every((feature) => isFeatureImplemented(feature));
};
