import mongoose, { type Document, Schema } from "mongoose"

export interface IGrievance extends Document {
  userId: mongoose.Types.ObjectId
  unitNo?: string
  subject: string
  description: string
  category?: string
  status: "open" | "in-progress" | "resolved" | "cancelled"
  priority?: "low" | "medium" | "high"
  adminNotes?: string
  resolutionNotes?: string
  resolvedAt?: Date
  resolvedBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const GrievanceSchema = new Schema<IGrievance>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    unitNo: { type: String, trim: true },
    subject: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    category: { type: String, trim: true },
    status: {
      type: String,
      enum: ["open", "in-progress", "resolved", "cancelled"],
      default: "open",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    adminNotes: { type: String, trim: true },
    resolutionNotes: { type: String, trim: true },
    resolvedAt: { type: Date },
    resolvedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
)

GrievanceSchema.index({ userId: 1, status: 1 })
GrievanceSchema.index({ unitNo: 1, status: 1 })
GrievanceSchema.index({ createdAt: -1 })

export default mongoose.models.Grievance || mongoose.model<IGrievance>("Grievance", GrievanceSchema)


