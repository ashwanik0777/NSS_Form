import mongoose, { type Document, Schema } from "mongoose"

export interface IEventReport extends Document {
  eventId: mongoose.Types.ObjectId
  description: string
  attendeesCount: number
  photoUrls: string[] // up to 10
  selectedPhotoUrls: string[] // up to 4
  videoUrls: string[] // up to 4
  createdAt: Date
  updatedAt: Date
}

const EventReportSchema = new Schema<IEventReport>(
  {
    eventId: { type: Schema.Types.ObjectId, ref: "Event", required: true, unique: true },
    description: { type: String, required: true, trim: true },
    attendeesCount: { type: Number, required: true, min: 0 },
    photoUrls: { type: [String], default: [] },
    selectedPhotoUrls: { type: [String], default: [] },
    videoUrls: { type: [String], default: [] },
  },
  { timestamps: true },
)

export default mongoose.models.EventReport || mongoose.model<IEventReport>("EventReport", EventReportSchema)



