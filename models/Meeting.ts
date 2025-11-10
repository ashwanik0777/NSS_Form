import mongoose, { type Document, Schema } from "mongoose"

export interface IMeeting extends Document {
  title: string
  description?: string
  projectId?: mongoose.Types.ObjectId
  meetingDate: Date
  location?: string
  startTime?: Date
  endTime?: Date
  status: "upcoming" | "ongoing" | "completed" | "cancelled"
  createdAt: Date
  updatedAt: Date
}

const MeetingSchema = new Schema<IMeeting>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    projectId: { type: Schema.Types.ObjectId, ref: "NSSProject" },
    meetingDate: { type: Date, required: true },
    location: { type: String, trim: true },
    startTime: { type: Date },
    endTime: { type: Date },
    status: {
      type: String,
      enum: ["upcoming", "ongoing", "completed", "cancelled"],
      default: "upcoming",
    },
  },
  { timestamps: true },
)

export default mongoose.models.Meeting || mongoose.model<IMeeting>("Meeting", MeetingSchema)


