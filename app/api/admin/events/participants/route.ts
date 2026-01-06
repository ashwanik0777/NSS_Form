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



