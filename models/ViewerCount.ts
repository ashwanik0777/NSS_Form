import mongoose, { Schema, model, models } from "mongoose"

export interface IViewerCount extends mongoose.Document {
  count: number
  updatedAt: Date
}

const ViewerCountSchema = new Schema<IViewerCount>(
  {
    count: {
      type: Number,
      default: 0,
      required: true,
    },
  },
  {
    timestamps: true,
  }
)

// Ensure only one document exists
ViewerCountSchema.index({ _id: 1 }, { unique: true })

const ViewerCount = models.ViewerCount || model<IViewerCount>("ViewerCount", ViewerCountSchema)

export default ViewerCount

