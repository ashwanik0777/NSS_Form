import mongoose, { type Document, Schema } from "mongoose"

export interface IVolunteerMeeting extends Document {
  volunteerId: mongoose.Types.ObjectId
  meetingId: mongoose.Types.ObjectId
  status: "registered" | "attended" | "absent"
  checkInTime?: Date
  checkOutTime?: Date
  createdAt: Date
  updatedAt: Date
}

const VolunteerMeetingSchema = new Schema<IVolunteerMeeting>(
  {
    volunteerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    meetingId: { type: Schema.Types.ObjectId, ref: "Meeting", required: true },
    status: {
      type: String,
      enum: ["registered", "attended", "absent"],
      default: "registered",
    },
    checkInTime: { type: Date },
    checkOutTime: { type: Date },
    hoursGranted: { type: Number, default: 0 },
  },
  { timestamps: true },
)

VolunteerMeetingSchema.index({ volunteerId: 1, meetingId: 1 }, { unique: true })
VolunteerMeetingSchema.index({ meetingId: 1 })

export default mongoose.models.VolunteerMeeting ||
  mongoose.model<IVolunteerMeeting>("VolunteerMeeting", VolunteerMeetingSchema)


