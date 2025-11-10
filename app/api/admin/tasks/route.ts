import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import dbConnect from "@/lib/mongodb"
import Task from "@/models/Task"
import User from "@/models/User"
import NSSApplication from "@/models/NSSApplication"
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

    // Check permission for sub-admin
    if (session.user.role === "sub-admin") {
      const userPermissions = session.user.permissions || []
      if (!hasPermission(userPermissions, "volunteers.view" as PermissionKey)) {
        return NextResponse.json({ success: false, message: "Permission denied" }, { status: 403 })
      }
    }

    await dbConnect()

    const { searchParams } = new URL(request.url)
    const volunteerId = searchParams.get("volunteerId")
    const status = searchParams.get("status")
    const unitNo = searchParams.get("unitNo")

    // Get sub-admin's assigned units
    let userAssignedUnits: string[] | null = null
    if (session.user.role === "sub-admin") {
      const user = await User.findById(session.user.id).select("assignedUnits").lean()
      if (user && (user as any).assignedUnits && (user as any).assignedUnits.length > 0) {
        userAssignedUnits = (user as any).assignedUnits
      }
    }

    let query: any = {}

    // Filter by volunteer if provided
    if (volunteerId) {
      query.assignedTo = volunteerId
    }

    // Filter by status if provided
    if (status && status !== "all") {
      query.status = status
    }

    // Unit-based filtering for sub-admins
    if (userAssignedUnits && userAssignedUnits.length > 0) {
      query.unitNo = { $in: userAssignedUnits }
    } else if (unitNo && unitNo !== "all") {
      query.unitNo = unitNo
    }

    const tasks = await Task.find(query)
      .populate("assignedTo", "name email")
      .populate("assignedBy", "name email")
      .sort({ createdAt: -1 })
      .lean()

    return NextResponse.json({
      success: true,
      tasks: tasks.map((task: any) => ({
        _id: task._id,
        title: task.title,
        description: task.description,
        assignedTo: {
          _id: task.assignedTo?._id,
          name: task.assignedTo?.name,
          email: task.assignedTo?.email,
        },
        assignedBy: {
          _id: task.assignedBy?._id,
          name: task.assignedBy?.name,
          email: task.assignedBy?.email,
        },
        unitNo: task.unitNo,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate,
        completedAt: task.completedAt,
        completionNotes: task.completionNotes,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
      })),
    })
  } catch (error) {
    console.error("Tasks fetch error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as any
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "admin" && session.user.role !== "sub-admin") {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 })
    }

    // Check permission for sub-admin
    if (session.user.role === "sub-admin") {
      const userPermissions = session.user.permissions || []
      if (!hasPermission(userPermissions, "volunteers.edit" as PermissionKey)) {
        return NextResponse.json({ success: false, message: "Permission denied. You need 'volunteers.edit' permission." }, { status: 403 })
      }
    }

    const body = await request.json()
    const { title, description, assignedTo, unitNo, priority, dueDate } = body

    if (!title || !description || !assignedTo || !unitNo) {
      return NextResponse.json(
        { success: false, message: "Title, description, assignedTo, and unitNo are required" },
        { status: 400 }
      )
    }

    await dbConnect()

    // Verify volunteer exists and get their unit
    const volunteer = await User.findById(assignedTo).lean()
    if (!volunteer || (volunteer.role !== "volunteer" && volunteer.role !== "user")) {
      return NextResponse.json({ success: false, message: "Invalid volunteer" }, { status: 400 })
    }

    // Get volunteer's application to verify unit
    const application = await NSSApplication.findOne({ userId: assignedTo }).lean()
    if (!application) {
      return NextResponse.json({ success: false, message: "Volunteer application not found" }, { status: 400 })
    }

    // Verify unit matches (for sub-admin, check if they have access to this unit)
    if (session.user.role === "sub-admin") {
      const user = await User.findById(session.user.id).select("assignedUnits").lean()
      const userAssignedUnits = (user as any)?.assignedUnits || []
      if (userAssignedUnits.length > 0 && !userAssignedUnits.includes(application.unitNo)) {
        return NextResponse.json(
          { success: false, message: "You can only assign tasks to volunteers in your assigned units" },
          { status: 403 }
        )
      }
    }

    // Verify unitNo matches volunteer's unit
    if (application.unitNo !== unitNo) {
      return NextResponse.json(
        { success: false, message: "Unit number does not match volunteer's unit" },
        { status: 400 }
      )
    }

    const task = new Task({
      title,
      description,
      assignedTo,
      assignedBy: session.user.id,
      unitNo: application.unitNo,
      priority: priority || "medium",
      dueDate: dueDate ? new Date(dueDate) : undefined,
      status: "pending",
    })

    await task.save()

    return NextResponse.json({
      success: true,
      message: "Task assigned successfully",
      task: {
        _id: task._id,
        title: task.title,
        description: task.description,
        assignedTo: task.assignedTo,
        assignedBy: task.assignedBy,
        unitNo: task.unitNo,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate,
        createdAt: task.createdAt,
      },
    })
  } catch (error) {
    console.error("Task creation error:", error)
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

    const body = await request.json()
    const { taskId, status, completionNotes, ...updateData } = body

    if (!taskId) {
      return NextResponse.json({ success: false, message: "Task ID required" }, { status: 400 })
    }

    await dbConnect()

    const task = await Task.findById(taskId)
    if (!task) {
      return NextResponse.json({ success: false, message: "Task not found" }, { status: 404 })
    }

    // Check permission for sub-admin
    if (session.user.role === "sub-admin") {
      const userPermissions = session.user.permissions || []
      if (!hasPermission(userPermissions, "volunteers.edit" as PermissionKey)) {
        return NextResponse.json({ success: false, message: "Permission denied. You need 'volunteers.edit' permission." }, { status: 403 })
      }

      // Verify sub-admin has access to this task's unit
      const user = await User.findById(session.user.id).select("assignedUnits").lean()
      const userAssignedUnits = (user as any)?.assignedUnits || []
      if (userAssignedUnits.length > 0 && !userAssignedUnits.includes(task.unitNo)) {
        return NextResponse.json({ success: false, message: "You don't have permission to modify this task" }, { status: 403 })
      }
    }

    // Update task
    if (status) {
      task.status = status
      if (status === "completed") {
        task.completedAt = new Date()
      } else if (status !== "completed" && task.completedAt) {
        task.completedAt = undefined
      }
    }

    if (completionNotes !== undefined) {
      task.completionNotes = completionNotes
    }

    if (updateData.title) task.title = updateData.title
    if (updateData.description) task.description = updateData.description
    if (updateData.priority) task.priority = updateData.priority
    if (updateData.dueDate) task.dueDate = new Date(updateData.dueDate)

    await task.save()

    return NextResponse.json({
      success: true,
      message: "Task updated successfully",
      task,
    })
  } catch (error) {
    console.error("Task update error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as any
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "admin" && session.user.role !== "sub-admin") {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const taskId = searchParams.get("id")

    if (!taskId) {
      return NextResponse.json({ success: false, message: "Task ID required" }, { status: 400 })
    }

    await dbConnect()

    const task = await Task.findById(taskId)
    if (!task) {
      return NextResponse.json({ success: false, message: "Task not found" }, { status: 404 })
    }

    // Check permission for sub-admin
    if (session.user.role === "sub-admin") {
      const userPermissions = session.user.permissions || []
      if (!hasPermission(userPermissions, "volunteers.edit" as PermissionKey)) {
        return NextResponse.json({ success: false, message: "Permission denied. You need 'volunteers.edit' permission." }, { status: 403 })
      }

      // Verify sub-admin has access to this task's unit
      const user = await User.findById(session.user.id).select("assignedUnits").lean()
      const userAssignedUnits = (user as any)?.assignedUnits || []
      if (userAssignedUnits.length > 0 && !userAssignedUnits.includes(task.unitNo)) {
        return NextResponse.json({ success: false, message: "You don't have permission to delete this task" }, { status: 403 })
      }
    }

    await Task.findByIdAndDelete(taskId)

    return NextResponse.json({
      success: true,
      message: "Task deleted successfully",
    })
  } catch (error) {
    console.error("Task deletion error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}


