import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import dbConnect from "@/lib/mongodb"
import Task from "@/models/Task"

export async function GET(request: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as any
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "volunteer" && session.user.role !== "user" && session.user.role !== "sub-admin" && session.user.role !== "admin") {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 })
    }

    await dbConnect()

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")

    let query: any = { assignedTo: session.user.id }

    if (status && status !== "all") {
      query.status = status
    }

    const tasks = await Task.find(query)
      .populate("assignedBy", "name email")
      .sort({ createdAt: -1 })
      .lean()

    return NextResponse.json({
      success: true,
      tasks: tasks.map((task: any) => ({
        _id: task._id,
        title: task.title,
        description: task.description,
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
    console.error("Volunteer tasks fetch error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as any
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "volunteer" && session.user.role !== "user" && session.user.role !== "sub-admin" && session.user.role !== "admin") {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { taskId, status, completionNotes } = body

    if (!taskId) {
      return NextResponse.json({ success: false, message: "Task ID required" }, { status: 400 })
    }

    await dbConnect()

    const task = await Task.findOne({
      _id: taskId,
      assignedTo: session.user.id,
    })

    if (!task) {
      return NextResponse.json({ success: false, message: "Task not found" }, { status: 404 })
    }

    // Volunteers can only update status and completion notes
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


