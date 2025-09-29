import { NextRequest, NextResponse } from "next/server"
import nodemailer from "nodemailer"
import VerificationCode from "@/models/VerificationCode"
import  connectDB  from "@/lib/mongodb"

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ success: false, message: "Email is required" })
    }

    // Generate 6-digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    
    // Delete any existing verification code for this email
    await VerificationCode.deleteOne({ email })
    
    // Store new code with 10 minutes expiry
    await VerificationCode.create({
      email,
      code,
      expires: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    })

    // Send email
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: email,
      subject: "NSS Registration - Email Verification",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Email Verification</h2>
          <p>Your verification code for NSS Registration is:</p>
          <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 3px; margin: 20px 0;">
            ${code}
          </div>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't request this verification, please ignore this email.</p>
        </div>
      `,
    })

    return NextResponse.json({ success: true, message: "Verification code sent" })
  } catch (error) {
    console.error("Send verification error:", error)
    return NextResponse.json({ success: false, message: "Failed to send verification code" })
  }
}