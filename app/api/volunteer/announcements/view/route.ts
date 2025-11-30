import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import dbConnect from "@/lib/mongodb"
import AnnouncementView from "@/models/AnnouncementView"
import NSSApplication from "@/models/NSSApplication"

export async function POST(request: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as any
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { announcementId } = body

    if (!announcementId) {
      return NextResponse.json({ success: false, message: "Announcement ID required" }, { status: 400 })
    }

    await dbConnect()

    // Verify volunteer has approved application
    const application = await NSSApplication.findOne({
      userId: session.user.id,
      status: "approved",
    }).lean()

    if (!application) {
      return NextResponse.json({ success: false, message: "Application not approved" }, { status: 403 })
    }

    // Create or update view record
    await AnnouncementView.findOneAndUpdate(
      {
        volunteerId: session.user.id,
        announcementId: announcementId,
      },
      {
        volunteerId: session.user.id,
        announcementId: announcementId,
        viewedAt: new Date(),
      },
      {
        upsert: true,
        new: true,
      }
    )

    return NextResponse.json({
      success: true,
      message: "Announcement marked as viewed",
    })
  } catch (error) {
    console.error("Announcement view error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

