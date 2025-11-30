import mongoose, { type Document, Schema } from "mongoose"

export interface IPostView extends Document {
  volunteerId: mongoose.Types.ObjectId
  postId: mongoose.Types.ObjectId
  viewedAt: Date
  clickedPlatforms: string[]
  likedPlatforms: string[]
  platformPoints: { [key: string]: number }
  pointsAwarded: boolean
  createdAt: Date
}

const PostViewSchema = new Schema<IPostView>(
  {
    volunteerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    postId: {
      type: Schema.Types.ObjectId,
      ref: "SocialMediaPost",
      required: true,
    },
    viewedAt: {
      type: Date,
      default: Date.now,
    },
    clickedPlatforms: {
      type: [String],
      default: [],
    },
    likedPlatforms: {
      type: [String],
      default: [],
    },
    platformPoints: {
      type: Map,
      of: Number,
      default: {},
    },
    pointsAwarded: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
)

// Ensure one view per volunteer per post (for points tracking)
PostViewSchema.index({ volunteerId: 1, postId: 1 }, { unique: true })

export default mongoose.models.PostView ||
  mongoose.model<IPostView>("PostView", PostViewSchema)

