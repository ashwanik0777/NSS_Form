import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import dbConnect from "@/lib/mongodb"
import VolunteerEvent from "@/models/VolunteerEvent"
import Event from "@/models/Event"
import VolunteerProject from "@/models/VolunteerProject"

export async function GET(_request: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as any
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    await dbConnect()

    // Get volunteer's project
    const projectAssignment = await VolunteerProject.findOne({
      volunteerId: session.user.id,
      status: "active",
    }).lean()

    // Calculate total hours
    const hoursAggregation = await VolunteerEvent.aggregate([
      { $match: { volunteerId: session.user.id } },
      { $group: { _id: null, total: { $sum: "$hoursWorked" } } },
    ])

    const totalHours = hoursAggregation[0]?.total || 0

    // Get upcoming events
    let upcomingEvents: any[] = []
    if (projectAssignment) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      upcomingEvents = await Event.find({
        projectId: projectAssignment.projectId,
        eventDate: { $gte: today },
        status: { $in: ["upcoming", "ongoing"] },
      })
        .sort({ eventDate: 1 })
        .limit(5)
        .lean()
    }

    return NextResponse.json({
      success: true,
      totalHours: Math.round(totalHours * 10) / 10,
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

