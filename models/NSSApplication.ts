import mongoose, { type Document, Schema } from "mongoose"

export interface INSSApplication extends Document {
  // Institution Details
  institutionName: string
  formNo: string
  enrollment: "first-year" | "second-year"
  programOfficerName: string
  unitNo: string

  // Personal Details
  nameEnglish: string
  fatherName: string
  motherName: string
  dateOfBirth: Date
  mobileNo: string
  emailId: string

  // Educational Details
  highSchoolRollNo: string
  classSemester: string

  // Application Status
  status: "draft" | "submitted" | "under-review" | "approved" | "rejected"
  rejectionReason?: string
  reviewedBy?: mongoose.Types.ObjectId
  reviewedAt?: Date

  // User Reference
  userId: mongoose.Types.ObjectId

  // Timestamps
  submittedAt?: Date
  createdAt: Date
  updatedAt: Date
}

const NSSApplicationSchema = new Schema<INSSApplication>(
  {
    // Institution Details
    institutionName: {
      type: String,
      required: true,
      trim: true,
    },
    formNo: {
      type: String,
      required: true,
      trim: true,
    },
    enrollment: {
      type: String,
      enum: ["first-year", "second-year"],
      required: true,
    },
    programOfficerName: {
      type: String,
      required: true,
      trim: true,
    },
    unitNo: {
      type: String,
      required: true,
      trim: true,
    },

    // Personal Details
    nameEnglish: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    // nameHindi: {
    
    //   type: String,
    //   required: true,
    //   trim: true,
    // },
    fatherName: {
      type: String,
      required: true,
      trim: true,
    },
    motherName: {
      type: String,
      required: true,
      trim: true,
    },
    dateOfBirth: {
      type: Date,
      required: true,
    },
    mobileNo: {
      type: String,
      required: true,
      match: /^[6-9]\d{9}$/,
    },
    emailId: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },

    // Educational Details
    highSchoolRollNo: {
      type: String,
      required: true,
      trim: true,
    },
    classSemester: {
      type: String,
      required: true,
      trim: true,
    },

    // Application Status
    status: {
      type: String,
      enum: ["draft", "submitted", "under-review", "approved", "rejected"],
      default: "draft",
    },
    rejectionReason: {
      type: String,
      trim: true,
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    reviewedAt: {
      type: Date,
    },

    // User Reference
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Timestamps
    submittedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
)

// Index for efficient queries
NSSApplicationSchema.index({ userId: 1, status: 1 })
NSSApplicationSchema.index({ status: 1, createdAt: -1 })

export default mongoose.models.NSSApplication || mongoose.model<INSSApplication>("NSSApplication", NSSApplicationSchema)
