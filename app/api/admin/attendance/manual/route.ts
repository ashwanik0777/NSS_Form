import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import dbConnect from "@/lib/mongodb"
import VolunteerEvent from "@/models/VolunteerEvent"
import Event from "@/models/Event"
import User from "@/models/User"
import { hasPermission } from "@/lib/permissions"

export async function POST(request: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as any
    if (!session?.user?.id || (session.user.role !== "admin" && session.user.role !== "sub-admin")) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role === "sub-admin" && !hasPermission(session.user.permissions, "events.manage")) {
        return NextResponse.json({ success: false, message: "Permission denied" }, { status: 403 })
    }

    await dbConnect()
    const { volunteerId, eventId, hours, description } = await request.json()

    if (!volunteerId || !eventId || hours === undefined) {
      return NextResponse.json(
        { success: false, message: "Volunteer, Event, and Hours are required" },
        { status: 400 }
      )
    }

    const event = await Event.findById(eventId)
    if (!event) {
      return NextResponse.json({ success: false, message: "Event not found" }, { status: 404 })
    }

    const volunteer = await User.findById(volunteerId)
    if (!volunteer) {
        return NextResponse.json({ success: false, message: "Volunteer not found" }, { status: 404 })
    }

    // Check if attendance record already exists
    let attendance = await VolunteerEvent.findOne({
      volunteerId,
      eventId,
    })

    if (attendance) {
      // Update existing
      attendance.hoursWorked = Number(hours)
      attendance.pendingHours = 0 // Clear pending if manual override
      attendance.reviewStatus = "approved"
      attendance.status = "completed" // Mark as attended
      attendance.reviewedBy = session.user.id
      attendance.reviewedAt = new Date()
      if (description) attendance.workDescription = description
      
      await attendance.save()
      
      return NextResponse.json({
        success: true, 
        message: "Attendance updated successfully",
        attendance
      })
    } else {
      // Create new
      attendance = await VolunteerEvent.create({
        volunteerId,
        eventId,
        projectId: event.projectId, // Assuming Event has projectId
        hoursWorked: Number(hours),
        pendingHours: 0,
        status: "completed",
        reviewStatus: "approved",
        reviewedBy: session.user.id,
        reviewedAt: new Date(),
        workDescription: description || "Manual entry by admin",
        startTime: event.startTime || event.eventDate || new Date(),
        endTime: event.endTime || event.eventDate || new Date(),
      })

      return NextResponse.json({
        success: true,
        message: "Attendance created successfully",
        attendance
      })
    }

  } catch (error) {
    console.error("Manual attendance error:", error)
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    )
  }
}
