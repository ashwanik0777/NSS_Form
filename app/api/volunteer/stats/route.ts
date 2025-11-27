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

export async function GET(_request: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as any
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    await dbConnect()

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

    // Calculate total hours - sum both approved hoursWorked and pendingHours
    const hoursAggregation = await VolunteerEvent.aggregate([
      { $match: { volunteerId: volunteerObjectId } },
      {
        $project: {
          totalHours: {
            $add: [
              { $ifNull: ["$hoursWorked", 0] },
              { $ifNull: ["$pendingHours", 0] }
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$totalHours" }
        }
      }
    ])

    const totalHours = hoursAggregation[0]?.total || 0

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

    return NextResponse.json({
      success: true,
      totalHours: roundedHours,
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
  } catch (error) {
    console.error("Stats fetch error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

