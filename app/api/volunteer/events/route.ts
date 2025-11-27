import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import dbConnect from "@/lib/mongodb"
import Event from "@/models/Event"
import VolunteerEvent from "@/models/VolunteerEvent"
import VolunteerProject from "@/models/VolunteerProject"
import EventRegistration from "@/models/EventRegistration"
import mongoose from "mongoose"

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

    const now = new Date()
    
    // Auto-update event status based on timing
    for (const event of events) {
      if (event.status !== "cancelled") {
        const eventStartTime = event.startTime ? new Date(event.startTime) : new Date(event.eventDate)
        const eventEndTime = event.endTime ? new Date(event.endTime) : new Date(event.eventDate)
        
        let newStatus = event.status
        if (now < eventStartTime) {
          newStatus = "upcoming"
        } else if (now >= eventStartTime && now < eventEndTime) {
          newStatus = "ongoing"
        } else if (now >= eventEndTime) {
          newStatus = "completed"
        }

        // Update in database if status changed
        if (newStatus !== event.status) {
          await Event.findByIdAndUpdate(event._id, { status: newStatus })
          event.status = newStatus
        }
      }
    }

    // Get volunteer's event participations
    const myEvents = await VolunteerEvent.find({ volunteerId: session.user.id })
      .populate("eventId")
      .populate("projectId")
      .sort({ createdAt: -1 })
      .lean()

    // Get registrations for all events
    const registrations = await EventRegistration.find({
      volunteerId: session.user.id,
      eventId: { $in: events.map((e: any) => e._id) },
    }).lean()

    const registrationMap = new Map(
      registrations.map((r: any) => [r.eventId.toString(), r])
    )

    return NextResponse.json({
      success: true,
      events: events.map((e) => {
        const registration = registrationMap.get(e._id.toString())
        return {
          _id: e._id,
          title: e.title,
          description: e.description,
          eventDate: e.eventDate,
          location: e.location,
          startTime: e.startTime,
          endTime: e.endTime,
          status: e.status,
          registrationStatus: registration?.registrationStatus || "pending",
          isDefaulter: registration?.isDefaulter || false,
        }
      }),
      myEvents: myEvents.map((e: any) => ({
        _id: e._id,
        eventId: e.eventId?._id,
        eventTitle: e.eventId?.title || "Unknown",
        projectTitle: e.projectId?.title || "Unknown",
        status: e.status,
        reviewStatus: e.reviewStatus || "pending",
        reviewNotes: e.reviewNotes,
        reviewedAt: e.reviewedAt,
        startTime: e.startTime,
        endTime: e.endTime,
        startPhoto: e.startPhoto,
        endPhoto: e.endPhoto,
        startLocation: e.startLocation,
        endLocation: e.endLocation,
        hoursWorked: e.hoursWorked || 0,
        pendingHours: e.pendingHours || 0,
        workDescription: e.workDescription,
      })),
    })
  } catch (error) {
    console.error("Events fetch error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

// Calculate distance between two coordinates using Haversine formula (in meters)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000 // Earth's radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
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

    // Compute global attendance window: 1 hour before start to 1 hour after end (+ optional extension)
    const eventStartTime = event.startTime ? new Date(event.startTime) : new Date(event.eventDate)
    const baseEventEnd = event.endTime
      ? new Date(event.endTime)
      : new Date(eventStartTime.getTime() + 3 * 60 * 60 * 1000) // fallback 3 hours after start
    const allowedFrom = new Date(eventStartTime.getTime() - 60 * 60 * 1000) // 1 hour before start
    const allowedUntilBase = new Date(baseEventEnd.getTime() + 60 * 60 * 1000) // 1 hour after end
    const allowedUntil = new Date(
      allowedUntilBase.getTime() + (event.attendanceExtensionMinutes || 0) * 60 * 1000,
    )

    if (action === "start") {
      if (!photo || !location) {
        return NextResponse.json(
          { success: false, message: "Photo and location required for event start" },
          { status: 400 }
        )
      }

      // Check if volunteer is registered for the event
      const registration = await EventRegistration.findOne({
        volunteerId: session.user.id,
        eventId,
      })

      if (!registration || registration.registrationStatus !== "registered") {
        return NextResponse.json(
          { success: false, message: "You must register for this event before marking attendance" },
          { status: 400 }
        )
      }

      // Check global attendance time window
      const now = new Date()
      if (now < allowedFrom || now > allowedUntil) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Attendance window is closed. You can mark attendance only from 1 hour before event start until 1 hour after event end. Please contact admin if you need an extension.",
            allowedFrom,
            allowedUntil,
          },
          { status: 400 }
        )
      }

      // Check location if event has coordinates
      if (event.locationCoordinates && event.locationCoordinates.latitude && event.locationCoordinates.longitude) {
        const distance = calculateDistance(
          event.locationCoordinates.latitude,
          event.locationCoordinates.longitude,
          location.latitude,
          location.longitude
        )

        if (distance > 50) {
          // More than 50 meters away
          return NextResponse.json(
            {
              success: false,
              message: "You are not at the event location. Please be within 50 meters of the event location to start.",
              distance: Math.round(distance),
            },
            { status: 400 }
          )
        }
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
      volunteerEvent.reviewStatus = "pending"
      volunteerEvent.reviewNotes = undefined
      volunteerEvent.reviewedBy = undefined as any
      volunteerEvent.reviewedAt = undefined
      volunteerEvent.hoursWorked = 0
      volunteerEvent.pendingHours = 0
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

      // Check global attendance time window
      const nowEnd = new Date()
      if (nowEnd < allowedFrom || nowEnd > allowedUntil) {
        return NextResponse.json(
          {
            success: false,
            message:
              "End attendance window is closed. You can mark attendance only from 1 hour before event start until 1 hour after event end. Please contact admin if you need an extension.",
            allowedFrom,
            allowedUntil,
          },
          { status: 400 }
        )
      }

      // Check if volunteer is still at event location (for ending)
      let distance = 0
      if (event.locationCoordinates && event.locationCoordinates.latitude && event.locationCoordinates.longitude) {
        distance = calculateDistance(
          event.locationCoordinates.latitude,
          event.locationCoordinates.longitude,
          location.latitude,
          location.longitude
        )

        if (distance > 50) {
          // More than 50 meters away - they already left
          // Still allow ending but mark appropriately
          volunteerEvent.endPhoto = photo
          volunteerEvent.endLocation = {
            latitude: location.latitude,
            longitude: location.longitude,
            address: location.address,
          }
          volunteerEvent.endTime = new Date()
          volunteerEvent.status = "completed"

          // Calculate hours worked based on actual time attended
          if (volunteerEvent.startTime && volunteerEvent.endTime) {
            const hours =
              (new Date(volunteerEvent.endTime).getTime() - new Date(volunteerEvent.startTime).getTime()) /
              (1000 * 60 * 60)
            volunteerEvent.hoursWorked = Math.max(0, Math.round(hours * 10) / 10) // Ensure non-negative
          }

          if (workDescription) {
            volunteerEvent.workDescription = workDescription
          }

          await volunteerEvent.save()

          return NextResponse.json({
            success: true,
            message: "You have already left the event. Event participation recorded based on your attendance time.",
            volunteerEvent,
            leftEarly: true,
            distance: Math.round(distance),
          })
        }
      }

      // Volunteer is still at location - normal end
      volunteerEvent.endPhoto = photo
      volunteerEvent.endLocation = {
        latitude: location.latitude,
        longitude: location.longitude,
        address: location.address,
      }
      volunteerEvent.endTime = new Date()
      volunteerEvent.status = "completed"

      const eventEndTime = baseEventEnd

      // Only calculate hours if both start and end were within the global window
      let calculatedHours = 0
      if (
        volunteerEvent.startTime &&
        volunteerEvent.endTime &&
        new Date(volunteerEvent.startTime) >= allowedFrom &&
        new Date(volunteerEvent.endTime) <= allowedUntil
      ) {
        const actualHours =
          (new Date(volunteerEvent.endTime).getTime() - new Date(volunteerEvent.startTime).getTime()) /
          (1000 * 60 * 60)

        // Calculate max hours from event duration
        let maxHours = actualHours
        if (event.startTime && event.endTime) {
          maxHours =
            (new Date(event.endTime).getTime() - new Date(event.startTime).getTime()) / (1000 * 60 * 60)
        }

        // Hours worked is minimum of actual attendance and max event duration
        calculatedHours = Math.min(Math.max(0, Math.round(actualHours * 10) / 10), maxHours)
      } else {
        // Late attendance - no hours added unless admin decides otherwise
        calculatedHours = 0
      }

      volunteerEvent.pendingHours = calculatedHours
      volunteerEvent.hoursWorked = 0
      volunteerEvent.reviewStatus = "pending"
      volunteerEvent.reviewNotes = undefined
      volunteerEvent.reviewedBy = undefined as any
      volunteerEvent.reviewedAt = undefined

      if (workDescription) {
        volunteerEvent.workDescription = workDescription
      }

      await volunteerEvent.save()

      return NextResponse.json({
        success: true,
        message:
          calculatedHours > 0
            ? "Attendance submitted successfully and is now pending admin review."
            : "Attendance submitted (outside ideal time). Admin will review and decide on working hours.",
        volunteerEvent,
        hoursEligible: calculatedHours > 0,
        pendingHours: volunteerEvent.pendingHours,
      })
    } else {
      return NextResponse.json({ success: false, message: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    console.error("Event participation error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

