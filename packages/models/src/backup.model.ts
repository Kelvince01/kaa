import mongoose, { Schema } from "mongoose";
import type { IBackup, IRestoreJob } from "./types/backup.type";

const backupSchema = new Schema<IBackup>(
  {
    name: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["full", "incremental", "differential"],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "running", "completed", "failed"],
      default: "pending",
    },
    size: {
      type: Number,
      default: 0,
    },
    location: {
      type: String,
      required: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    memberId: {
      type: Schema.Types.ObjectId,
      ref: "Tenant",
    },
    startedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

backupSchema.index({ memberId: 1 });
backupSchema.index({ status: 1 });
backupSchema.index({ expiresAt: 1 });

export const Backup = mongoose.model<IBackup>("Backup", backupSchema);

const restoreJobSchema = new Schema<IRestoreJob>(
  {
    backupId: {
      type: Schema.Types.ObjectId,
      ref: "Backup",
      required: true,
    },
    memberId: {
      type: Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "running", "completed", "failed"],
      default: "pending",
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    startedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    error: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export const RestoreJob = mongoose.model<IRestoreJob>(
  "RestoreJob",
  restoreJobSchema
);
