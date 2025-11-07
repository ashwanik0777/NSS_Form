import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import dbConnect from "@/lib/mongodb"
import Event from "@/models/Event"
import EventRegistration from "@/models/EventRegistration"
import VolunteerEvent from "@/models/VolunteerEvent"
import VolunteerProject from "@/models/VolunteerProject"
import Defaulter from "@/models/Defaulter"
import User from "@/models/User"
import NSSApplication from "@/models/NSSApplication"
import { sendDefaulterEmail } from "@/lib/email"

export async function POST(request: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as any
    if (!session?.user?.id || (session.user.role !== "admin" && session.user.role !== "sub-admin")) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { eventId } = body

    if (!eventId) {
      return NextResponse.json({ success: false, message: "Event ID is required" }, { status: 400 })
    }

    await dbConnect()

    const event = await Event.findById(eventId)
    if (!event) {
      return NextResponse.json({ success: false, message: "Event not found" }, { status: 404 })
    }

    // Get all volunteers who should have registered/attended
    const allVolunteers = await User.find({
      $or: [{ role: "volunteer" }, { role: "user" }],
      status: "accepted",
    }).lean()

    const defaulters: Array<{
      volunteerId: string
      reason: string
      name: string
      email: string
    }> = []

    for (const volunteer of allVolunteers) {
      // Check if volunteer has active project for this event
      const projectAssignment = await VolunteerProject.findOne({
        volunteerId: volunteer._id,
        status: "active",
      }).lean()

      if (!projectAssignment || projectAssignment.projectId.toString() !== event.projectId.toString()) {
        continue // Skip if not in this project
      }

      const registration = await EventRegistration.findOne({
        volunteerId: volunteer._id,
        eventId,
      }).lean()

      const volunteerEvent = await VolunteerEvent.findOne({
        volunteerId: volunteer._id,
        eventId,
      }).lean()

      let isDefaulter = false
      let defaulterReason: string | null = null

      // Check if not registered and no reason provided
      if (!registration || registration.registrationStatus === "pending") {
        isDefaulter = true
        defaulterReason = "not_registered"
      }
      // Check if registered but didn't attend (no start attendance)
      else if (registration.registrationStatus === "registered" && !volunteerEvent) {
        isDefaulter = true
        defaulterReason = "not_attended"
      }
      // Check if started but no start attendance within time window
      else if (volunteerEvent && !volunteerEvent.startTime) {
        isDefaulter = true
        defaulterReason = "no_start_attendance"
      }
      // Check if started but no end attendance within time window
      else if (
        volunteerEvent &&
        volunteerEvent.startTime &&
        (!volunteerEvent.endTime || volunteerEvent.status !== "completed")
      ) {
        const eventEndTime = event.endTime ? new Date(event.endTime) : new Date(event.eventDate)
        const extensionMinutes = (event.attendanceExtensionMinutes || 0) + 30
        const deadlineTime = new Date(eventEndTime.getTime() + extensionMinutes * 60 * 1000)

        if (new Date() > deadlineTime) {
          isDefaulter = true
          defaulterReason = "no_end_attendance"
        }
      }

      if (isDefaulter && defaulterReason) {
        // Update or create registration record
        if (registration) {
          registration.isDefaulter = true
          registration.defaulterReason = defaulterReason as any
          await EventRegistration.findByIdAndUpdate(registration._id, {
            isDefaulter: true,
            defaulterReason: defaulterReason,
          })
        } else {
          await EventRegistration.create({
            volunteerId: volunteer._id,
            eventId,
            registrationStatus: "pending",
            isDefaulter: true,
            defaulterReason: defaulterReason,
          })
        }

        // Get volunteer details
        const application = await NSSApplication.findOne({ userId: volunteer._id }).lean()
        const volunteerName = application?.nameEnglish || volunteer.name || "Volunteer"

        defaulters.push({
          volunteerId: volunteer._id.toString(),
          reason: defaulterReason,
          name: volunteerName,
          email: volunteer.email,
        })
      }
    }

    // Process defaulters and send emails
    const processedDefaulters = []
    for (const defaulter of defaulters) {
      // Get or create defaulter record
      let defaulterRecord = await Defaulter.findOne({ volunteerId: defaulter.volunteerId })

      if (!defaulterRecord) {
        defaulterRecord = new Defaulter({
          volunteerId: defaulter.volunteerId,
          defaulterCount: 0,
        })
      }

      // Only increment if not already marked as defaulter for this event
      const existingRegistration = await EventRegistration.findOne({
        volunteerId: defaulter.volunteerId,
        eventId,
        isDefaulter: true,
      })

      if (!existingRegistration || !existingRegistration.isDefaulter) {
        defaulterRecord.defaulterCount += 1
        defaulterRecord.lastDefaulterDate = new Date()

        // If 3rd time, mark as removed
        if (defaulterRecord.defaulterCount >= 3) {
          defaulterRecord.isRemoved = true
          defaulterRecord.removalDate = new Date()
        }

        await defaulterRecord.save()

        // Send email
        try {
          await sendDefaulterEmail(defaulter.email, {
            name: defaulter.name,
            eventTitle: event.title,
            eventDate: event.eventDate.toString(),
            defaulterCount: defaulterRecord.defaulterCount,
            reason: defaulter.reason,
          })
        } catch (emailError) {
          console.error(`Error sending defaulter email to ${defaulter.email}:`, emailError)
        }

        processedDefaulters.push({
          ...defaulter,
          defaulterCount: defaulterRecord.defaulterCount,
          isRemoved: defaulterRecord.isRemoved,
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${processedDefaulters.length} defaulters`,
      defaulters: processedDefaulters,
    })
  } catch (error) {
    console.error("Error processing defaulters:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

