import { type NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import NSSApplication from "@/models/NSSApplication"
import User from "@/models/User" 
import { sendApplicationApprovedEmail, sendApplicationRejectedEmail } from "@/lib/email"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import mongoose from "mongoose"
import { hasPermission, PermissionKey } from "@/lib/permissions"
import bcrypt from "bcryptjs"   

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = (await getServerSession(authOptions)) as any
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "admin" && session.user.role !== "sub-admin") {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 })
    }

    // Check permission for sub-admin
    if (session.user.role === "sub-admin") {
      const userPermissions = session.user.permissions || []
      if (!hasPermission(userPermissions, "applications.view" as PermissionKey)) {
        return NextResponse.json({ success: false, message: "Permission denied" }, { status: 403 })
      }
    }

    await dbConnect()

    const application = await NSSApplication.findById(params.id)
      .populate("userId", "name email")
      .populate("reviewedBy", "name email")

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

    const session = (await getServerSession(authOptions)) as any
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "admin" && session.user.role !== "sub-admin") {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 })
    }

    // Check permission for sub-admin - require applications.review
    if (session.user.role === "sub-admin") {
      const userPermissions = session.user.permissions || []
      if (!hasPermission(userPermissions, "applications.review" as PermissionKey)) {
        return NextResponse.json({ success: false, message: "Permission denied. You need 'applications.review' permission." }, { status: 403 })
      }
    }

    await dbConnect()

    const { status, rejectionReason } = body

    // Check unit capacity before approving
    if (status === "approved") {
      const application = await NSSApplication.findById(params.id)
      if (!application) {
        return NextResponse.json({ success: false, message: "Application not found" }, { status: 404 })
      }

      const MAX_STUDENTS_PER_UNIT = 100
      const currentCount = await NSSApplication.countDocuments({
        unitNo: application.unitNo,
        status: "approved",
        _id: { $ne: application._id },
      })

      if (currentCount >= MAX_STUDENTS_PER_UNIT) {
        return NextResponse.json(
          {
            success: false,
            message: `Cannot approve: Unit ${application.unitNo} is full. Maximum ${MAX_STUDENTS_PER_UNIT} students allowed per unit. Please transfer students to another unit first.`,
          },
          { status: 400 }
        )
      }
    }

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

    // Convert to plain object to access all fields, including those not in schema
    const appPlain = application.toObject ? application.toObject() : application
    const appData = appPlain as any

    try {
      if (status === "approved") {
        // Prepare formData for PDF - include all fields including courseName, bloodGroup, and address details
        const formData = {
          institutionName: application.institutionName,
          formNo: application.formNo,
          enrollment: application.enrollment,
          programOfficerName: application.programOfficerName,
          unitNo: application.unitNo,
          schoolName: appData.schoolName || '',
          nameEnglish: application.nameEnglish,
          nameHindi: appData.nameHindi || application.nameEnglish,
          fatherName: application.fatherName,
          motherName: application.motherName,
          dateOfBirth: application.dateOfBirth?.toISOString().split('T')[0] || '',
          mobileNo: application.mobileNo,
          emailId: application.emailId,
          departmentName: application.departmentName || '',
          courseName: appData.courseName || '',
          gender: application.gender || '',
          category: application.category || '',
          institutionalIdCard: application.institutionalIdCard || '',
          photo: application.photo || '',
          signature: application.signature || '',
          highSchoolRollNo: application.highSchoolRollNo,
          classSemester: application.classSemester,
          bloodGroup: appData.bloodGroup || '',
          nssEnrollmentYear: application.nssEnrollmentYear || '',
          attendedSpecialCamp: application.attendedSpecialCamp || false,
          specialCampDetails: application.specialCampDetails || undefined,
          myBharatPortalRegistered: application.myBharatPortalRegistered || false,
          myBharatPortalId: appData.myBharatPortalId || '',
          myBharatPortalScreenshot: appData.myBharatPortalScreenshot || '',
          specialNSSAchievements: appData.specialNSSAchievements || 'No',
          specialNSSAchievementsProof: appData.specialNSSAchievementsProof || null,
          attendedELP: application.attendedELP || false,
          elpProof: appData.elpProof || null,
          otherAchievements: appData.otherAchievements || 'No',
          otherAchievementsCertificates: appData.otherAchievementsCertificates || null,
          addressType: appData.addressType || '',
          hostelAddress: appData.hostelAddress || '',
          homeAddress: appData.homeAddress || '',
        };

        // --- Volunteer Account Creation / Reset Logic ---
        // Always generate first-login password: nameEnglish + birth year
        // Remove all spaces and convert to consistent case
        const name = application.nameEnglish.replace(/\s+/g, "").replace(/[^a-zA-Z]/g, "");
        const birthYear = application.dateOfBirth ? new Date(application.dateOfBirth).getFullYear().toString() : "1234";
        const generatedPassword = `${name}${birthYear}`;

        // Check if user exists; create or reset password for first login
        let volunteerUser = await User.findOne({ email: application.emailId });
        
        let credentialsToSend = null;

        if (!volunteerUser) {
           // Should not happen if application exists, but safety first
           const hashedPassword = await bcrypt.hash(generatedPassword, 10);
           volunteerUser = new User({
            name: application.nameEnglish,
            email: application.emailId,
            password: hashedPassword,
            role: "volunteer",
            mustChangePassword: true,
          });
          await volunteerUser.save();
          credentialsToSend = { email: application.emailId, password: generatedPassword };
        } else {
            // If User exists, check if they are ALREADY a volunteer / verified user
            if (volunteerUser.role === 'volunteer' || volunteerUser.role === 'admin' || volunteerUser.role === 'sub-admin') {
                // Existing account. DO NOT RESET PASSWORD.
                // Just ensure role is correct? (It is).
                console.log(`User ${application.emailId} is already a ${volunteerUser.role}. Skipping password reset.`);
                // We do NOT send credentials if we didn't reset password.
            } else {
                // User Role is 'user' (Pending/Applicant). FIRST TIME APPROVAL.
                // Reset password for first login and ensure role is volunteer
                const hashedPassword = await bcrypt.hash(generatedPassword, 10);
                volunteerUser.password = hashedPassword;
                volunteerUser.role = "volunteer" as any;
                volunteerUser.mustChangePassword = true;
                await volunteerUser.save();
                credentialsToSend = { email: application.emailId, password: generatedPassword };
            }
        }

        // 5. Send acceptance email with credentials
        await sendApplicationApprovedEmail(application.emailId, {
          name: application.nameEnglish,
          applicationId: application._id.toString(),
          institutionName: application.institutionName,
          formData,
          // Only include credentials if we generated/reset them
          credentials: credentialsToSend || undefined,
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
