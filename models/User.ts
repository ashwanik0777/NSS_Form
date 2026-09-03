import mongoose, { type Document, Schema } from "mongoose"

export interface IUser extends Document {
  name: string
  email: string
  password: string
  role: "admin" | "sub-admin" | "user" | "volunteer"
  permissions?: string[]
  mustChangePassword?: boolean
  assignedUnits?: string[] // Array of unit numbers like ["1", "2", "3"]
  status: "pending" | "accepted" | "rejected" | "removed"
  // Profile fields
  phone?: string
  photo?: string
  designation?: string
  department?: string
  address?: string
  createdAt: Date
  updatedAt: Date
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    role: {
      type: String,
      enum: ["admin", "sub-admin", "user", "volunteer"],
      default: "user",
    },
    hierarchy: {
      type: String,
      enum: ["convener", "co-convener", "member", ""],
      default: "",
    },
    mustChangePassword: {
      type: Boolean,
      default: false,
    },
    permissions: [
      {
        type: String,
      },
    ],
    assignedUnits: [
      {
        type: String,
      },
    ],
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "removed"],
      default: "pending",
    },
    // Profile fields
    phone: {
      type: String,
      trim: true,
    },
    photo: {
      type: String,
    },
    designation: {
      type: String,
      trim: true,
    },
    department: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
)

export default mongoose.models.User || mongoose.model<IUser>("User", UserSchema)
