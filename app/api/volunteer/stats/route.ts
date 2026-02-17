import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import mongoose from "mongoose"
import { authOptions } from "@/lib/auth"
import dbConnect from "@/lib/mongodb"
import VolunteerEvent from "@/models/VolunteerEvent"
import Event from "@/models/Event"
import VolunteerProject from "@/models/VolunteerProject"
import Task from "@/models/Task"
import Meeting from "@/models/Meeting"
import VolunteerMeeting from "@/models/VolunteerMeeting"

export const dynamic = "force-dynamic"

export async function GET(_request: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as any
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    // Role check is not strictly needed as we query by ID
    
    await dbConnect()

    // Ensure models are registered (sometimes explicitly referencing them helps in edge cases)
    // We already import them, which triggers registration. 

    let volunteerObjectId: mongoose.Types.ObjectId
    try {
      volunteerObjectId = new mongoose.Types.ObjectId(session.user.id)
    } catch {
      return NextResponse.json({ success: false, message: "Invalid user id" }, { status: 400 })
    }

    // Get volunteer's project
    const projectAssignment = await VolunteerProject.findOne({
      volunteerId: volunteerObjectId,
      status: "active",
    }).lean()

    // Calculate event hours separately:
    // - eventHours: approved/actual hours only (shown in actual totals)
    // - pendingEventHours: pending approval hours (shown separately)
    const [approvedEventHoursAggregation, pendingEventHoursAggregation] = await Promise.all([
      VolunteerEvent.aggregate([
        {
          $match: {
            volunteerId: volunteerObjectId,
            $or: [{ reviewStatus: "approved" }, { reviewStatus: { $exists: false } }],
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: { $toDouble: { $ifNull: ["$hoursWorked", 0] } } },
          },
        },
      ]),
      VolunteerEvent.aggregate([
        {
          $match: {
            volunteerId: volunteerObjectId,
            reviewStatus: "pending",
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: { $toDouble: { $ifNull: ["$pendingHours", 0] } } },
          },
        },
      ]),
    ])

    const eventHours = approvedEventHoursAggregation[0]?.total || 0
    const pendingEventHours = pendingEventHoursAggregation[0]?.total || 0

    // Calculate meeting hours
    const meetingHoursAggregation = await VolunteerMeeting.aggregate([
      { $match: { volunteerId: volunteerObjectId } },
      {
        $group: {
          _id: null,
          total: { $sum: { $toDouble: { $ifNull: ["$hoursGranted", 0] } } }
        }
      }
    ])

    const meetingHours = meetingHoursAggregation[0]?.total || 0

    // Calculate task hours
    const taskHoursAggregation = await Task.aggregate([
      { $match: { assignedTo: volunteerObjectId, status: "completed" } },
      {
        $group: {
          _id: null,
          total: { $sum: { $toDouble: { $ifNull: ["$hoursGranted", 0] } } }
        }
      }
    ])
    
    const taskHours = taskHoursAggregation[0]?.total || 0

    // Calculate Grand Total
    const totalHours = eventHours + meetingHours + taskHours

    // Get upcoming events and event stats
    let upcomingEvents: any[] = []
    let eventsSummary = {
      totalEvents: 0,
      upcomingOrOngoing: 0,
      attended: 0,
      notAttended: 0,
      registered: 0,
    }

    if (projectAssignment) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const [upcomingList, totalEventsCount, upcomingOrOngoingCount, attendedCount, notAttendedCount, registeredCount] =
        await Promise.all([
          Event.find({
            projectId: projectAssignment.projectId,
            eventDate: { $gte: today },
            status: { $in: ["upcoming", "ongoing"] },
          })
            .sort({ eventDate: 1 })
            .limit(5)
            .lean(),
          Event.countDocuments({ projectId: projectAssignment.projectId }),
          Event.countDocuments({
            projectId: projectAssignment.projectId,
            status: { $in: ["upcoming", "ongoing"] },
          }),
          VolunteerEvent.countDocuments({
            volunteerId: volunteerObjectId,
            $or: [{ reviewStatus: "approved" }, { reviewStatus: { $exists: false }, hoursWorked: { $gt: 0 } }],
          }),
          VolunteerEvent.countDocuments({
            volunteerId: volunteerObjectId,
            $or: [{ status: "absent" }, { reviewStatus: "rejected" }],
          }),
          VolunteerEvent.countDocuments({ volunteerId: volunteerObjectId }),
        ])

      upcomingEvents = upcomingList
      eventsSummary = {
        totalEvents: totalEventsCount,
        upcomingOrOngoing: upcomingOrOngoingCount,
        attended: attendedCount,
        notAttended: notAttendedCount,
        registered: registeredCount,
      }
    }

    // Task stats summary
    const taskPipeline = [
      { $match: { assignedTo: volunteerObjectId } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]
    const taskAggregation = await Task.aggregate(taskPipeline)

    const tasksSummary = {
      total: taskAggregation.reduce((acc: number, cur: any) => acc + cur.count, 0),
      pending: taskAggregation.find((i: any) => i._id === "pending")?.count || 0,
      inProgress: taskAggregation.find((i: any) => i._id === "in-progress")?.count || 0,
      completed: taskAggregation.find((i: any) => i._id === "completed")?.count || 0,
      cancelled: taskAggregation.find((i: any) => i._id === "cancelled")?.count || 0,
    }

    // Meetings stats summary
    let meetingsSummary = { total: 0, upcomingOrOngoing: 0, attended: 0, notAttended: 0, registered: 0 }
    const [meetingTotals, meetingUpcoming, meetingAttended, meetingAbsent, meetingRegistered] = await Promise.all([
      Meeting.countDocuments(projectAssignment ? { projectId: projectAssignment.projectId } : {}),
      Meeting.countDocuments(
        projectAssignment
          ? { projectId: projectAssignment.projectId, status: { $in: ["upcoming", "ongoing"] } }
          : { status: { $in: ["upcoming", "ongoing"] } },
      ),
      VolunteerMeeting.countDocuments({ volunteerId: volunteerObjectId, status: "attended" }),
      VolunteerMeeting.countDocuments({ volunteerId: volunteerObjectId, status: "absent" }),
      VolunteerMeeting.countDocuments({ volunteerId: volunteerObjectId }),
    ])
    meetingsSummary = {
      total: meetingTotals,
      upcomingOrOngoing: meetingUpcoming,
      attended: meetingAttended,
      notAttended: meetingAbsent,
      registered: meetingRegistered,
    }

    const roundedHours = Math.round(totalHours * 10) / 10
    const roundedEventHours = Math.round(eventHours * 10) / 10
    const roundedMeetingHours = Math.round(meetingHours * 10) / 10
    const roundedTaskHours = Math.round(taskHours * 10) / 10
    const roundedPendingEventHours = Math.round(pendingEventHours * 10) / 10

    return NextResponse.json({
      success: true,
      totalHours: roundedHours,
      eventHours: roundedEventHours,
      pendingEventHours: roundedPendingEventHours,
      meetingHours: roundedMeetingHours,
      taskHours: roundedTaskHours,
      hoursWorked: roundedHours,
      tasks: tasksSummary,
      events: eventsSummary,
      meetings: meetingsSummary,
      upcomingEvents: upcomingEvents.map((e) => ({
        _id: e._id,
        title: e.title,
        description: e.description,
        eventDate: e.eventDate,
        startTime: e.startTime,
        endTime: e.endTime,
        location: e.location,
        status: e.status,
      })),
    })
  } catch (error: any) {
    console.error("Stats fetch error:", error)
    return NextResponse.json({ success: false, message: error.message || "Internal server error", details: error.toString() }, { status: 500 })
  }
}

