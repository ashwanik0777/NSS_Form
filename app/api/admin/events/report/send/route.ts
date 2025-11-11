import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import dbConnect from "@/lib/mongodb"
import Event from "@/models/Event"
import EventReport from "@/models/EventReport"
import { hasPermission, PermissionKey } from "@/lib/permissions"
import { sendCustomEmail } from "@/lib/email"

export async function POST(request: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as any
    if (!session?.user?.id) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })

    if (session.user.role !== "admin" && session.user.role !== "sub-admin") {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 })
    }

    // Check permission for sub-admin
    if (session.user.role === "sub-admin") {
      const userPermissions = session.user.permissions || []
      if (!hasPermission(userPermissions, "events.view" as PermissionKey)) {
        return NextResponse.json({ success: false, message: "Permission denied" }, { status: 403 })
      }
    }

    const body = await request.json()
    const { eventId, email } = body
    if (!eventId || !email) {
      return NextResponse.json({ success: false, message: "eventId and email required" }, { status: 400 })
    }

    await dbConnect()

    const event = await Event.findById(eventId).lean()
    if (!event) return NextResponse.json({ success: false, message: "Event not found" }, { status: 404 })

    const report = await EventReport.findOne({ eventId }).lean()
    if (!report) return NextResponse.json({ success: false, message: "Report not found" }, { status: 404 })

    const selected = (report.selectedPhotoUrls || []).slice(0, 4)
    const imagesHtml = selected
      .map((url) => `<div style="flex:1; padding:4px;"><img src="${url}" alt="Event photo" style="width:100%; border-radius:8px;"/></div>`)
      .join("")

    const content = `
      <div style="font-family: Arial, sans-serif;">
        <h2 style="margin:0 0 4px 0;">${event.title}</h2>
        <p style="margin:0; color:#6b7280;">${new Date(event.eventDate).toLocaleDateString("en-IN")}</p>
        <hr style="margin:16px 0; border:none; border-top:1px solid #e5e7eb;"/>
        <p style="white-space:pre-wrap; color:#111827;">${report.description}</p>
        <p style="margin:12px 0;"><strong>Attendees:</strong> ${report.attendeesCount}</p>
        ${
          selected.length > 0
            ? `<div style="display:flex; gap:8px; margin:12px 0; flex-wrap:wrap;">${imagesHtml}</div>`
            : ""
        }
      </div>
    `

    await sendCustomEmail(email, `Event Report: ${event.title}`, content)

    return NextResponse.json({ success: true, message: "Report email sent successfully" })
  } catch (error) {
    console.error("Event report send error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}



