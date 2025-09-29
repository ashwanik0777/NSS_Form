import mongoose, { Document, Schema } from "mongoose"

export interface IVerificationCode extends Document {
  email: string
  code: string
  expires: Date
  createdAt: Date
}

const VerificationCodeSchema = new Schema<IVerificationCode>({
  email: {
    type: String,
    required: true,
    lowercase: true,
  },
  code: {
    type: String,
    required: true,
  },
  expires: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 }, // Auto-delete expired documents
  },
}, {
  timestamps: true,
})

// Create index for email to ensure uniqueness and quick lookups
VerificationCodeSchema.index({ email: 1 }, { unique: true })

export default mongoose.models.VerificationCode || mongoose.model<IVerificationCode>("VerificationCode", VerificationCodeSchema)