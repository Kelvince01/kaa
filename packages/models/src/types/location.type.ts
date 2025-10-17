import type { Types } from "mongoose";
import type { IAmenity } from "./amenity.type";

// Kenya-specific Location Types
export enum KenyanCounty {
  BARINGO = "Baringo",
  BOMET = "Bomet",
  BUNGOMA = "Bungoma",
  BUSIA = "Busia",
  ELGEYO_MARAKWET = "Elgeyo-Marakwet",
  EMBU = "Embu",
  GARISSA = "Garissa",
  HOMA_BAY = "Homa Bay",
  ISIOLO = "Isiolo",
  KAJIADO = "Kajiado",
  KAKAMEGA = "Kakamega",
  KERICHO = "Kericho",
  KIAMBU = "Kiambu",
  KILIFI = "Kilifi",
  KIRINYAGA = "Kirinyaga",
  KISII = "Kisii",
  KISUMU = "Kisumu",
  KITUI = "Kitui",
  KWALE = "Kwale",
  LAIKIPIA = "Laikipia",
  LAMU = "Lamu",
  MACHAKOS = "Machakos",
  MAKUENI = "Makueni",
  MANDERA = "Mandera",
  MARSABIT = "Marsabit",
  MERU = "Meru",
  MIGORI = "Migori",
  MOMBASA = "Mombasa",
  MURANG_A = "Murang'a",
  NAIROBI = "Nairobi",
  NAKURU = "Nakuru",
  NANDI = "Nandi",
  NAROK = "Narok",
  NYAMIRA = "Nyamira",
  NYANDARUA = "Nyandarua",
  NYERI = "Nyeri",
  SAMBURU = "Samburu",
  SIAYA = "Siaya",
  TAITA_TAVETA = "Taita-Taveta",
  TANA_RIVER = "Tana River",
  THARAKA_NITHI = "Tharaka-Nithi",
  TRANS_NZOIA = "Trans Nzoia",
  TURKANA = "Turkana",
  UASIN_GISHU = "Uasin Gishu",
  VIHIGA = "Vihiga",
  WAJIR = "Wajir",
  WEST_POKOT = "West Pokot",
}

export enum LocationType {
  COUNTY = "county",
  CITY = "city",
  TOWN = "town",
  SUBURB = "suburb",
  ESTATE = "estate",
  BUILDING = "building",
  LANDMARK = "landmark",
  NEIGHBORHOOD = "neighborhood",
}

export enum LocationStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  PENDING = "pending",
  ARCHIVED = "archived",
}

export enum GeocodingProvider {
  GOOGLE_MAPS = "google_maps",
  MAPBOX = "mapbox",
  HERE_MAPS = "here_maps",
  OPENSTREETMAP = "openstreetmap",
}

export enum AreaUnit {
  SQUARE_METERS = "sqm",
  SQUARE_KILOMETERS = "sqkm",
  ACRES = "acres",
  HECTARES = "hectares",
}

// Core Location Interfaces
export type ILocation = {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  type: LocationType;
  county?: KenyanCounty;
  parent?: Types.ObjectId | ILocation;
  children?: Types.ObjectId[] | ILocation[];
  coordinates: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
  address: ILocationAddress;
  boundaries?: IGeoPolygon;
  area?: IAreaInfo;
  metadata: ILocationMetadata;
  demographics?: IDemographics;
  amenities: IAmenity[];
  transportation: ITransportation;
  safety: ISafetyInfo;
  economy: IEconomicData;
  weather?: IWeatherData;
  visibility: {
    isPublic: boolean;
    searchable: boolean;
    featured: boolean;
  };
  analytics: ILocationAnalytics;
  seo: {
    title?: string;
    description?: string;
    keywords: string[];
  };
  status: LocationStatus;
  verifiedAt?: Date;
  verifiedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;

  addView: (userId: string) => Promise<void>;
};

export type ILocationAddress = {
  street?: string;
  building?: string;
  estate?: string;
  suburb?: string;
  ward?: string;
  constituency?: string;
  county: KenyanCounty;
  postalCode?: string;
  country: string;
  formatted: string;
};

export type IGeoPolygon = {
  type: "Polygon";
  coordinates: number[][][]; // GeoJSON polygon format
};

export type IAreaInfo = {
  size: number;
  unit: AreaUnit;
  calculatedAt: Date;
  source: "manual" | "calculated" | "imported";
};

export type ILocationMetadata = {
  population?: number;
  elevation?: number;
  timeZone: string;
  languages: string[];
  currency: "KES";
  dialCode: "+254";
  alternativeNames: string[];
  historicalNames: string[];
  description?: string;
  tags: string[];
  images: ILocationImage[];
  documents: ILocationDocument[];
};

export type ILocationImage = {
  url: string;
  type: "primary" | "gallery" | "map" | "aerial";
  caption?: string;
  uploadedAt: Date;
  uploadedBy?: Types.ObjectId;
};

export type ILocationDocument = {
  name: string;
  url: string;
  type: "deed" | "survey" | "planning" | "other";
  uploadedAt: Date;
  uploadedBy?: Types.ObjectId;
};

export type IDemographics = {
  population: number;
  households: number;
  averageAge: number;
  literacy: number;
  employment: number;
  lastUpdated: Date;
  source: string;
};

export type IBusinessHours = {
  monday?: ITimeSlot[];
  tuesday?: ITimeSlot[];
  wednesday?: ITimeSlot[];
  thursday?: ITimeSlot[];
  friday?: ITimeSlot[];
  saturday?: ITimeSlot[];
  sunday?: ITimeSlot[];
};

export type ITimeSlot = {
  open: string; // HH:MM format
  close: string; // HH:MM format
};

export type ITransportation = {
  publicTransport: IPublicTransport[];
  roads: IRoadInfo[];
  airports: ITransportHub[];
  trainStations: ITransportHub[];
  busStations: ITransportHub[];
  matatu: {
    routes: IMatatuRoute[];
    stages: IMatatuStage[];
  };
};

export type IPublicTransport = {
  type: "bus" | "matatu" | "boda" | "taxi" | "train";
  routes: string[];
  frequency: "high" | "medium" | "low";
  cost: {
    min: number;
    max: number;
    currency: "KES";
  };
};

export type IRoadInfo = {
  name: string;
  type: "highway" | "arterial" | "collector" | "local";
  surface: "tarmac" | "murram" | "dirt";
  condition: "excellent" | "good" | "fair" | "poor";
};

export type ITransportHub = {
  name: string;
  type: string;
  distance: number; // in meters
  coordinates: {
    latitude: number;
    longitude: number;
  };
};

export type IMatatuRoute = {
  name: string;
  from: string;
  to: string;
  fare: number;
  duration: number; // in minutes
  frequency: number; // per hour
};

export type IMatatuStage = {
  name: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  routes: string[];
};

export type ISafetyInfo = {
  crimeRate: "very_low" | "low" | "moderate" | "high" | "very_high";
  policeStations: ISecurityFacility[];
  securityFirms: ISecurityFacility[];
  emergencyServices: IEmergencyService[];
  safetyRating: number; // 1-5
  lastUpdated: Date;
  incidents: ISecurityIncident[];
};

export type ISecurityFacility = {
  name: string;
  type: string;
  distance: number;
  contact: string;
  response: "immediate" | "fast" | "moderate" | "slow";
};

export type IEmergencyService = {
  type: "police" | "fire" | "medical" | "rescue";
  contact: string;
  availability: "24/7" | "business_hours" | "on_call";
};

export type ISecurityIncident = {
  type: string;
  date: Date;
  severity: "low" | "medium" | "high";
  resolved: boolean;
};

export type IEconomicData = {
  averageIncome: number;
  unemploymentRate: number;
  majorIndustries: string[];
  businessCount: number;
  rentRange: {
    min: number;
    max: number;
    average: number;
    currency: "KES";
  };
  propertyPrices: {
    residential: {
      min: number;
      max: number;
      average: number;
    };
    commercial: {
      min: number;
      max: number;
      average: number;
    };
    land: {
      min: number;
      max: number;
      average: number;
    };
  };
  costOfLiving: {
    index: number;
    categories: Record<string, number>;
  };
  lastUpdated: Date;
};

export type IWeatherData = {
  temperature: {
    min: number;
    max: number;
    average: number;
  };
  rainfall: {
    annual: number;
    seasonal: Record<string, number>;
  };
  humidity: {
    average: number;
    range: {
      min: number;
      max: number;
    };
  };
  seasons: {
    dry: { months: string[] };
    wet: { months: string[] };
  };
  lastUpdated: Date;
};

export type ILocationAnalytics = {
  views: {
    total: number;
    unique: number;
    lastMonth: number;
    trending: boolean;
  };
  searches: {
    total: number;
    keywords: string[];
    sources: Record<string, number>;
  };
  properties: {
    total: number;
    active: number;
    averagePrice: number;
    categories: Record<string, number>;
  };
  users: {
    registered: number;
    active: number;
    demographics: Record<string, any>;
  };
  bookings: {
    total: number;
    successful: number;
    cancelled: number;
    revenue: number;
  };
  popularity: {
    score: number;
    rank: number;
    trending: boolean;
  };
  lastUpdated: Date;
};

// Location Search Interfaces
export type ILocationSearchQuery = {
  query?: string;
  county?: KenyanCounty;
  type?: LocationType;
  coordinates?: {
    latitude: number;
    longitude: number;
    radius?: number; // in kilometers
  };
  amenities?: string[];
  priceRange?: {
    min?: number;
    max?: number;
  };
  features?: string[];
  sortBy?: LocationSortField;
  sortOrder?: "asc" | "desc";
  limit?: number;
  skip?: number;
};

export enum LocationSortField {
  NAME = "name",
  POPULARITY = "analytics.popularity.score",
  DISTANCE = "distance",
  CREATED_AT = "createdAt",
  UPDATED_AT = "updatedAt",
  PROPERTY_COUNT = "analytics.properties.total",
  AVERAGE_PRICE = "analytics.properties.averagePrice",
}

export type ILocationSearchResult = {
  locations: ILocationSearchItem[];
  total: number;
  aggregations: ILocationAggregations;
  facets: ILocationFacets;
};

export type ILocationSearchItem = {
  _id: string;
  name: string;
  type: LocationType;
  county: KenyanCounty;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  address: {
    formatted: string;
  };
  analytics: {
    properties: {
      total: number;
      averagePrice: number;
    };
    popularity: {
      score: number;
    };
  };
  amenities: {
    count: number;
    categories: string[];
  };
  images: {
    primary?: string;
  };
  distance?: number;
  relevanceScore?: number;
};

export type ILocationAggregations = {
  counties: { county: string; count: number }[];
  types: { type: string; count: number }[];
  priceRanges: { range: string; count: number }[];
  amenityCategories: { category: string; count: number }[];
};

export type ILocationFacets = {
  counties: string[];
  types: string[];
  amenityCategories: string[];
  features: string[];
};

// Geocoding Interfaces
export type IGeocodingRequest = {
  address?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  provider?: GeocodingProvider;
  language?: string;
  region?: string;
};

export type IGeocodingResponse = {
  success: boolean;
  provider: GeocodingProvider;
  results: IGeocodingResult[];
  usage: {
    requestsToday: number;
    requestsThisMonth: number;
    limit: number;
  };
};

export type IGeocodingResult = {
  address: {
    formatted: string;
    components: {
      building?: string;
      street?: string;
      suburb?: string;
      city?: string;
      county?: string;
      postalCode?: string;
      country?: string;
    };
  };
  coordinates: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  type: string;
  confidence: number;
  viewport?: {
    northeast: { lat: number; lng: number };
    southwest: { lat: number; lng: number };
  };
  placeId?: string;
};

// Location Service Configuration
export type ILocationServiceConfig = {
  geocoding: {
    providers: {
      google: {
        apiKey: string;
        enabled: boolean;
        dailyLimit: number;
      };
      mapbox: {
        apiKey: string;
        enabled: boolean;
        dailyLimit: number;
      };
    };
    defaultProvider: GeocodingProvider;
    cacheResults: boolean;
    cacheDuration: number; // in seconds
  };
  search: {
    defaultRadius: number; // in kilometers
    maxRadius: number;
    defaultLimit: number;
    maxLimit: number;
    enableAnalytics: boolean;
  };
  analytics: {
    updateInterval: number; // in minutes
    retentionDays: number;
    aggregateData: boolean;
  };
  data: {
    autoImport: boolean;
    sources: string[];
    updateFrequency: number; // in hours
  };
};

// Location Events
export enum LocationEventType {
  LOCATION_CREATED = "location.created",
  LOCATION_UPDATED = "location.updated",
  LOCATION_DELETED = "location.deleted",
  LOCATION_VIEWED = "location.viewed",
  LOCATION_SEARCHED = "location.searched",
  GEOCODING_PERFORMED = "location.geocoding.performed",
  ANALYTICS_UPDATED = "location.analytics.updated",
  BOUNDARY_UPDATED = "location.boundary.updated",
  AMENITY_ADDED = "location.amenity.added",
  AMENITY_REMOVED = "location.amenity.removed",
}

export type ILocationEvent = {
  type: LocationEventType;
  locationId?: string;
  userId?: string;
  data: Record<string, any>;
  timestamp: Date;
  source: string;
};

// Location Statistics
export type ILocationStatistics = {
  totalLocations: number;
  locationsByType: Record<LocationType, number>;
  locationsByCounty: Record<KenyanCounty, number>;
  geocodingUsage: {
    total: number;
    byProvider: Record<GeocodingProvider, number>;
    today: number;
    thisMonth: number;
  };
  searchMetrics: {
    totalSearches: number;
    topKeywords: { keyword: string; count: number }[];
    popularLocations: { locationId: string; name: string; views: number }[];
  };
  dataQuality: {
    withCoordinates: number;
    withBoundaries: number;
    withAmenities: number;
    withImages: number;
    verified: number;
  };
  lastUpdated: Date;
};

// Error Types
export enum LocationErrorCode {
  LOCATION_NOT_FOUND = "LOCATION_NOT_FOUND",
  INVALID_COORDINATES = "INVALID_COORDINATES",
  INVALID_COUNTY = "INVALID_COUNTY",
  GEOCODING_FAILED = "GEOCODING_FAILED",
  GEOCODING_LIMIT_EXCEEDED = "GEOCODING_LIMIT_EXCEEDED",
  BOUNDARY_INVALID = "BOUNDARY_INVALID",
  DUPLICATE_LOCATION = "DUPLICATE_LOCATION",
  PERMISSION_DENIED = "PERMISSION_DENIED",
  SEARCH_FAILED = "SEARCH_FAILED",
  ANALYTICS_ERROR = "ANALYTICS_ERROR",
}

export type ILocationError = {
  code: LocationErrorCode;
  message: string;
  details?: Record<string, any>;
  timestamp: Date;
};

// API Request/Response Types
export type ICreateLocationRequest = {
  name: string;
  type: LocationType;
  county: KenyanCounty;
  parent?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  address?: Partial<ILocationAddress>;
  description?: string;
  tags?: string[];
  amenities?: Partial<IAmenity>[];
  metadata?: Partial<ILocationMetadata>;
};

export type IUpdateLocationRequest = {
  name?: string;
  type?: LocationType;
  county?: KenyanCounty;
  parent?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  address?: Partial<ILocationAddress>;
  description?: string;
  tags?: string[];
  amenities?: Partial<IAmenity>[];
  metadata?: Partial<ILocationMetadata>;
  status?: LocationStatus;
};

export type ILocationResponse = {
  success: boolean;
  data?: ILocation;
  message?: string;
  error?: ILocationError;
};

export type ILocationListResponse = {
  success: boolean;
  data?: {
    locations: ILocation[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  };
  message?: string;
  error?: ILocationError;
};

// Constants
export const KENYAN_COUNTIES = Object.values(KenyanCounty);

export const LOCATION_CONFIG = {
  DEFAULT_COUNTRY: "Kenya",
  DEFAULT_CURRENCY: "KES",
  DEFAULT_DIAL_CODE: "+254",
  DEFAULT_TIMEZONE: "Africa/Nairobi",
  DEFAULT_LANGUAGE: "en-KE",
  SUPPORTED_LANGUAGES: ["en-KE", "sw-KE"], // English, Swahili
  COORDINATE_PRECISION: 6,
  SEARCH_RADIUS_KM: 50,
  MAX_SEARCH_RADIUS_KM: 500,
  GEOCODING_CACHE_TTL: 86_400, // 24 hours
  ANALYTICS_UPDATE_INTERVAL: 3_600_000, // 1 hour in ms

  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  DEFAULT_RADIUS: 1000, // meters
  MAX_RADIUS: 50_000, // 50km
  //   GEOCODING_CACHE_TTL: 3600, // 1 hour
  GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY,
  MAPBOX_ACCESS_TOKEN: process.env.MAPBOX_ACCESS_TOKEN,
  OSM_NOMINATIM_URL: "https://nominatim.openstreetmap.org",
  RATE_LIMIT_REQUESTS: 100,
  RATE_LIMIT_WINDOW: 3_600_000, // 1 hour
};
