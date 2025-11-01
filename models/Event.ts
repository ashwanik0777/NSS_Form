import mongoose, { type Document, Schema } from "mongoose"

export interface IEvent extends Document {
  title: string
  description: string
  projectId: mongoose.Types.ObjectId
  eventDate: Date
  location?: string
  startTime?: Date
  endTime?: Date
  coordinator?: string
  maxParticipants?: number
  currentParticipants: number
  status: "upcoming" | "ongoing" | "completed" | "cancelled"
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
  },
  {
    timestamps: true,
  },
)

export default mongoose.models.Event || mongoose.model<IEvent>("Event", EventSchema)

