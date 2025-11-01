import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import dbConnect from "@/lib/mongodb"
import NSSProject from "@/models/NSSProject"
import VolunteerProject from "@/models/VolunteerProject"

export async function GET(_request: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as any
    if (!session?.user?.id) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })

    await dbConnect()

    // Get volunteer's selected project
    const volunteerProject = await VolunteerProject.findOne({
      volunteerId: session.user.id,
      status: "active",
    })
      .populate("projectId")
      .lean()

    // Get all available projects
    const allProjects = await NSSProject.find({ status: "active" }).sort({ createdAt: -1 }).lean()

    return NextResponse.json({
      success: true,
      selectedProject: volunteerProject?.projectId || null,
      projects: allProjects,
      hasSelected: !!volunteerProject,
    })
  } catch (e) {
    console.error("Projects fetch error:", e)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as any
    if (!session?.user?.id) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })

    const { projectId } = await request.json()
    if (!projectId) return NextResponse.json({ success: false, message: "Project ID required" }, { status: 400 })

    await dbConnect()

    // Check if volunteer already has an active project
    const existing = await VolunteerProject.findOne({
      volunteerId: session.user.id,
      status: "active",
    })

    if (existing) {
      return NextResponse.json({ success: false, message: "You have already selected a project" }, { status: 400 })
    }

    // Verify project exists and is active
    const project = await NSSProject.findById(projectId)
    if (!project || project.status !== "active") {
      return NextResponse.json({ success: false, message: "Project not available" }, { status: 400 })
    }

    // Create volunteer project assignment
    const volunteerProject = new VolunteerProject({
      volunteerId: session.user.id,
      projectId: projectId,
      status: "active",
    })
    await volunteerProject.save()

    // Update project volunteer count
    await NSSProject.findByIdAndUpdate(projectId, {
      $inc: { currentVolunteers: 1 },
    })

    return NextResponse.json({ success: true, message: "Project selected successfully", volunteerProject })
  } catch (e) {
    console.error("Project selection error:", e)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

