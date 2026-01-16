import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import dbConnect from "@/lib/mongodb"
import NSSProject from "@/models/NSSProject"
import VolunteerProject from "@/models/VolunteerProject"
import User from "@/models/User"
import { hasPermission, PermissionKey } from "@/lib/permissions"

export async function GET(request: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as any
    if (!session?.user?.id || (session.user.role !== "admin" && session.user.role !== "sub-admin")) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    // Check permission for sub-admin
    if (session.user.role === "sub-admin") {
      const userPermissions = session.user.permissions || []
      if (!hasPermission(userPermissions, "projects.view" as PermissionKey)) {
        return NextResponse.json({ success: false, message: "Permission denied" }, { status: 403 })
      }
    }

    await dbConnect()
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get("id")
    const pageParam = Number.parseInt(searchParams.get("page") || "1")
    const limitParam = Number.parseInt(searchParams.get("limit") || "10")
    const page = Number.isNaN(pageParam) || pageParam < 1 ? 1 : pageParam
    const limit = Number.isNaN(limitParam) || limitParam < 1 ? 10 : limitParam
    const skip = (page - 1) * limit

    if (projectId) {
      // Get single project with volunteers
      const project = await NSSProject.findById(projectId).lean()
      if (!project) {
        return NextResponse.json({ success: false, message: "Project not found" }, { status: 404 })
      }

      const volunteers = await VolunteerProject.find({ projectId, status: "active" })
        .populate("volunteerId", "name email")
        .lean()

      const validVolunteers = volunteers.filter((v: any) => v.volunteerId)

      return NextResponse.json({
        success: true,
        project: {
          ...project,
          volunteers: validVolunteers.map((v: any) => ({
            _id: v.volunteerId._id,
            name: v.volunteerId.name,
            email: v.volunteerId.email,
            selectedAt: v.selectedAt,
          })),
        },
      })
    }

    // Get all projects with volunteer counts (paginated)
    const totalProjectsCount = await NSSProject.countDocuments()

    const projects = await NSSProject.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()

    const projectIds = projects.map((project) => project._id)
    let volunteerCountsMap: Record<string, number> = {}

    if (projectIds.length > 0) {
      const volunteerCounts = await VolunteerProject.aggregate([
        { $match: { projectId: { $in: projectIds }, status: "active" } },
        { $group: { _id: "$projectId", count: { $sum: 1 } } },
      ])

      volunteerCountsMap = volunteerCounts.reduce(
        (acc, item) => {
          acc[item._id.toString()] = item.count
          return acc
        },
        {} as Record<string, number>,
      )
    }

    const projectsWithCounts = projects.map((project) => ({
      ...project,
      actualVolunteerCount: volunteerCountsMap[project._id.toString()] || 0,
    }))

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
        totalProjects: totalProjectsCount,
        totalVolunteers,
        mostPopularProject: popularProjectData,
      },
      pagination: {
        page,
        limit,
        total: totalProjectsCount,
        pages: Math.max(1, Math.ceil(totalProjectsCount / limit)),
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

    // Check permission for sub-admin - require projects.create
    if (session.user.role === "sub-admin") {
      const userPermissions = session.user.permissions || []
      if (!hasPermission(userPermissions, "projects.create" as PermissionKey)) {
        return NextResponse.json({ success: false, message: "Permission denied. You need 'projects.create' permission." }, { status: 403 })
      }
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

    // Check permission for sub-admin - require projects.edit
    if (session.user.role === "sub-admin") {
      const userPermissions = session.user.permissions || []
      if (!hasPermission(userPermissions, "projects.edit" as PermissionKey)) {
        return NextResponse.json({ success: false, message: "Permission denied. You need 'projects.edit' permission." }, { status: 403 })
      }
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

    // Check permission for sub-admin - require projects.delete
    if (session.user.role === "sub-admin") {
      const userPermissions = session.user.permissions || []
      if (!hasPermission(userPermissions, "projects.delete" as PermissionKey)) {
        return NextResponse.json({ success: false, message: "Permission denied. You need 'projects.delete' permission." }, { status: 403 })
      }
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

