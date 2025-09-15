import { type NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import NSSApplication from "@/models/NSSApplication"
import User from "@/models/User"
import { validateAllSteps } from "@/lib/validation"
import { sendApplicationSubmittedEmail } from "@/lib/email"

export async function POST(request: NextRequest) {
  try {
    await dbConnect()

    const body = await request.json()
    const { formData, userEmail } = body

    // Validate form data
    const errors = validateAllSteps(formData)
    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ success: false, errors }, { status: 400 })
    }

    // Find or create user
    let user = await User.findOne({ email: userEmail })
    if (!user) {
      // Create a temporary user for the application
      user = new User({
        name: formData.nameEnglish,
        email: userEmail,
        password: "temp_password", // This should be handled properly in a real app
        role: "user",
      })
      await user.save()
    }

    // Create NSS application
    const application = new NSSApplication({
      ...formData,
      userId: user._id,
      status: "submitted",
      submittedAt: new Date(),
    })

    await application.save()

    try {
      await sendApplicationSubmittedEmail(formData.emailId, {
        name: formData.nameEnglish,
        applicationId: application._id.toString(),
        institutionName: formData.institutionName,
      })
    } catch (emailError) {
      console.error("Error sending confirmation email:", emailError)
      // Don't fail the application submission if email fails
    }

    return NextResponse.json({
      success: true,
      applicationId: application._id,
      message: "Application submitted successfully",
    })
  } catch (error) {
    console.error("Error submitting application:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    await dbConnect()

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const skip = (page - 1) * limit

    let query = {}
    if (status && status !== "all") {
      query = { status }
    }

    const applications = await NSSApplication.find(query)
      .populate("userId", "name email")
      .populate("reviewedBy", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)

    const total = await NSSApplication.countDocuments(query)

    return NextResponse.json({
      success: true,
      applications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching applications:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
