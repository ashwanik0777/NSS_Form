import mongoose, { type Document, Schema } from "mongoose"

export interface INotificationRead extends Document {
  volunteerId: mongoose.Types.ObjectId
  announcementId: mongoose.Types.ObjectId
  readAt: Date
  createdAt: Date
  updatedAt: Date
}

const NotificationReadSchema = new Schema<INotificationRead>(
  {
    volunteerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    announcementId: {
      type: Schema.Types.ObjectId,
      ref: "Announcement",
      required: true,
    },
    readAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
)

// Ensure one read record per volunteer per announcement
NotificationReadSchema.index({ volunteerId: 1, announcementId: 1 }, { unique: true })

export default mongoose.models.NotificationRead ||
  mongoose.model<INotificationRead>("NotificationRead", NotificationReadSchema)

