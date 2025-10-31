import { type NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import NSSApplication from "@/models/NSSApplication"
import User from "@/models/User" 
import { sendApplicationApprovedEmail, sendApplicationRejectedEmail } from "@/lib/email"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import mongoose from "mongoose"

import bcrypt from "bcryptjs"   

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

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  console.log("PATCH /api/applications/:id called, id =", params.id)
  try {
    const id = params.id
    const body = await req.json()

    await dbConnect()

    const session = (await getServerSession(authOptions)) as any
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const { status, rejectionReason } = body

    // Derive reviewer ObjectId from the session when possible; fall back to email lookup.
    let reviewerObjectId: mongoose.Types.ObjectId | undefined
    if (session.user.id && mongoose.Types.ObjectId.isValid(session.user.id)) {
      reviewerObjectId = new mongoose.Types.ObjectId(session.user.id)
    } else if (session.user.email) {
      const adminUser = await mongoose.model("User").findOne({ email: session.user.email })
      if (adminUser?._id) {
        reviewerObjectId = adminUser._id as mongoose.Types.ObjectId
      }
    }

    const updateData: any = {
      status,
      reviewedAt: new Date(),
      ...(reviewerObjectId ? { reviewedBy: reviewerObjectId } : {}),
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

        // --- Volunteer Account Creation Logic ---
        // 1. Check if user already exists
        let volunteerUser = await User.findOne({ email: application.emailId });
        let generatedPassword = "";
        if (!volunteerUser) {
          // 2. Generate password: nameEnglish + birth year
          const name = application.nameEnglish.replace(/\s+/g, "");
          const birthYear = application.dateOfBirth ? new Date(application.dateOfBirth).getFullYear() : "1234";
          generatedPassword = `${name}${birthYear}`;
          // 3. Hash password
          const hashedPassword = await bcrypt.hash(generatedPassword, 10);
          // 4. Create user
          volunteerUser = new User({
            name: application.nameEnglish,
            email: application.emailId,
            password: hashedPassword,
            role: "volunteer",
          });
          await volunteerUser.save();
        }

        // 5. Send acceptance email with credentials
        await sendApplicationApprovedEmail(application.emailId, {
          name: application.nameEnglish,
          applicationId: application._id.toString(),
          institutionName: application.institutionName,
          formData,
          // Add credentials if account was just created
          credentials: !generatedPassword
            ? undefined
            : {
                email: application.emailId,
                password: generatedPassword,
              },
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
