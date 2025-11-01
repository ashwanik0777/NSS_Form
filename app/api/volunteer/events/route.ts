import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import dbConnect from "@/lib/mongodb"
import Event from "@/models/Event"
import VolunteerEvent from "@/models/VolunteerEvent"
import VolunteerProject from "@/models/VolunteerProject"

export async function GET(request: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as any
    if (!session?.user?.id) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })

    await dbConnect()

    // Get volunteer's project
    const projectAssignment = await VolunteerProject.findOne({
      volunteerId: session.user.id,
      status: "active",
    }).lean()

    if (!projectAssignment) {
      return NextResponse.json({ success: true, events: [], myEvents: [] })
    }

    // Get events for the volunteer's project
    const events = await Event.find({ projectId: projectAssignment.projectId })
      .sort({ eventDate: -1 })
      .lean()

    // Get volunteer's event participations
    const myEvents = await VolunteerEvent.find({ volunteerId: session.user.id })
      .populate("eventId")
      .populate("projectId")
      .sort({ createdAt: -1 })
      .lean()

    return NextResponse.json({
      success: true,
      events: events.map((e) => ({
        _id: e._id,
        title: e.title,
        description: e.description,
        eventDate: e.eventDate,
        location: e.location,
        startTime: e.startTime,
        endTime: e.endTime,
        status: e.status,
      })),
      myEvents: myEvents.map((e: any) => ({
        _id: e._id,
        eventId: e.eventId?._id,
        eventTitle: e.eventId?.title || "Unknown",
        projectTitle: e.projectId?.title || "Unknown",
        status: e.status,
        startTime: e.startTime,
        endTime: e.endTime,
        startPhoto: e.startPhoto,
        endPhoto: e.endPhoto,
        hoursWorked: e.hoursWorked || 0,
        workDescription: e.workDescription,
      })),
    })
  } catch (error) {
    console.error("Events fetch error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as any
    if (!session?.user?.id) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })

    const body = await request.json()
    const { eventId, action, photo, location, workDescription } = body

    if (!eventId || !action) {
      return NextResponse.json({ success: false, message: "Event ID and action required" }, { status: 400 })
    }

    await dbConnect()

    // Get volunteer's project
    const projectAssignment = await VolunteerProject.findOne({
      volunteerId: session.user.id,
      status: "active",
    }).lean()

    if (!projectAssignment) {
      return NextResponse.json({ success: false, message: "No active project assigned" }, { status: 400 })
    }

    // Verify event belongs to volunteer's project
    const event = await Event.findById(eventId).lean()
    if (!event || event.projectId.toString() !== projectAssignment.projectId.toString()) {
      return NextResponse.json({ success: false, message: "Event not found or unauthorized" }, { status: 404 })
    }

    let volunteerEvent = await VolunteerEvent.findOne({
      volunteerId: session.user.id,
      eventId: eventId,
    })

    if (action === "start") {
      if (!photo || !location) {
        return NextResponse.json(
          { success: false, message: "Photo and location required for event start" },
          { status: 400 }
        )
      }

      if (!volunteerEvent) {
        volunteerEvent = new VolunteerEvent({
          volunteerId: session.user.id,
          eventId: eventId,
          projectId: projectAssignment.projectId,
          status: "started",
        })
      }

      volunteerEvent.startPhoto = photo
      volunteerEvent.startLocation = {
        latitude: location.latitude,
        longitude: location.longitude,
        address: location.address,
      }
      volunteerEvent.startTime = new Date()
      volunteerEvent.status = "started"
      await volunteerEvent.save()

      return NextResponse.json({
        success: true,
        message: "Event started successfully",
        volunteerEvent,
      })
    } else if (action === "end") {
      if (!photo || !location) {
        return NextResponse.json(
          { success: false, message: "Photo and location required for event end" },
          { status: 400 }
        )
      }

      if (!volunteerEvent || volunteerEvent.status !== "started") {
        return NextResponse.json({ success: false, message: "Event not started" }, { status: 400 })
      }

      volunteerEvent.endPhoto = photo
      volunteerEvent.endLocation = {
        latitude: location.latitude,
        longitude: location.longitude,
        address: location.address,
      }
      volunteerEvent.endTime = new Date()
      volunteerEvent.status = "completed"

      // Calculate hours worked
      if (volunteerEvent.startTime && volunteerEvent.endTime) {
        const hours =
          (new Date(volunteerEvent.endTime).getTime() - new Date(volunteerEvent.startTime).getTime()) /
          (1000 * 60 * 60)
        volunteerEvent.hoursWorked = Math.round(hours * 10) / 10
      }

      if (workDescription) {
        volunteerEvent.workDescription = workDescription
      }

      await volunteerEvent.save()

      return NextResponse.json({
        success: true,
        message: "Event completed successfully",
        volunteerEvent,
      })
    } else {
      return NextResponse.json({ success: false, message: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    console.error("Event participation error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

