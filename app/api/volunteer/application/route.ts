import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import dbConnect from "@/lib/mongodb"
import NSSApplication from "@/models/NSSApplication"

export async function GET(_request: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as any
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    await dbConnect()
    const application = await NSSApplication.findOne({ userId: session.user.id })
      .populate("userId", "name email")
      .populate("reviewedBy", "name")
      .sort({ createdAt: -1 })
      .lean()

    if (!application) {
      // Return success with null application instead of 404 error
      // This prevents client-side handling issues for users passing other checks
      return NextResponse.json({ success: true, application: null })
    }

    return NextResponse.json({ success: true, application })
  } catch (error) {
    console.error("Error fetching volunteer application:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

