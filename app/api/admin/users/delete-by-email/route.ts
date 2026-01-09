import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import dbConnect from "@/lib/mongodb"
import User from "@/models/User"
import { hasPermission, PermissionKey } from "@/lib/permissions"

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
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

    const { email } = await request.json()

    if (!email) {
       return NextResponse.json({ success: false, message: "Email is required" }, { status: 400 })
    }

    await dbConnect()

    const user = await User.findOne({ email })
    if (!user) {
        return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
    }

    if (user.role === 'admin') {
         return NextResponse.json({ success: false, message: "Cannot delete admin account" }, { status: 403 })
    }

    await User.findByIdAndDelete(user._id)

    return NextResponse.json({
      success: true,
      message: `User account for ${email} deleted successfully`,
    })
  } catch (error) {
    console.error("Error deleting user by email:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
