import type { Document } from "mongoose";

/**
 * Base model interface with common fields
 */
export interface BaseDocument extends Document {
  createdAt: Date;
  updatedAt: Date;
}
