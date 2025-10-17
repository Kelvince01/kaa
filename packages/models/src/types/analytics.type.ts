import type mongoose from "mongoose";

// Analytics Event Model - for tracking user interactions and form events
export type IAnalyticsEvent = {
  event: string;
  step?: string;
  field?: string;
  value?: any;
  timestamp: Date;
  sessionId: string;
  userId?: string;
  memberId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
};

// Property Views Model - for tracking property viewing analytics
export type IPropertyView = {
  propertyId: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  sessionId: string;
  ipAddress: string;
  userAgent: string;
  referrer?: string;
  viewDuration?: number; // in seconds
  source: "direct" | "search" | "social" | "email" | "ads" | "other";
  deviceType: "mobile" | "tablet" | "desktop";
  location?: {
    country?: string;
    city?: string;
    coordinates?: [number, number]; // [longitude, latitude]
  };
  engagement?: {
    scrollDepth?: number; // percentage
    timeOnPage?: number; // seconds
    interactions?: string[]; // buttons clicked, etc.
    contactRequested?: boolean;
    favorited?: boolean;
    shared?: boolean;
  };
  timestamp: Date;
  createdAt?: Date;
  updatedAt?: Date;
};

// User Session Model - for tracking user sessions and form analytics
export type IUserSession = {
  sessionId: string;
  userId?: string;
  memberId?: string;
  startTime: Date;
  endTime?: Date;
  duration?: number; // in seconds
  pageViews: number;
  deviceInfo: {
    userAgent: string;
    deviceType: "mobile" | "tablet" | "desktop";
    browser: string;
    os: string;
    screenResolution?: string;
  };
  location?: {
    ipAddress: string;
    country?: string;
    city?: string;
    coordinates?: [number, number];
  };
  referrer?: string;
  entryPage: string;
  exitPage?: string;
  formInteractions?: {
    formType?: string;
    currentStep?: string;
    completedSteps?: string[];
    fieldInteractions?: Record<string, number>;
    errors?: Array<{
      field: string;
      error: string;
      timestamp: Date;
    }>;
    timePerStep?: Record<string, number>;
    completed?: boolean;
    dropOffPoint?: string;
  };
  engagement: {
    totalScrollDepth: number;
    totalTimeActive: number; // time actively engaging vs idle
    clicksCount: number;
    pagesVisited: string[];
  };
  conversionEvents?: Array<{
    event: string;
    timestamp: Date;
    value?: number;
  }>;
  isBot?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
};
