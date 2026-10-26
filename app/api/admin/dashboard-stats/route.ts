import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import dbConnect from "@/lib/mongodb"
import NSSApplication from "@/models/NSSApplication"
import Event from "@/models/Event"
import VolunteerEvent from "@/models/VolunteerEvent"
import User from "@/models/User"

export async function GET(request: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as any
    if (!session?.user?.id || (session.user.role !== "admin" && session.user.role !== "sub-admin")) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    await dbConnect()

    // Run all read-only queries in parallel for speed
    const [
      totalVolunteers,
      totalApplications,
      pendingApprovals,
      totalEvents,
      upcomingEvents,
      completedEvents,
      totalParticipations,
      recentUpcomingEvents,
      recentCompletedEvents,
      pendingAttendance,
    ] = await Promise.all([
      // Total approved volunteers
      NSSApplication.countDocuments({ status: "approved" }),
      // Total applications (all statuses except draft)
      NSSApplication.countDocuments({ status: { $ne: "draft" } }),
      // Pending approvals (submitted, not yet reviewed)
      NSSApplication.countDocuments({ status: "submitted" }),
      // Total events ever
      Event.countDocuments(),
      // Upcoming events
      Event.countDocuments({ status: "upcoming" }),
      // Completed events
      Event.countDocuments({ status: "completed" }),
      // Total event participations (volunteer-event records)
      VolunteerEvent.countDocuments(),
      // Next 5 upcoming events
      Event.find({ status: "upcoming" })
        .sort({ eventDate: 1 })
        .limit(5)
        .select("title eventDate currentParticipants maxParticipants location")
        .lean(),
      // Last 5 completed events
      Event.find({ status: "completed" })
        .sort({ eventDate: -1 })
        .limit(5)
        .select("title eventDate currentParticipants")
        .lean(),
      // Attendance submissions pending review
      VolunteerEvent.countDocuments({ reviewStatus: "pending" }),
    ])

    return NextResponse.json({
      success: true,
      stats: {
        totalVolunteers,
        totalEvents,
        upcomingEvents,
        completedEvents,
        totalApplications,
        pendingApprovals,
        totalParticipations,
        pendingAttendance,
      },
      recentUpcomingEvents: (recentUpcomingEvents as any[]).map((e) => ({
        _id: e._id,
        title: e.title,
        eventDate: e.eventDate,
        registrations: e.currentParticipants || 0,
        maxParticipants: e.maxParticipants,
        location: e.location,
      })),
      recentCompletedEvents: (recentCompletedEvents as any[]).map((e) => ({
        _id: e._id,
        title: e.title,
        eventDate: e.eventDate,
        participation: e.currentParticipants || 0,
      })),
    })
  } catch (error) {
    console.error("Dashboard stats error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
