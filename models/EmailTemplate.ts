import mongoose from "mongoose"

const EmailTemplateSchema = new mongoose.Schema(
  {
    name: {
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
    type: {
      type: String,
      enum: ["approval", "rejection", "reminder", "custom"],
      default: "custom",
    },
  },
  {
    timestamps: true,
  },
)

export default mongoose.models.EmailTemplate || mongoose.model("EmailTemplate", EmailTemplateSchema)
