import mongoose, { type Document, Schema } from "mongoose"

export interface IVolunteerEvent extends Document {
  volunteerId: mongoose.Types.ObjectId
  eventId: mongoose.Types.ObjectId
  projectId: mongoose.Types.ObjectId
  startPhoto?: string
  startLocation?: {
    latitude: number
    longitude: number
    address?: string
  }
  startTime?: Date
  endPhoto?: string
  endLocation?: {
    latitude: number
    longitude: number
    address?: string
  }
  endTime?: Date
  status: "registered" | "started" | "completed" | "absent"
  workDescription?: string
  hoursWorked?: number
  createdAt: Date
  updatedAt: Date
}

const VolunteerEventSchema = new Schema<IVolunteerEvent>(
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
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "NSSProject",
      required: true,
    },
    startPhoto: {
      type: String,
      trim: true,
    },
    startLocation: {
      latitude: { type: Number },
      longitude: { type: Number },
      address: { type: String },
    },
    startTime: {
      type: Date,
    },
    endPhoto: {
      type: String,
      trim: true,
    },
    endLocation: {
      latitude: { type: Number },
      longitude: { type: Number },
      address: { type: String },
    },
    endTime: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["registered", "started", "completed", "absent"],
      default: "registered",
    },
    workDescription: {
      type: String,
      trim: true,
    },
    hoursWorked: {
      type: Number,
    },
  },
  {
    timestamps: true,
  },
)

// Index for efficient queries
VolunteerEventSchema.index({ volunteerId: 1, eventId: 1 }, { unique: true })
VolunteerEventSchema.index({ projectId: 1 })
VolunteerEventSchema.index({ eventId: 1 })

export default mongoose.models.VolunteerEvent || mongoose.model<IVolunteerEvent>("VolunteerEvent", VolunteerEventSchema)

