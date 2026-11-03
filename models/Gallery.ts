import mongoose, { type Document, Schema } from "mongoose"

export interface IGalleryItem extends Document {
  title: string
  description?: string
  imageUrl: string
  publicId?: string
  category:
    | "Events"
    | "Camps"
    | "Blood Donation"
    | "Tree Plantation"
    | "Orientation"
    | "Social Awareness"
    | "Celebrations"
    | "Other"
  eventDate?: Date
  isFeatured: boolean
  isVisible: boolean
  tags?: string[]
  uploadedBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const GallerySchema = new Schema<IGalleryItem>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    imageUrl: {
      type: String,
      required: true,
    },
    publicId: {
      type: String,
      default: "",
    },
    category: {
      type: String,
      enum: [
        "Events",
        "Camps",
        "Blood Donation",
        "Tree Plantation",
        "Orientation",
        "Social Awareness",
        "Celebrations",
        "Other",
      ],
      default: "Events",
    },
    eventDate: {
      type: Date,
      default: Date.now,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isVisible: {
      type: Boolean,
      default: true,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
)

GallerySchema.index({ category: 1, createdAt: -1 })
GallerySchema.index({ isFeatured: 1, createdAt: -1 })

export default mongoose.models.Gallery || mongoose.model<IGalleryItem>("Gallery", GallerySchema)

