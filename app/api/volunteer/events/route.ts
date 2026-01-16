import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import dbConnect from "@/lib/mongodb"
import Event from "@/models/Event"
import VolunteerEvent from "@/models/VolunteerEvent"
import VolunteerProject from "@/models/VolunteerProject"
import EventRegistration from "@/models/EventRegistration"

export async function GET(request: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as any
    if (!session?.user?.id) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })

    await dbConnect()

    // Get pagination parameters
    const { searchParams } = new URL(request.url)
    const pageParam = Number.parseInt(searchParams.get("page") || "1")
    const limitParam = Number.parseInt(searchParams.get("limit") || "10")
    const page = Number.isNaN(pageParam) || pageParam < 1 ? 1 : pageParam
    const limit = Number.isNaN(limitParam) || limitParam < 1 ? 10 : limitParam
    const skip = (page - 1) * limit

    // Get ALL events (not just project-specific)
    const totalEvents = await Event.countDocuments()
    const allEvents = await Event.find()
      .sort({ eventDate: -1 })
      .lean()

    const now = new Date()
    
    // Auto-update event status based on timing
    for (const event of allEvents) {
      if (event.status !== "cancelled") {
        const eventStartTime = (!Array.isArray(event) && event.startTime) ? new Date(event.startTime) : new Date(event.eventDate)
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

    // Apply pagination
    const events = allEvents.slice(skip, skip + limit)

    // Get volunteer's event participations
    const myEvents = await VolunteerEvent.find({ volunteerId: session.user.id })
      .populate("eventId")
      .populate("projectId")
      .sort({ createdAt: -1 })
      .lean()

    // Get registrations for all events
    const registrations = await EventRegistration.find({
      volunteerId: session.user.id,
      eventId: { $in: allEvents.map((e: any) => e._id) },
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
      pagination: {
        page,
        limit,
        total: totalEvents,
        pages: Math.max(1, Math.ceil(totalEvents / limit)),
      },
    })
  } catch (error: any) {
    console.error("Events fetch error:", error)
    return NextResponse.json({ 
      success: false, 
      message: error?.message || "Internal server error" 
    }, { status: 500 })
  }
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000 
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

    const event = await Event.findById(eventId).lean()
    if (!event) {
      return NextResponse.json({ success: false, message: "Event not found" }, { status: 404 })
    }

    const projectAssignment = await VolunteerProject.findOne({
      volunteerId: session.user.id,
      status: "active",
    }).lean()

    let volunteerEvent = await VolunteerEvent.findOne({
      volunteerId: session.user.id,
      eventId: eventId,
    })

    const eventStartTime = event.startTime ? new Date(event.startTime) : new Date(event.eventDate)
    const baseEventEnd = event.endTime
      ? new Date(event.endTime)
      : new Date(eventStartTime.getTime() + 3 * 60 * 60 * 1000) 
     
    const allowedFrom = new Date(eventStartTime.getTime() - 60 * 60 * 1000)
    const allowedUntilBase = new Date(baseEventEnd.getTime() + 2 * 60 * 60 * 1000) 
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

      const now = new Date()
      let startedEarly = false
      if (now < allowedFrom) {
        startedEarly = true
      } else if (now > allowedUntil) {
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
      if (
        !Array.isArray(event) &&
        event.locationCoordinates &&
        event.locationCoordinates.latitude &&
        event.locationCoordinates.longitude
      ) {
        const distance = calculateDistance(
          event.locationCoordinates.latitude,
          event.locationCoordinates.longitude,
          location.latitude,
          location.longitude
        )

        // Increased radius to 150 meters as requested
        if (distance > 150) {
          return NextResponse.json(
            {
              success: false,
              message: "You are not at the event location. Please be within 150 meters of the event location to mark attendance.",
              distance: Math.round(distance),
            },
            { status: 400 }
          )
        }
      }

      // Determine event-assigned hours
      let eventAssignedHours = 3 // default fallback
      if (typeof event.nssHours === "number") {
        eventAssignedHours = event.nssHours
      } else if (typeof (event.assignedHours ?? event.durationHours) === "number") {
        eventAssignedHours = (event.assignedHours ?? event.durationHours) as number
      } else if (!Array.isArray(event) && event.startTime && event.endTime) {
        const start = new Date(event.startTime).getTime()
        const end = new Date(event.endTime).getTime()
        if (!isNaN(start) && !isNaN(end) && end > start) {
          eventAssignedHours = (end - start) / (1000 * 60 * 60)
        }
      }
      const eventMaxHours = typeof event.maxHours === "number" ? event.maxHours : eventAssignedHours
      const assignedHoursRounded = Math.max(0, Math.round(eventAssignedHours * 10) / 10)
      const cappedHours = Math.max(0, Math.round(Math.min(assignedHoursRounded, eventMaxHours) * 10) / 10)

      // Use upsert to ensure attendance is persisted
      const updateDoc: any = {
        $set: {
          startPhoto: photo,
          endPhoto: photo, // Single photo serves as both start/end evidence for simplicity
          startLocation: {
            latitude: location.latitude,
            longitude: location.longitude,
            address: location.address,
          },
          endLocation: {
            latitude: location.latitude,
            longitude: location.longitude,
            address: location.address,
          },
          startTime: new Date(),
          endTime: new Date(), // Mark simultaneous end for single-checkin flow
          status: "completed", // Immediately mark as completed
          reviewStatus: "pending",
          reviewNotes: startedEarly ? "Marked attendance before allowed window (needs admin review)" : undefined,
          reviewedBy: undefined,
          reviewedAt: undefined,
          hoursWorked: 0,
          pendingHours: cappedHours, // Assign hours immediately pending review
        },
        $setOnInsert: {
          volunteerId: session.user.id,
          eventId: eventId,
          projectId: event.projectId || (projectAssignment?.projectId),
          createdAt: new Date(),
        },
      }

      const opts = { upsert: true, new: true, setDefaultsOnInsert: true }
      volunteerEvent = await VolunteerEvent.findOneAndUpdate(
        { volunteerId: session.user.id, eventId: eventId },
        updateDoc,
        opts
      )

      // Ensure we have the freshest document
      if (!volunteerEvent) {
        // fallback: create and save explicitly
        const newEvent = new VolunteerEvent({
          volunteerId: session.user.id,
          eventId: eventId,
          projectId: event.projectId || (projectAssignment?.projectId),
          startPhoto: photo,
          endPhoto: photo,
          startLocation: {
            latitude: location.latitude,
            longitude: location.longitude,
            address: location.address,
          },
          endLocation: {
            latitude: location.latitude,
            longitude: location.longitude,
            address: location.address,
          },
          startTime: new Date(),
          endTime: new Date(),
          status: "completed",
          reviewStatus: "pending",
          reviewNotes: startedEarly ? "Marked attendance before allowed window (needs admin review)" : undefined,
          hoursWorked: 0,
          pendingHours: cappedHours,
        })
        volunteerEvent = await newEvent.save()
      }

      // Convert to object to avoid circular reference issues in response
      const responseEvent = volunteerEvent.toObject ? volunteerEvent.toObject() : volunteerEvent

      return NextResponse.json({
        success: true,
        message: startedEarly ? "Attendance marked (outside allowed window) — admin will review." : "Attendance marked successfully",
        volunteerEvent: responseEvent,
        startedEarly,
        allowedFrom,
        allowedUntil,
      })
    } else if (action === "end") {
       // Deprecated/Disabled as per request, but keeping a fallback just in case
       // or simply return success if called by accident
       return NextResponse.json({ success: true, message: "Attendance already completed via single-step." })
    } else {
      if (!photo || !location) {
        return NextResponse.json(
          { success: false, message: "Photo and location required for event end" },
          { status: 400 }
        )
      }

      if (!volunteerEvent || volunteerEvent.status !== "started") {
        return NextResponse.json({ success: false, message: "Event not started" }, { status: 400 })
      }

      // Check global attendance time window - only block if too late
      const nowEnd = new Date()
      if (nowEnd > allowedUntil) {
        return NextResponse.json(
          {
            success: false,
            message:
              "End attendance window is closed. You can mark attendance until 1 hour after event end. Please contact admin if you need an extension.",
            allowedUntil,
          },
          { status: 400 }
        )
      }

      // Determine event-assigned hours with fallbacks and enforce cap
      let eventAssignedHours = 3 // default fallback
      if (typeof event.nssHours === "number") {
        eventAssignedHours = event.nssHours
      } else if (typeof (event.assignedHours ?? event.durationHours) === "number") {
        eventAssignedHours = (event.assignedHours ?? event.durationHours) as number
      } else if (!Array.isArray(event) && event.startTime && event.endTime) {
        const start = new Date(event.startTime).getTime()
        const end = new Date(event.endTime).getTime()
        if (!isNaN(start) && !isNaN(end) && end > start) {
          eventAssignedHours = (end - start) / (1000 * 60 * 60)
        }
      }
      // If event defines a hard maximum per volunteer, use it as cap (optional)
      const eventMaxHours = typeof event.maxHours === "number" ? event.maxHours : eventAssignedHours
      const assignedHoursRounded = Math.max(0, Math.round(eventAssignedHours * 10) / 10)
      const cappedHours = Math.max(0, Math.round(Math.min(assignedHoursRounded, eventMaxHours) * 10) / 10)

      // Check if volunteer is still at event location (for ending)
      let distance = 0
      if (
        !Array.isArray(event) &&
        event.locationCoordinates &&
        event.locationCoordinates.latitude &&
        event.locationCoordinates.longitude
      ) {
        distance = calculateDistance(
          event.locationCoordinates.latitude,
          event.locationCoordinates.longitude,
          location.latitude,
          location.longitude
        )

        if (distance > 50) {
          volunteerEvent.endPhoto = photo
          volunteerEvent.endLocation = {
            latitude: location.latitude,
            longitude: location.longitude,
            address: location.address,
          }
          volunteerEvent.endTime = new Date()
          volunteerEvent.status = "completed"
          volunteerEvent.pendingHours = cappedHours
          volunteerEvent.hoursWorked = 0
          volunteerEvent.reviewStatus = "pending"
          volunteerEvent.reviewNotes = "Left event location before end — admin to review"
          volunteerEvent.reviewedBy = undefined as any
          volunteerEvent.reviewedAt = undefined

          if (workDescription) {
            volunteerEvent.workDescription = workDescription
          }

          await volunteerEvent.save()

          const responseEvent = volunteerEvent.toObject ? volunteerEvent.toObject() : volunteerEvent

          return NextResponse.json({
            success: true,
            message: "You have already left the event. Attendance submitted for admin review.",
            volunteerEvent: responseEvent,
            leftEarly: true,
            distance: Math.round(distance),
            pendingHours: volunteerEvent.pendingHours,
          })
        }
      }

      volunteerEvent.endPhoto = photo
      volunteerEvent.endLocation = {
        latitude: location.latitude,
        longitude: location.longitude,
        address: location.address,
      }
      volunteerEvent.endTime = new Date()
      volunteerEvent.status = "completed"
      volunteerEvent.pendingHours = cappedHours
      volunteerEvent.hoursWorked = 0
      volunteerEvent.reviewStatus = "pending"
      volunteerEvent.reviewNotes = undefined
      volunteerEvent.reviewedBy = undefined as any
      volunteerEvent.reviewedAt = undefined

      if (workDescription) {
        volunteerEvent.workDescription = workDescription
      }

      await volunteerEvent.save()

      const responseEvent = volunteerEvent.toObject ? volunteerEvent.toObject() : volunteerEvent

      return NextResponse.json({
        success: true,
        message: "Attendance submitted and is pending admin review. Assigned hours recorded as pending.",
        volunteerEvent: responseEvent,
        hoursEligible: true,
        pendingHours: volunteerEvent.pendingHours,
      })
    } 
  } catch (error: any) {
    console.error("Event participation error:", error)
    return NextResponse.json({ 
      success: false, 
      message: error?.message || "Internal server error" 
    }, { status: 500 })
  }
}

