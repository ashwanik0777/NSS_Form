import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import User from "@/models/User"
import VerificationCode from "@/models/VerificationCode"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const email = (body?.email || "").trim().toLowerCase()
    const otp = (body?.otp || "").trim()

    if (!email || !otp) {
      return NextResponse.json({ success: false, message: "Email and OTP are required" }, { status: 400 })
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

    const storedCode = await VerificationCode.findOne({ email }).lean()
    if (!storedCode || storedCode.code !== otp || storedCode.expires < new Date()) {
      return NextResponse.json({ success: false, message: "Invalid or expired OTP" }, { status: 400 })
    }

    return NextResponse.json({ success: true, message: "OTP verified successfully" })
  } catch (error) {
    console.error("Volunteer forgot-password verify OTP error:", error)
    return NextResponse.json({ success: false, message: "Failed to verify OTP" }, { status: 500 })
  }
}
