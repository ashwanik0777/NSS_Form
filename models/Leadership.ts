import mongoose, { type Document, Schema } from "mongoose"

export interface ILeadership extends Document {
  name: string
  designation: string
  category: "coordinator" | "officer" | "mentor" | "other"
  unitNo: "All Units" | "Unit 1" | "Unit 2" | "Unit 3" | "Unit 4" | "Unit 5" | "Unit 6"
  department?: string
  school?: string
  email?: string
  phone?: string
  photo?: string
  bio?: string
  order: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const LeadershipSchema = new Schema<ILeadership>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    designation: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ["coordinator", "officer", "mentor", "other"],
      default: "officer",
    },
    unitNo: {
      type: String,
      enum: ["All Units", "Unit 1", "Unit 2", "Unit 3", "Unit 4", "Unit 5", "Unit 6"],
      default: "All Units",
    },
    department: {
      type: String,
      trim: true,
      default: "",
    },
    school: {
      type: String,
      trim: true,
      default: "",
    },
    email: {
      type: String,
      trim: true,
      default: "",
    },
    phone: {
      type: String,
      trim: true,
      default: "",
    },
    photo: {
      type: String,
      default: "",
    },
    bio: {
      type: String,
      trim: true,
      default: "",
    },
    order: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
)

export default mongoose.models.Leadership || mongoose.model<ILeadership>("Leadership", LeadershipSchema)

