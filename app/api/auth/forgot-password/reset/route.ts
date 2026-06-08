import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import User from "@/models/User"
import VerificationCode from "@/models/VerificationCode"
import bcrypt from "bcryptjs"

const PASSWORD_MIN = 6

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const email = (body?.email || "").trim().toLowerCase()
    const otp = (body?.otp || "").trim()
    const newPassword = (body?.newPassword || "").trim()

    if (!email || !otp || !newPassword) {
      return NextResponse.json({ success: false, message: "Email, OTP and new password are required" }, { status: 400 })
    }

    if (newPassword.length < PASSWORD_MIN) {
      return NextResponse.json(
        { success: false, message: `Password must be at least ${PASSWORD_MIN} characters` },
        { status: 400 },
      )
    }

    await dbConnect()

    const user = await User.findOne({ email })
    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
    }

    // Block super admin — high security
    if ((user as any).role === "admin") {
      return NextResponse.json(
        { success: false, message: "Super Admin account password cannot be reset from here." },
        { status: 403 },
      )
    }

    const storedCode = await VerificationCode.findOne({ email })
    if (!storedCode || storedCode.code !== otp || storedCode.expires < new Date()) {
      return NextResponse.json({ success: false, message: "Invalid or expired OTP" }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10)
    user.password = hashedPassword
    user.mustChangePassword = false
    await user.save()

    await VerificationCode.deleteOne({ email })

    return NextResponse.json({ success: true, message: "Password reset successful. Please login." })
  } catch (error) {
    console.error("Forgot-password reset error:", error)
    return NextResponse.json({ success: false, message: "Failed to reset password" }, { status: 500 })
  }
}
