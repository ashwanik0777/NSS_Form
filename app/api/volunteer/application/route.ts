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

    // Find all applications for the user to select the best one
    // Prioritize: approved > under-review > submitted > rejected > draft
    const applications = await NSSApplication.find({ userId: session.user.id })
      .populate("userId", "name email")
      .populate("reviewedBy", "name")
      .sort({ createdAt: -1 }) // Get latest first, but we will sort by priority
      .lean();

    if (!applications || applications.length === 0) {
      return NextResponse.json({ success: true, application: null })
    }

    // Define priority map
    const priorityMap: Record<string, number> = {
      "approved": 4,
      "under-review": 3,
      "submitted": 2,
      "rejected": 1,
      "draft": 0
    };

    // Sort to get best application
    const application = applications.sort((a: any, b: any) => {
      const pA = priorityMap[a.status] || 0;
      const pB = priorityMap[b.status] || 0;
      return pB - pA; // Descending priority
    })[0];

    return NextResponse.json({ success: true, application })
  } catch (error) {
    console.error("Error fetching volunteer application:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

