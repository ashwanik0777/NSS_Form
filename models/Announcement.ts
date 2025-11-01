import mongoose, { type Document, Schema } from "mongoose"

export interface IAnnouncement extends Document {
  title: string
  content: string
  type: "notification" | "announcement" | "general"
  sendEmail: boolean
  createdBy: mongoose.Types.ObjectId
  status: "active" | "inactive"
  createdAt: Date
  updatedAt: Date
}

const AnnouncementSchema = new Schema<IAnnouncement>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["notification", "announcement", "general"],
      default: "announcement",
    },
    sendEmail: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  {
    timestamps: true,
  },
)

export default mongoose.models.Announcement ||
  mongoose.model<IAnnouncement>("Announcement", AnnouncementSchema)

