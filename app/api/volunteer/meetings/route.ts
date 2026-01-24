import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import dbConnect from "@/lib/mongodb"
import Meeting from "@/models/Meeting"
import VolunteerMeeting from "@/models/VolunteerMeeting"
import mongoose from "mongoose"

export async function GET() {
  try {
    const session = (await getServerSession(authOptions)) as any
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    await dbConnect()

    const userId = new mongoose.Types.ObjectId(session.user.id)
    const meetings = await Meeting.find({
        status: { $ne: "cancelled" }
    })
    .sort({ meetingDate: 1 }) 
    .lean()

    // Get user's registrations
    const myRegistrations = await VolunteerMeeting.find({
      volunteerId: userId,
      meetingId: { $in: meetings.map((m: any) => m._id) }
    }).lean()

    // Map registration status to meetings
    const enhancedMeetings = meetings.map((meeting: any) => {
      const reg = myRegistrations.find((r: any) => r.meetingId.toString() === meeting._id.toString())
      return {
        ...meeting,
        isRegistered: !!reg,
        registrationStatus: reg ? reg.status : null,
        hoursGranted: reg ? reg.hoursGranted : 0
      }
    })

    return NextResponse.json({ success: true, meetings: enhancedMeetings })

  } catch (error) {
    console.error("Error fetching volunteer meetings:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = (await getServerSession(authOptions)) as any
    if (!session?.user?.id) {
        return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const { meetingId } = await request.json()
    if (!meetingId) {
        return NextResponse.json({ success: false, message: "Meeting ID required" }, { status: 400 })
    }

    await dbConnect()

    const userId = session.user.id

    // Check if valid meeting
    const meeting = await Meeting.findById(meetingId)
    if (!meeting) {
        return NextResponse.json({ success: false, message: "Meeting not found" }, { status: 404 })
    }

    if (meeting.status === "cancelled") {
        return NextResponse.json({ success: false, message: "Cannot register for cancelled meeting" }, { status: 400 })
    }

    // Check if already registered
    const existing = await VolunteerMeeting.findOne({
        volunteerId: userId,
        meetingId: meetingId
    })

    if (existing) {
        return NextResponse.json({ success: false, message: "Already registered" }, { status: 400 })
    }

    // Register
    await VolunteerMeeting.create({
        volunteerId: userId,
        meetingId: meetingId,
        status: "registered"
    })

    return NextResponse.json({ success: true, message: "Registered successfully" })

  } catch (error) {
    console.error("Error registering for meeting:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
