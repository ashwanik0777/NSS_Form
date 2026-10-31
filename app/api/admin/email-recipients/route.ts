import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import dbConnect from "@/lib/mongodb"
import NSSApplication from "@/models/NSSApplication"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user.role !== "admin" && session.user.role !== "sub-admin")) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    await dbConnect()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") || "approved"
    const unit = searchParams.get("unit") || "all"
    const search = searchParams.get("search")?.trim() || ""

    const query: any = {}

    // Status filter
    switch (status) {
      case "approved":
        query.status = "approved"
        break
      case "pending":
        query.status = { $in: ["submitted", "under-review", "pending"] }
        break
      case "rejected":
        query.status = "rejected"
        break
      case "all":
      default:
        // Do not include removed or draft
        query.status = { $in: ["approved", "submitted", "under-review"] }
        break
    }

    // Unit filter
    if (unit && unit !== "all") {
      // Unit can be stored as "1", "Unit 1", or number 1
      query.$or = [
        { unitNo: unit },
        { unitNo: `Unit ${unit}` },
        { unitNo: Number.parseInt(unit, 10) || unit },
      ]
    }

    // Search query
    if (search) {
      const searchRegex = new RegExp(search, "i")
      const searchConditions = [
        { nameEnglish: searchRegex },
        { emailId: searchRegex },
        { formNo: searchRegex },
      ]

      if (query.$or) {
        query.$and = [{ $or: query.$or }, { $or: searchConditions }]
        delete query.$or
      } else {
        query.$or = searchConditions
      }
    }

    // Query applications with needed fields
    const applications = await NSSApplication.find(query)
      .select("nameEnglish emailId unitNo formNo status")
      .lean()

    // Filter out invalid emails and deduplicate
    const seenEmails = new Set<string>()
    const recipients: Array<{
      id: string
      name: string
      email: string
      unitNo: string
      formNo: string
      status: string
    }> = []

    for (const app of applications) {
      const email = app.emailId?.trim().toLowerCase()
      if (email && email.includes("@") && !seenEmails.has(email)) {
        seenEmails.add(email)
        recipients.push({
          id: String(app._id),
          name: app.nameEnglish || "Volunteer",
          email: app.emailId.trim(),
          unitNo: String(app.unitNo || "N/A"),
          formNo: String(app.formNo || "N/A"),
          status: app.status || "unknown",
        })
      }
    }

    return NextResponse.json({
      success: true,
      count: recipients.length,
      recipients,
    })
  } catch (error: any) {
    console.error("Error fetching email recipients:", error)
    return NextResponse.json({ success: false, message: error.message || "Internal server error" }, { status: 500 })
  }
}
