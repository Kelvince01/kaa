/**
 * Property Contractor Types
 *
 * This module provides type definitions for property contractor management
 * including contractor profiles, ratings, and availability.
 */

/**
 * Contractor status enumeration
 */
export enum ContractorStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  SUSPENDED = "suspended",
}

/**
 * Contractor specialty enumeration
 */
export enum ContractorSpecialty {
  PLUMBING = "plumbing",
  ELECTRICAL = "electrical",
  HVAC = "hvac",
  CARPENTRY = "carpentry",
  PAINTING = "painting",
  ROOFING = "roofing",
  FLOORING = "flooring",
  APPLIANCE_REPAIR = "appliance_repair",
  PEST_CONTROL = "pest_control",
  LANDSCAPING = "landscaping",
  CLEANING = "cleaning",
  GENERAL_MAINTENANCE = "general_maintenance",
  OTHER = "other",
}

/**
 * Contractor rating interface
 */
export type ContractorRating = {
  _id?: string;
  workOrder: string;
  ratedBy: string;
  rating: number; // 1-5
  comment?: string;
  qualityRating: number;
  timelinessRating: number;
  communicationRating: number;
  professionalismRating: number;
  createdAt: string;
};

/**
 * Main contractor interface
 */
export type Contractor = {
  _id: string;
  name: string;
  company?: string;
  email: string;
  phone: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  specialties: ContractorSpecialty[];
  status: ContractorStatus;
  licenseNumber?: string;
  insuranceInfo?: {
    provider: string;
    policyNumber: string;
    expiryDate: string;
    coverageAmount: number;
  };
  hourlyRate?: number;
  availability: {
    monday: { start: string; end: string; available: boolean };
    tuesday: { start: string; end: string; available: boolean };
    wednesday: { start: string; end: string; available: boolean };
    thursday: { start: string; end: string; available: boolean };
    friday: { start: string; end: string; available: boolean };
    saturday: { start: string; end: string; available: boolean };
    sunday: { start: string; end: string; available: boolean };
  };
  serviceAreas: string[]; // Array of city/region names
  ratings: ContractorRating[];
  averageRating: number;
  totalJobs: number;
  completedJobs: number;
  onTimePercentage: number;
  emergencyAvailable: boolean;
  notes?: string;
  addedBy: string; // Property manager/landlord who added them
  lastActiveDate?: string;
  createdAt: string;
  updatedAt: string;
};

/**
 * Contractor creation input
 */
export type CreateContractorInput = {
  name: string;
  company?: string;
  email: string;
  phone: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  specialties: ContractorSpecialty[];
  licenseNumber?: string;
  insuranceInfo?: {
    provider: string;
    policyNumber: string;
    expiryDate: string;
    coverageAmount: number;
  };
  hourlyRate?: number;
  serviceAreas: string[];
  emergencyAvailable?: boolean;
  notes?: string;
};

/**
 * Contractor update input
 */
export type UpdateContractorInput = {
  name?: string;
  company?: string;
  email?: string;
  phone?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  specialties?: ContractorSpecialty[];
  status?: ContractorStatus;
  licenseNumber?: string;
  insuranceInfo?: {
    provider: string;
    policyNumber: string;
    expiryDate: string;
    coverageAmount: number;
  };
  hourlyRate?: number;
  serviceAreas?: string[];
  emergencyAvailable?: boolean;
  notes?: string;
};

/**
 * Contractor query parameters
 */
export type ContractorQueryParams = {
  status?: ContractorStatus;
  specialty?: ContractorSpecialty;
  serviceArea?: string;
  emergencyOnly?: boolean;
  sortBy?: "averageRating" | "totalJobs" | "hourlyRate" | "name";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
  search?: string;
};

/**
 * Contractor rating input
 */
export type RateContractorInput = {
  workOrder: string;
  rating: number;
  comment?: string;
  qualityRating: number;
  timelinessRating: number;
  communicationRating: number;
  professionalismRating: number;
};

/**
 * Available contractor search
 */
export type AvailableContractorQuery = {
  specialty: ContractorSpecialty;
  serviceArea: string;
  date: string;
  startTime: string;
  endTime: string;
};

/**
 * Emergency contractor search
 */
export type EmergencyContractorQuery = {
  specialty: ContractorSpecialty;
  serviceArea: string;
};

/**
 * Pagination interface
 */
export type Pagination = {
  page: number;
  limit: number;
  total: number;
  pages: number;
};

/**
 * Base API response interface
 */
export type ApiResponse<T> = {
  status: "success" | "error";
  message?: string;
  data?: T;
};

/**
 * Contractor API responses
 */
export interface ContractorResponse extends ApiResponse<Contractor> {
  contractor?: Contractor;
}

export type ContractorListResponse = {
  contractors?: Contractor[];
  data?: {
    contractors: Contractor[];
    pagination: Pagination;
  };
};

export interface AvailableContractorsResponse
  extends ApiResponse<Contractor[]> {
  contractors?: Contractor[];
}
