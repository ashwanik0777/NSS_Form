import mongoose, { type Document, Schema } from "mongoose"

export interface IDefaulter extends Document {
  volunteerId: mongoose.Types.ObjectId
  defaulterCount: number
  lastDefaulterDate: Date
  isRemoved: boolean
  removalDate?: Date
  createdAt: Date
  updatedAt: Date
}

const DefaulterSchema = new Schema<IDefaulter>(
  {
    volunteerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    defaulterCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastDefaulterDate: {
      type: Date,
    },
    isRemoved: {
      type: Boolean,
      default: false,
    },
    removalDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
)

// Index for efficient queries
DefaulterSchema.index({ volunteerId: 1 })
DefaulterSchema.index({ isRemoved: 1 })

export default mongoose.models.Defaulter || mongoose.model<IDefaulter>("Defaulter", DefaulterSchema)

