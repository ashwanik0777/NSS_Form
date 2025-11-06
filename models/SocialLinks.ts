import mongoose, { Schema, type Document } from "mongoose"

export interface ISocialLinks extends Document {
  key: string // singleton key, e.g., "nss"
  facebook?: string
  instagram?: string
  twitter?: string
  linkedin?: string
  updatedAt: Date
  createdAt: Date
}

const SocialLinksSchema = new Schema<ISocialLinks>(
  {
    key: { type: String, required: true, unique: true, default: "nss" },
    facebook: { type: String, trim: true },
    instagram: { type: String, trim: true },
    twitter: { type: String, trim: true },
    linkedin: { type: String, trim: true },
  },
  { timestamps: true }
)

export default mongoose.models.SocialLinks || mongoose.model<ISocialLinks>("SocialLinks", SocialLinksSchema)


