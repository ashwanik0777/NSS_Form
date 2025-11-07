import mongoose, { type Document, Schema } from "mongoose"

export interface IEventRegistration extends Document {
  volunteerId: mongoose.Types.ObjectId
  eventId: mongoose.Types.ObjectId
  registrationStatus: "registered" | "declined" | "pending"
  declineReason?: string
  isDefaulter: boolean
  defaulterReason?: string // "not_registered" | "not_attended" | "no_start_attendance" | "no_end_attendance"
  createdAt: Date
  updatedAt: Date
}

const EventRegistrationSchema = new Schema<IEventRegistration>(
  {
    volunteerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    eventId: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    registrationStatus: {
      type: String,
      enum: ["registered", "declined", "pending"],
      default: "pending",
    },
    declineReason: {
      type: String,
      trim: true,
    },
    isDefaulter: {
      type: Boolean,
      default: false,
    },
    defaulterReason: {
      type: String,
      enum: ["not_registered", "not_attended", "no_start_attendance", "no_end_attendance"],
    },
  },
  {
    timestamps: true,
  },
)

// Index for efficient queries
EventRegistrationSchema.index({ volunteerId: 1, eventId: 1 }, { unique: true })
EventRegistrationSchema.index({ eventId: 1 })
EventRegistrationSchema.index({ volunteerId: 1, isDefaulter: 1 })

export default mongoose.models.EventRegistration ||
  mongoose.model<IEventRegistration>("EventRegistration", EventRegistrationSchema)

