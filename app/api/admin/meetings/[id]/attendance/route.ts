import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import dbConnect from "@/lib/mongodb"
import Meeting from "@/models/Meeting"
import VolunteerMeeting from "@/models/VolunteerMeeting"
import User from "@/models/User"
import NSSApplication from "@/models/NSSApplication"
import mongoose from "mongoose"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = (await getServerSession(authOptions)) as any
    if (!session?.user?.id || (session.user.role !== "admin" && session.user.role !== "sub-admin")) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    await dbConnect()
    const meetingId = params.id
    const meeting = await Meeting.findById(meetingId)

    if (!meeting) {
        return NextResponse.json({ success: false, message: "Meeting not found" }, { status: 404 })
    }

    // Get all registrations
    // Also lookup User/NSSApplication details for display
    const registrations = await VolunteerMeeting.aggregate([
        { $match: { meetingId: new mongoose.Types.ObjectId(meetingId) } },
        {
            $lookup: {
                from: "users",
                localField: "volunteerId",
                foreignField: "_id",
                as: "user"
            }
        },
        { $unwind: "$user" },
        {
            $lookup: {
                from: "nssapplications",
                localField: "volunteerId",
                foreignField: "userId",
                as: "application"
            }
        },
        { $unwind: { path: "$application", preserveNullAndEmptyArrays: true } }
    ])

    return NextResponse.json({
        success: true,
        meeting,
        registrations: registrations.map(reg => ({
            _id: reg._id,
            volunteerId: reg.volunteerId,
            name: reg.application?.nameEnglish || reg.user.name,
            email: reg.user.email,
            unitNo: reg.application?.unitNo || "N/A",
            status: reg.status,
            hoursGranted: reg.hoursGranted,
            checkInTime: reg.checkInTime,
            createdAt: reg.createdAt
        }))
    })

  } catch (error) {
    console.error("Error fetching meeting attendance:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = (await getServerSession(authOptions)) as any
    if (!session?.user?.id || (session.user.role !== "admin" && session.user.role !== "sub-admin")) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const meetingId = params.id
    const { registrationIds, status, hoursGranted } = await request.json()

    if (!registrationIds || !Array.isArray(registrationIds) || registrationIds.length === 0) {
        return NextResponse.json({ success: false, message: "No volunteers selected" }, { status: 400 })
    }

    await dbConnect()

    const updateData: any = { status }
    if (status === "attended") {
        updateData.hoursGranted = hoursGranted || 0
        updateData.checkInTime = new Date()
    } else {
        updateData.hoursGranted = 0
    }

    await VolunteerMeeting.updateMany(
        { _id: { $in: registrationIds } },
        { $set: updateData }
    )

    return NextResponse.json({ success: true, message: "Attendance updated" })

  } catch (error) {
     console.error("Error updating meeting attendance:", error)
     return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
