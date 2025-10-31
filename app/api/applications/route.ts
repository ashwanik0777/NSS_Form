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


    // Get next form number from DB
    let nextFormNo = "1001"
    const lastApp: any = await NSSApplication.findOne({}, { formNo: 1 })
      .sort({ formNo: -1 })
      .lean()
    if (lastApp && lastApp.formNo && !isNaN(Number(lastApp.formNo))) {
      nextFormNo = String(Number(lastApp.formNo) + 1)
    }

    // Create NSS application with formNo set
    const application = new NSSApplication({
      ...formData, // This will include schoolName and highSchoolCertificate
      formNo: nextFormNo,
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
    // Remove default limit of 10, fetch all applications if limit not provided
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limitParam = searchParams.get("limit")
    const limit = limitParam ? Number.parseInt(limitParam) : 0 // 0 means no limit
    const skip = (page - 1) * (limit || 1)

    let query = {}
    if (status && status !== "all") {
      query = { status }
    }

    let applicationsQuery = NSSApplication.find(query)
      .populate("userId", "name email")
      .populate("reviewedBy", "name")
      .sort({ createdAt: -1 })

    if (limit) {
      applicationsQuery = applicationsQuery.skip(skip).limit(limit)
    }

    const applications = await applicationsQuery
    const total = await NSSApplication.countDocuments(query)

    return NextResponse.json({
      success: true,
      applications,
      pagination: {
        page,
        limit: limit || total,
        total,
        pages: limit ? Math.ceil(total / limit) : 1,
      },
    })
  } catch (error) {
    console.error("Error fetching applications:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
