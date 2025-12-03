import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import dbConnect from "@/lib/mongodb"
import EventRegistration from "@/models/EventRegistration"
import Event from "@/models/Event"

export async function GET(request: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as any
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get("eventId")

    await dbConnect()

    if (eventId) {
      // Get registration for specific event
      const registration = await EventRegistration.findOne({
        volunteerId: session.user.id,
        eventId,
      }).lean()

      return NextResponse.json({ success: true, registration: registration || null })
    } else {
      // Get all registrations for volunteer
      const registrations = await EventRegistration.find({
        volunteerId: session.user.id,
      })
        .populate("eventId")
        .sort({ createdAt: -1 })
        .lean()

      return NextResponse.json({ success: true, registrations })
    }
  } catch (error) {
    console.error("Error fetching event registration:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as any
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { eventId, action, reason } = body // action: "register" | "decline"

    if (!eventId || !action) {
      return NextResponse.json({ success: false, message: "Event ID and action are required" }, { status: 400 })
    }

    if (action === "decline" && !reason) {
      return NextResponse.json({ success: false, message: "Reason is required when declining" }, { status: 400 })
    }

    await dbConnect()

    // Verify event exists
    const event = await Event.findById(eventId)
    if (!event) {
      return NextResponse.json({ success: false, message: "Event not found" }, { status: 404 })
    }

    // NOTE: Removed project-assignment checks so any volunteer can register for any event.

    // Check if registration already exists
    let registration = await EventRegistration.findOne({
      volunteerId: session.user.id,
      eventId,
    })

    if (registration) {
      // Update existing registration
      registration.registrationStatus = action === "register" ? "registered" : "declined"
      if (action === "decline") {
        registration.declineReason = reason
        registration.isDefaulter = false // Not a defaulter if they provided a reason
      } else {
        registration.declineReason = undefined
      }
      await registration.save()
    } else {
      // Create new registration
      registration = new EventRegistration({
        volunteerId: session.user.id,
        eventId,
        registrationStatus: action === "register" ? "registered" : "declined",
        declineReason: action === "decline" ? reason : undefined,
        isDefaulter: false,
      })
      await registration.save()
    }

    return NextResponse.json({
      success: true,
      message: action === "register" ? "Successfully registered for event" : "Registration declined",
      registration,
    })
  } catch (error) {
    console.error("Error processing event registration:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

