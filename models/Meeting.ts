import mongoose, { type Document, Schema } from "mongoose"

export interface IMeeting extends Document {
  title: string
  description?: string
  projectId?: mongoose.Types.ObjectId
  unitNo?: string // Unit number for filtering
  meetingDate: Date
  location?: string
  startTime?: Date
  endTime?: Date
  status: "upcoming" | "ongoing" | "completed" | "cancelled"
  cancelReason?: string // Reason for cancellation
  createdAt: Date
  updatedAt: Date
}

const MeetingSchema = new Schema<IMeeting>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    projectId: { type: Schema.Types.ObjectId, ref: "NSSProject" },
    unitNo: { type: String, trim: true },
    meetingDate: { type: Date, required: true },
    location: { type: String, trim: true },
    locationCoordinates: {
      latitude: { type: Number },
      longitude: { type: Number },
    },
    attendanceRadius: { type: Number, default: 100 }, // in meters
    isAttendanceOpen: { type: Boolean, default: true },
    startTime: { type: Date },
    endTime: { type: Date },
    status: {
      type: String,
      enum: ["upcoming", "ongoing", "completed", "cancelled"],
      default: "upcoming",
    },
    cancelReason: { type: String, trim: true },
  },
  { timestamps: true },
)

MeetingSchema.index({ unitNo: 1 })
MeetingSchema.index({ projectId: 1 })
MeetingSchema.index({ status: 1 })

export default mongoose.models.Meeting || mongoose.model<IMeeting>("Meeting", MeetingSchema)


