import mongoose, { Document, Schema } from "mongoose"

export interface ITask extends Document {
  title: string
  description: string
  assignedTo: mongoose.Types.ObjectId // Volunteer ID
  assignedBy: mongoose.Types.ObjectId // Admin/Sub-admin ID
  unitNo: string // Unit number for filtering
  status: "pending" | "in-progress" | "completed" | "cancelled"
  priority: "low" | "medium" | "high" | "urgent"
  dueDate?: Date
  completedAt?: Date
  completionNotes?: string
  createdAt: Date
  updatedAt: Date
}

const TaskSchema = new Schema<ITask>(
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
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assignedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    unitNo: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "in-progress", "completed", "cancelled"],
      default: "pending",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    dueDate: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    completionNotes: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
)

TaskSchema.index({ assignedTo: 1, status: 1 })
TaskSchema.index({ unitNo: 1 })
TaskSchema.index({ assignedBy: 1 })

export default mongoose.models.Task || mongoose.model<ITask>("Task", TaskSchema)


