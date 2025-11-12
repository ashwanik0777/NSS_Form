import mongoose, { type Document, Schema } from "mongoose"

export interface ISocialMediaPost extends Document {
  title: string
  description?: string
  platformLinks: {
    facebook?: string
    instagram?: string
    twitter?: string
    linkedin?: string
    youtube?: string
  }
  postedBy: mongoose.Types.ObjectId
  isActive: boolean
  pointsReward: number
  createdAt: Date
  updatedAt: Date
}

const SocialMediaPostSchema = new Schema<ISocialMediaPost>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    platformLinks: {
      facebook: {
        type: String,
        trim: true,
      },
      instagram: {
        type: String,
        trim: true,
      },
      twitter: {
        type: String,
        trim: true,
      },
      linkedin: {
        type: String,
        trim: true,
      },
      youtube: {
        type: String,
        trim: true,
      },
    },
    postedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    pointsReward: {
      type: Number,
      default: 10,
      min: 0,
    },
  },
  {
    timestamps: true,
  },
)

// Indexes
SocialMediaPostSchema.index({ isActive: 1, createdAt: -1 })
SocialMediaPostSchema.index({ postedBy: 1 })

export default mongoose.models.SocialMediaPost ||
  mongoose.model<ISocialMediaPost>("SocialMediaPost", SocialMediaPostSchema)

