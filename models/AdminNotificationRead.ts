import mongoose, { type Document, Schema } from "mongoose"

export interface IAdminNotificationRead extends Document {
  adminId: mongoose.Types.ObjectId
  notificationId: string // Can be app-{id} or event-{id}
  readAt: Date
  createdAt: Date
  updatedAt: Date
}

const AdminNotificationReadSchema = new Schema<IAdminNotificationRead>(
  {
    adminId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    notificationId: {
      type: String,
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

// Ensure one read record per admin per notification
AdminNotificationReadSchema.index({ adminId: 1, notificationId: 1 }, { unique: true })

export default mongoose.models.AdminNotificationRead ||
  mongoose.model<IAdminNotificationRead>("AdminNotificationRead", AdminNotificationReadSchema)

