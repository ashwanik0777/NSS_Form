import mongoose, { type Document, Schema } from "mongoose"

export interface IVolunteerProject extends Document {
  volunteerId: mongoose.Types.ObjectId
  projectId: mongoose.Types.ObjectId
  selectedAt: Date
  status: "active" | "completed" | "withdrawn"
  createdAt: Date
  updatedAt: Date
}

const VolunteerProjectSchema = new Schema<IVolunteerProject>(
  {
    volunteerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "NSSProject",
      required: true,
    },
    selectedAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["active", "completed", "withdrawn"],
      default: "active",
    },
  },
  {
    timestamps: true,
  },
)

// Ensure one volunteer can only have one active project
VolunteerProjectSchema.index({ volunteerId: 1, status: 1 }, { unique: true, partialFilterExpression: { status: "active" } })

export default mongoose.models.VolunteerProject || mongoose.model<IVolunteerProject>("VolunteerProject", VolunteerProjectSchema)

