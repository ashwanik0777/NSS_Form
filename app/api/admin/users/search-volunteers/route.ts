import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import dbConnect from "@/lib/mongodb"
import User from "@/models/User"
import NSSApplication from "@/models/NSSApplication"

function escapeRegex(text: string): string {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&")
}

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as any
    if (!session?.user?.id || (session.user.role !== "admin" && session.user.role !== "sub-admin")) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    await dbConnect()

    const { searchParams } = new URL(request.url)
    const query = (searchParams.get("q") || "").trim()

    if (!query || query.length < 2) {
      return NextResponse.json({ success: true, volunteers: [] })
    }

    const escaped = escapeRegex(query)
    const digitsOnly = query.replace(/\D/g, "")

    // Search users by name, email, phone
    const matchingUsers = await User.find({
      $or: [
        { name: { $regex: escaped, $options: "i" } },
        { email: { $regex: escaped, $options: "i" } },
        { phone: { $regex: escaped, $options: "i" } },
      ],
      role: { $in: ["volunteer", "user"] },
    })
      .select("_id")
      .limit(30)
      .lean()

    const userIdsFromUsers = matchingUsers.map((u: any) => u._id)

    const appOrConditions: any[] = [
      { nameEnglish: { $regex: escaped, $options: "i" } },
      { nameHindi: { $regex: escaped, $options: "i" } },
      { emailId: { $regex: escaped, $options: "i" } },
      { mobileNo: { $regex: escaped, $options: "i" } },
      { institutionalIdCard: { $regex: escaped, $options: "i" } },
      { formNo: { $regex: escaped, $options: "i" } },
    ]

    if (digitsOnly.length >= 3) {
      appOrConditions.push({ mobileNo: { $regex: digitsOnly, $options: "i" } })
    }
    if (userIdsFromUsers.length > 0) {
      appOrConditions.push({ userId: { $in: userIdsFromUsers } })
    }

    // Search in approved applications
    const applications = await NSSApplication.find({
      status: "approved",
      $or: appOrConditions,
    })
      .select("userId nameEnglish emailId mobileNo institutionalIdCard")
      .limit(30)
      .lean()

    const userIds = [
      ...new Set([
        ...userIdsFromUsers.map((id: any) => id.toString()),
        ...applications.map((app) => app.userId?.toString()).filter(Boolean),
      ]),
    ]

    if (userIds.length === 0) {
      return NextResponse.json({ success: true, volunteers: [] })
    }

    // Get user details
    const users = await User.find({
      _id: { $in: userIds },
      role: { $in: ["volunteer", "user"] },
    })
      .select("_id name email phone")
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
        email: user.email || app?.emailId,
        mobileNo: app?.mobileNo || user.phone || "",
        institutionalIdCard: app?.institutionalIdCard || "",
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


