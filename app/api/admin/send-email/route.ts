import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import dbConnect from "@/lib/mongodb"
import NSSApplication from "@/models/NSSApplication"
import { sendCustomEmail } from "@/lib/email"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    await dbConnect()
    const body = await request.json()
    const { type, recipients, subject, content, recipientType, customRecipients, templateId } = body

    let emailList: string[] = []

    if (type === "single") {
      emailList = recipients
    } else if (type === "bulk") {
      if (recipientType === "custom") {
        emailList = customRecipients
      } else {
        // Fetch emails based on recipient type
        let query: any = {}

        switch (recipientType) {
          case "approved":
            query = { status: "approved" }
            break
          case "pending":
            query = { status: "pending" }
            break
          case "rejected":
            query = { status: "rejected" }
            break
          case "all":
          default:
            query = {}
            break
        }

        const applications = await NSSApplication.find(query).select("emailId")
        emailList = applications.map((app) => app.emailId).filter(Boolean)
      }
    }

    // Send emails
    const results = []
    for (const email of emailList) {
      try {
        await sendCustomEmail(email, subject, content)
        results.push({ email, status: "sent" })

        // Log email
        await logEmail({
          to: email,
          subject,
          content,
          status: "sent",
          templateId,
        })
      } catch (error) {
        results.push({ email, status: "failed", error: error.message })

        // Log failed email
        await logEmail({
          to: email,
          subject,
          content,
          status: "failed",
          error: error.message,
          templateId,
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Emails processed: ${results.filter((r) => r.status === "sent").length} sent, ${results.filter((r) => r.status === "failed").length} failed`,
      results,
    })
  } catch (error) {
    console.error("Error sending emails:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

async function logEmail(data: any) {
  try {
    const EmailLog = (await import("@/models/EmailLog")).default
    await EmailLog.create({
      ...data,
      sentAt: new Date(),
    })
  } catch (error) {
    console.error("Error logging email:", error)
  }
}
