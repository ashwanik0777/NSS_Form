import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import dbConnect from "@/lib/mongodb"
import EmailTemplate from "@/models/EmailTemplate"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user.role !== "admin" && session.user.role !== "sub-admin")) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    await dbConnect()
    const templates = await EmailTemplate.find().sort({ createdAt: -1 })

    return NextResponse.json({
      success: true,
      templates,
    })
  } catch (error) {
    console.error("Error fetching templates:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user.role !== "admin" && session.user.role !== "sub-admin")) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    await dbConnect()
    const body = await request.json()

    // Support seeding preset templates
    if (body.action === "seed_presets") {
      const presets = [
        {
          name: "Important NSS Meeting Notice",
          subject: "Notice: Mandatory NSS Meeting for Unit {{unitNo}} Volunteers",
          content: `Dear {{name}},\n\nThis is to notify all registered NSS volunteers of Unit {{unitNo}} that a mandatory briefing meeting has been scheduled.\n\nDate: Upcoming Saturday\nTime: 10:00 AM\nVenue: Main Auditorium / NSS Room\n\nPlease ensure your attendance is marked on the portal. Bring your college ID card.\n\nRegards,\nNSS Coordinator\nGautam Buddha University`,
          type: "reminder",
        },
        {
          name: "Camp & Social Drive Announcement",
          subject: "Upcoming NSS Social Service Drive - Participation Required",
          content: `Dear {{name}},\n\nWe are organizing an upcoming community outreach and social service camp under the National Service Scheme.\n\nAs an active volunteer of Unit {{unitNo}}, your participation will earn you official activity hours toward your NSS certificate.\n\nPlease check your volunteer dashboard on the portal for event registration and reporting time.\n\nBest wishes,\nNSS Team`,
          type: "custom",
        },
        {
          name: "Volunteer Application Approved",
          subject: "Welcome to NSS! Your Volunteer Application ({{formNo}}) is Approved",
          content: `Dear {{name}},\n\nCongratulations! We are delighted to inform you that your application (Form #{{formNo}}) to join the National Service Scheme (NSS) at Gautam Buddha University has been approved.\n\nYou have been allotted to NSS Unit {{unitNo}}.\n\nPlease log in to your volunteer portal using your registered email ({{email}}) to view upcoming events and submit your activity reports.\n\nWelcome to the NSS family!\n\nJai Hind,\nNSS Program Coordinator`,
          type: "approval",
        },
        {
          name: "Activity Hours / Attendance Reminder",
          subject: "NSS Portal Notice: Update Your Attendance & Event Hours",
          content: `Dear {{name}},\n\nPlease review your volunteer dashboard and verify that your attendance and event hours for recent activities are properly recorded.\n\nIf you attended an event but your hours are missing, please raise a report through your dashboard or contact your Unit {{unitNo}} leader.\n\nBest regards,\nNSS Administration`,
          type: "reminder",
        },
      ]

      const created = []
      for (const preset of presets) {
        const existing = await EmailTemplate.findOne({ name: preset.name })
        if (!existing) {
          const doc = await EmailTemplate.create(preset)
          created.push(doc)
        }
      }

      const all = await EmailTemplate.find().sort({ createdAt: -1 })
      return NextResponse.json({
        success: true,
        message: `Added ${created.length} preset templates`,
        templates: all,
      })
    }

    const { name, subject, content, type } = body

    if (!name || !subject || !content) {
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 })
    }

    const template = await EmailTemplate.create({
      name,
      subject,
      content,
      type: type || "custom",
    })

    return NextResponse.json({
      success: true,
      template,
    })
  } catch (error: any) {
    console.error("Error creating template:", error)
    return NextResponse.json({ success: false, message: error.message || "Internal server error" }, { status: 500 })
  }
}
