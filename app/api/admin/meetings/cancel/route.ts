import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import dbConnect from "@/lib/mongodb"
import Meeting from "@/models/Meeting"
import User from "@/models/User"
import { hasPermission, PermissionKey } from "@/lib/permissions"

export async function PATCH(request: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as any
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "admin" && session.user.role !== "sub-admin") {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 })
    }

    // Check permission for sub-admin - require events.edit
    if (session.user.role === "sub-admin") {
      const userPermissions = session.user.permissions || []
      if (!hasPermission(userPermissions, "events.edit" as PermissionKey)) {
        return NextResponse.json(
          { success: false, message: "Permission denied. You need 'events.edit' permission." },
          { status: 403 }
        )
      }
    }

    const body = await request.json()
    const { meetingId, cancelReason } = body

    if (!meetingId) {
      return NextResponse.json({ success: false, message: "Meeting ID required" }, { status: 400 })
    }

    if (!cancelReason || cancelReason.trim() === "") {
      return NextResponse.json({ success: false, message: "Cancel reason is required" }, { status: 400 })
    }

    await dbConnect()

    // Check if meeting exists and sub-admin has access
    const existingMeeting = await Meeting.findById(meetingId).lean()
    if (!existingMeeting) {
      return NextResponse.json({ success: false, message: "Meeting not found" }, { status: 404 })
    }

    // For sub-admin, ensure they can only cancel meetings in their assigned units
    if (session.user.role === "sub-admin" && existingMeeting.unitNo) {
      const user = await User.findById(session.user.id).select("assignedUnits").lean()
      if (user && (user as any).assignedUnits && (user as any).assignedUnits.length > 0) {
        if (!(user as any).assignedUnits.includes(existingMeeting.unitNo)) {
          return NextResponse.json({ success: false, message: "You can only cancel meetings for your assigned units" }, { status: 403 })
        }
      }
    }

    const meeting = await Meeting.findByIdAndUpdate(
      meetingId,
      {
        status: "cancelled",
        cancelReason: cancelReason.trim(),
      },
      { new: true }
    )

    if (!meeting) {
      return NextResponse.json({ success: false, message: "Meeting not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "Meeting cancelled successfully",
      meeting,
    })
  } catch (error) {
    console.error("Meeting cancellation error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

