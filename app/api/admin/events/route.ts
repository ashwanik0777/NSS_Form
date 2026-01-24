import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import dbConnect from "@/lib/mongodb"
import Event from "@/models/Event"
import NSSProject from "@/models/NSSProject"
import VolunteerProject from "@/models/VolunteerProject"
import User from "@/models/User"
import NSSApplication from "@/models/NSSApplication"
import EventRegistration from "@/models/EventRegistration"
import VolunteerEvent from "@/models/VolunteerEvent"
import { sendEventNotificationEmail } from "@/lib/email"
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
      if (!hasPermission(userPermissions, "events.view" as PermissionKey) && 
          !hasPermission(userPermissions, "events.manage" as PermissionKey)) {
        return NextResponse.json({ success: false, message: "Permission denied" }, { status: 403 })
      }
    }

    await dbConnect()

    try {
       await NSSProject.init()
    } catch (e) {

    }

    const { searchParams } = new URL(request.url)
    const pageParam = Number.parseInt(searchParams.get("page") || "1")
    const limitParam = Number.parseInt(searchParams.get("limit") || "20")
    const page = Number.isNaN(pageParam) || pageParam < 1 ? 1 : pageParam
    const limit = Number.isNaN(limitParam) || limitParam < 1 ? 20 : limitParam
    const skip = (page - 1) * limit

    const events = await Event.find()
      .populate("projectId")
      .sort({ eventDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()

    const eventIds = events.map((event) => event._id)

    let registrationStats: any[] = []
    let attendanceStats: any[] = []

    if (eventIds.length > 0) {
      registrationStats = await EventRegistration.aggregate([
        { $match: { eventId: { $in: eventIds } } },
        {
          $group: {
            _id: "$eventId",
            total: { $sum: 1 },
            registered: {
              $sum: { $cond: [{ $eq: ["$registrationStatus", "registered"] }, 1, 0] },
            },
            pending: {
              $sum: { $cond: [{ $eq: ["$registrationStatus", "pending"] }, 1, 0] },
            },
            declined: {
              $sum: { $cond: [{ $eq: ["$registrationStatus", "declined"] }, 1, 0] },
            },
          },
        },
      ])

      attendanceStats = await VolunteerEvent.aggregate([
        { $match: { eventId: { $in: eventIds } } },
        {
          $group: {
            _id: "$eventId",
            total: { $sum: 1 },
            approved: {
              $sum: { $cond: [{ $eq: ["$reviewStatus", "approved"] }, 1, 0] },
            },
            pending: {
              $sum: { $cond: [{ $eq: ["$reviewStatus", "pending"] }, 1, 0] },
            },
            rejected: {
              $sum: { $cond: [{ $eq: ["$reviewStatus", "rejected"] }, 1, 0] },
            },
          },
        },
      ])
    }

    const registrationStatsMap = new Map(
      registrationStats.map((stat: any) => [stat._id.toString(), stat]),
    )
    const attendanceStatsMap = new Map(attendanceStats.map((stat: any) => [stat._id.toString(), stat]))

    const now = new Date()
    const updatedEvents = []

    // Auto-update event status based on timing
    for (const event of events) {
      let status = event.status
      
      // Only auto-update if not cancelled
      if (status !== "cancelled") {
        const eventStartTime = event.startTime ? new Date(event.startTime) : new Date(event.eventDate)
        const eventEndTime = event.endTime ? new Date(event.endTime) : new Date(event.eventDate)
        
        if (now < eventStartTime) {
          status = "upcoming"
        } else if (now >= eventStartTime && now < eventEndTime) {
          status = "ongoing"
        } else if (now >= eventEndTime) {
          status = "completed"
        }

        // Update in database if status changed
        if (status !== event.status) {
          await Event.findByIdAndUpdate(event._id, { status })
        }
      }

      const registrationStat = registrationStatsMap.get(event._id.toString()) || {
        total: 0,
        registered: 0,
        pending: 0,
        declined: 0,
      }
      const attendanceStat = attendanceStatsMap.get(event._id.toString()) || {
        total: 0,
        approved: 0,
        pending: 0,
        rejected: 0,
      }

      updatedEvents.push({
        _id: event._id,
        title: event.title,
        description: event.description,
        projectId: event.projectId?._id,
        projectName: event.projectId?.title,
        eventDate: event.eventDate,
        location: event.location,
        startTime: event.startTime,
        endTime: event.endTime,
        coordinator: event.coordinator,
        maxParticipants: event.maxParticipants,
        currentParticipants: event.currentParticipants,
        status: status,
        attendanceExtensionMinutes: event.attendanceExtensionMinutes,
        nssHours: event.nssHours,
        locationCoordinates: event.locationCoordinates,
        createdAt: event.createdAt,
        updatedAt: event.updatedAt,
        participantStats: {
          totalRegistrations: registrationStat.total || 0,
          registered: registrationStat.registered || 0,
          pending: registrationStat.pending || 0,
          declined: registrationStat.declined || 0,
          approvedAttendance: attendanceStat.approved || 0,
          pendingAttendance: attendanceStat.pending || 0,
          rejectedAttendance: attendanceStat.rejected || 0,
        },
      })
    }

    const totalEvents = await Event.countDocuments()

    return NextResponse.json({
      success: true,
      events: updatedEvents,
      pagination: {
        page,
        limit,
        total: totalEvents,
        pages: Math.max(1, Math.ceil(totalEvents / limit)),
      },
    })
  } catch (error) {
    console.error("Events fetch error:", error)
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
        return NextResponse.json({ success: false, message: "Permission denied. You need 'events.create' permission." }, { status: 403 })
      }
    }

    const body = await request.json()
    const { 
      title, 
      description, 
      projectId, 
      eventDate, 
      location, 
      locationCoordinates,
      startTime, 
      endTime, 
      coordinator, 
      maxParticipants, 
      attendanceExtensionMinutes, 
      nssHours 
    } = body

    if (!title || !description || !projectId || !eventDate) {
      return NextResponse.json(
        { success: false, message: "Title, description, project, and event date are required" },
        { status: 400 }
      )
    }

    await dbConnect()

    // Create event
    const event = new Event({
      title,
      description,
      projectId,
      eventDate: new Date(eventDate),
      location,
      locationCoordinates,
      startTime: startTime ? new Date(startTime) : undefined,
      endTime: endTime ? new Date(endTime) : undefined,
      coordinator,
      maxParticipants,
      status: "upcoming",
      currentParticipants: 0,
      attendanceExtensionMinutes: attendanceExtensionMinutes ? parseInt(attendanceExtensionMinutes) : 30,
      nssHours: nssHours ? parseFloat(nssHours) : undefined,
    })

    await event.save()

    // Get all volunteers assigned to this project
    const projectAssignments = await VolunteerProject.find({
      projectId: projectId,
      status: "active",
    }).lean()

    const volunteerIds = projectAssignments.map((pa) => pa.volunteerId)

    // Get volunteer details for email
    const volunteers = await User.find({
      _id: { $in: volunteerIds },
      role: { $in: ["volunteer", "user"] },
    }).lean()

    // Get applications for volunteer names
    const applications = await NSSApplication.find({
      userId: { $in: volunteerIds },
    }).lean()

    const applicationMap = new Map(applications.map((app: any) => [app.userId.toString(), app]))

    // Send email notifications to all volunteers
    const emailPromises = volunteers.map(async (volunteer: any) => {
      const application = applicationMap.get(volunteer._id.toString())
      const volunteerName = application?.nameEnglish || volunteer.name || "Volunteer"

      try {
        await sendEventNotificationEmail(volunteer.email, {
          name: volunteerName,
          eventTitle: title,
          eventDescription: description,
          eventDate: eventDate,
          startTime: startTime,
          endTime: endTime,
          location: location || "TBA",
          coordinator: coordinator || "N/A",
        })
      } catch (error) {
        console.error(`Failed to send email to ${volunteer.email}:`, error)
      }
    })

    await Promise.allSettled(emailPromises)

    return NextResponse.json({
      success: true,
      message: "Event created successfully and notifications sent to volunteers",
      event: {
        _id: event._id,
        title: event.title,
        description: event.description,
        projectId: event.projectId,
        eventDate: event.eventDate,
        location: event.location,
        startTime: event.startTime,
        endTime: event.endTime,
        coordinator: event.coordinator,
        maxParticipants: event.maxParticipants,
        status: event.status,
      },
    })
  } catch (error) {
    console.error("Event creation error:", error)
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
        return NextResponse.json({ success: false, message: "Permission denied. You need 'events.edit' permission." }, { status: 403 })
      }
    }

    const body = await request.json()
    const { eventId, ...updateData } = body

    if (!eventId) {
      return NextResponse.json({ success: false, message: "Event ID required" }, { status: 400 })
    }

    await dbConnect()

    // Convert date strings to Date objects if present
    if (updateData.eventDate) updateData.eventDate = new Date(updateData.eventDate)
    if (updateData.startTime) updateData.startTime = new Date(updateData.startTime)
    if (updateData.endTime) updateData.endTime = new Date(updateData.endTime)
    
    // Convert nssHours to number if present
    if (updateData.nssHours !== undefined) {
      updateData.nssHours = updateData.nssHours ? parseFloat(updateData.nssHours) : undefined
    }

    // Convert attendanceExtensionMinutes to number if present
    if (updateData.attendanceExtensionMinutes !== undefined) {
      updateData.attendanceExtensionMinutes = updateData.attendanceExtensionMinutes 
        ? parseInt(updateData.attendanceExtensionMinutes) 
        : 0;
    }

    const event = await Event.findByIdAndUpdate(eventId, updateData, { new: true })

    if (!event) {
      return NextResponse.json({ success: false, message: "Event not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "Event updated successfully",
      event,
    })
  } catch (error) {
    console.error("Event update error:", error)
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
        return NextResponse.json({ success: false, message: "Permission denied. You need 'events.delete' permission." }, { status: 403 })
      }
    }

    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get("id")

    if (!eventId) {
      return NextResponse.json({ success: false, message: "Event ID required" }, { status: 400 })
    }

    await dbConnect()

    const event = await Event.findByIdAndDelete(eventId)

    if (!event) {
      return NextResponse.json({ success: false, message: "Event not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "Event deleted successfully",
    })
  } catch (error) {
    console.error("Event deletion error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

