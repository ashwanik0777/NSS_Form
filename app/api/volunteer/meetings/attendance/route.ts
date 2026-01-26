import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import dbConnect from "@/lib/mongodb"
import Meeting from "@/models/Meeting"
import VolunteerMeeting from "@/models/VolunteerMeeting"

// Helper: Haversine Formula for distance in meters
function getDistanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // metres
  const φ1 = lat1 * Math.PI/180; // φ, λ in radians
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
}

export async function POST(request: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as any
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const { meetingId, latitude, longitude } = await request.json()

    if (!meetingId || latitude === undefined || longitude === undefined) {
      return NextResponse.json({ success: false, message: "Missing location data" }, { status: 400 })
    }

    await dbConnect()

    const meeting = await Meeting.findById(meetingId)
    if (!meeting) {
      return NextResponse.json({ success: false, message: "Meeting not found" }, { status: 404 })
    }

    // 1. Check if Attendance is Manually Enabled (Admin Control)
    if (!meeting.isAttendanceOpen) {
        return NextResponse.json({ success: false, message: "Attendance has been closed by the admin." }, { status: 403 })
    }

    // 2. Check Time Validity
    const now = new Date()
    const start = new Date(meeting.startTime)
    const end = new Date(meeting.endTime)

    if (now < start) {
        return NextResponse.json({ success: false, message: "Attendance has not started yet." }, { status: 403 })
    }
    if (now > end) {
        // Optionally close it permanently if end time passed? 
        // For now just reject the request
        return NextResponse.json({ success: false, message: "Attendance period is over." }, { status: 403 })
    }

    // 3. Check Geo-Fence
    if (!meeting.locationCoordinates || !meeting.locationCoordinates.latitude || !meeting.locationCoordinates.longitude) {
        // If meeting has no coords set, decide policy. Usually allow or fail. 
        // Given the requirement is strict 100m, maybe fail. But for safety, if admin forgot to set coords, maybe allow? 
        // User said "attendance sirf tabhi mark ho jab ... 100 range ...". Requires coords.
        return NextResponse.json({ success: false, message: "Meeting location coordinates not set by Admin." }, { status: 400 })
    }

    const distance = getDistanceInMeters(
        latitude, 
        longitude, 
        meeting.locationCoordinates.latitude, 
        meeting.locationCoordinates.longitude
    )

    const userDistance = Math.round(distance);
    const maxDistance = meeting.attendanceRadius || 100;

    if (userDistance > maxDistance) {
        return NextResponse.json({ 
            success: false, 
            message: `You are too far from the location (${userDistance}m). Please come within ${maxDistance}m.` 
        }, { status: 403 })
    }

    // 4. Check Registration & Existing Status
    const registration = await VolunteerMeeting.findOne({
        meetingId: meetingId,
        volunteerId: session.user.id
    })

    if (!registration) {
        return NextResponse.json({ success: false, message: "You are not registered for this meeting." }, { status: 403 })
    }

    if (registration.status === 'attended') {
        return NextResponse.json({ success: false, message: "You have already marked attendance." }, { status: 400 })
    }
    
    // Strictly no update if marked absent/attended (though if absent & within time/range, maybe allow update? 
    // User said "ek baar ... update na ho sake".)
    if (registration.status !== 'registered') {
        return NextResponse.json({ success: false, message: "Attendance status already finalized." }, { status: 400 })
    }

    // 5. Update Status
    // Calculate hours to grant based on duration? Or use default? 
    // Usually standard meeting duration.
    const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    const hours = Number(durationHours.toFixed(1)) || 1;

    registration.status = 'attended';
    registration.checkInTime = now;
    // registration.hoursGranted = hours; // Usually granted after approval? Or auto-granted? 
    // "Meeting attendees" usually get points/hours. Let's auto-grant for now or let admin approve. 
    // "Attendace marking" => Usually implies auto-presence.
    // The previous Admin API uses 'inputHours' to grant.
    // For auto-mark, let's set it to 0 or estimated, admin can update? 
    // If strict "no update", then we must set it correctly now.
    registration.hoursGranted = hours;

    await registration.save();

    return NextResponse.json({
        success: true, 
        message: "Attendance marked successfully!",
        data: { status: 'attended', checkInTime: now }
    })

  } catch (error) {
    console.error("Attendance error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
