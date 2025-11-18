import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import dbConnect from "@/lib/mongodb"
import VolunteerEvent from "@/models/VolunteerEvent"
import { hasPermission, PermissionKey } from "@/lib/permissions"

function isAdminUser(session: any) {
  return session?.user?.role === "admin" || session?.user?.role === "sub-admin"
}

function ensureAccess(session: any) {
  if (session.user.role === "sub-admin") {
    const permissions: PermissionKey[] = session.user.permissions || []
    if (!hasPermission(permissions, "events.manage")) {
      throw new Error("Permission denied")
    }
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as any
    if (!session?.user?.id || !isAdminUser(session)) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    ensureAccess(session)
    await dbConnect()

    const { searchParams } = new URL(request.url)
    const reviewStatus = searchParams.get("reviewStatus") || "pending"
    const status = searchParams.get("status")
    const projectId = searchParams.get("projectId")
    const volunteerId = searchParams.get("volunteerId")
    const search = searchParams.get("search")?.toLowerCase()
    const page = Number.parseInt(searchParams.get("page") || "1", 10)
    const limit = Math.min(Number.parseInt(searchParams.get("limit") || "20", 10), 100)

    const query: Record<string, any> = {}
    if (reviewStatus && reviewStatus !== "all") {
      query.reviewStatus = reviewStatus
    }
    if (status && status !== "all") {
      query.status = status
    }
    if (projectId && projectId !== "all") {
      query.projectId = projectId
    }
    if (volunteerId) {
      query.volunteerId = volunteerId
    }

    const attendanceRecords = await VolunteerEvent.find(query)
      .populate("eventId", "title eventDate startTime endTime nssHours")
      .populate("projectId", "title")
      .populate("volunteerId", "name email")
      .sort({ createdAt: -1 })
      .lean()

    const filtered = search
      ? attendanceRecords.filter((record: any) => {
          const volunteerName = record.volunteerId?.name?.toLowerCase() || ""
          const volunteerEmail = record.volunteerId?.email?.toLowerCase() || ""
          const eventTitle = record.eventId?.title?.toLowerCase() || ""
          return (
            volunteerName.includes(search) ||
            volunteerEmail.includes(search) ||
            eventTitle.includes(search) ||
            record.reviewStatus?.toLowerCase().includes(search)
          )
        })
      : attendanceRecords

    const total = filtered.length
    const start = (page - 1) * limit
    const paginated = filtered.slice(start, start + limit)

    return NextResponse.json({
      success: true,
      attendances: paginated,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error: any) {
    if (error.message === "Permission denied") {
      return NextResponse.json({ success: false, message: error.message }, { status: 403 })
    }
    console.error("Attendance review GET error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as any
    if (!session?.user?.id || !isAdminUser(session)) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }
    ensureAccess(session)
    await dbConnect()

    const body = await request.json()
    const { attendanceId, action, hours, notes } = body

    if (!attendanceId || !action) {
      return NextResponse.json({ success: false, message: "attendanceId and action are required" }, { status: 400 })
    }

    const attendance = await VolunteerEvent.findById(attendanceId)
      .populate("eventId", "title eventDate startTime endTime nssHours")
      .populate("projectId", "title")
      .populate("volunteerId", "name email")

    if (!attendance) {
      return NextResponse.json({ success: false, message: "Attendance record not found" }, { status: 404 })
    }

    if (action === "approve") {
      const fallbackHours = attendance.pendingHours || attendance.eventId?.nssHours || 0
      const approvedHours =
        typeof hours === "number" && !Number.isNaN(hours) ? Math.max(0, Number(hours)) : fallbackHours

      attendance.hoursWorked = approvedHours
      attendance.pendingHours = 0
      attendance.reviewStatus = "approved"
      attendance.reviewNotes = notes || ""
      attendance.reviewedBy = session.user.id
      attendance.reviewedAt = new Date()
      await attendance.save()
    } else if (action === "reject") {
      if (!notes || !notes.trim()) {
        return NextResponse.json(
          { success: false, message: "Reason is required when rejecting attendance" },
          { status: 400 },
        )
      }
      attendance.hoursWorked = 0
      attendance.pendingHours = 0
      attendance.reviewStatus = "rejected"
      attendance.reviewNotes = notes.trim()
      attendance.reviewedBy = session.user.id
      attendance.reviewedAt = new Date()
      await attendance.save()
    } else {
      return NextResponse.json({ success: false, message: "Invalid action" }, { status: 400 })
    }

    const updatedAttendance = await VolunteerEvent.findById(attendance._id)
      .populate("eventId", "title eventDate startTime endTime nssHours")
      .populate("projectId", "title")
      .populate("volunteerId", "name email")
      .lean()

    return NextResponse.json({
      success: true,
      message: action === "approve" ? "Attendance approved successfully" : "Attendance rejected successfully",
      attendance: updatedAttendance,
    })
  } catch (error: any) {
    if (error.message === "Permission denied") {
      return NextResponse.json({ success: false, message: error.message }, { status: 403 })
    }
    console.error("Attendance review PATCH error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}


