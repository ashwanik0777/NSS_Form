import mongoose, { type Document, Schema } from "mongoose"

export interface IVolunteerPoints extends Document {
  volunteerId: mongoose.Types.ObjectId
  totalPoints: number
  pointsHistory: Array<{
    points: number
    source: string
    sourceId?: mongoose.Types.ObjectId
    description: string
    earnedAt: Date
  }>
  achievements: Array<{
    achievementId: string
    name: string
    description: string
    earnedAt: Date
  }>
  createdAt: Date
  updatedAt: Date
}

const VolunteerPointsSchema = new Schema<IVolunteerPoints>(
  {
    volunteerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    totalPoints: {
      type: Number,
      default: 0,
      min: 0,
    },
    pointsHistory: [
      {
        points: { type: Number, required: true },
        source: { type: String, required: true }, // "social_post", "event", "task", etc.
        sourceId: { type: Schema.Types.ObjectId },
        description: { type: String, required: true },
        earnedAt: { type: Date, default: Date.now },
      },
    ],
    achievements: [
      {
        achievementId: { type: String, required: true },
        name: { type: String, required: true },
        description: { type: String, required: true },
        earnedAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  },
)

VolunteerPointsSchema.index({ "pointsHistory.earnedAt": -1 })

export default mongoose.models.VolunteerPoints ||
  mongoose.model<IVolunteerPoints>("VolunteerPoints", VolunteerPointsSchema)

