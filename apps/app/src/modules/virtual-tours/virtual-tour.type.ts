/**
 * Virtual Tours Types for Frontend
 */

// Core virtual tour types
export type VirtualTour = {
  _id: string;
  id: string;
  propertyId: string;
  title: string;
  description: string;
  type: TourType;
  status: TourStatus;
  settings: TourSettings;
  scenes: TourScene[];
  hotspots: Hotspot[];
  analytics: TourAnalytics;
  metadata: TourMetadata;
  createdBy: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
};

export enum TourType {
  PHOTO_360 = "photo_360",
  VIDEO_360 = "video_360",
  THREE_D_MODEL = "3d_model",
  VIRTUAL_REALITY = "virtual_reality",
  AUGMENTED_REALITY = "augmented_reality",
  INTERACTIVE_WALKTHROUGH = "interactive_walkthrough",
  DRONE_AERIAL = "drone_aerial",
}

export enum TourStatus {
  DRAFT = "draft",
  PROCESSING = "processing",
  PUBLISHED = "published",
  ARCHIVED = "archived",
  FAILED = "failed",
}

export enum SceneType {
  PANORAMA = "panorama",
  EQUIRECTANGULAR = "equirectangular",
  CUBEMAP = "cubemap",
  VIDEO_360 = "video_360",
  THREE_D = "3d",
  AERIAL = "aerial",
}

export enum HotspotType {
  INFO = "info",
  NAVIGATION = "navigation",
  MEDIA = "media",
  PRODUCT = "product",
  CONTACT = "contact",
  MEASUREMENT = "measurement",
  ANNOTATION = "annotation",
}

export type TourSettings = {
  autoRotate: boolean;
  autoRotateSpeed: number;
  initialView: ViewAngle;
  controlsEnabled: boolean;
  gyroscopeEnabled: boolean;
  vrMode: boolean;
  arEnabled: boolean;
  audioEnabled: boolean;
  backgroundMusic?: string;
  logoOverlay?: string;
  branding: BrandingSettings;
};

export type ViewAngle = {
  yaw: number;
  pitch: number;
  fov: number;
};

export type BrandingSettings = {
  showLogo: boolean;
  logoPosition: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  showWatermark: boolean;
  customCSS?: string;
  theme: "light" | "dark" | "custom";
};

export type TourScene = {
  id: string;
  name: string;
  description: string;
  type: SceneType;
  mediaUrl: string;
  thumbnailUrl: string;
  position: ScenePosition;
  connections: SceneConnection[];
  hotspots: string[];
  metadata: SceneMetadata;
  order: number;
};

export type ScenePosition = {
  latitude?: number;
  longitude?: number;
  altitude?: number;
  floor?: number;
  room?: string;
};

export type SceneConnection = {
  targetSceneId: string;
  position: { x: number; y: number; z: number };
  arrow: boolean;
  transition: TransitionType;
};

export enum TransitionType {
  FADE = "fade",
  SLIDE = "slide",
  ZOOM = "zoom",
  FLIP = "flip",
  INSTANT = "instant",
}

export type SceneMetadata = {
  captureDate: Date;
  camera?: string;
  resolution: { width: number; height: number };
  fileSize: number;
  processing?: ProcessingInfo;
};

export type ProcessingInfo = {
  status: "pending" | "processing" | "completed" | "failed";
  progress: number;
  startedAt: Date;
  completedAt?: Date;
  error?: string;
};

export type Hotspot = {
  id: string;
  sceneId: string;
  type: HotspotType;
  position: HotspotPosition;
  content: HotspotContent;
  style: HotspotStyle;
  trigger: HotspotTrigger;
  analytics: HotspotAnalytics;
};

export type HotspotPosition = {
  x: number;
  y: number;
  z?: number;
  yaw?: number;
  pitch?: number;
};

export type HotspotContent = {
  title: string;
  description?: string;
  mediaUrl?: string;
  mediaType?: "image" | "video" | "audio" | "3d";
  link?: string;
  action?: HotspotAction;
};

export type HotspotAction = {
  type: "navigate" | "call" | "email" | "whatsapp" | "external" | "modal";
  target: string;
  parameters?: Record<string, any>;
};

export type HotspotStyle = {
  icon: string;
  color: string;
  size: number;
  animation?: "pulse" | "bounce" | "rotate" | "none";
  visible: boolean;
};

export enum HotspotTrigger {
  CLICK = "click",
  HOVER = "hover",
  PROXIMITY = "proximity",
  AUTO = "auto",
  GESTURE = "gesture",
}

export type HotspotAnalytics = {
  views: number;
  clicks: number;
  averageViewTime: number;
  lastInteraction: Date;
};

export type TourAnalytics = {
  totalViews: number;
  uniqueVisitors: number;
  averageDuration: number;
  completionRate: number;
  deviceBreakdown: DeviceAnalytics;
  locationBreakdown: LocationAnalytics;
  sceneAnalytics: SceneAnalytics[];
  heatmap: HeatmapData[];
  conversionMetrics: ConversionMetrics;
};

export type DeviceAnalytics = {
  mobile: number;
  desktop: number;
  tablet: number;
  vr: number;
  ar: number;
};

export type LocationAnalytics = {
  [country: string]: {
    views: number;
    averageDuration: number;
    bounceRate: number;
  };
};

export type SceneAnalytics = {
  sceneId: string;
  views: number;
  averageTime: number;
  exitRate: number;
  hotspotEngagement: number;
};

export type HeatmapData = {
  sceneId: string;
  position: { x: number; y: number };
  intensity: number;
  duration: number;
};

export type ConversionMetrics = {
  inquiries: number;
  bookings: number;
  phoneClicks: number;
  emailClicks: number;
  whatsappClicks: number;
  conversionRate: number;
};

export type TourMetadata = {
  propertyType: string;
  totalSize: number;
  bedrooms: number;
  bathrooms: number;
  floor: number;
  county: string;
  constituency: string;
  ward: string;
  amenities: string[];
  features: string[];
};

// Request/Response types
export type TourCreationRequest = {
  propertyId: string;
  title: string;
  description: string;
  type: TourType;
  settings: Partial<TourSettings>;
  metadata: TourMetadata;
};

export type MediaUploadRequest = {
  tourId: string;
  sceneId?: string;
  file: File;
  fileName: string;
  mimeType: string;
  metadata?: Record<string, any>;
};

export type TourListResponse = {
  data: {
    tours: VirtualTour[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
    filters?: any;
  };
  status: "success" | "error";
  message?: string;
};

export type TourEmbedOptions = {
  width: number;
  height: number;
  autoplay: boolean;
  controls: boolean;
  responsive: boolean;
  theme: "light" | "dark";
  customCSS?: string;
};

// Advanced Features Types (Frontend)
export type AIGeneratedContent = {
  title?: string;
  description?: string;
  hotspotSuggestions: HotspotSuggestion[];
  sceneConnections: SceneConnectionSuggestion[];
  metadata?: Partial<TourMetadata>;
  voiceScript?: VoiceScript[];
};

export type HotspotSuggestion = {
  type: HotspotType;
  position: HotspotPosition;
  confidence: number;
  content: Partial<HotspotContent>;
  reasoning: string;
};

export type SceneConnectionSuggestion = {
  fromSceneId: string;
  toSceneId: string;
  position: { x: number; y: number; z: number };
  confidence: number;
  transition: TransitionType;
};

export type VoiceScript = {
  sceneId: string;
  text: string;
  language: "en" | "sw" | "auto";
  voice: "male" | "female" | "neutral";
  timing: {
    start: number;
    duration: number;
  };
};

// Collaboration Types (Frontend)
export type CollaborationSession = {
  id: string;
  tourId: string;
  hostId: string;
  participants: Participant[];
  isConnected: boolean;
  role: "host" | "viewer" | "editor";
};

export type Participant = {
  id: string;
  userId: string;
  role: "host" | "viewer" | "editor";
  joinedAt: Date;
  isActive: boolean;
  permissions: ParticipantPermissions;
};

export type ParticipantPermissions = {
  canEdit: boolean;
  canAddScenes: boolean;
  canAddHotspots: boolean;
  canModifySettings: boolean;
  canManageParticipants: boolean;
};

export type ChatMessage = {
  id: string;
  userId: string;
  message: string;
  timestamp: Date;
  type: "text" | "system" | "annotation";
};

export type LiveAnnotation = {
  id: string;
  userId: string;
  sceneId: string;
  position: { x: number; y: number };
  content: string;
  timestamp: Date;
  type: "note" | "question" | "issue";
};

// ML Analytics Types (Frontend)
export interface MLAnalytics extends TourAnalytics {
  predictions: {
    expectedViews: number;
    conversionProbability: number;
    optimalHotspotPlacements: HotspotSuggestion[];
    performanceScore: number;
    engagementForecast: EngagementForecast;
  };
  insights: {
    userBehaviorPatterns: BehaviorPattern[];
    seasonalTrends: SeasonalData[];
    competitorComparison: CompetitorMetrics;
    marketInsights: MarketInsights;
  };
  realTimeMetrics: {
    activeViewers: number;
    currentEngagementRate: number;
    liveHeatmap: HeatmapPoint[];
    performanceHealth: PerformanceHealth;
  };
}

export type EngagementForecast = {
  nextWeek: number;
  nextMonth: number;
  peak: Date;
  factors: ForecastFactor[];
};

export type BehaviorPattern = {
  pattern: string;
  frequency: number;
  impact: number;
  segments: UserSegment[];
};

export type UserSegment = {
  name: string;
  criteria: any;
  size: number;
  conversionRate: number;
};

export type SeasonalData = {
  month: number;
  averageViews: number;
  conversionRate: number;
  popularFeatures: string[];
};

export type CompetitorMetrics = {
  averageViews: number;
  averageTours: number;
  popularFeatures: string[];
  pricingStrategy: string;
};

export type MarketInsights = {
  demandScore: number;
  priceRecommendation: number;
  optimalListingTime: Date;
  targetAudience: AudienceSegment[];
};

export type AudienceSegment = {
  segment: string;
  percentage: number;
  characteristics: string[];
  recommendations: string[];
};

export type ForecastFactor = {
  factor: string;
  impact: number;
  confidence: number;
};

export type HeatmapPoint = {
  x: number;
  y: number;
  intensity: number;
  duration: number;
  sceneId: string;
};

export type PerformanceHealth = {
  overall: number;
  loading: number;
  interaction: number;
  conversion: number;
  issues: PerformanceIssue[];
};

export type PerformanceIssue = {
  type: string;
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  recommendation: string;
};

// API Response types
export type ApiResponse<T> = {
  status: "success" | "error";
  message: string;
  data?: T;
};

export type PaginatedResponse<T> = {
  status: "success" | "error";
  message: string;
  data: {
    items: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
};

// Form types
export type CreateTourFormData = {
  propertyId: string;
  title: string;
  description: string;
  type: TourType;
  settings: Partial<TourSettings>;
  metadata: TourMetadata;
};

export type SceneFormData = {
  name: string;
  description: string;
  type: SceneType;
  mediaFile?: File;
  position: ScenePosition;
  metadata: Partial<SceneMetadata>;
};

export type HotspotFormData = {
  type: HotspotType;
  position: HotspotPosition;
  content: HotspotContent;
  style: Partial<HotspotStyle>;
  trigger: HotspotTrigger;
};

// Feature capability types
export type VirtualTourCapabilities = {
  advancedMode: boolean;
  orchestrator: {
    initialized: boolean;
    healthyServices: string[];
    failedServices: string[];
    totalServices: number;
    systemHealth: string;
  };
  features: {
    aiAnalysis: boolean;
    webXR: boolean;
    realTimeCollaboration: boolean;
    mlAnalytics: boolean;
    edgeComputing: boolean;
    accessibility: boolean;
    mobilePWA: boolean;
    iotIntegration: boolean;
    security: boolean;
    kenyaFeatures: boolean;
    voiceControl: boolean;
    adaptiveQuality: boolean;
  };
  serviceMetrics: Record<string, any>;
  version: string;
  lastHealthCheck: Date;
};

// Payment integration types
export type TourPayment = {
  tourId: string;
  amount: number;
  currency: "KES" | "USD";
  provider: "mpesa" | "airtel_money" | "stripe";
  phoneNumber?: string;
  reference: string;
  description: string;
  status: "pending" | "completed" | "failed" | "cancelled";
};

// Kenya-specific types
export type KenyaPropertyTaxes = {
  stampDuty: number;
  capitalGains: number;
  landRates: number;
  total: number;
  breakdown: Array<{
    type: string;
    rate: string;
    amount: number;
  }>;
};

export type KenyaFinancingOptions = {
  propertyValue: string;
  downPayment: string;
  loanAmount: string;
  monthlyPayment: string;
  interestRate: string;
  termYears: number;
  totalInterest: string;
  eligibleBanks: string[];
};
