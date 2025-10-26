import mongoose, { Schema } from "mongoose";
import { AgentStatus, AgentType, type IAgent } from "./types/agent.type";

const agentSchema = new Schema<IAgent>({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  memberId: { type: Schema.Types.ObjectId, ref: "Member", required: true },
  organizationId: { type: Schema.Types.ObjectId, ref: "Organization" },
  status: { type: String, enum: Object.values(AgentStatus), required: true },
  type: { type: String, enum: Object.values(AgentType), required: true },
});

export const Agent = mongoose.model<IAgent>("Agent", agentSchema);
