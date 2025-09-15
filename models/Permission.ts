import mongoose, { type Document, Schema } from "mongoose"

export interface IPermission extends Document {
  name: string
  description: string
  category: string
  createdAt: Date
  updatedAt: Date
}

const PermissionSchema = new Schema<IPermission>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      enum: ["applications", "users", "reports", "settings", "system"],
      default: "applications",
    },
  },
  {
    timestamps: true,
  },
)

export default mongoose.models.Permission || mongoose.model<IPermission>("Permission", PermissionSchema)
