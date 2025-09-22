import { type NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import NSSApplication from "@/models/NSSApplication"
import { sendApplicationApprovedEmail, sendApplicationRejectedEmail } from "@/lib/email"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import mongoose from "mongoose"

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

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { status, rejectionReason } = body

    const adminUser = await mongoose.model("User").findOne({ email: session.user.email })
    if (!adminUser) {
      return NextResponse.json({ success: false, message: "Admin user not found" }, { status: 404 })
    }

    const updateData: any = {
      status,
      reviewedAt: new Date(),
      reviewedBy: adminUser._id, // Use the actual ObjectId from database
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
        // Prepare formData for PDF
        const formData = {
          institutionName: application.institutionName,
          formNo: application.formNo,
          enrollment: application.enrollment,
          programOfficerName: application.programOfficerName,
          unitNo: application.unitNo,
          nameEnglish: application.nameEnglish,
          nameHindi: application.nameHindi,
          fatherName: application.fatherName,
          motherName: application.motherName,
          dateOfBirth: application.dateOfBirth?.toISOString().split('T')[0] || '',
          mobileNo: application.mobileNo,
          emailId: application.emailId,
          departmentName: application.departmentName || '',
          gender: application.gender || '',
          category: application.category || '',
          institutionalIdCard: application.institutionalIdCard || '',
          photo: application.photo || '',
          highSchoolRollNo: application.highSchoolRollNo,
          classSemester: application.classSemester,
          nssEnrollmentYear: application.nssEnrollmentYear || '',
          attendedSpecialCamp: application.attendedSpecialCamp || false,
          specialCampDetails: application.specialCampDetails || undefined,
          myBharatPortalRegistered: application.myBharatPortalRegistered || false,
          specialNSSAchievements: application.specialNSSAchievements || '',
          attendedELP: application.attendedELP || false,
          otherAchievements: application.otherAchievements || '',
        };
        await sendApplicationApprovedEmail(application.emailId, {
          name: application.nameEnglish,
          applicationId: application._id.toString(),
          institutionName: application.institutionName,
          formData,
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
