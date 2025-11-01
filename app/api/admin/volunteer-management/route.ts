import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import dbConnect from "@/lib/mongodb"
import User from "@/models/User"
import VolunteerProject from "@/models/VolunteerProject"
import VolunteerEvent from "@/models/VolunteerEvent"
import Event from "@/models/Event"
import NSSApplication from "@/models/NSSApplication"

export async function GET(request: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as any
    if (!session?.user?.id || (session.user.role !== "admin" && session.user.role !== "sub-admin")) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    await dbConnect()
    const { searchParams } = new URL(request.url)
    const volunteerId = searchParams.get("volunteerId")

    if (volunteerId) {
      // Get detailed info for a specific volunteer
      const volunteer = await User.findById(volunteerId).lean()
      if (!volunteer || (volunteer.role !== "volunteer" && volunteer.role !== "user")) {
        return NextResponse.json({ success: false, message: "Volunteer not found" }, { status: 404 })
      }

      const application = await NSSApplication.findOne({ userId: volunteerId }).lean()
      const projectAssignment = await VolunteerProject.findOne({
        volunteerId,
        status: "active",
      })
        .populate("projectId")
        .lean()

      const events = await VolunteerEvent.find({ volunteerId })
        .populate("eventId")
        .populate("projectId")
        .sort({ createdAt: -1 })
        .lean()

      const totalEvents = events.length
      const completedEvents = events.filter((e: any) => e.status === "completed").length
      const totalHours = events.reduce((sum: number, e: any) => sum + (e.hoursWorked || 0), 0)
      const attendanceRate = totalEvents > 0 ? (completedEvents / totalEvents) * 100 : 0

      return NextResponse.json({
        success: true,
        volunteer: {
          ...volunteer,
          application,
          project: projectAssignment?.projectId || null,
          stats: {
            totalEvents,
            completedEvents,
            totalHours,
            attendanceRate: Math.round(attendanceRate),
          },
          events: events.map((e: any) => ({
            _id: e._id,
            eventTitle: e.eventId?.title || "Unknown Event",
            projectTitle: e.projectId?.title || "Unknown Project",
            status: e.status,
            startTime: e.startTime,
            endTime: e.endTime,
            hoursWorked: e.hoursWorked || 0,
            workDescription: e.workDescription,
          })),
        },
      })
    }

    // Get all volunteers with approved applications only
    const approvedApplications = await NSSApplication.find({ status: "approved" })
      .select("userId")
      .lean()
    
    const approvedUserIds = approvedApplications.map((app) => app.userId)

    // Get only volunteers with approved applications
    const volunteers = await User.find({
      _id: { $in: approvedUserIds },
      role: { $in: ["volunteer", "user"] }
    }).lean()

    const volunteersWithStats = await Promise.all(
      volunteers.map(async (volunteer) => {
        const projectCount = await VolunteerProject.countDocuments({
          volunteerId: volunteer._id,
          status: "active",
        })
        const eventCount = await VolunteerEvent.countDocuments({ volunteerId: volunteer._id })
        const completedEvents = await VolunteerEvent.countDocuments({
          volunteerId: volunteer._id,
          status: "completed",
        })
        const totalHours = await VolunteerEvent.aggregate([
          { $match: { volunteerId: volunteer._id } },
          { $group: { _id: null, total: { $sum: "$hoursWorked" } } },
        ])

        const application = await NSSApplication.findOne({ userId: volunteer._id }).lean()

        return {
          _id: volunteer._id,
          name: volunteer.name,
          email: volunteer.email,
          application: application
            ? {
                formNo: application.formNo,
                institutionName: application.institutionName,
                status: application.status,
                nameEnglish: application.nameEnglish,
                mobileNo: application.mobileNo,
                enrollment: application.enrollment,
                departmentName: application.departmentName,
                courseName: application.courseName,
              }
            : null,
          stats: {
            projects: projectCount,
            events: eventCount,
            completedEvents,
            totalHours: totalHours[0]?.total || 0,
            attendanceRate:
              eventCount > 0 ? Math.round((completedEvents / eventCount) * 100) : 0,
          },
        }
      })
    )

    // Overall analytics
    const totalVolunteers = volunteers.length
    const totalActiveProjects = await VolunteerProject.countDocuments({ status: "active" })
    const totalEvents = await Event.countDocuments()
    const totalEventParticipations = await VolunteerEvent.countDocuments()
    const avgAttendanceRate =
      volunteersWithStats.length > 0
        ? Math.round(
            volunteersWithStats.reduce((sum, v) => sum + v.stats.attendanceRate, 0) /
              volunteersWithStats.length
          )
        : 0

    return NextResponse.json({
      success: true,
      volunteers: volunteersWithStats,
      analytics: {
        totalVolunteers,
        totalActiveProjects,
        totalEvents,
        totalEventParticipations,
        avgAttendanceRate,
      },
    })
  } catch (error) {
    console.error("Volunteer management error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

