import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import dbConnect from "@/lib/mongodb"
import NotificationRead from "@/models/NotificationRead"
import Notification from "@/models/Notification"

export async function POST(request: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as any
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { announcementId } = body

    if (!announcementId) {
      return NextResponse.json(
        { success: false, message: "Announcement ID required" },
        { status: 400 }
      )
    }

    await dbConnect()

    // Check if it's a Notification model notification (user-specific) or Announcement-based
    const notification = await Notification.findOne({ _id: announcementId, userId: session.user.id }).lean()

    if (notification) {
      // Update Notification model's isRead field
      await Notification.findByIdAndUpdate(announcementId, {
        isRead: true,
        readAt: new Date(),
      })
    } else {
      // Mark announcement-based notification as read
      await NotificationRead.findOneAndUpdate(
        {
          volunteerId: session.user.id,
          announcementId: announcementId,
        },
        {
          volunteerId: session.user.id,
          announcementId: announcementId,
          readAt: new Date(),
        },
        { upsert: true, new: true }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Notification marked as read",
    })
  } catch (error) {
    console.error("Mark notification read error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

