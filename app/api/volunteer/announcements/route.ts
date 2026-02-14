import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import dbConnect from "@/lib/mongodb"
import Announcement from "@/models/Announcement"
import Notification from "@/models/Notification"
import NSSApplication from "@/models/NSSApplication"
import NotificationRead from "@/models/NotificationRead"

export const dynamic = "force-dynamic"

export async function GET(_request: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as any
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    await dbConnect()

    // Verify volunteer has approved application
    const application = await NSSApplication.findOne({
      userId: session.user.id,
      status: "approved",
    }).lean()

    // If no application (e.g. sub-admin), show all "all" target announcements but not unit specific ones.
    const unitNo = application?.unitNo
    const buildAudienceFilter = () => {
      const clauses: any[] = [{ targetType: { $exists: false } }, { targetType: "all" }]
      if (unitNo) {
        clauses.push({ targetType: "units", targetUnits: unitNo })
      }
      return { $or: clauses }
    }

    // Get active announcements and notifications
    const announcements = await Announcement.find({
      status: "active",
      type: { $in: ["announcement", "general"] },
      ...buildAudienceFilter(),
    })
      .populate("createdBy", "name")
      .sort({ createdAt: -1 })
      .limit(10)
      .lean()

    const globalNotifications = await Announcement.find({
      status: "active",
      type: "notification",
      ...buildAudienceFilter(),
    })
      .populate("createdBy", "name")
      .sort({ createdAt: -1 })
      .limit(5)
      .lean()

    // Merge in per-user notifications
    const userNotifications = await Notification.find({ userId: session.user.id })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean()

    // Get read status for global notifications
    const notificationIds = globalNotifications.map((n: any) => n._id)
    const readNotifications = await NotificationRead.find({
      volunteerId: session.user.id,
      announcementId: { $in: notificationIds },
    })
      .select("announcementId")
      .lean()

    const readNotificationIds = new Set(
      readNotifications.map((r: any) => r.announcementId.toString())
    )

    return NextResponse.json({
      success: true,
      announcements: announcements.map((a: any) => ({
        _id: a._id,
        title: a.title,
        content: a.content,
        type: a.type,
        createdAt: a.createdAt,
        createdBy: a.createdBy?.name || "Admin",
      })),
      notifications: [
        // Global announcement-based notifications
        ...globalNotifications.map((n: any) => ({
        _id: n._id,
        title: n.title,
        content: n.content,
        createdAt: n.createdAt,
        createdBy: n.createdBy?.name || "Admin",
        isRead: readNotificationIds.has(n._id.toString()),
        })),
        // User-specific notifications
        ...userNotifications.map((n: any) => ({
          _id: n._id,
          title: n.title,
          content: n.message,
          createdAt: n.createdAt,
          createdBy: "System",
          isRead: n.isRead || false,
        })),
      ],
    })
  } catch (error) {
    console.error("Announcements fetch error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

