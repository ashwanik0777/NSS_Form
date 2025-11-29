import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import dbConnect from "@/lib/mongodb"
import User from "@/models/User"
import NSSApplication from "@/models/NSSApplication"
import VerificationCode from "@/models/VerificationCode"
import bcrypt from "bcryptjs"
import { sendPasswordResetOTPEmail, sendPasswordResetConfirmationEmail } from "@/lib/email"

const ensureSuperAdmin = async () => {
  const session = (await getServerSession(authOptions)) as any
  if (!session?.user?.id || session.user.role !== "admin") {
    return { error: NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 }) }
  }
  return { session }
}

const maskEmail = (email: string) => {
  const [local, domain] = email.split("@")
  if (!local || !domain) return email
  const visible = local.slice(0, 2)
  return `${visible}${"*".repeat(Math.max(1, local.length - 2))}@${domain}`
}

export async function GET(request: NextRequest) {
  const { error } = await ensureSuperAdmin()
  if (error) return error

  try {
    await dbConnect()
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")?.trim()
    if (!query || query.length < 2) {
      return NextResponse.json({ success: true, results: [] })
    }

    const regex = new RegExp(query, "i")
    const applications = await NSSApplication.find({
      status: "approved",
      $or: [{ nameEnglish: regex }, { emailId: regex }, { formNo: regex }, { mobileNo: regex }],
    })
      .sort({ submittedAt: -1 })
      .limit(10)
      .lean()

    const userIds = applications.map((app) => app.userId)
    const users = await User.find({ _id: { $in: userIds } })
      .select("name email role")
      .lean()
    const userMap = new Map(users.map((user) => [user._id.toString(), user]))

    const results = applications.map((app) => {
      const linkedUser = userMap.get(app.userId.toString())
      return {
        volunteerId: app.userId,
        name: app.nameEnglish || linkedUser?.name || "Volunteer",
        email: linkedUser?.email || app.emailId,
        unitNo: app.unitNo,
        formNo: app.formNo,
        dateOfBirth: app.dateOfBirth,
        mobileNo: app.mobileNo,
        application: {
          programOfficerName: app.programOfficerName,
          schoolName: app.schoolName,
          departmentName: app.departmentName,
          enrollment: app.enrollment,
          courseName: app.courseName,
          addressType: app.addressType,
          hostelAddress: app.hostelAddress,
          homeAddress: app.homeAddress,
          nssEnrollmentYear: app.nssEnrollmentYear,
          attendedSpecialCamp: app.attendedSpecialCamp,
        },
      }
    })

    return NextResponse.json({ success: true, results })
  } catch (err) {
    console.error("Password reset search error:", err)
    return NextResponse.json({ success: false, message: "Failed to search volunteers" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const { session, error } = await ensureSuperAdmin()
  if (error) return error
  try {
    await dbConnect()
    const body = await request.json()
    const volunteerId = body?.volunteerId
    if (!volunteerId) {
      return NextResponse.json({ success: false, message: "Volunteer ID is required" }, { status: 400 })
    }

    const volunteer = await User.findById(volunteerId).lean()
    if (!volunteer) {
      return NextResponse.json({ success: false, message: "Volunteer not found" }, { status: 404 })
    }

    const application = await NSSApplication.findOne({ userId: volunteerId }).lean()
    if (!application) {
      return NextResponse.json({ success: false, message: "Volunteer application not found" }, { status: 404 })
    }

    const email = (application.emailId || volunteer.email || "").toLowerCase()
    if (!email) {
      return NextResponse.json({ success: false, message: "Volunteer email is missing" }, { status: 400 })
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    await VerificationCode.findOneAndUpdate(
      { email },
      { code: otp, expires: new Date(Date.now() + 10 * 60 * 1000) },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    )

    await sendPasswordResetOTPEmail(email, {
      name: application.nameEnglish || volunteer.name || "Volunteer",
      otp,
    })

    return NextResponse.json({
      success: true,
      message: `OTP sent to ${maskEmail(email)}. It will expire in 10 minutes.`,
    })
  } catch (err) {
    console.error("Send OTP error:", err)
    return NextResponse.json({ success: false, message: "Failed to send OTP" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const { error } = await ensureSuperAdmin()
  if (error) return error
  try {
    await dbConnect()
    const body = await request.json()
    const volunteerId = body?.volunteerId
    const otp = (body?.otp || "").trim()

    if (!volunteerId || !otp) {
      return NextResponse.json({ success: false, message: "Volunteer ID and OTP are required" }, { status: 400 })
    }

    const volunteer = await User.findById(volunteerId)
    if (!volunteer) {
      return NextResponse.json({ success: false, message: "Volunteer not found" }, { status: 404 })
    }

    const application = await NSSApplication.findOne({ userId: volunteerId }).lean()
    if (!application) {
      return NextResponse.json({ success: false, message: "Volunteer application not found" }, { status: 404 })
    }

    const email = (application.emailId || volunteer.email || "").toLowerCase()
    if (!email) {
      return NextResponse.json({ success: false, message: "Volunteer email is missing" }, { status: 400 })
    }

    const storedCode = await VerificationCode.findOne({ email })
    if (!storedCode || storedCode.code !== otp || storedCode.expires < new Date()) {
      return NextResponse.json({ success: false, message: "Invalid or expired OTP" }, { status: 400 })
    }

    await VerificationCode.deleteOne({ email })

    const birthYear = application.dateOfBirth ? new Date(application.dateOfBirth).getFullYear().toString() : "2000"
    const namePart =
      (application.nameEnglish || volunteer.name || "nss")
        .split(" ")[0]
        ?.replace(/[^a-zA-Z]/g, "")
        .toLowerCase() || "nss"
    const temporaryPassword = `${namePart}${birthYear}`

    const hashedPassword = await bcrypt.hash(temporaryPassword, 10)
    volunteer.password = hashedPassword
    volunteer.mustChangePassword = true
    await volunteer.save()

    await sendPasswordResetConfirmationEmail(email, {
      name: application.nameEnglish || volunteer.name || "Volunteer",
      temporaryPassword,
    })

    return NextResponse.json({
      success: true,
      message: "Password reset successfully",
      password: temporaryPassword,
    })
  } catch (err) {
    console.error("Password reset verify error:", err)
    return NextResponse.json({ success: false, message: "Failed to reset password" }, { status: 500 })
  }
}

