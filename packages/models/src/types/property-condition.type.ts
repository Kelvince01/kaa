/**
 * Property condition report type
 */

import type mongoose from "mongoose";

export enum ConditionStatus {
  EXCELLENT = "excellent",
  GOOD = "good",
  FAIR = "fair",
  POOR = "poor",
  DAMAGED = "damaged",
}

export type IConditionItem = {
  name: string;
  category: string;
  status: ConditionStatus;
  description?: string;
  photos?: Array<{
    url: string;
    fileName: string;
    fileType: string;
    size: number;
  }>;
  notes?: string;
};

export interface IPropertyCondition extends mongoose.Document {
  property: mongoose.Types.ObjectId;
  tenant?: mongoose.Types.ObjectId;
  landlord: mongoose.Types.ObjectId;
  reportType: "check_in" | "check_out" | "inspection" | "inventory";
  reportDate: Date;
  items: IConditionItem[];
  overallCondition: ConditionStatus;
  notes: string;
  signedByTenant: boolean;
  signedByLandlord: boolean;
  tenantSignatureDate?: Date;
  landlordSignatureDate?: Date;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  attachments?: Array<{
    url: string;
    fileName: string;
    fileType: string;
    size: number;
  }>;
}
