import { type NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import NSSApplication from "@/models/NSSApplication"
import { sendApplicationApprovedEmail, sendApplicationRejectedEmail } from "@/lib/email"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect()

    const application = await NSSApplication.findById(params.id)
      .populate("userId", "name email")
      .populate("reviewedBy", "name")

    if (!application) {
      return NextResponse.json({ success: false, message: "Application not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      application,
    })
  } catch (error) {
    console.error("Error fetching application:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect()

    const body = await request.json()
    const { status, rejectionReason, reviewedBy } = body

    const updateData: any = {
      status,
      reviewedAt: new Date(),
      reviewedBy,
    }

    if (status === "rejected" && rejectionReason) {
      updateData.rejectionReason = rejectionReason
    }

    const application = await NSSApplication.findByIdAndUpdate(params.id, updateData, { new: true }).populate(
      "userId",
      "name email",
    )

    if (!application) {
      return NextResponse.json({ success: false, message: "Application not found" }, { status: 404 })
    }

    try {
      if (status === "approved") {
        await sendApplicationApprovedEmail(application.emailId, {
          name: application.nameEnglish,
          applicationId: application._id.toString(),
          institutionName: application.institutionName,
        })
      } else if (status === "rejected") {
        await sendApplicationRejectedEmail(application.emailId, {
          name: application.nameEnglish,
          applicationId: application._id.toString(),
          rejectionReason: rejectionReason || "No specific reason provided",
        })
      }
    } catch (emailError) {
      console.error("Error sending status email:", emailError)
      // Don't fail the status update if email fails
    }

    return NextResponse.json({
      success: true,
      application,
      message: `Application ${status} successfully`,
    })
  } catch (error) {
    console.error("Error updating application:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
