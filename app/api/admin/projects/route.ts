import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import dbConnect from "@/lib/mongodb"
import NSSProject from "@/models/NSSProject"
import VolunteerProject from "@/models/VolunteerProject"
import User from "@/models/User"

export async function GET(request: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as any
    if (!session?.user?.id || (session.user.role !== "admin" && session.user.role !== "sub-admin")) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    await dbConnect()
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get("id")

    if (projectId) {
      // Get single project with volunteers
      const project = await NSSProject.findById(projectId).lean()
      if (!project) {
        return NextResponse.json({ success: false, message: "Project not found" }, { status: 404 })
      }

      const volunteers = await VolunteerProject.find({ projectId, status: "active" })
        .populate("volunteerId", "name email")
        .lean()

      return NextResponse.json({
        success: true,
        project: {
          ...project,
          volunteers: volunteers.map((v) => ({
            _id: v.volunteerId._id,
            name: (v.volunteerId as any).name,
            email: (v.volunteerId as any).email,
            selectedAt: v.selectedAt,
          })),
        },
      })
    }

    // Get all projects with volunteer counts
    const projects = await NSSProject.find().sort({ createdAt: -1 }).lean()
    const projectsWithCounts = await Promise.all(
      projects.map(async (project) => {
        const volunteerCount = await VolunteerProject.countDocuments({
          projectId: project._id,
          status: "active",
        })
        return {
          ...project,
          actualVolunteerCount: volunteerCount,
        }
      })
    )

    // Analytics
    const totalVolunteers = await VolunteerProject.countDocuments({ status: "active" })
    const mostPopularProject = await VolunteerProject.aggregate([
      { $match: { status: "active" } },
      { $group: { _id: "$projectId", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 },
    ])

    let popularProjectData = null
    if (mostPopularProject.length > 0) {
      const popularProject = await NSSProject.findById(mostPopularProject[0]._id).lean()
      if (popularProject) {
        popularProjectData = {
          ...popularProject,
          volunteerCount: mostPopularProject[0].count,
        }
      }
    }

    return NextResponse.json({
      success: true,
      projects: projectsWithCounts,
      analytics: {
        totalProjects: projects.length,
        totalVolunteers,
        mostPopularProject: popularProjectData,
      },
    })
  } catch (error) {
    console.error("Projects fetch error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as any
    if (!session?.user?.id || (session.user.role !== "admin" && session.user.role !== "sub-admin")) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    await dbConnect()

    const project = new NSSProject({
      title: body.title,
      description: body.description,
      location: body.location,
      startDate: body.startDate ? new Date(body.startDate) : undefined,
      endDate: body.endDate ? new Date(body.endDate) : undefined,
      coordinator: body.coordinator,
      maxVolunteers: body.maxVolunteers,
      status: body.status || "active",
      category: body.category,
    })

    await project.save()

    return NextResponse.json({ success: true, project })
  } catch (error) {
    console.error("Project creation error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as any
    if (!session?.user?.id || (session.user.role !== "admin" && session.user.role !== "sub-admin")) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json({ success: false, message: "Project ID required" }, { status: 400 })
    }

    await dbConnect()

    if (updateData.startDate) updateData.startDate = new Date(updateData.startDate)
    if (updateData.endDate) updateData.endDate = new Date(updateData.endDate)

    const project = await NSSProject.findByIdAndUpdate(id, { $set: updateData }, { new: true })

    if (!project) {
      return NextResponse.json({ success: false, message: "Project not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, project })
  } catch (error) {
    console.error("Project update error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as any
    if (!session?.user?.id || (session.user.role !== "admin" && session.user.role !== "sub-admin")) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ success: false, message: "Project ID required" }, { status: 400 })
    }

    await dbConnect()

    const project = await NSSProject.findByIdAndDelete(id)

    if (!project) {
      return NextResponse.json({ success: false, message: "Project not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: "Project deleted" })
  } catch (error) {
    console.error("Project deletion error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

