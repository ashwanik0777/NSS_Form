import mongoose, { type Document, Schema } from "mongoose"

export interface INSSProject extends Document {
  title: string
  description: string
  location?: string
  startDate?: Date
  endDate?: Date
  coordinator?: string
  maxVolunteers?: number
  currentVolunteers: number
  status: "active" | "completed" | "upcoming"
  category?: string
  createdAt: Date
  updatedAt: Date
}

const NSSProjectSchema = new Schema<INSSProject>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: String,
      trim: true,
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
    coordinator: {
      type: String,
      trim: true,
    },
    maxVolunteers: {
      type: Number,
    },
    currentVolunteers: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["active", "completed", "upcoming"],
      default: "active",
    },
    category: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
)

export default mongoose.models.NSSProject || mongoose.model<INSSProject>("NSSProject", NSSProjectSchema)

