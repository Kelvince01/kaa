import type mongoose from "mongoose";
import type { Document } from "mongoose";

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

export enum TransitionType {
  FADE = "fade",
  SLIDE = "slide",
  ZOOM = "zoom",
  FLIP = "flip",
  INSTANT = "instant",
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

export enum HotspotTrigger {
  CLICK = "click",
  HOVER = "hover",
  PROXIMITY = "proximity",
  AUTO = "auto",
  GESTURE = "gesture",
}

export type ViewAngle = {
  yaw: number; // Horizontal rotation (-180 to 180)
  pitch: number; // Vertical rotation (-90 to 90)
  fov: number; // Field of view (30 to 120)
};

export type BrandingSettings = {
  showLogo: boolean;
  logoPosition: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  showWatermark: boolean;
  customCSS?: string;
  theme: "light" | "dark" | "custom";
};

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

export type ProcessingInfo = {
  status: "pending" | "processing" | "completed" | "failed";
  progress: number;
  startedAt: Date;
  completedAt?: Date;
  error?: string;
};

export type SceneMetadata = {
  captureDate: Date;
  camera?: string;
  resolution: { width: number; height: number };
  fileSize: number;
  processing?: ProcessingInfo;
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
  hotspots: string[]; // Hotspot IDs
  metadata: SceneMetadata;
  order: number;
};

export type HotspotPosition = {
  x: number; // Pixel position or 3D coordinate
  y: number;
  z?: number; // For 3D scenes
  yaw?: number; // For spherical hotspots
  pitch?: number;
};

export type HotspotAction = {
  type: "navigate" | "call" | "email" | "whatsapp" | "external" | "modal";
  target: string;
  parameters?: Record<string, any>;
};

export type MeasurementData = {
  dimensions: { length: number; width: number; height?: number };
  area: number;
  unit: "meters" | "feet";
  accuracy: number;
};

export type HotspotContent = {
  title: string;
  description?: string;
  mediaUrl?: string;
  mediaType?: "image" | "video" | "audio" | "3d";
  link?: string;
  action?: HotspotAction;
  measurements?: MeasurementData;
};

export type HotspotStyle = {
  icon: string;
  color: string;
  size: number;
  animation?: "pulse" | "bounce" | "rotate" | "none";
  visible: boolean;
};

export type HotspotAnalytics = {
  views: number;
  clicks: number;
  averageViewTime: number;
  lastInteraction: Date;
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

export type TourMetadata = {
  propertyType: string;
  totalSize: number; // in square meters
  bedrooms: number;
  bathrooms: number;
  floor: number;
  county: string;
  constituency: string;
  ward: string;
  amenities: string[];
  features: string[];
};

export interface IVirtualTour extends Document {
  id: string;
  propertyId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  type: TourType;
  status: TourStatus;
  settings: TourSettings;
  scenes: TourScene[];
  hotspots: Hotspot[];
  analytics: TourAnalytics;
  metadata: TourMetadata;
  createdBy: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
}

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
  file: Buffer;
  fileName: string;
  mimeType: string;
  metadata?: Record<string, any>;
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

// AI-Powered Features
export type AIFeatures = {
  autoSceneDetection: boolean;
  smartTransitions: boolean;
  contentGeneration: boolean;
  voiceNarration: boolean;
  objectRecognition: boolean;
  qualityEnhancement: boolean;
  virtualStaging: boolean;
  damageDetection: boolean;
};

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

// Advanced VR/AR Capabilities
export type AdvancedXRSettings = TourSettings & {
  webxr: {
    enabled: boolean;
    supportedDevices: ("vr" | "ar" | "mixed")[];
    handTracking: boolean;
    eyeTracking: boolean;
    spatialMapping: boolean;
    roomScale: boolean;
  };
  hapticFeedback: {
    enabled: boolean;
    intensity: number;
    patterns: HapticPattern[];
  };
  spatialAudio: {
    enabled: boolean;
    ambientSounds: string[];
    positionalAudio: boolean;
  };
  multiUser: {
    enabled: boolean;
    maxParticipants: number;
    voiceChat: boolean;
    avatars: boolean;
  };
};

export type HapticPattern = {
  name: string;
  pattern: number[];
  duration: number;
  intensity: number;
};

// Real-time Collaboration & Streaming
export type LiveTourSession = {
  id: string;
  tourId: string;
  hostId: string;
  participants: Participant[];
  isRecording: boolean;
  streamSettings: StreamSettings;
  chatHistory: ChatMessage[];
  annotations: LiveAnnotation[];
};

export type Participant = {
  id: string;
  userId: string;
  role: "host" | "viewer" | "editor";
  joinedAt: Date;
  isActive: boolean;
  permissions: ParticipantPermissions;
};

export type StreamSettings = {
  quality: "low" | "medium" | "high" | "4k" | "adaptive";
  bitrate: number;
  fps: number;
  codec: "h264" | "h265" | "vp9" | "av1";
  audioEnabled: boolean;
  recordLocally: boolean;
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

export type ParticipantPermissions = {
  canEdit: boolean;
  canAddScenes: boolean;
  canAddHotspots: boolean;
  canModifySettings: boolean;
  canManageParticipants: boolean;
};

// Advanced Analytics & ML
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

// Edge Computing & Performance
export type EdgeComputingConfig = {
  enabled: boolean;
  nodes: EdgeNode[];
  adaptiveQuality: {
    enabled: boolean;
    networkThresholds: NetworkThreshold[];
    qualityLevels: QualityLevel[];
    autoAdjustment: boolean;
  };
  preloading: {
    predictiveLoading: boolean;
    maxCacheSize: number;
    priorityScenes: string[];
    preloadRadius: number;
  };
  compression: {
    algorithm: "gzip" | "brotli" | "zstd";
    level: number;
    adaptive: boolean;
  };
};

export type EdgeNode = {
  id: string;
  location: string;
  capacity: number;
  latency: number;
  isActive: boolean;
};

export type NetworkThreshold = {
  speed: number; // in Mbps
  quality: "low" | "medium" | "high" | "4k";
  priority: number;
};

export type QualityLevel = {
  name: string;
  resolution: { width: number; height: number };
  bitrate: number;
  fps: number;
  compressionRatio: number;
};

// Accessibility Features
export type AccessibilitySettings = {
  visualImpairment: {
    screenReaderSupport: boolean;
    highContrast: boolean;
    textToSpeech: boolean;
    audioDescriptions: AudioDescription[];
    magnification: number;
    colorBlindSupport: boolean;
  };
  motorImpairment: {
    voiceControls: boolean;
    dwellTimeNavigation: boolean;
    keyboardNavigation: boolean;
    customControls: ControlMapping[];
    autoAdvance: boolean;
  };
  cognitiveSupport: {
    simplifiedInterface: boolean;
    guidedTour: boolean;
    pauseControls: boolean;
    progressIndicator: boolean;
    skipOptions: boolean;
  };
  language: {
    primary: string;
    fallback: string;
    rtlSupport: boolean;
    fontSize: number;
    fontFamily: string;
  };
};

export type AudioDescription = {
  sceneId: string;
  description: string;
  duration: number;
  language: string;
  voice: string;
};

export type ControlMapping = {
  action: string;
  key: string;
  modifier?: string;
  description: string;
};

// Mobile & PWA Features
export type PWAConfig = {
  offlineSupport: boolean;
  backgroundSync: boolean;
  pushNotifications: boolean;
  installPrompt: boolean;
  cacheStrategy: "network-first" | "cache-first" | "stale-while-revalidate";
  updateStrategy: "immediate" | "on-next-visit" | "user-prompt";
  storageQuota: number;
};

export type MobileOptimization = {
  gyroscopeNavigation: boolean;
  touchGestures: GestureConfig[];
  batteryOptimization: {
    enabled: boolean;
    lowPowerMode: boolean;
    reducedQuality: boolean;
    pauseOnBackground: boolean;
  };
  adaptiveUI: {
    screenSizes: ScreenConfig[];
    orientation: "auto" | "portrait" | "landscape";
    safeAreas: boolean;
  };
};

export type GestureConfig = {
  type: "tap" | "double-tap" | "pinch" | "swipe" | "rotate";
  action: string;
  sensitivity: number;
  enabled: boolean;
};

export type ScreenConfig = {
  breakpoint: number;
  layout: string;
  controls: string[];
};

// IoT & Integration
export type IoTIntegration = {
  enabled: boolean;
  supportedDevices: IoTDevice[];
  smartHomePlatforms: ("alexa" | "google" | "apple" | "samsung")[];
  propertyMetrics: PropertyMetrics;
  automations: IoTAutomation[];
};

export type IoTDevice = {
  id: string;
  type: "sensor" | "camera" | "speaker" | "light" | "thermostat";
  name: string;
  location: string;
  isActive: boolean;
  data: Record<string, any>;
};

export type PropertyMetrics = {
  temperature: number;
  humidity: number;
  airQuality: number;
  energyUsage: number;
  lightLevel: number;
  soundLevel: number;
  occupancy: boolean;
  lastUpdate: Date;
};

export type IoTAutomation = {
  id: string;
  trigger: string;
  conditions: AutomationCondition[];
  actions: AutomationAction[];
  isActive: boolean;
};

export type AutomationCondition = {
  device: string;
  property: string;
  operator: ">" | "<" | "=" | "!=" | "contains";
  value: any;
};

export type AutomationAction = {
  device: string;
  action: string;
  parameters: Record<string, any>;
};

// Security & Privacy
export type SecuritySettings = {
  authentication: {
    biometric: boolean;
    twoFactor: boolean;
    sso: boolean;
    allowedDomains: string[];
  };
  privacy: {
    dataRetention: number; // days
    anonymization: boolean;
    cookieConsent: boolean;
    gdprCompliant: boolean;
  };
  content: {
    watermarking: boolean;
    drm: boolean;
    accessControl: AccessControl[];
    downloadPrevention: boolean;
  };
  monitoring: {
    accessLogging: boolean;
    anomalyDetection: boolean;
    alertRules: VirtualAlertRule[];
  };
};

export type AccessControl = {
  role: string;
  permissions: string[];
  restrictions: string[];
  expiry?: Date;
};

export type VirtualAlertRule = {
  id: string;
  condition: string;
  threshold: number;
  action: "email" | "sms" | "webhook" | "block";
  isActive: boolean;
};

export type PaymentRate = {
  amount: number;
  fee: number;
  percentage: number;
};

export type TaxConfig = {
  vat: number;
  serviceTax: number;
  digitalTax: number;
  reportingRequired: boolean;
};

// Blockchain Integration
export type BlockchainIntegration = {
  enabled: boolean;
  network: "ethereum" | "polygon" | "bsc" | "cardano";
  features: {
    nftTours: boolean;
    smartContracts: boolean;
    provenanceTracking: boolean;
    tokenizedAccess: boolean;
  };
  contracts: SmartContract[];
};

export type SmartContract = {
  address: string;
  type: "nft" | "access" | "payment" | "escrow";
  isActive: boolean;
};

// Gamification
export type GamificationSettings = {
  enabled: boolean;
  achievements: Achievement[];
  points: {
    viewTour: number;
    completeTour: number;
    shareTour: number;
    rateTour: number;
  };
  levels: UserLevel[];
  rewards: Reward[];
};

export type Achievement = {
  id: string;
  name: string;
  description: string;
  icon: string;
  points: number;
  condition: AchievementCondition;
};

export type AchievementCondition = {
  type: "tours_viewed" | "time_spent" | "hotspots_clicked" | "tours_shared";
  threshold: number;
};

export type UserLevel = {
  level: number;
  name: string;
  minPoints: number;
  benefits: string[];
};

export type Reward = {
  id: string;
  type: "discount" | "access" | "feature" | "badge";
  value: any;
  requirements: number; // points required
};

// Enhanced Tour Interface
export interface IAdvancedVirtualTour extends IVirtualTour {
  aiFeatures: AIFeatures;
  xrSettings: AdvancedXRSettings;
  accessibility: AccessibilitySettings;
  mlAnalytics: MLAnalytics;
  edgeConfig: EdgeComputingConfig;
  pwaConfig: PWAConfig;
  mobileOptimization: MobileOptimization;
  iotIntegration: IoTIntegration;
  security: SecuritySettings;
  blockchain: BlockchainIntegration;
  gamification: GamificationSettings;
  collaborationSessions: LiveTourSession[];
  version: number;
  branches: TourBranch[];
}

export type TourBranch = {
  id: string;
  name: string;
  description: string;
  parentId?: string;
  createdBy: string;
  createdAt: Date;
  isActive: boolean;
  mergedAt?: Date;
};

// Additional utility types
export type UserSegment = {
  name: string;
  criteria: SegmentCriteria;
  size: number;
  conversionRate: number;
};

export type SegmentCriteria = {
  age?: { min: number; max: number };
  location?: string[];
  interests?: string[];
  behavior?: BehaviorCriteria;
};

export type BehaviorCriteria = {
  sessionsPerMonth: number;
  avgSessionDuration: number;
  preferredDevices: string[];
  engagementLevel: "low" | "medium" | "high";
};

export type AudienceSegment = {
  segment: string;
  percentage: number;
  characteristics: string[];
  recommendations: string[];
};

export type ForecastFactor = {
  factor: string;
  impact: number; // -1 to 1
  confidence: number; // 0 to 1
};

export type HeatmapPoint = {
  x: number;
  y: number;
  intensity: number;
  duration: number;
  sceneId: string;
};
