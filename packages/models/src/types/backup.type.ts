import type mongoose from "mongoose";
import type { BaseDocument } from "./base.type";

export interface IBackup extends BaseDocument {
  name: string;
  type: string;
  status: string;
  size: number;
  location: string;
  metadata: Record<string, any>;
  memberId?: mongoose.Types.ObjectId;
  startedAt: Date;
  completedAt: Date;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IRestoreJob extends BaseDocument {
  backupId: mongoose.Types.ObjectId;
  memberId: mongoose.Types.ObjectId;
  status: string;
  progress: number;
  startedAt: Date;
  completedAt: Date;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}
