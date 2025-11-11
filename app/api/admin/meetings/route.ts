import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import dbConnect from "@/lib/mongodb"
import Meeting from "@/models/Meeting"
import User from "@/models/User"
import { hasPermission, PermissionKey } from "@/lib/permissions"

export async function GET(_request: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as any
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

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

    await dbConnect()

    // Get sub-admin's assigned units
    let userAssignedUnits: string[] | null = null
    if (session.user.role === "sub-admin") {
      const user = await User.findById(session.user.id).select("assignedUnits").lean()
      if (user && (user as any).assignedUnits && (user as any).assignedUnits.length > 0) {
        userAssignedUnits = (user as any).assignedUnits
      }
    }

    let query: any = {}

    // Unit-based filtering for sub-admins
    if (userAssignedUnits && userAssignedUnits.length > 0) {
      query.unitNo = { $in: userAssignedUnits }
    }

    const meetings = await Meeting.find(query)
      .populate("projectId")
      .sort({ meetingDate: -1, createdAt: -1 })
      .lean()

    const now = new Date()
    const updatedMeetings = []

    // Auto-update meeting status based on timing
    for (const meeting of meetings) {
      let status = meeting.status

      // Only auto-update if not cancelled
      if (status !== "cancelled") {
        const meetingStartTime = meeting.startTime ? new Date(meeting.startTime) : new Date(meeting.meetingDate)
        const meetingEndTime = meeting.endTime ? new Date(meeting.endTime) : new Date(meeting.meetingDate)

        if (now < meetingStartTime) {
          status = "upcoming"
        } else if (now >= meetingStartTime && now < meetingEndTime) {
          status = "ongoing"
        } else if (now >= meetingEndTime) {
          status = "completed"
        }

        // Update in database if status changed
        if (status !== meeting.status) {
          await Meeting.findByIdAndUpdate(meeting._id, { status })
        }
      }

      updatedMeetings.push({
        _id: meeting._id,
        title: meeting.title,
        description: meeting.description,
        projectId: meeting.projectId?._id,
        projectName: meeting.projectId?.title,
        unitNo: meeting.unitNo,
        meetingDate: meeting.meetingDate,
        location: meeting.location,
        startTime: meeting.startTime,
        endTime: meeting.endTime,
        status: status,
        cancelReason: meeting.cancelReason,
        createdAt: meeting.createdAt,
        updatedAt: meeting.updatedAt,
      })
    }

    return NextResponse.json({
      success: true,
      meetings: updatedMeetings,
    })
  } catch (error) {
    console.error("Meetings fetch error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as any
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "admin" && session.user.role !== "sub-admin") {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 })
    }

    // Check permission for sub-admin - require events.create
    if (session.user.role === "sub-admin") {
      const userPermissions = session.user.permissions || []
      if (!hasPermission(userPermissions, "events.create" as PermissionKey)) {
        return NextResponse.json(
          { success: false, message: "Permission denied. You need 'events.create' permission." },
          { status: 403 }
        )
      }
    }

    const body = await request.json()
    const { title, description, projectId, unitNo, meetingDate, location, startTime, endTime } = body

    if (!title || !meetingDate) {
      return NextResponse.json({ success: false, message: "Title and meeting date are required" }, { status: 400 })
    }

    await dbConnect()

    // For sub-admin, ensure unitNo is in their assigned units
    if (session.user.role === "sub-admin" && unitNo) {
      const user = await User.findById(session.user.id).select("assignedUnits").lean()
      if (user && (user as any).assignedUnits && (user as any).assignedUnits.length > 0) {
        if (!(user as any).assignedUnits.includes(unitNo)) {
          return NextResponse.json({ success: false, message: "You can only create meetings for your assigned units" }, { status: 403 })
        }
      }
    }

    // Create meeting
    const meeting = new Meeting({
      title,
      description,
      projectId: projectId || undefined,
      unitNo: unitNo || undefined,
      meetingDate: new Date(meetingDate),
      location,
      startTime: startTime ? new Date(startTime) : undefined,
      endTime: endTime ? new Date(endTime) : undefined,
      status: "upcoming",
    })

    await meeting.save()

    return NextResponse.json({
      success: true,
      message: "Meeting created successfully",
      meeting: {
        _id: meeting._id,
        title: meeting.title,
        description: meeting.description,
        projectId: meeting.projectId,
        unitNo: meeting.unitNo,
        meetingDate: meeting.meetingDate,
        location: meeting.location,
        startTime: meeting.startTime,
        endTime: meeting.endTime,
        status: meeting.status,
      },
    })
  } catch (error) {
    console.error("Meeting creation error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

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
    const { meetingId, ...updateData } = body

    if (!meetingId) {
      return NextResponse.json({ success: false, message: "Meeting ID required" }, { status: 400 })
    }

    await dbConnect()

    // Check if meeting exists and sub-admin has access
    const existingMeeting = await Meeting.findById(meetingId).lean()
    if (!existingMeeting) {
      return NextResponse.json({ success: false, message: "Meeting not found" }, { status: 404 })
    }

    // For sub-admin, ensure they can only edit meetings in their assigned units
    if (session.user.role === "sub-admin" && existingMeeting.unitNo) {
      const user = await User.findById(session.user.id).select("assignedUnits").lean()
      if (user && (user as any).assignedUnits && (user as any).assignedUnits.length > 0) {
        if (!(user as any).assignedUnits.includes(existingMeeting.unitNo)) {
          return NextResponse.json({ success: false, message: "You can only edit meetings for your assigned units" }, { status: 403 })
        }
      }
    }

    // Convert date strings to Date objects if present
    if (updateData.meetingDate) updateData.meetingDate = new Date(updateData.meetingDate)
    if (updateData.startTime) updateData.startTime = new Date(updateData.startTime)
    if (updateData.endTime) updateData.endTime = new Date(updateData.endTime)

    const meeting = await Meeting.findByIdAndUpdate(meetingId, updateData, { new: true })

    if (!meeting) {
      return NextResponse.json({ success: false, message: "Meeting not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "Meeting updated successfully",
      meeting,
    })
  } catch (error) {
    console.error("Meeting update error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as any
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "admin" && session.user.role !== "sub-admin") {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 })
    }

    // Check permission for sub-admin - require events.delete
    if (session.user.role === "sub-admin") {
      const userPermissions = session.user.permissions || []
      if (!hasPermission(userPermissions, "events.delete" as PermissionKey)) {
        return NextResponse.json(
          { success: false, message: "Permission denied. You need 'events.delete' permission." },
          { status: 403 }
        )
      }
    }

    const { searchParams } = new URL(request.url)
    const meetingId = searchParams.get("id")

    if (!meetingId) {
      return NextResponse.json({ success: false, message: "Meeting ID required" }, { status: 400 })
    }

    await dbConnect()

    // Check if meeting exists and sub-admin has access
    const existingMeeting = await Meeting.findById(meetingId).lean()
    if (!existingMeeting) {
      return NextResponse.json({ success: false, message: "Meeting not found" }, { status: 404 })
    }

    // For sub-admin, ensure they can only delete meetings in their assigned units
    if (session.user.role === "sub-admin" && existingMeeting.unitNo) {
      const user = await User.findById(session.user.id).select("assignedUnits").lean()
      if (user && (user as any).assignedUnits && (user as any).assignedUnits.length > 0) {
        if (!(user as any).assignedUnits.includes(existingMeeting.unitNo)) {
          return NextResponse.json({ success: false, message: "You can only delete meetings for your assigned units" }, { status: 403 })
        }
      }
    }

    await Meeting.findByIdAndDelete(meetingId)

    return NextResponse.json({
      success: true,
      message: "Meeting deleted successfully",
    })
  } catch (error) {
    console.error("Meeting deletion error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

