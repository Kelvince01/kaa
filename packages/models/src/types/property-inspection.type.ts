import type mongoose from "mongoose";
import type { Document } from "mongoose";

export enum InspectionStatus {
	SCHEDULED = "scheduled",
	COMPLETED = "completed",
	CANCELLED = "cancelled",
	RESCHEDULED = "rescheduled",
}

export enum InspectionType {
	ROUTINE = "routine",
	MOVE_IN = "move_in",
	MOVE_OUT = "move_out",
	MAINTENANCE = "maintenance",
	SAFETY = "safety",
}

export interface IPropertyInspection extends Document {
	property: mongoose.Types.ObjectId;
	scheduledDate: Date;
	actualDate?: Date;
	inspector: mongoose.Types.ObjectId;
	tenant?: mongoose.Types.ObjectId;
	type: InspectionType;
	status: InspectionStatus;
	notes?: string;
	findings?: string;
	recommendations?: string;
	followUpRequired: boolean;
	followUpDate?: Date;
	createdBy: mongoose.Types.ObjectId;
	updatedBy?: mongoose.Types.ObjectId;
	notificationSent: boolean;
	tenantConfirmed: boolean;
	attachments?: {
		fileName: string;
		fileType: string;
		url: string;
		uploadedAt: Date;
	}[];
	conditionReportId?: mongoose.Types.ObjectId;
}
