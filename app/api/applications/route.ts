import { type NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import NSSApplication from "@/models/NSSApplication"
import User from "@/models/User"
import { validateAllSteps } from "@/lib/validation"
import { sendApplicationSubmittedEmail } from "@/lib/email"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { hasPermission, PermissionKey } from "@/lib/permissions"

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


    // Check unit capacity before creating application (only for approved status, but we check during approval)
    // For now, we allow submission but will check during approval

    // Get next form number from DB
    let nextFormNo = "1001"
    const lastApp: any = await NSSApplication.findOne({}, { formNo: 1 })
      .sort({ formNo: -1 })
      .lean()
    if (lastApp && lastApp.formNo && !isNaN(Number(lastApp.formNo))) {
      nextFormNo = String(Number(lastApp.formNo) + 1)
    }

    // Create NSS application with formNo set - explicitly map all fields
    const application = new NSSApplication({
      // Institution Details
      institutionName: formData.institutionName,
      enrollment: formData.enrollment,
      programOfficerName: formData.programOfficerName,
      unitNo: formData.unitNo,
      schoolName: formData.schoolName || '',
      
      // Personal Details
      nameEnglish: formData.nameEnglish,
      nameHindi: formData.nameHindi || formData.nameEnglish,
      fatherName: formData.fatherName,
      motherName: formData.motherName,
      dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth) : new Date(),
      mobileNo: formData.mobileNo,
      emailId: formData.emailId,
      departmentName: formData.departmentName,
      courseName: formData.courseName || '',
      gender: formData.gender,
      category: formData.category,
      bloodGroup: formData.bloodGroup || '',
      institutionalIdCard: formData.institutionalIdCard,
      institutionalIdProof: formData.institutionalIdProof || undefined,
      photo: formData.photo || '',
      signature: formData.signature || '',
      
      // Address Details
      addressType: formData.addressType || '',
      hostelAddress: formData.hostelAddress || '',
      homeAddress: formData.homeAddress || '',
      
      // Educational Details
      highSchoolRollNo: formData.highSchoolRollNo,
      classSemester: formData.classSemester,
      highSchoolCertificate: formData.highSchoolCertificate || undefined,
      
      // NSS Enrollment Details
      nssEnrollmentYear: formData.nssEnrollmentYear,
      attendedSpecialCamp: formData.attendedSpecialCamp || false,
      specialCampDetails: formData.specialCampDetails || undefined,
      
      // My Bharat Portal
      myBharatPortalRegistered: formData.myBharatPortalRegistered || false,
      myBharatPortalId: formData.myBharatPortalId || undefined,
      myBharatPortalScreenshot: formData.myBharatPortalScreenshot || undefined,
      
      // Additional Achievements
      specialNSSAchievements: formData.specialNSSAchievements || undefined,
      specialNSSAchievementsProof: formData.specialNSSAchievementsProof || undefined,
      attendedELP: formData.attendedELP || false,
      elpProof: formData.elpProof || undefined,
      otherAchievements: formData.otherAchievements || undefined,
      otherAchievementsCertificates: formData.otherAchievementsCertificates || undefined,
      
      // Application Metadata
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

    // Check if user is sub-admin and get their assigned units
    let userAssignedUnits: string[] | null = null
    if (session.user.role === "sub-admin") {
      const user = await User.findById(session.user.id).select("assignedUnits")
      if (user && (user as any).assignedUnits && (user as any).assignedUnits.length > 0) {
        userAssignedUnits = (user as any).assignedUnits
      }
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const unitNo = searchParams.get("unitNo")
    const enrollment = searchParams.get("enrollment") // first-year | second-year
    const schoolName = searchParams.get("schoolName")
    const departmentName = searchParams.get("departmentName")
    const nameSearch = searchParams.get("nameSearch") // Search by applicant name
    // Remove default limit of 10, fetch all applications if limit not provided
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limitParam = searchParams.get("limit")
    const limit = limitParam ? Number.parseInt(limitParam) : 0 // 0 means no limit
    const skip = (page - 1) * (limit || 1)

    let query: any = {}
    if (status && status !== "all") {
      query = { status }
    }
    
    // If sub-admin has assigned units, filter by those units
    if (userAssignedUnits && userAssignedUnits.length > 0) {
      query.unitNo = { $in: userAssignedUnits }
    } else if (unitNo && unitNo !== "all") {
      query.unitNo = unitNo
    }
    
    if (enrollment && (enrollment === "first-year" || enrollment === "second-year")) {
      query.enrollment = enrollment
    }
    if (schoolName && schoolName.trim()) {
      // Exact match for dropdown selection
      query.schoolName = schoolName.trim()
    }
    if (departmentName && departmentName.trim()) {
      query.departmentName = { $regex: new RegExp(`${departmentName.trim()}`, 'i') }
    }
    if (nameSearch && nameSearch.trim()) {
      query.nameEnglish = { $regex: new RegExp(`${nameSearch.trim()}`, 'i') }
    }

    let applicationsQuery = NSSApplication.find(query)
      .populate("userId", "name email")
      .populate("reviewedBy", "name email")
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
