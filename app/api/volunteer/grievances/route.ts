import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import dbConnect from "@/lib/mongodb"
import Grievance from "@/models/Grievance"
import NSSApplication from "@/models/NSSApplication"

export async function GET(_request: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as any
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    await dbConnect()

    const grievances = await Grievance.find({ userId: session.user.id })
      .sort({ createdAt: -1 })
      .lean()

    return NextResponse.json({
      success: true,
      grievances: grievances.map((g: any) => ({
        _id: g._id,
        subject: g.subject,
        description: g.description,
        category: g.category,
        status: g.status,
        priority: g.priority,
        adminNotes: g.adminNotes,
        resolutionNotes: g.resolutionNotes,
        resolvedAt: g.resolvedAt,
        createdAt: g.createdAt,
      })),
    })
  } catch (error) {
    console.error("Volunteer grievances fetch error:", error)
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
    const { subject, description, category, priority } = body

    if (!subject || !description) {
      return NextResponse.json({ success: false, message: "Subject and description are required" }, { status: 400 })
    }

    await dbConnect()

    // derive unit from approved application if available
    const app = await NSSApplication.findOne({ userId: session.user.id, status: "approved" }).select("unitNo").lean()
    const unitNo = (app as any)?.unitNo || undefined

    const grievance = await Grievance.create({
      userId: session.user.id,
      unitNo,
      subject,
      description,
      category: category || undefined,
      priority: priority || "medium",
      status: "open",
    })

    return NextResponse.json({
      success: true,
      grievance: {
        _id: grievance._id,
        subject: grievance.subject,
        description: grievance.description,
        category: grievance.category,
        status: grievance.status,
        priority: grievance.priority,
        createdAt: grievance.createdAt,
      },
    })
  } catch (error) {
    console.error("Volunteer grievance create error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}


