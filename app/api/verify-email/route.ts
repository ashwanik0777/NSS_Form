import { NextRequest, NextResponse } from "next/server"
import VerificationCode from "@/models/VerificationCode"
import connectDB  from "@/lib/mongodb"

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const { email, code } = await request.json()

    if (!email || !code) {
      return NextResponse.json({ success: false, message: "Email and code are required" })
    }

    const storedData = await VerificationCode.findOne({ email })
    
    if (!storedData) {
      return NextResponse.json({ success: false, message: "Verification code not found. Please request a new code." })
    }

    if (Date.now() > storedData.expires.getTime()) {
      await VerificationCode.deleteOne({ email })
      return NextResponse.json({ success: false, message: "Verification code has expired. Please request a new code." })
    }

    if (storedData.code !== code.trim()) {
      return NextResponse.json({ success: false, message: "Invalid verification code. Please try again." })
    }

    // Clean up
    await VerificationCode.deleteOne({ email })

    return NextResponse.json({ success: true, message: "Email verified successfully" })
  } catch (error) {
    console.error("Verify email error:", error)
    return NextResponse.json({ success: false, message: "Failed to verify email" })
  }
}

