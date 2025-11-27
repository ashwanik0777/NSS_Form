import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import dbConnect from "@/lib/mongodb"
import Event from "@/models/Event"
import EventRegistration from "@/models/EventRegistration"
import VolunteerProject from "@/models/VolunteerProject"
import User from "@/models/User"
import NSSApplication from "@/models/NSSApplication"
import VolunteerEvent from "@/models/VolunteerEvent"
import Notification from "@/models/Notification"
import {
  sendEventDayReminderEmail,
  sendAttendanceReminderEmail,
  sendEndAttendanceReminderEmail,
} from "@/lib/email"

// Send event day reminder at 12 AM
export async function POST(request: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as any
    if (!session?.user?.id || (session.user.role !== "admin" && session.user.role !== "sub-admin")) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { eventId, notificationType } = body // "day_reminder" | "1hour_before" | "30min_before_start" | "30min_before_end"

    if (!eventId || !notificationType) {
      return NextResponse.json({ success: false, message: "Event ID and notification type are required" }, { status: 400 })
    }

    await dbConnect()

    const event = await Event.findById(eventId).lean()
    if (!event) {
      return NextResponse.json({ success: false, message: "Event not found" }, { status: 404 })
    }

    // Get all registered volunteers for this event
    const registrations = await EventRegistration.find({
      eventId,
      registrationStatus: "registered",
    })
      .populate("volunteerId")
      .lean()

    const notifications = []
    const emails = []

    for (const registration of registrations) {
      const volunteer = registration.volunteerId as any
      if (!volunteer) continue

      const application = await NSSApplication.findOne({ userId: volunteer._id }).lean()
      const volunteerName = application?.nameEnglish || volunteer.name || "Volunteer"

      if (notificationType === "day_reminder") {
        // Send email + dashboard notification
        try {
          await sendEventDayReminderEmail(volunteer.email, {
            name: volunteerName,
            eventTitle: event.title,
            eventDate: event.eventDate.toString(),
            startTime: event.startTime?.toString() || event.eventDate.toString(),
            location: event.location,
          })
          emails.push(volunteer.email)
        } catch (error) {
          console.error(`Error sending email to ${volunteer.email}:`, error)
        }

        // Create dashboard notification
        await Notification.create({
          userId: volunteer._id,
          title: "Event Reminder",
          message: `The event "${event.title}" is scheduled for today at ${new Date(event.startTime || event.eventDate).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}. Please join on time at ${event.location || "the specified location"}, otherwise you will be added to the defaulter list.`,
          type: "event_reminder",
          link: "/dashboard/events",
        })
        notifications.push(volunteer._id.toString())
      } else if (notificationType === "1hour_before" || notificationType === "30min_before_start") {
        // Dashboard notification only (no email) before event start
        const timeText = notificationType === "1hour_before" ? "1 hour" : "30 minutes"
        await Notification.create({
          userId: volunteer._id,
          title: "Event Starting Soon",
          message: `The event "${event.title}" will start in ${timeText}. Please join on time and remember to mark your attendance. Attendance is allowed from 1 hour before start until 1 hour after end.`,
          type: "event_reminder",
          link: "/dashboard/events",
        })
        notifications.push(volunteer._id.toString())
      } else if (notificationType === "30min_before_start") {
        // 30 minutes before start: check if they have NOT marked start attendance yet
        const volunteerEvent = await VolunteerEvent.findOne({
          volunteerId: volunteer._id,
          eventId,
          startTime: { $exists: true },
        }).lean()

        if (!volunteerEvent) {
          // Send email + dashboard notification to those who didn't mark attendance
          try {
            await sendAttendanceReminderEmail(volunteer.email, {
              name: volunteerName,
              eventTitle: event.title,
              eventDate: event.eventDate.toString(),
              startTime: event.startTime?.toString() || event.eventDate.toString(),
            })
            emails.push(volunteer.email)
          } catch (error) {
            console.error(`Error sending email to ${volunteer.email}:`, error)
          }

          await Notification.create({
            userId: volunteer._id,
            title: "Mark Your Attendance",
            message: `The event "${event.title}" has started. Please mark your starting attendance immediately through your dashboard. If you fail to mark your attendance within 30 minutes, you will be added to the defaulter list.`,
            type: "attendance_reminder",
            link: "/dashboard/events",
          })
          notifications.push(volunteer._id.toString())
        }
      } else if (notificationType === "30min_before_end") {
        // 30 minutes before end: check if they have NOT marked end attendance yet
        const volunteerEvent = await VolunteerEvent.findOne({
          volunteerId: volunteer._id,
          eventId,
          endTime: { $exists: true },
          status: "completed",
        }).lean()

        if (!volunteerEvent) {
          // Send email + dashboard notification to those who didn't mark end attendance
          try {
            await sendEndAttendanceReminderEmail(volunteer.email, {
              name: volunteerName,
              eventTitle: event.title,
              eventDate: event.eventDate.toString(),
              endTime: event.endTime?.toString() || event.eventDate.toString(),
            })
            emails.push(volunteer.email)
          } catch (error) {
            console.error(`Error sending email to ${volunteer.email}:`, error)
          }

          await Notification.create({
            userId: volunteer._id,
            title: "Mark Your End Attendance",
            message: `The event "${event.title}" has ended. Please mark your end attendance immediately through your dashboard. If you fail to mark your end attendance within 30 minutes, your working hours will not be added to your record.`,
            type: "attendance_reminder",
            link: "/dashboard/events",
          })
          notifications.push(volunteer._id.toString())
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Sent ${notifications.length} notifications and ${emails.length} emails`,
      notificationsCount: notifications.length,
      emailsCount: emails.length,
    })
  } catch (error) {
    console.error("Error sending event notifications:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

