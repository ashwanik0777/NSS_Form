import mongoose, { type Document, Schema } from "mongoose"

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId
  title: string
  message: string
  type: "event_reminder" | "attendance_reminder" | "defaulter" | "general" | "announcement"
  link?: string
  isRead: boolean
  readAt?: Date
  createdAt: Date
  updatedAt: Date
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["event_reminder", "attendance_reminder", "defaulter", "general", "announcement"],
      default: "general",
    },
    link: {
      type: String,
      trim: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
)

// Index for efficient queries
NotificationSchema.index({ userId: 1, isRead: 1 })
NotificationSchema.index({ userId: 1, createdAt: -1 })
NotificationSchema.index({ type: 1 })

export default mongoose.models.Notification || mongoose.model<INotification>("Notification", NotificationSchema)

