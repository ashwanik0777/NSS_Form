import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import dbConnect from "@/lib/mongodb"
import EmailLog from "@/models/EmailLog"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user.role !== "admin" && session.user.role !== "sub-admin")) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    await dbConnect()

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const search = searchParams.get("search")?.trim()
    const limit = Math.min(Number.parseInt(searchParams.get("limit") || "100", 10), 500)

    const query: any = {}
    if (status && status !== "all") {
      query.status = status
    }

    if (search) {
      const searchRegex = new RegExp(search, "i")
      query.$or = [
        { to: searchRegex },
        { subject: searchRegex },
        { recipientName: searchRegex },
      ]
    }

    const [logs, totalSent, totalFailed, totalLogs] = await Promise.all([
      EmailLog.find(query).sort({ sentAt: -1 }).limit(limit).lean(),
      EmailLog.countDocuments({ status: "sent" }),
      EmailLog.countDocuments({ status: "failed" }),
      EmailLog.countDocuments(),
    ])

    // Calculate emails sent today (since midnight local)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const sentToday = await EmailLog.countDocuments({
      status: "sent",
      sentAt: { $gte: today },
    })

    return NextResponse.json({
      success: true,
      logs,
      stats: {
        totalSent,
        totalFailed,
        totalLogs,
        sentToday,
        dailyLimit: 500, // Gmail standard daily limit
        remainingToday: Math.max(0, 500 - sentToday),
      },
    })
  } catch (error: any) {
    console.error("Error fetching email logs:", error)
    return NextResponse.json({ success: false, message: error?.message || "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ success: false, message: "Unauthorized: Admin only" }, { status: 401 })
    }

    await dbConnect()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    const action = searchParams.get("action")

    if (action === "clear_all") {
      await EmailLog.deleteMany({})
      return NextResponse.json({ success: true, message: "All email logs cleared" })
    }

    if (id) {
      await EmailLog.findByIdAndDelete(id)
      return NextResponse.json({ success: true, message: "Log deleted" })
    }

    return NextResponse.json({ success: false, message: "Missing id or action" }, { status: 400 })
  } catch (error: any) {
    console.error("Error deleting email log:", error)
    return NextResponse.json({ success: false, message: error?.message || "Internal server error" }, { status: 500 })
  }
}
