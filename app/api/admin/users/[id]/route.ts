import { type NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import User from "@/models/User"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { hasPermission, PermissionKey } from "@/lib/permissions"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = (await getServerSession(authOptions)) as any
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "admin" && session.user.role !== "sub-admin") {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 })
    }

    // Check permission for sub-admin - require users.edit
    if (session.user.role === "sub-admin") {
      const userPermissions = session.user.permissions || []
      if (!hasPermission(userPermissions, "users.edit" as PermissionKey)) {
        return NextResponse.json({ success: false, message: "Permission denied. You need 'users.edit' permission." }, { status: 403 })
      }
    }

    await dbConnect()

    const body = await request.json()
    const { name, email, role, hierarchy, permissions, assignedUnits } = body

    const updateData: any = {
      name,
      email,
      role,
      permissions: permissions || [],
      assignedUnits: assignedUnits || [],
      status: "accepted", // Accept karte waqt status update karein
    }

    if (hierarchy !== undefined) {
      updateData.hierarchy = hierarchy || undefined
    }

    const user = await User.findByIdAndUpdate(
      params.id,
      updateData,
      { new: true },
    ).select("-password")

    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      user,
    })
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = (await getServerSession(authOptions)) as any
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "admin" && session.user.role !== "sub-admin") {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 })
    }

    // Check permission for sub-admin - require users.delete
    if (session.user.role === "sub-admin") {
      const userPermissions = session.user.permissions || []
      if (!hasPermission(userPermissions, "users.delete" as PermissionKey)) {
        return NextResponse.json({ success: false, message: "Permission denied. You need 'users.delete' permission." }, { status: 403 })
      }
    }

    await dbConnect()

    const user = await User.findById(params.id)

    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
    }

    // Prevent deletion of admin users
    if (user.role === "admin") {
      return NextResponse.json({ success: false, message: "Cannot delete admin users" }, { status: 403 })
    }

    await User.findByIdAndDelete(params.id)

    return NextResponse.json({
      success: true,
      message: "User deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
