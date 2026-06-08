import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import User from "@/models/User"
import NSSApplication from "@/models/NSSApplication"
import VerificationCode from "@/models/VerificationCode"
import { sendVolunteerSelfResetOTPEmail, sendAdminSelfResetOTPEmail } from "@/lib/email"

const normalize = (value: string) => value.trim().replace(/\s+/g, " ").toLowerCase()
const maskEmail = (email: string) => {
  const [local, domain] = email.split("@")
  if (!local || !domain) return email
  const visible = local.slice(0, 2)
  return `${visible}${"*".repeat(Math.max(1, local.length - 2))}@${domain}`
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const name = (body?.name || "").trim()
    const email = (body?.email || "").trim().toLowerCase()

    if (!name || !email) {
      return NextResponse.json({ success: false, message: "Name and email are required" }, { status: 400 })
    }

    await dbConnect()

    const user = await User.findOne({ email }).lean()
    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
    }

    const userRole = (user as any).role

    // Block super admin — high security, password reset not allowed from here
    if (userRole === "admin") {
      return NextResponse.json(
        { success: false, message: "Super Admin account password cannot be reset from here. Please contact the system administrator." },
        { status: 403 },
      )
    }

    // For sub-admins: verify name against User model
    if (userRole === "sub-admin") {
      const userName = normalize((user as any).name || "")
      const typedName = normalize(name)
      if (!userName || userName !== typedName) {
        return NextResponse.json({ success: false, message: "Name does not match your admin profile" }, { status: 400 })
      }
    } else {
      // For volunteers: verify name against NSSApplication
      const application = await NSSApplication.findOne({ userId: (user as any)._id, status: "approved" }).lean()
      if (!application) {
        return NextResponse.json({ success: false, message: "Approved volunteer profile not found" }, { status: 404 })
      }

      const appName = normalize((application as any).nameEnglish || "")
      const typedName = normalize(name)
      if (!appName || appName !== typedName) {
        return NextResponse.json({ success: false, message: "Name does not match your volunteer profile" }, { status: 400 })
      }
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString()

    await VerificationCode.findOneAndUpdate(
      { email },
      { code: otp, expires: new Date(Date.now() + 10 * 60 * 1000) },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    )

    // Send role-appropriate email
    if (userRole === "sub-admin") {
      await sendAdminSelfResetOTPEmail(email, {
        name: (user as any).name || "Admin",
        otp,
        designation: (user as any).designation || "",
      })
    } else {
      const application = await NSSApplication.findOne({ userId: (user as any)._id, status: "approved" }).lean()
      await sendVolunteerSelfResetOTPEmail(email, {
        name: (application as any)?.nameEnglish || (user as any).name || "Volunteer",
        otp,
      })
    }

    return NextResponse.json({
      success: true,
      message: `OTP sent to ${maskEmail(email)}. It will expire in 10 minutes.`,
    })
  } catch (error) {
    console.error("Forgot-password send OTP error:", error)
    return NextResponse.json({ success: false, message: "Failed to send OTP" }, { status: 500 })
  }
}
