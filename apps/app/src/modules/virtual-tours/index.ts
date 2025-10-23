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
  AIGeneratedContent,
  ApiResponse,
  BehaviorPattern,
  BrandingSettings,
  ChatMessage,
  CollaborationSession,
  ConversionMetrics,
  CreateTourFormData,
  DeviceAnalytics,
  EngagementForecast,
  Hotspot,
  HotspotContent,
  HotspotFormData,
  HotspotPosition,
  HotspotStyle,
  HotspotSuggestion,
  HotspotType,
  KenyaFinancingOptions,
  KenyaPropertyTaxes,
  LiveAnnotation,
  LocationAnalytics,
  MediaUploadRequest,
  MLAnalytics,
  PaginatedResponse,
  Participant,
  ParticipantPermissions,
  SceneConnection,
  SceneConnectionSuggestion,
  SceneFormData,
  ScenePosition,
  SceneType,
  TourAnalytics,
  TourCreationRequest,
  TourEmbedOptions,
  TourListResponse,
  TourMetadata,
  TourPayment,
  TourScene,
  TourSettings,
  TourStatus,
  TourType,
  UserSegment,
  ViewAngle,
  VirtualTour,
  VirtualTourCapabilities,
  VoiceScript,
} from "./virtual-tour.type";

// =============================================================================
// SERVICES & API
// =============================================================================

export {
  // Hotspot operations
  addHotspot,
  // Scene operations
  addScene,
  // Kenya-specific features
  calculatePropertyTaxes,
  // Collaboration operations
  createCollaborationSession,
  createVirtualTour,
  deleteHotspot,
  deleteScene,
  deleteVirtualTour,
  disableAdvancedMode,
  duplicateVirtualTour,
  enableAdvancedMode,
  enableVoiceControl,
  endCollaborationSession,
  generateSmartConnections,
  getAccessibilityReport,
  getAdvancedServicesHealth,
  getCollaborationSession,
  getCountyMarketData,
  getFinancingOptions,
  getOptimizedContentUrl,
  getPopularTours,
  getRealTimeMetrics,
  // Advanced features
  getServiceCapabilities,
  // Analytics operations
  getTourAnalytics,
  // Embed operations
  getTourEmbedCode,
  getTourRecommendations,
  getUSSDHealth,
  // Communication services
  getUSSDStats,
  getUserTours,
  getVirtualTour,
  // Core tour operations
  getVirtualTours,
  // Service health
  getVirtualToursHealth,
  // Payment integration
  processVirtualTourPayment,
  publishVirtualTour,
  restartAdvancedService,
  // Search and discovery
  searchTours,
  startXRSession,
  trackHotspotInteraction,
  trackSceneView,
  trackTourView,
  updateHotspot,
  updateScene,
  updateVirtualTour,
  // Media operations
  uploadMedia,
} from "./virtual-tour.service";

// =============================================================================
// QUERIES & MUTATIONS
// =============================================================================

export {
  // Hotspot mutations
  useAddHotspot,
  // Scene mutations
  useAddScene,
  // Collaboration mutations
  useCreateCollaborationSession,
  // Tour mutations
  useCreateVirtualTour,
  useDeleteHotspot,
  useDeleteScene,
  useDeleteVirtualTour,
  useDisableAdvancedMode,
  useDuplicateVirtualTour,
  // Advanced feature mutations
  useEnableAdvancedMode,
  useEnableVoiceControl,
  useEndCollaborationSession,
  useGenerateSmartConnections,
  // Payment mutations
  useProcessTourPayment,
  usePublishVirtualTour,
  useRestartAdvancedService,
  useStartXRSession,
  useTrackHotspotInteraction,
  useTrackSceneView,
  // Tracking mutations
  useTrackTourView,
  useUpdateHotspot,
  useUpdateScene,
  useUpdateVirtualTour,
  // Media mutations
  useUploadMedia,
} from "./virtual-tour.mutations";
export {
  useAccessibilityReport,
  useAdvancedServicesHealth,
  useCollaborationSession,
  useCountyMarketData,
  useFinancingOptions,
  usePopularTours,
  usePropertyTaxes,
  useRealTimeMetrics,
  useSearchTours,
  useServiceCapabilities,
  useTourAnalytics,
  useTourEmbedCode,
  useTourRecommendations,
  useUSSDHealth,
  useUSSDStats,
  useUserTours,
  useVirtualTour,
  // Queries
  useVirtualTours,
  useVirtualToursHealth,
} from "./virtual-tour.queries";

// =============================================================================
// STATE MANAGEMENT
// =============================================================================

export {
  useVirtualTourActions,
  useVirtualTourSelectors,
  useVirtualTourState,
  useVirtualTourStore,
} from "./virtual-tour.store";

// =============================================================================
// COMPONENTS
// =============================================================================

export { default as CollaborationPanel } from "./components/collaboration-panel";
export { default as CreateTourForm } from "./components/create-tour-form";
export { default as TourAnalyticsDashboard } from "./components/tour-analytics-dashboard";
export { default as TourManagementDashboard } from "./components/tour-management-dashboard";
export { default as TourPlayer } from "./components/tour-player";
export { default as VirtualTourViewer } from "./components/virtual-tour-viewer";

// =============================================================================
// HOOKS & UTILITIES
// =============================================================================

export { default as useVirtualTourIntegration } from "./hooks/use-virtual-tour-integration";

// =============================================================================
// FRONTEND SERVICE INTEGRATIONS
// =============================================================================

// Accessibility Integration
export {
  AccessibilityService,
  announceToScreenReader,
  getVoices,
  hasVoiceRecognition,
  isScreenReaderActive,
  supportsTextToSpeech,
} from "@/lib/accessibility";
// Collaboration Integration
export {
  CollaborationClient,
  getMediaDevices,
  isWebRTCSupported,
  isWebSocketSupported,
  requestMediaPermissions,
} from "@/lib/collaboration";
// Mobile PWA Integration
export {
  getNetworkInfo,
  hasGyroscope,
  isMobileDevice,
  isTabletDevice,
  isTouchDevice,
  MobilePWAService,
} from "@/lib/mobile";
// WebXR Integration
export {
  getXRCapabilities,
  isARSupported,
  isVRSupported,
  isWebXRSupported,
  WebXRService,
} from "@/lib/webxr";

// =============================================================================
// MODULE CONFIGURATION
// =============================================================================

/**
 * Virtual Tours module configuration
 */
export const virtualToursModuleConfig = {
  name: "virtual-tours",
  version: "2.0.0-advanced",
  description:
    "Advanced virtual tours with AI, XR, and real-time collaboration",

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
export const getAvailableFeatures = () =>
  Object.entries(virtualToursModuleConfig.features)
    .filter(([_, config]) => config.implemented)
    .map(([name, config]) => ({ name, ...config }));

/**
 * Check if feature is implemented
 */
export const isFeatureImplemented = (featureName: string): boolean => {
  const feature =
    virtualToursModuleConfig.features[
      featureName as keyof typeof virtualToursModuleConfig.features
    ];
  return feature?.implemented;
};

/**
 * Get advanced features
 */
export const getAdvancedFeatures = () => [
  "aiPowered",
  "webXR",
  "realTimeCollaboration",
  "mlAnalytics",
  "accessibility",
  "mobilePWA",
  "kenyaIntegration",
];

/**
 * Check if all advanced features are available
 */
export const hasAllAdvancedFeatures = (): boolean =>
  getAdvancedFeatures().every((feature) => isFeatureImplemented(feature));

/**
 * Get Kenya-specific features
 */
export const getKenyaFeatures = () => [
  "kenyaIntegration",
  "mpesaPayments",
  "airtelMoney",
  "ussdSupport",
  "smsNotifications",
];

/**
 * Check if Kenya features are available
 */
export const hasKenyaFeatures = (): boolean =>
  getKenyaFeatures().every((feature) => isFeatureImplemented(feature));
