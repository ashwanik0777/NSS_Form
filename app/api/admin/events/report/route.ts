import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import dbConnect from "@/lib/mongodb"
import Event from "@/models/Event"
import EventReport from "@/models/EventReport"
import { hasPermission, PermissionKey } from "@/lib/permissions"

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get("eventId")
    if (!eventId) return NextResponse.json({ success: false, message: "eventId required" }, { status: 400 })

    await dbConnect()

    const report = await EventReport.findOne({ eventId }).lean()
    return NextResponse.json({ success: true, report: report || null })
  } catch (error) {
    console.error("Event report fetch error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as any
    if (!session?.user?.id) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })

    if (session.user.role !== "admin" && session.user.role !== "sub-admin") {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 })
    }

    // Check permission for sub-admin
    if (session.user.role === "sub-admin") {
      const userPermissions = session.user.permissions || []
      if (!hasPermission(userPermissions, "events.edit" as PermissionKey)) {
        return NextResponse.json({ success: false, message: "Permission denied" }, { status: 403 })
      }
    }

    const body = await request.json()
    const { eventId, description, attendeesCount, photoUrls = [], selectedPhotoUrls = [], videoUrls = [] } = body
    if (!eventId || !description || attendeesCount === undefined) {
      return NextResponse.json({ success: false, message: "eventId, description, attendeesCount required" }, { status: 400 })
    }
    if (photoUrls.length > 10) return NextResponse.json({ success: false, message: "Max 10 photos" }, { status: 400 })
    if (selectedPhotoUrls.length > 4) return NextResponse.json({ success: false, message: "Select up to 4 photos" }, { status: 400 })
    if (videoUrls.length > 4) return NextResponse.json({ success: false, message: "Max 4 videos" }, { status: 400 })

    await dbConnect()

    const event = await Event.findById(eventId).lean()
    if (!event) return NextResponse.json({ success: false, message: "Event not found" }, { status: 404 })

    // Allow only when completed
    if (event.status !== "completed") {
      return NextResponse.json({ success: false, message: "Report can be filled only after event completion" }, { status: 400 })
    }

    const report = await EventReport.findOneAndUpdate(
      { eventId },
      { description, attendeesCount, photoUrls, selectedPhotoUrls, videoUrls },
      { upsert: true, new: true },
    )

    return NextResponse.json({ success: true, report })
  } catch (error) {
    console.error("Event report save error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}



