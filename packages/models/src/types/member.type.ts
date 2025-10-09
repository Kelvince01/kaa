import type mongoose from "mongoose";
import type { BaseDocument } from "./base.type";

export interface IMember extends BaseDocument {
  type?: "admin" | "agent" | "caretaker" | "viewer";
  user: mongoose.Types.ObjectId;
  organization: mongoose.Types.ObjectId;
  role: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  plan: mongoose.Types.ObjectId;
  domain?: string;
  logo?: string;
  isActive: boolean;
  settings: {
    maxUsers: number;
    features: string[];
    customBranding: boolean;
    allowInvites: boolean;
    requireEmailVerification: boolean;
    twoFactorRequired: boolean;
  };
  usage: {
    users: number;
    apiCalls: number;
    storage: number; // in bytes
    bandwidth: number; // in bytes
  };
  limits: {
    users: number;
    apiCalls: number;
    storage: number;
    bandwidth: number;
  };

  customPermissions?: string[];
}
