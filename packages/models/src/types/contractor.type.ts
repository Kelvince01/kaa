import type mongoose from "mongoose";
import type { BaseDocument } from "./base.type";

export enum ContractorStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  SUSPENDED = "suspended",
}

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

export interface IContractorRating extends BaseDocument {
  workOrder: mongoose.Types.ObjectId;
  ratedBy: mongoose.Types.ObjectId;
  rating: number; // 1-5
  comment?: string;
  qualityRating: number;
  timelinessRating: number;
  communicationRating: number;
  professionalismRating: number;
}

export interface IContractor extends BaseDocument {
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
    expiryDate: Date;
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
  ratings: IContractorRating[];
  averageRating: number;
  totalJobs: number;
  completedJobs: number;
  onTimePercentage: number;
  emergencyAvailable: boolean;
  notes?: string;
  addedBy: mongoose.Types.ObjectId; // Property manager/landlord who added them
  lastActiveDate?: Date;
}
