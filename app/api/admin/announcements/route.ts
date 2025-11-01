import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import dbConnect from "@/lib/mongodb"
import Announcement from "@/models/Announcement"
import User from "@/models/User"
import NSSApplication from "@/models/NSSApplication"
import { sendCustomEmail } from "@/lib/email"

export async function GET(_request: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as any
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "admin" && session.user.role !== "sub-admin") {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 })
    }

    await dbConnect()

    const announcements = await Announcement.find()
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 })
      .lean()

    return NextResponse.json({
      success: true,
      announcements,
    })
  } catch (error) {
    console.error("Announcements fetch error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as any
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "admin" && session.user.role !== "sub-admin") {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { title, content, type, sendEmail } = body

    if (!title || !content) {
      return NextResponse.json(
        { success: false, message: "Title and content are required" },
        { status: 400 }
      )
    }

    await dbConnect()

    // Create announcement
    const announcement = new Announcement({
      title,
      content,
      type: type || "announcement",
      sendEmail: sendEmail || false,
      createdBy: session.user.id,
      status: "active",
    })

    await announcement.save()

    // Send emails if requested
    if (sendEmail) {
      // Get all approved volunteers only
      const approvedApplications = await NSSApplication.find({ status: "approved" })
        .select("userId emailId")
        .lean()

      const approvedUserIds = approvedApplications.map((app) => app.userId)

      const volunteers = await User.find({
        _id: { $in: approvedUserIds },
        role: { $in: ["volunteer", "user"] },
      }).lean()

      const applicationMap = new Map(
        approvedApplications.map((app: any) => [app.userId.toString(), app])
      )

      // Send emails to all approved volunteers
      const emailPromises = volunteers.map(async (volunteer: any) => {
        const application = applicationMap.get(volunteer._id.toString())
        const volunteerEmail = application?.emailId || volunteer.email
        const volunteerName = application?.nameEnglish || volunteer.name || "Volunteer"

        try {
          await sendCustomEmail(
            volunteerEmail,
            `NSS Announcement: ${title}`,
            `<h2>${title}</h2><p>Dear ${volunteerName},</p><p>${content}</p><p>Best regards,<br>NSS Team</p>`
          )
        } catch (error) {
          console.error(`Failed to send email to ${volunteerEmail}:`, error)
        }
      })

      await Promise.allSettled(emailPromises)
    }

    return NextResponse.json({
      success: true,
      message: sendEmail
        ? "Announcement created and emails sent to all approved volunteers"
        : "Announcement created successfully",
      announcement,
    })
  } catch (error) {
    console.error("Announcement creation error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as any
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "admin" && session.user.role !== "sub-admin") {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { announcementId, ...updateData } = body

    if (!announcementId) {
      return NextResponse.json(
        { success: false, message: "Announcement ID required" },
        { status: 400 }
      )
    }

    await dbConnect()

    const announcement = await Announcement.findByIdAndUpdate(announcementId, updateData, { new: true })

    if (!announcement) {
      return NextResponse.json({ success: false, message: "Announcement not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "Announcement updated successfully",
      announcement,
    })
  } catch (error) {
    console.error("Announcement update error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as any
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "admin" && session.user.role !== "sub-admin") {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const announcementId = searchParams.get("id")

    if (!announcementId) {
      return NextResponse.json(
        { success: false, message: "Announcement ID required" },
        { status: 400 }
      )
    }

    await dbConnect()

    const announcement = await Announcement.findByIdAndDelete(announcementId)

    if (!announcement) {
      return NextResponse.json({ success: false, message: "Announcement not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "Announcement deleted successfully",
    })
  } catch (error) {
    console.error("Announcement deletion error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

