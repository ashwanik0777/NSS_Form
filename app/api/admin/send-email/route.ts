import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import dbConnect from "@/lib/mongodb"
import NSSApplication from "@/models/NSSApplication"
import EmailLog from "@/models/EmailLog"
import { sendCustomEmail, replaceEmailVariables } from "@/lib/email"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user.role !== "admin" && session.user.role !== "sub-admin")) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    await dbConnect()
    const body = await request.json()
    const {
      type,
      recipients,
      items, // For batch sending: Array<{ email: string; name?: string; unitNo?: string; formNo?: string }>
      subject,
      content,
      recipientType,
      unit,
      customRecipients,
      templateId,
    } = body

    if (!subject || !content) {
      return NextResponse.json({ success: false, message: "Subject and content are required" }, { status: 400 })
    }

    // 1. Batch Sending (Used by Live Interactive Bulk Sender)
    if (type === "batch" && Array.isArray(items)) {
      const results: Array<{
        email: string
        name?: string
        unitNo?: string
        status: "sent" | "failed"
        error?: string
        sentAt: string
      }> = []

      for (const item of items) {
        const email = item.email?.trim()
        if (!email) continue

        const now = new Date()
        try {
          const personalizedSubject = replaceEmailVariables(subject, item)
          const personalizedContent = replaceEmailVariables(content, item)

          await sendCustomEmail(email, personalizedSubject, personalizedContent, item)

          results.push({
            email,
            name: item.name,
            unitNo: item.unitNo,
            status: "sent",
            sentAt: now.toISOString(),
          })

          await EmailLog.create({
            to: email,
            recipientName: item.name || "Volunteer",
            unitNo: item.unitNo || "N/A",
            type: "bulk",
            subject: personalizedSubject,
            content: personalizedContent,
            status: "sent",
            templateId: templateId || undefined,
            sentAt: now,
          })
        } catch (error: any) {
          const errorMsg = error?.message || "Failed to send email"
          results.push({
            email,
            name: item.name,
            unitNo: item.unitNo,
            status: "failed",
            error: errorMsg,
            sentAt: now.toISOString(),
          })

          await EmailLog.create({
            to: email,
            recipientName: item.name || "Volunteer",
            unitNo: item.unitNo || "N/A",
            type: "bulk",
            subject: replaceEmailVariables(subject, item),
            content: replaceEmailVariables(content, item),
            status: "failed",
            error: errorMsg,
            templateId: templateId || undefined,
            sentAt: now,
          })
        }
      }

      return NextResponse.json({
        success: true,
        sent: results.filter((r) => r.status === "sent").length,
        failed: results.filter((r) => r.status === "failed").length,
        results,
      })
    }

    // 2. Single or comma-separated direct send
    if (type === "single") {
      let emailList: string[] = []
      if (Array.isArray(recipients)) {
        emailList = recipients.map((e) => String(e).trim()).filter(Boolean)
      } else if (typeof recipients === "string") {
        emailList = recipients
          .split(",")
          .map((e) => e.trim())
          .filter(Boolean)
      }

      if (emailList.length === 0) {
        return NextResponse.json({ success: false, message: "No recipients provided" }, { status: 400 })
      }

      const results = []
      for (const email of emailList) {
        const now = new Date()
        try {
          await sendCustomEmail(email, subject, content)
          results.push({ email, status: "sent", sentAt: now.toISOString() })

          await EmailLog.create({
            to: email,
            type: "single",
            subject,
            content,
            status: "sent",
            templateId: templateId || undefined,
            sentAt: now,
          })
        } catch (error: any) {
          const errorMsg = error?.message || "Failed to send email"
          results.push({ email, status: "failed", error: errorMsg, sentAt: now.toISOString() })

          await EmailLog.create({
            to: email,
            type: "single",
            subject,
            content,
            status: "failed",
            error: errorMsg,
            templateId: templateId || undefined,
            sentAt: now,
          })
        }
      }

      const sentCount = results.filter((r) => r.status === "sent").length
      const failedCount = results.filter((r) => r.status === "failed").length

      return NextResponse.json({
        success: sentCount > 0,
        message: `${sentCount} sent, ${failedCount} failed`,
        results,
      })
    }

    // 3. Fallback Full Bulk (querying DB directly if not client batching)
    if (type === "bulk") {
      let recipientList: Array<{ email: string; name?: string; unitNo?: string; formNo?: string }> = []

      if (recipientType === "custom") {
        const rawList = Array.isArray(customRecipients)
          ? customRecipients
          : typeof customRecipients === "string"
            ? customRecipients.split(",").map((e: string) => e.trim())
            : []
        recipientList = rawList.filter(Boolean).map((email: string) => ({ email }))
      } else {
        const query: any = {}
        switch (recipientType) {
          case "approved":
            query.status = "approved"
            break
          case "pending":
            query.status = { $in: ["submitted", "under-review", "pending"] }
            break
          case "rejected":
            query.status = "rejected"
            break
          case "all":
          default:
            query.status = { $in: ["approved", "submitted", "under-review"] }
            break
        }

        if (unit && unit !== "all") {
          query.$or = [
            { unitNo: unit },
            { unitNo: `Unit ${unit}` },
            { unitNo: Number.parseInt(unit, 10) || unit },
          ]
        }

        const applications = await NSSApplication.find(query)
          .select("nameEnglish emailId unitNo formNo")
          .lean()

        const seen = new Set<string>()
        for (const app of applications) {
          const email = app.emailId?.trim().toLowerCase()
          if (email && email.includes("@") && !seen.has(email)) {
            seen.add(email)
            recipientList.push({
              email: app.emailId.trim(),
              name: app.nameEnglish,
              unitNo: String(app.unitNo || ""),
              formNo: String(app.formNo || ""),
            })
          }
        }
      }

      if (recipientList.length === 0) {
        return NextResponse.json({ success: false, message: "No matching recipients found" }, { status: 400 })
      }

      const results = []
      for (const item of recipientList) {
        const now = new Date()
        try {
          const personalizedSubject = replaceEmailVariables(subject, item)
          const personalizedContent = replaceEmailVariables(content, item)

          await sendCustomEmail(item.email, personalizedSubject, personalizedContent, item)
          results.push({ email: item.email, status: "sent", sentAt: now.toISOString() })

          await EmailLog.create({
            to: item.email,
            recipientName: item.name || "Volunteer",
            unitNo: item.unitNo || "N/A",
            type: "bulk",
            subject: personalizedSubject,
            content: personalizedContent,
            status: "sent",
            templateId: templateId || undefined,
            sentAt: now,
          })
        } catch (error: any) {
          const errorMsg = error?.message || "Failed to send email"
          results.push({ email: item.email, status: "failed", error: errorMsg, sentAt: now.toISOString() })

          await EmailLog.create({
            to: item.email,
            recipientName: item.name || "Volunteer",
            unitNo: item.unitNo || "N/A",
            type: "bulk",
            subject: replaceEmailVariables(subject, item),
            content: replaceEmailVariables(content, item),
            status: "failed",
            error: errorMsg,
            templateId: templateId || undefined,
            sentAt: now,
          })
        }
      }

      const sentCount = results.filter((r) => r.status === "sent").length
      const failedCount = results.filter((r) => r.status === "failed").length

      return NextResponse.json({
        success: true,
        message: `Bulk emails processed: ${sentCount} sent, ${failedCount} failed`,
        results,
      })
    }

    return NextResponse.json({ success: false, message: "Invalid request type" }, { status: 400 })
  } catch (error: any) {
    console.error("Error sending emails:", error)
    return NextResponse.json({ success: false, message: error?.message || "Internal server error" }, { status: 500 })
  }
}
