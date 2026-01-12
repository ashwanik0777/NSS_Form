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
      }

      existing.attendanceStatus = record.status
      existing.attendanceReviewStatus = record.reviewStatus
      existing.hoursWorked = record.hoursWorked || 0
      existing.pendingHours = record.pendingHours || 0
      existing.reviewNotes = record.reviewNotes || ""
      existing.reviewedAt = record.reviewedAt || null

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
    const { eventId, action, volunteerIds } = body

    if (!eventId) {
      return NextResponse.json({ success: false, message: "eventId is required" }, { status: 400 })
    }

    await dbConnect()

    const event = await Event.findById(eventId)
    if (!event) {
      return NextResponse.json({ success: false, message: "Event not found" }, { status: 404 })
    }
    
    // Validate nssHours from event
    // The max hours a volunteer can get is limited to nssHours of the event
    const allowedHours = event.nssHours || 0;

    // Build filter query
    let filter: any = { eventId };
    
    // If specific volunteers are provided, filter by them
    if (volunteerIds && Array.isArray(volunteerIds) && volunteerIds.length > 0) {
      filter.volunteerId = { $in: volunteerIds };
    }
    
    // Only target records that match certain criteria based on action
    if (action === 'approve') {
       // Only approve pending records? Or can re-approve? 
       // Usually we approve 'pending' records.
       // User requirement: "all approval ka bhi option do"
       // Update: We should only update 'pending' or 'rejected' to 'approved' if re-evaluating.
       // Let's assume action 'approve-all' or 'approve-selected'
       // But simpler: Update status wherereviewStatus is pending
       
       if (!volunteerIds) {
          // Bulk approve all PENDING for this event
          filter.reviewStatus = 'pending';
       }
    } else if (action === 'reject') {
       if (!volunteerIds) {
          filter.reviewStatus = 'pending';
       }
    }

    // Determine updates based on action
    let update: any = {};
    if (action === 'approve') {
       update = { 
         reviewStatus: 'approved',
         status: 'attended', // Ensure status is attended
         hoursWorked: allowedHours, // STRICTLY LIMIT HOURS TO EVENT HOURS
         pendingHours: 0,
         reviewedAt: new Date(),
         reviewedBy: session.user.id
       };
    } else if (action === 'reject') {
       update = {
         reviewStatus: 'rejected',
         // status: 'absent', // Should we mark as absent? Keep what it was but rejected credit?
         hoursWorked: 0,
         pendingHours: 0,
         reviewedAt: new Date(),
         reviewedBy: session.user.id
       };
    } else {
        return NextResponse.json({ success: false, message: "Invalid action" }, { status: 400 })
    }

    const result = await VolunteerEvent.updateMany(filter, update);

    return NextResponse.json({
      success: true,
      message: `Successfully updated attendance records.`,
      modifiedCount: result.modifiedCount
    })

  } catch (error) {
     console.error("Bulk attendance update error:", error)
     return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
