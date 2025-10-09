import mongoose from "mongoose";
import {
  DocumentCategory,
  DocumentPriority,
  DocumentStatus,
  type IDocument,
} from "./types/document.type";

const documentSchema = new mongoose.Schema<IDocument>(
  {
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: Object.values(DocumentCategory),
      required: true,
    },
    file: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(DocumentStatus),
      default: DocumentStatus.PENDING,
    },
    priority: {
      type: String,
      enum: Object.values(DocumentPriority),
      default: DocumentPriority.MEDIUM,
    },
    expiryDate: {
      type: Date,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
    verifiedAt: {
      type: Date,
    },
    rejectionReason: {
      type: String,
    },
    preview: {
      type: String,
    },
    tags: {
      type: [String],
      default: [],
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Virtual for document URL
documentSchema.virtual("url").get(function () {
  return `/documents/${this._id}`;
});

export const Document = mongoose.model("Document", documentSchema);
export default Document;
