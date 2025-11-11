import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import dbConnect from "@/lib/mongodb"
import Grievance from "@/models/Grievance"
import User from "@/models/User"
import Notification from "@/models/Notification"
import { hasPermission, PermissionKey } from "@/lib/permissions"

export async function GET(request: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as any
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "admin" && session.user.role !== "sub-admin") {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 })
    }

    // Permission for sub-admin
    if (session.user.role === "sub-admin") {
      const userPermissions = session.user.permissions || []
      if (!hasPermission(userPermissions, "volunteers.view" as PermissionKey)) {
        return NextResponse.json({ success: false, message: "Permission denied" }, { status: 403 })
      }
    }

    await dbConnect()

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const unitNo = searchParams.get("unitNo")

    // Unit-based filtering for sub-admins
    let userAssignedUnits: string[] | null = null
    if (session.user.role === "sub-admin") {
      const user = await User.findById(session.user.id).select("assignedUnits").lean()
      if (user && (user as any).assignedUnits && (user as any).assignedUnits.length > 0) {
        userAssignedUnits = (user as any).assignedUnits
      }
    }

    const query: any = {}
    if (status && status !== "all") query.status = status
    if (userAssignedUnits && userAssignedUnits.length > 0) {
      query.unitNo = { $in: userAssignedUnits }
    } else if (unitNo && unitNo !== "all") {
      query.unitNo = unitNo
    }

    const grievances = await Grievance.find(query)
      .populate("userId", "name email")
      .sort({ createdAt: -1 })
      .lean()

    return NextResponse.json({
      success: true,
      grievances: grievances.map((g: any) => ({
        _id: g._id,
        user: { _id: g.userId?._id, name: g.userId?.name, email: g.userId?.email },
        unitNo: g.unitNo,
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
    console.error("Admin grievances fetch error:", error)
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

    // Permission for sub-admin
    if (session.user.role === "sub-admin") {
      const userPermissions = session.user.permissions || []
      if (!hasPermission(userPermissions, "volunteers.view" as PermissionKey)) {
        return NextResponse.json({ success: false, message: "Permission denied" }, { status: 403 })
      }
    }

    const body = await request.json()
    const { grievanceId, status, adminNotes, resolutionNotes } = body

    if (!grievanceId) {
      return NextResponse.json({ success: false, message: "Grievance ID required" }, { status: 400 })
    }

    await dbConnect()

    const grievance = await Grievance.findById(grievanceId)
    if (!grievance) {
      return NextResponse.json({ success: false, message: "Grievance not found" }, { status: 404 })
    }

    if (status) grievance.status = status
    if (adminNotes !== undefined) grievance.adminNotes = adminNotes
    if (resolutionNotes !== undefined) grievance.resolutionNotes = resolutionNotes

    if (status === "resolved") {
      grievance.resolvedAt = new Date()
      grievance.resolvedBy = session.user.id
    }

    await grievance.save()

    // Send per-user notification when resolved
    if (status === "resolved") {
      await Notification.create({
        userId: grievance.userId,
        title: "Grievance Resolved",
        message: `Your grievance "${grievance.subject}" has been resolved.`,
        type: "general",
        link: "/dashboard/grievances",
      })
    }

    return NextResponse.json({
      success: true,
      message: "Grievance updated successfully",
    })
  } catch (error) {
    console.error("Admin grievance update error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}


