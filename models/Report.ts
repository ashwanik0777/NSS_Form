import mongoose, { type Document, Schema } from "mongoose"

export interface IReport extends Document {
  reportId: string // Unique report ID (e.g., RPT-2025-001)
  userId: mongoose.Types.ObjectId
  category: "problem" | "complaint" | "suggestion" | "bug" | "event-issue" | "volunteer-issue" | "other"
  subject: string
  description: string
  priority: "low" | "medium" | "high" | "urgent"
  status: "open" | "in-progress" | "resolved" | "closed" | "cancelled"
  
  // File attachments
  attachments?: string[] // Array of Cloudinary URLs
  
  // Admin management
  assignedTo?: mongoose.Types.ObjectId // Admin/Sub-admin assigned to handle this report
  adminNotes?: string // Internal notes visible only to admins
  resolutionNotes?: string // Notes added when resolving
  
  // Reply system
  replies?: Array<{
    userId: mongoose.Types.ObjectId
    message: string
    isAdmin: boolean
    attachments?: string[]
    createdAt: Date
  }>
  
  // Related references
  relatedEventId?: mongoose.Types.ObjectId
  relatedVolunteerId?: mongoose.Types.ObjectId
  
  // Timestamps
  resolvedAt?: Date
  resolvedBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const ReportSchema = new Schema<IReport>(
  {
    reportId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    category: {
      type: String,
      enum: ["problem", "complaint", "suggestion", "bug", "event-issue", "volunteer-issue", "other"],
      required: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    status: {
      type: String,
      enum: ["open", "in-progress", "resolved", "closed", "cancelled"],
      default: "open",
    },
    attachments: [
      {
        type: String,
      },
    ],
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    adminNotes: {
      type: String,
      trim: true,
    },
    resolutionNotes: {
      type: String,
      trim: true,
    },
    replies: [
      {
        userId: {
          type: Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        message: {
          type: String,
          required: true,
          trim: true,
        },
        isAdmin: {
          type: Boolean,
          default: false,
        },
        attachments: [
          {
            type: String,
          },
        ],
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    relatedEventId: {
      type: Schema.Types.ObjectId,
      ref: "Event",
    },
    relatedVolunteerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    resolvedAt: {
      type: Date,
    },
    resolvedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  },
)

// Indexes for efficient queries
ReportSchema.index({ reportId: 1 })
ReportSchema.index({ userId: 1, status: 1 })
ReportSchema.index({ status: 1, priority: 1 })
ReportSchema.index({ category: 1, status: 1 })
ReportSchema.index({ assignedTo: 1, status: 1 })
ReportSchema.index({ createdAt: -1 })

export default mongoose.models.Report || mongoose.model<IReport>("Report", ReportSchema)




