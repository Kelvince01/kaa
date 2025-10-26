import type mongoose from "mongoose";
import type { BaseDocument } from "./base.type";

export enum AgentStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  SUSPENDED = "suspended",
  REJECTED = "rejected",
}

export enum AgentType {
  INDIVIDUAL = "individual",
  COMPANY = "company",
}

export interface IAgent extends BaseDocument {
  user: mongoose.Types.ObjectId;
  memberId: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  status: AgentStatus;
  type: AgentType;
}
