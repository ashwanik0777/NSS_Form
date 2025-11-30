import mongoose, { type Document, Schema } from "mongoose"

export interface IAnnouncementView extends Document {
  volunteerId: mongoose.Types.ObjectId
  announcementId: mongoose.Types.ObjectId
  viewedAt: Date
  createdAt: Date
  updatedAt: Date
}

const AnnouncementViewSchema = new Schema<IAnnouncementView>(
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
    viewedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
)

// Ensure one view record per volunteer per announcement
AnnouncementViewSchema.index({ volunteerId: 1, announcementId: 1 }, { unique: true })

export default mongoose.models.AnnouncementView ||
  mongoose.model<IAnnouncementView>("AnnouncementView", AnnouncementViewSchema)

