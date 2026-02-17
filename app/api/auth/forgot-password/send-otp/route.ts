import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import User from "@/models/User"
import NSSApplication from "@/models/NSSApplication"
import VerificationCode from "@/models/VerificationCode"
import { sendVolunteerSelfResetOTPEmail } from "@/lib/email"

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
      return NextResponse.json({ success: false, message: "Volunteer not found" }, { status: 404 })
    }

    if ((user as any).role === "admin" || (user as any).role === "sub-admin") {
      return NextResponse.json(
        { success: false, message: "Forgot password here is available only for volunteers" },
        { status: 403 },
      )
    }

    const application = await NSSApplication.findOne({ userId: (user as any)._id, status: "approved" }).lean()
    if (!application) {
      return NextResponse.json({ success: false, message: "Approved volunteer profile not found" }, { status: 404 })
    }

    const appName = normalize((application as any).nameEnglish || "")
    const typedName = normalize(name)
    if (!appName || appName !== typedName) {
      return NextResponse.json({ success: false, message: "Name does not match your volunteer profile" }, { status: 400 })
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString()

    await VerificationCode.findOneAndUpdate(
      { email },
      { code: otp, expires: new Date(Date.now() + 10 * 60 * 1000) },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    )

    await sendVolunteerSelfResetOTPEmail(email, {
      name: (application as any).nameEnglish || (user as any).name || "Volunteer",
      otp,
    })

    return NextResponse.json({
      success: true,
      message: `OTP sent to ${maskEmail(email)}. It will expire in 10 minutes.`,
    })
  } catch (error) {
    console.error("Volunteer forgot-password send OTP error:", error)
    return NextResponse.json({ success: false, message: "Failed to send OTP" }, { status: 500 })
  }
}
