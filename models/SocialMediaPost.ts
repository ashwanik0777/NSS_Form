import mongoose, { type Document, Schema } from "mongoose"

export interface ISocialMediaPost extends Document {
  title: string
  description?: string
  image?: string
  platform: "facebook" | "instagram" | "twitter" | "linkedin" | "youtube"
  postUrl?: string
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
    image: {
      type: String,
      trim: true,
    },
    platform: {
      type: String,
      enum: ["facebook", "instagram", "twitter", "linkedin", "youtube"],
      required: true,
    },
    postUrl: {
      type: String,
      trim: true,
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

