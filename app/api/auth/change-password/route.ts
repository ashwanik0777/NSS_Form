import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import dbConnect from "@/lib/mongodb"
import User from "@/models/User"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as any
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const { currentPassword, newPassword } = await request.json()
    if (!newPassword || typeof newPassword !== "string" || newPassword.length < 6) {
      return NextResponse.json({ success: false, message: "New password must be at least 6 characters" }, { status: 400 })
    }

    await dbConnect()
    const user = await User.findById(session.user.id)
    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
    }

    const requiresCurrent = !user.mustChangePassword
    if (requiresCurrent) {
      if (!currentPassword) {
        return NextResponse.json({ success: false, message: "Current password required" }, { status: 400 })
      }
      const valid = await bcrypt.compare(currentPassword, user.password)
      if (!valid) {
        return NextResponse.json({ success: false, message: "Current password is incorrect" }, { status: 400 })
      }
    }

    const hashed = await bcrypt.hash(newPassword, 10)
    user.password = hashed
    user.mustChangePassword = false
    await user.save()

    return NextResponse.json({ success: true, message: "Password updated" })
  } catch (error) {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}


