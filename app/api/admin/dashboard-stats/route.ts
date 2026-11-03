import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import dbConnect from "@/lib/mongodb"
import NSSApplication from "@/models/NSSApplication"
import Event from "@/models/Event"
import VolunteerEvent from "@/models/VolunteerEvent"
import EventRegistration from "@/models/EventRegistration"

export async function GET(request: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as any
    if (!session?.user?.id || (session.user.role !== "admin" && session.user.role !== "sub-admin")) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    await dbConnect()

    // Run core count and list queries in parallel for high performance
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
      // Upcoming or ongoing events
      Event.countDocuments({ status: { $in: ["upcoming", "ongoing"] } }),
      // Completed events
      Event.countDocuments({ status: "completed" }),
      // Total verified event participations
      VolunteerEvent.countDocuments({ reviewStatus: "approved" }),
      // Next 5 upcoming or ongoing events
      Event.find({ status: { $in: ["upcoming", "ongoing"] } })
        .sort({ eventDate: 1 })
        .limit(5)
        .select("title eventDate location maxParticipants")
        .lean(),
      // Last 5 completed events
      Event.find({ status: "completed" })
        .sort({ eventDate: -1 })
        .limit(5)
        .select("title eventDate location")
        .lean(),
      // Attendance submissions pending review
      VolunteerEvent.countDocuments({ reviewStatus: "pending" }),
    ])

    // Collect event IDs for enrichment
    const upcomingIds = (recentUpcomingEvents as any[]).map((e) => e._id)
    const completedIds = (recentCompletedEvents as any[]).map((e) => e._id)

    // Aggregate real registration and verified attendance counts
    const [upcomingRegStats, completedRegStats, completedAttStats] = await Promise.all([
      upcomingIds.length > 0
        ? EventRegistration.aggregate([
            { $match: { eventId: { $in: upcomingIds }, status: { $ne: "declined" } } },
            { $group: { _id: "$eventId", count: { $sum: 1 } } },
          ])
        : Promise.resolve([]),
      completedIds.length > 0
        ? EventRegistration.aggregate([
            { $match: { eventId: { $in: completedIds }, status: { $ne: "declined" } } },
            { $group: { _id: "$eventId", count: { $sum: 1 } } },
          ])
        : Promise.resolve([]),
      completedIds.length > 0
        ? VolunteerEvent.aggregate([
            { $match: { eventId: { $in: completedIds } } },
            {
              $group: {
                _id: "$eventId",
                total: { $sum: 1 },
                approved: { $sum: { $cond: [{ $eq: ["$reviewStatus", "approved"] }, 1, 0] } },
                pending: { $sum: { $cond: [{ $eq: ["$reviewStatus", "pending"] }, 1, 0] } },
              },
            },
          ])
        : Promise.resolve([]),
    ])

    const upcomingRegMap: Record<string, number> = {}
    upcomingRegStats.forEach((s: any) => {
      upcomingRegMap[s._id.toString()] = s.count
    })

    const completedRegMap: Record<string, number> = {}
    completedRegStats.forEach((s: any) => {
      completedRegMap[s._id.toString()] = s.count
    })

    const completedAttMap: Record<string, { total: number; approved: number; pending: number }> = {}
    completedAttStats.forEach((s: any) => {
      completedAttMap[s._id.toString()] = {
        total: s.total,
        approved: s.approved,
        pending: s.pending,
      }
    })

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
        registrations: upcomingRegMap[e._id.toString()] || 0,
        maxParticipants: e.maxParticipants,
        location: e.location,
      })),
      recentCompletedEvents: (recentCompletedEvents as any[]).map((e) => {
        const id = e._id.toString()
        const att = completedAttMap[id]
        const regCount = completedRegMap[id] || 0
        // Real participation is the verified (approved) attendance count,
        // falling back to total attendance submissions or registered participants
        const participation =
          att && att.approved > 0
            ? att.approved
            : att && att.total > 0
              ? att.total
              : regCount

        return {
          _id: e._id,
          title: e.title,
          eventDate: e.eventDate,
          participation,
          registrations: regCount,
          approvedAttendance: att?.approved || 0,
          pendingAttendance: att?.pending || 0,
        }
      }),
    })
  } catch (error) {
    console.error("Dashboard stats error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
