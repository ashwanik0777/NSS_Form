import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import dbConnect from "@/lib/mongodb"
import Event from "@/models/Event"
import EventRegistration from "@/models/EventRegistration"
import VolunteerEvent from "@/models/VolunteerEvent"
import { hasPermission, PermissionKey } from "@/lib/permissions"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as any
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "admin" && session.user.role !== "sub-admin") {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 })
    }

    if (session.user.role === "sub-admin") {
      const userPermissions = session.user.permissions || []
      if (!hasPermission(userPermissions, "events.view" as PermissionKey)) {
        return NextResponse.json({ success: false, message: "Permission denied" }, { status: 403 })
      }
    }

    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get("eventId")

    if (!eventId) {
      return NextResponse.json({ success: false, message: "eventId is required" }, { status: 400 })
    }

    await dbConnect()

    const event = await Event.findById(eventId).lean()
    if (!event) {
      return NextResponse.json({ success: false, message: "Event not found" }, { status: 404 })
    }

    const registrations = await EventRegistration.find({ eventId })
      .populate("volunteerId", "name email")
      .lean()

    const attendanceRecords = await VolunteerEvent.find({ eventId })
      .populate("volunteerId", "name email")
      .lean()

    const participantsMap = new Map<string, any>()

    registrations.forEach((registration) => {
      const volunteer = registration.volunteerId as any
      const key = volunteer?._id?.toString() || registration.volunteerId.toString()
      participantsMap.set(key, {
        volunteerId: key,
        name: volunteer?.name || "Volunteer",
        email: volunteer?.email || "",
        registrationStatus: registration.registrationStatus,
        declineReason: registration.declineReason || "",
        attendanceStatus: "not-marked",
        attendanceReviewStatus: "not-submitted",
        hoursWorked: 0,
        pendingHours: 0,
        reviewNotes: "",
        reviewedAt: null,
        photo: null,
        startPhoto: null,
        endPhoto: null,
        location: null,
        startTime: null,
        endTime: null,
        workDescription: "",
      })
    })

    attendanceRecords.forEach((record) => {
      const volunteer = record.volunteerId as any
      const key = volunteer?._id?.toString() || record.volunteerId.toString()
      const existing = participantsMap.get(key) || {
        volunteerId: key,
        name: volunteer?.name || "Volunteer",
        email: volunteer?.email || "",
        registrationStatus: "not-registered",
        declineReason: "",
        attendanceStatus: "not-marked",
        attendanceReviewStatus: "not-submitted",
        hoursWorked: 0,
        pendingHours: 0,
        reviewNotes: "",
        reviewedAt: null,
        photo: null,
        startPhoto: null,
        endPhoto: null,
        location: null,
        startTime: null,
        endTime: null,
        workDescription: "",
      }

      existing.attendanceId = record._id?.toString()
      existing.attendanceStatus = record.status
      existing.attendanceReviewStatus = record.reviewStatus
      existing.hoursWorked = record.hoursWorked || 0
      existing.pendingHours = record.pendingHours || 0
      existing.reviewNotes = record.reviewNotes || ""
      existing.reviewedAt = record.reviewedAt || null
      existing.photo = record.endPhoto || record.startPhoto || null
      existing.startPhoto = record.startPhoto || null
      existing.endPhoto = record.endPhoto || null
      existing.location = record.endLocation || record.startLocation || null
      existing.startTime = record.startTime || null
      existing.endTime = record.endTime || null
      existing.workDescription = record.workDescription || ""

      participantsMap.set(key, existing)
    })

    const participants = Array.from(participantsMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    )

    const summary = {
      registered: registrations.filter((r) => r.registrationStatus === "registered").length,
      pending: registrations.filter((r) => r.registrationStatus === "pending").length,
      declined: registrations.filter((r) => r.registrationStatus === "declined").length,
      approvedAttendance: attendanceRecords.filter((r) => r.reviewStatus === "approved").length,
      pendingAttendance: attendanceRecords.filter((r) => r.reviewStatus === "pending").length,
      rejectedAttendance: attendanceRecords.filter((r) => r.reviewStatus === "rejected").length,
    }

    return NextResponse.json({
      success: true,
      event: {
        _id: event._id,
        title: event.title,
        status: event.status,
        eventDate: event.eventDate,
        nssHours: event.nssHours || 0,
      },
      summary,
      participants,
    })
  } catch (error) {
    console.error("Event participants fetch error:", error)
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
  
    // Check permission for sub-admin - require attendance.verify
    if (session.user.role === "sub-admin") {
      const userPermissions = session.user.permissions || []
      if (!hasPermission(userPermissions, "attendance.verify" as PermissionKey)) {
        return NextResponse.json({ success: false, message: "Permission denied. You need 'attendance.verify' permission." }, { status: 403 })
      }
    }

    const body = await request.json()
    const { eventId, action, volunteerIds, volunteerId, reviewStatus, hoursWorked, reviewNotes } = body

    if (!eventId) {
      return NextResponse.json({ success: false, message: "eventId is required" }, { status: 400 })
    }

    await dbConnect()

    const event = await Event.findById(eventId)
    if (!event) {
      return NextResponse.json({ success: false, message: "Event not found" }, { status: 404 })
    }
    
    // Default hours from event
    const allowedHours = event.nssHours || 0

    // Mode A: Edit individual volunteer attendance
    if (action === "edit" || action === "update-single") {
      if (!volunteerId) {
        return NextResponse.json({ success: false, message: "volunteerId is required for editing" }, { status: 400 })
      }

      if (reviewStatus === "not-submitted") {
        // Delete volunteer event record if reverting to not submitted
        await VolunteerEvent.deleteOne({ eventId, volunteerId })
        return NextResponse.json({
          success: true,
          message: "Attendance reverted to Not Submitted",
        })
      }

      const parsedHours = typeof hoursWorked === "number" ? hoursWorked : parseFloat(hoursWorked || "0") || 0
      const newStatus = reviewStatus === "approved" ? "completed" : reviewStatus === "rejected" ? "absent" : "registered"

      const updated = await VolunteerEvent.findOneAndUpdate(
        { eventId, volunteerId },
        {
          $set: {
            projectId: event.projectId,
            reviewStatus: reviewStatus || "approved",
            status: newStatus,
            hoursWorked: reviewStatus === "approved" ? parsedHours : 0,
            pendingHours: reviewStatus === "pending" ? parsedHours : 0,
            reviewNotes: reviewNotes || "",
            reviewedAt: new Date(),
            reviewedBy: session.user.id,
          },
          $setOnInsert: {
            startTime: event.startTime || event.eventDate,
            endTime: event.endTime || event.eventDate,
            createdAt: new Date(),
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      )

      return NextResponse.json({
        success: true,
        message: "Attendance updated successfully",
        record: updated,
      })
    }

    // Mode B: Bulk approve or reject
    let filter: any = { eventId }
    
    // If specific volunteers are provided, filter by them
    if (volunteerIds && Array.isArray(volunteerIds) && volunteerIds.length > 0) {
      filter.volunteerId = { $in: volunteerIds }
    }
    
    if (action === 'approve') {
       if (!volunteerIds) {
          filter.reviewStatus = 'pending'
       }
    } else if (action === 'reject') {
       if (!volunteerIds) {
          filter.reviewStatus = 'pending'
       }
    }

    let update: any = {}
    if (action === 'approve') {
       update = { 
         reviewStatus: 'approved',
         status: 'completed',
         hoursWorked: allowedHours,
         pendingHours: 0,
         reviewedAt: new Date(),
         reviewedBy: session.user.id
       }
    } else if (action === 'reject') {
       update = {
         reviewStatus: 'rejected',
         status: 'absent',
         hoursWorked: 0,
         pendingHours: 0,
         reviewedAt: new Date(),
         reviewedBy: session.user.id
       }
    } else {
        return NextResponse.json({ success: false, message: "Invalid action" }, { status: 400 })
    }

    const result = await VolunteerEvent.updateMany(filter, update)

    return NextResponse.json({
      success: true,
      message: `Successfully updated attendance records.`,
      modifiedCount: result.modifiedCount
    })

  } catch (error) {
     console.error("Attendance update error:", error)
     return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
