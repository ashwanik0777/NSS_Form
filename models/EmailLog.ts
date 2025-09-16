import mongoose from "mongoose"

const EmailLogSchema = new mongoose.Schema(
  {
    to: {
      type: String,
      required: true,
    },
    subject: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["sent", "failed", "pending"],
      default: "pending",
    },
    sentAt: {
      type: Date,
      default: Date.now,
    },
    templateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EmailTemplate",
    },
    error: String,
  },
  {
    timestamps: true,
  },
)

export default mongoose.models.EmailLog || mongoose.model("EmailLog", EmailLogSchema)
