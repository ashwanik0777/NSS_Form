import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import dbConnect from "@/lib/mongodb"
import AdminNotificationRead from "@/models/AdminNotificationRead"

export async function POST(request: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as any
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "admin" && session.user.role !== "sub-admin") {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { notificationId, notificationIds } = body

    await dbConnect()

    // Handle single notification
    if (notificationId) {
      await AdminNotificationRead.findOneAndUpdate(
        {
          adminId: session.user.id,
          notificationId: notificationId,
        },
        {
          adminId: session.user.id,
          notificationId: notificationId,
          readAt: new Date(),
        },
        { upsert: true, new: true }
      )

      return NextResponse.json({
        success: true,
        message: "Notification marked as read",
      })
    }

    // Handle multiple notifications
    if (notificationIds && Array.isArray(notificationIds)) {
      const promises = notificationIds.map((id: string) =>
        AdminNotificationRead.findOneAndUpdate(
          {
            adminId: session.user.id,
            notificationId: id,
          },
          {
            adminId: session.user.id,
            notificationId: id,
            readAt: new Date(),
          },
          { upsert: true, new: true }
        )
      )

      await Promise.all(promises)

      return NextResponse.json({
        success: true,
        message: "All notifications marked as read",
      })
    }

    return NextResponse.json(
      { success: false, message: "Notification ID or notificationIds array required" },
      { status: 400 }
    )
  } catch (error) {
    console.error("Mark notification read error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

