import mongoose from "mongoose";
import {
  DocumentCategory,
  DocumentPriority,
  DocumentStatus,
  type IDocument,
  type IVerificationFeedback,
  type IVerificationLog,
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

const verificationLogSchema = new mongoose.Schema<IVerificationLog>(
  {
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Document",
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    result: {
      isValid: {
        type: Boolean,
        required: true,
      },
      confidence: {
        type: Number,
        required: true,
      },
    },
    processingTimeMs: {
      type: Number,
      required: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

export const VerificationLog = mongoose.model<IVerificationLog>(
  "VerificationLog",
  verificationLogSchema
);

const verificationFeedbackSchema = new mongoose.Schema<IVerificationFeedback>(
  {
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Document",
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    feedback: {
      isCorrect: {
        type: Boolean,
        required: true,
      },
      actualStatus: {
        type: String,
        required: true,
      },
      comments: {
        type: String,
      },
    },
    reviewStatus: {
      type: String,
      enum: ["pending", "reviewed", "dismissed"],
      default: "pending",
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    reviewedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export const VerificationFeedback = mongoose.model<IVerificationFeedback>(
  "VerificationFeedback",
  verificationFeedbackSchema
);
