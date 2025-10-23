// Application status enum
export enum ApplicationStatus {
  draft = "draft",
  submitted = "submitted",
  in_review = "in_review",
  approved = "approved",
  rejected = "rejected",
  withdrawn = "withdrawn",
}

// Timeline event status enum
export enum TimelineEventStatus {
  COMPLETED = "completed",
  IN_PROGRESS = "in_progress",
  WARNING = "warning",
  ERROR = "error",
}

// Timeline event interface
export type ApplicationTimelineEvent = {
  _id?: string;
  title: string;
  description: string;
  date: string;
  status: TimelineEventStatus;
  actor?: string | any; // user id or user object
};

// Application interface
export type Application = {
  _id: string;
  property: string | any; // property id or object
  tenant: string | any; // tenant id or user object
  status: ApplicationStatus;
  documents: string[] | any[];
  moveInDate: string;
  offerAmount?: number;
  notes?: string;
  timeline: ApplicationTimelineEvent[];
  appliedAt: string;
  messages?: string[] | any[];
  landlord?: string | any;
  rejectionReason?: string;
  approvedBy?: string | any;
  approvedAt?: string;
  isExpired?: boolean;
  expiresAt?: string;
  createdAt?: string;
};

// Create input
export type ApplicationCreateInput = {
  property: string;
  moveInDate: string;
  offerAmount?: number;
  notes?: string;
  documents?: string[];
};

// Update input
export type ApplicationUpdateInput = {
  status?: ApplicationStatus;
  moveInDate?: string;
  offerAmount?: number;
  notes?: string;
  documents?: string[];
  rejectionReason?: string;
};

// List response
export type ApplicationListResponse = {
  items: Application[];
  pagination: {
    pages: number;
    total: number;
    page: number;
    limit: number;
  };
  status: "success" | "error";
  message?: string;
};

// Single response
export type ApplicationResponse = {
  data: Application;
  status: "success" | "error";
  message?: string;
};

export type ApplicationFilter = {
  status?: ApplicationStatus | null;
  propertyId?: string;
  page?: number;
  limit?: number;
};
