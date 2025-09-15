import { type NextRequest, NextResponse } from "next/server"
import { sendApplicationSubmittedEmail } from "@/lib/email"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, name, applicationId, institutionName } = body

    if (!email || !name || !applicationId || !institutionName) {
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 })
    }

    const result = await sendApplicationSubmittedEmail(email, {
      name,
      applicationId,
      institutionName,
    })

    return NextResponse.json({
      success: result.success,
      message: result.success ? "Test email sent successfully" : "Failed to send email",
      error: result.error || null,
    })
  } catch (error) {
    console.error("Error sending test email:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
