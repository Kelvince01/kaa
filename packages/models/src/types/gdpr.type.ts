import type mongoose from "mongoose";
import type { Document } from "mongoose";

export interface IDataRequest extends Document {
  userId: mongoose.Types.ObjectId;
  tenantId: mongoose.Types.ObjectId;
  type: string;
  status: string;
  requestedAt: Date;
  completedAt: Date;
  data?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface IConsentRecord extends Document {
  userId: mongoose.Types.ObjectId;
  tenantId: mongoose.Types.ObjectId;
  consentType: string;
  granted: boolean;
  grantedAt: Date;
  revokedAt: Date;
  ipAddress: string;
  userAgent: string;
  createdAt: Date;
  updatedAt: Date;
}
