import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import dbConnect from "@/lib/mongodb"
import Meeting from "@/models/Meeting"
import VolunteerMeeting from "@/models/VolunteerMeeting"

export async function GET(_request: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as any
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    // Only admin/sub-admin
    if (session.user.role !== "admin" && session.user.role !== "sub-admin") {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 })
    }

    await dbConnect()

    const [totalMeetings, upcomingOrOngoing, completedMeetings, cancelledMeetings, totalRegistrations, totalAttended, totalAbsent] =
      await Promise.all([
        Meeting.countDocuments({}),
        Meeting.countDocuments({ status: { $in: ["upcoming", "ongoing"] } }),
        Meeting.countDocuments({ status: "completed" }),
        Meeting.countDocuments({ status: "cancelled" }),
        VolunteerMeeting.countDocuments({}),
        VolunteerMeeting.countDocuments({ status: "attended" }),
        VolunteerMeeting.countDocuments({ status: "absent" }),
      ])

    return NextResponse.json({
      success: true,
      meetings: {
        total: totalMeetings,
        upcomingOrOngoing,
        completed: completedMeetings,
        cancelled: cancelledMeetings,
      },
      attendance: {
        totalRegistrations,
        attended: totalAttended,
        absent: totalAbsent,
      },
    })
  } catch (error) {
    console.error("Admin meetings stats error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}


