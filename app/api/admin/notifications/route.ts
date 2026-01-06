import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import dbConnect from "@/lib/mongodb"
import NSSApplication from "@/models/NSSApplication"
import VolunteerEvent from "@/models/VolunteerEvent"
import Event from "@/models/Event"
import AdminNotificationRead from "@/models/AdminNotificationRead"

export const dynamic = 'force-dynamic'

export async function GET(_request: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as any
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "admin" && session.user.role !== "sub-admin") {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 })
    }

    await dbConnect()

    // Get recent pending applications
    const pendingApplications = await NSSApplication.find({
      status: { $in: ["submitted", "under-review"] },
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("nameEnglish formNo status createdAt")
      .lean()

    // Get upcoming events
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const upcomingEvents = await Event.find({
      eventDate: { $gte: today },
      status: { $in: ["upcoming", "ongoing"] },
    })
      .sort({ eventDate: 1 })
      .limit(5)
      .select("title eventDate status")
      .lean()

    // Format notifications
    const allNotifications = [
      ...pendingApplications.map((app: any) => ({
        id: `app-${app._id}`,
        type: "application",
        message: `New application submitted by ${app.nameEnglish}`,
        time: new Date(app.createdAt).toISOString(),
        unread: true, // Default to unread
        data: app,
      })),
      ...upcomingEvents.map((event: any) => ({
        id: `event-${event._id}`,
        type: "event",
        message: `Upcoming event: ${event.title}`,
        time: new Date(event.eventDate).toISOString(),
        unread: event.status === "ongoing", // Default to unread if ongoing
        data: event,
      })),
    ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())

    // Get read status for notifications
    const notificationIds = allNotifications.map((n) => n.id)
    const readNotifications = await AdminNotificationRead.find({
      adminId: session.user.id,
      notificationId: { $in: notificationIds },
    })
      .select("notificationId")
      .lean()

    const readNotificationIds = new Set(
      readNotifications.map((r: any) => r.notificationId)
    )

    // Mark notifications as read/unread based on database
    const notifications = allNotifications.map((n) => ({
      ...n,
      unread: !readNotificationIds.has(n.id),
    }))

    return NextResponse.json({
      success: true,
      notifications: notifications.slice(0, 10),
      unreadCount: notifications.filter((n) => n.unread).length,
    })
  } catch (error) {
    console.error("Notifications fetch error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

