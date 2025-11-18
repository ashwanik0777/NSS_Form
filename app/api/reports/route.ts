import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import dbConnect from "@/lib/mongodb"
import Report from "@/models/Report"
import User from "@/models/User"
import NSSApplication from "@/models/NSSApplication"
import { sendReportSubmittedEmail, sendReportStatusUpdateEmail, sendReportReplyEmail } from "@/lib/email"

// Generate unique report ID
async function generateReportId(): Promise<string> {
  const year = new Date().getFullYear().toString().slice(-2)
  const lastReport = await Report.findOne({ reportId: new RegExp(`^RPT-${year}-`) })
    .sort({ reportId: -1 })
    .lean()

  let nextNumber = 1
  if (lastReport) {
    const lastNumber = parseInt(lastReport.reportId.split("-")[2] || "0")
    nextNumber = lastNumber + 1
  }

  return `RPT-${year}-${nextNumber.toString().padStart(4, "0")}`
}

// GET - Fetch reports (user sees own, admin sees all with filters)
export async function GET(request: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as any
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    await dbConnect()

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const category = searchParams.get("category")
    const priority = searchParams.get("priority")
    const assignedTo = searchParams.get("assignedTo")
    const search = searchParams.get("search")

    const isAdmin = session.user.role === "admin" || session.user.role === "sub-admin"

    // Build query
    const query: any = {}
    if (!isAdmin) {
      // Users can only see their own reports
      query.userId = session.user.id
    }

    if (status && status !== "all") {
      query.status = status
    }
    if (category && category !== "all") {
      query.category = category
    }
    if (priority && priority !== "all") {
      query.priority = priority
    }
    if (assignedTo && assignedTo !== "all") {
      if (assignedTo === "unassigned") {
        query.$or = [
          { assignedTo: { $exists: false } },
          { assignedTo: null },
        ]
      } else {
        query.assignedTo = assignedTo
      }
    }
    if (search) {
      const searchConditions = [
        { subject: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { reportId: { $regex: search, $options: "i" } },
      ]
      if (query.$or) {
        // If $or already exists (for unassigned), combine with $and
        query.$and = [
          { $or: query.$or },
          { $or: searchConditions },
        ]
        delete query.$or
      } else {
        query.$or = searchConditions
      }
    }

    const reports = await Report.find(query)
      .populate("userId", "name email")
      .populate("assignedTo", "name email")
      .populate("resolvedBy", "name email")
      .sort({ createdAt: -1 })
      .lean()

    return NextResponse.json({
      success: true,
      reports,
    })
  } catch (error) {
    console.error("Error fetching reports:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

// POST - Create new report
export async function POST(request: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as any
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    await dbConnect()

    const body = await request.json()
    const { category, subject, description, priority, attachments, relatedEventId, relatedVolunteerId } = body

    // Validation
    if (!category || !subject || !description) {
      return NextResponse.json(
        { success: false, message: "Category, subject, and description are required" },
        { status: 400 },
      )
    }

    // Generate unique report ID
    const reportId = await generateReportId()

    // Create report
    const report = new Report({
      reportId,
      userId: session.user.id,
      category,
      subject: subject.trim(),
      description: description.trim(),
      priority: priority || "medium",
      attachments: attachments || [],
      relatedEventId: relatedEventId || undefined,
      relatedVolunteerId: relatedVolunteerId || undefined,
      status: "open",
    })

    await report.save()

    // Populate user data for email
    const user = await User.findById(session.user.id).lean()
    const application = await NSSApplication.findOne({ userId: session.user.id }).lean()
    const userName = application?.nameEnglish || user?.name || "User"

    // Send confirmation email to user
    try {
      await sendReportSubmittedEmail(user?.email || "", {
        name: userName,
        reportId,
        subject,
        category,
        priority: priority || "medium",
      })
    } catch (emailError) {
      console.error("Error sending report submission email:", emailError)
      // Don't fail the request if email fails
    }

    // Populate and return
    const populatedReport = await Report.findById(report._id)
      .populate("userId", "name email")
      .lean()

    return NextResponse.json({
      success: true,
      message: "Report submitted successfully",
      report: populatedReport,
    })
  } catch (error: any) {
    console.error("Error creating report:", error)
    return NextResponse.json(
      { success: false, message: error.message || "Internal server error" },
      { status: 500 },
    )
  }
}

// PATCH - Update report (admin only for status/notes/assignment, user can add replies)
export async function PATCH(request: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as any
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    await dbConnect()

    const body = await request.json()
    const {
      reportId,
      status,
      adminNotes,
      resolutionNotes,
      assignedTo,
      replyMessage,
      replyAttachments,
    } = body

    if (!reportId) {
      return NextResponse.json({ success: false, message: "Report ID is required" }, { status: 400 })
    }

    const report = await Report.findOne({ reportId })
    if (!report) {
      return NextResponse.json({ success: false, message: "Report not found" }, { status: 404 })
    }

    const isAdmin = session.user.role === "admin" || session.user.role === "sub-admin"
    const isOwner = report.userId.toString() === session.user.id

    // Handle replies (both admin and user can reply)
    if (replyMessage) {
      if (!isAdmin && !isOwner) {
        return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 })
      }

      report.replies = report.replies || []
      report.replies.push({
        userId: session.user.id,
        message: replyMessage.trim(),
        isAdmin,
        attachments: replyAttachments || [],
        createdAt: new Date(),
      })

      await report.save()

      // Send email notification
      const user = await User.findById(report.userId).lean()
      const application = await NSSApplication.findOne({ userId: report.userId }).lean()
      const userName = application?.nameEnglish || user?.name || "User"

      const replier = await User.findById(session.user.id).lean()
      const replierName = replier?.name || "Admin"

      try {
        // Send to report owner if admin replied, or to admins if user replied
        if (isAdmin && user?.email) {
          await sendReportReplyEmail(user.email, {
            name: userName,
            reportId: report.reportId,
            subject: report.subject,
            replyMessage,
            repliedBy: replierName,
            isAdmin: true,
          })
        }
        // TODO: Notify admins when user replies
      } catch (emailError) {
        console.error("Error sending reply email:", emailError)
      }

      const updatedReport = await Report.findOne({ reportId })
        .populate("userId", "name email")
        .populate("assignedTo", "name email")
        .populate("resolvedBy", "name email")
        .populate("replies.userId", "name email")
        .lean()

      return NextResponse.json({
        success: true,
        message: "Reply added successfully",
        report: updatedReport,
      })
    }

    // Admin-only operations
    if (!isAdmin) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 })
    }

    // Update status, notes, assignment
    const updateData: any = {}
    if (status) updateData.status = status
    if (adminNotes !== undefined) updateData.adminNotes = adminNotes
    if (resolutionNotes !== undefined) updateData.resolutionNotes = resolutionNotes
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo || null

    if (status === "resolved" && !report.resolvedAt) {
      updateData.resolvedAt = new Date()
      updateData.resolvedBy = session.user.id
    }

    const updatedReport = await Report.findOneAndUpdate({ reportId }, updateData, { new: true })
      .populate("userId", "name email")
      .populate("assignedTo", "name email")
      .populate("resolvedBy", "name email")
      .lean()

    // Send status update email
    if (status && status !== report.status) {
      const user = await User.findById(report.userId).lean()
      const application = await NSSApplication.findOne({ userId: report.userId }).lean()
      const userName = application?.nameEnglish || user?.name || "User"

      const admin = await User.findById(session.user.id).lean()
      const adminName = admin?.name || "Admin"

      try {
        await sendReportStatusUpdateEmail(user?.email || "", {
          name: userName,
          reportId: report.reportId,
          subject: report.subject,
          status,
          message: resolutionNotes || adminNotes,
          adminName,
        })
      } catch (emailError) {
        console.error("Error sending status update email:", emailError)
      }
    }

    return NextResponse.json({
      success: true,
      message: "Report updated successfully",
      report: updatedReport,
    })
  } catch (error: any) {
    console.error("Error updating report:", error)
    return NextResponse.json(
      { success: false, message: error.message || "Internal server error" },
      { status: 500 },
    )
  }
}

