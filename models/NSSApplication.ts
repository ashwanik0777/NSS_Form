import mongoose, { type Document, Schema } from "mongoose"

export interface INSSApplication extends Document {
  // Institution Details (Step 1)
  institutionName: string
  formNo: string
  enrollment: "first-year" | "second-year"
  programOfficerName: string
  unitNo: string

  // Personal Details (Step 2)
  nameEnglish: string
  nameHindi?: string
  fatherName: string
  motherName: string
  dateOfBirth: Date
  mobileNo: string
  emailId: string
  departmentName: string
  courseName?: string
  gender: "male" | "female" | "other"
  category: "general" | "obc" | "st" | "sc"
  bloodGroup?: string
  institutionalIdCard: string
  institutionalIdProof?: string
  photo: string
  signature: string

  // Educational Details (Step 3)
  highSchoolRollNo: string
  classSemester: string

  // Additional Details (Step 4)
  nssEnrollmentYear: "first-year" | "second-year"
  attendedSpecialCamp: boolean
  specialCampDetails?: {
    villageName: string
    date: string
    venue: string
  }
  myBharatPortalRegistered: boolean
  myBharatPortalScreenshot?: string
  specialNSSAchievements?: string
  specialNSSAchievementsProof?: string
  attendedELP: boolean
  elpProof?: string
  otherAchievements?: string
  otherAchievementsCertificates?: string

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

  // Additional Fields
  schoolName: string
  highSchoolCertificate?: string
  myBharatPortalId?: string
  addressType?: "hostler" | "dayscholar" | string
  hostelAddress?: string
  homeAddress?: string
  // permanentAddress?: string
  // correspondenceAddress?: string
  // emergencyPerson?: string
  // emergencyRelation?: string
  // emergencyContact?: string
}

const NSSApplicationSchema = new Schema<INSSApplication>(
  {
    // Institution Details (Step 1)
    institutionName: {
      type: String,
      required: true,
      trim: true,
    },
    formNo: {
      type: String,
      required: true,
      trim: true,
      unique: true,
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

    // Personal Details (Step 2)
    nameEnglish: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
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
    departmentName: {
      type: String,
      required: true,
      trim: true,
    },
    courseName: {
      type: String,
      trim: true,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
      required: true,
    },
    category: {
      type: String,
      enum: ["general", "obc", "st", "sc"],
      required: true,
    },
    bloodGroup: {
      type: String,
      trim: true,
    },
    institutionalIdCard: {
      type: String,
      required: true,
      trim: true,
    },
    institutionalIdProof: {
      type: String, // File URL
      trim: true,
    },
    photo: {
      type: String, // File URL
      required: true,
      trim: true,
    },
    signature: {
      type: String, // File URL
      required: true,
      trim: true,
    },

    // Educational Details (Step 3)
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

    // Additional Details (Step 4)
    nssEnrollmentYear: {
      type: String,
      enum: ["first-year", "second-year"],
      required: true,
    },
    attendedSpecialCamp: {
      type: Boolean,
      required: true,
      default: false,
    },
    specialCampDetails: {
      villageName: {
        type: String,
        trim: true,
      },
      date: {
        type: String,
        trim: true,
      },
      venue: {
        type: String,
        trim: true,
      },
    },
    myBharatPortalRegistered: {
      type: Boolean,
      required: true,
      default: false,
    },
    myBharatPortalId: {
      type: String,
      trim: true,
    },
    myBharatPortalScreenshot: {
      type: String, // File URL
      trim: true,
    },
    specialNSSAchievements: {
      type: String,
      trim: true,
    },
    specialNSSAchievementsProof: {
      type: String, // File URL
      trim: true,
    },
    attendedELP: {
      type: Boolean,
      default: false,
    },
    elpProof: {
      type: String, // File URL
      trim: true,
    },
    otherAchievements: {
      type: String,
      trim: true,
    },
    otherAchievementsCertificates: {
      type: String, // File URL
      trim: true,
    },
    // permanentAddress: {
    //   type: String,
    //   trim: true,
    // },
    // correspondenceAddress: {
    //   type: String,
    //   trim: true,
    // },
    // emergencyPerson: {
    //   type: String,
    //   trim: true,
    // },
    // emergencyRelation: {
    //   type: String,
    //   trim: true,
    // },
    // emergencyContact: {
    //   type: String,
    //   trim: true,
    // },

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
    schoolName: {
      type: String,
      required: true,
      trim: true,
    },
    highSchoolCertificate: {
      type: String, // This should be a string URL
      required: false,
      trim: true,
    },
    nameHindi: {
      type: String,
      trim: true,
    },
    addressType: {
      type: String,
      trim: true,
    },
    hostelAddress: {
      type: String,
      trim: true,
    },
    homeAddress: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
)

// Indexes for efficient queries
// NSSApplicationSchema.index({ userId: 1, status: 1 })
// NSSApplicationSchema.index({ status: 1, createdAt: -1 })
// NSSApplicationSchema.index({ formNo: 1 }, { unique: true })
// NSSApplicationSchema.index({ emailId: 1 })

// Pre-save middleware to ensure required fields for submitted applications
NSSApplicationSchema.pre('save', function(next) {
  if (this.status === 'submitted') {
    // Validate required fields for submission
    const requiredFields = [
      'institutionName', 'enrollment', 'programOfficerName', 'unitNo',
      'nameEnglish', 'fatherName', 'motherName', 'dateOfBirth', 'mobileNo', 
      'emailId', 'departmentName', 'gender', 'category', 'institutionalIdCard',
      'photo', 'signature', 'highSchoolRollNo', 'classSemester', 'nssEnrollmentYear'
    ]
    
    for (const field of requiredFields) {
      if (!this[field as keyof INSSApplication]) {
        return next(new Error(`${field} is required for submission`))
      }
    }
    
    // Set submittedAt if not already set
    if (!this.submittedAt) {
      this.submittedAt = new Date()
    }
  }
  next()
})

export default mongoose.models.NSSApplication || mongoose.model<INSSApplication>("NSSApplication", NSSApplicationSchema)
