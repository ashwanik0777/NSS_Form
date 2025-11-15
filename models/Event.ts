import mongoose, { type Document, Schema } from "mongoose"

export interface IEvent extends Document {
  title: string
  description: string
  projectId: mongoose.Types.ObjectId
  eventDate: Date
  location?: string
  locationCoordinates?: {
    latitude: number
    longitude: number
  }
  startTime?: Date
  endTime?: Date
  coordinator?: string
  maxParticipants?: number
  currentParticipants: number
  status: "upcoming" | "ongoing" | "completed" | "cancelled"
  attendanceExtensionMinutes?: number // Super admin can extend attendance submission time
  nssHours?: number // NSS hours awarded for this event
  createdAt: Date
  updatedAt: Date
}

const EventSchema = new Schema<IEvent>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "NSSProject",
      required: true,
    },
    eventDate: {
      type: Date,
      required: true,
    },
    location: {
      type: String,
      trim: true,
    },
    locationCoordinates: {
      latitude: { type: Number },
      longitude: { type: Number },
    },
    startTime: {
      type: Date,
    },
    endTime: {
      type: Date,
    },
    coordinator: {
      type: String,
      trim: true,
    },
    maxParticipants: {
      type: Number,
    },
    currentParticipants: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["upcoming", "ongoing", "completed", "cancelled"],
      default: "upcoming",
    },
    attendanceExtensionMinutes: {
      type: Number,
      default: 0, // Default 30 minutes, can be extended by super admin
    },
    nssHours: {
      type: Number,
      min: 0,
    },
  },
  {
    timestamps: true,
  },
)

export default mongoose.models.Event || mongoose.model<IEvent>("Event", EventSchema)

