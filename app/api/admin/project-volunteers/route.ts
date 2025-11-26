import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import dbConnect from "@/lib/mongodb"
import VolunteerProject from "@/models/VolunteerProject"

export async function PATCH(request: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as any
    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ success: false, message: "Only super admins can manage project volunteers" }, { status: 403 })
    }

    const body = await request.json()
    const { action, projectId, volunteerId } = body

    if (action !== "remove") {
      return NextResponse.json({ success: false, message: "Unsupported action" }, { status: 400 })
    }

    if (!projectId || !volunteerId) {
      return NextResponse.json({ success: false, message: "Project ID and Volunteer ID are required" }, { status: 400 })
    }

    await dbConnect()

    const assignment = await VolunteerProject.findOne({ projectId, volunteerId, status: "active" })
    if (!assignment) {
      return NextResponse.json({ success: false, message: "Active assignment not found" }, { status: 404 })
    }

    assignment.status = "withdrawn"
    assignment.updatedAt = new Date()
    await assignment.save()

    return NextResponse.json({
      success: true,
      message: "Volunteer removed from project successfully",
    })
  } catch (error) {
    console.error("Project volunteer update error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}


