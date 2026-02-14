import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import dbConnect from "@/lib/mongodb"
import User from "@/models/User"
import NSSApplication from "@/models/NSSApplication"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as any
    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    await dbConnect()

    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q") || ""

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ success: true, volunteers: [] })
    }

    // Search in approved applications by name
    const applications = await NSSApplication.find({
      status: "approved",
      nameEnglish: { $regex: new RegExp(query.trim(), "i") },
    })
      .select("userId nameEnglish emailId")
      .limit(20)
      .lean()

    const userIds = applications.map((app) => app.userId).filter(Boolean)

    if (userIds.length === 0) {
      return NextResponse.json({ success: true, volunteers: [] })
    }

    // Get user details
    const users = await User.find({
      _id: { $in: userIds },
      role: { $in: ["volunteer", "user"] },
    })
      .select("_id name email")
      .lean()

    // Map applications to users
    const applicationMap = new Map(
      applications.map((app: any) => [app.userId?.toString(), app])
    )

    const volunteers = users.map((user: any) => {
      const app = applicationMap.get(user._id.toString())
      return {
        _id: user._id,
        name: app?.nameEnglish || user.name,
        email: app?.emailId || user.email,
      }
    })

    return NextResponse.json({
      success: true,
      volunteers,
    })
  } catch (error) {
    console.error("Error searching volunteers:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}


