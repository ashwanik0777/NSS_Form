import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import dbConnect from "@/lib/mongodb"
import PostView from "@/models/PostView"
import User from "@/models/User"
import NSSApplication from "@/models/NSSApplication"
import { hasPermission, PermissionKey } from "@/lib/permissions"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
      if (!hasPermission(userPermissions, "social.view" as PermissionKey)) {
        return NextResponse.json({ success: false, message: "Permission denied" }, { status: 403 })
      }
    }

    const postId = params.id

    if (!postId) {
      return NextResponse.json({ success: false, message: "Post ID required" }, { status: 400 })
    }

    await dbConnect()

    // Get all views for this post
    const views = await PostView.find({ postId })
      .populate("volunteerId", "name email")
      .sort({ viewedAt: -1 })
      .lean()

    // Get application details for each viewer
    const viewerDetails = await Promise.all(
      views.map(async (view: any) => {
        const application = await NSSApplication.findOne({
          userId: view.volunteerId._id,
          status: "approved",
        })
          .select("nameEnglish emailId unitNo")
          .lean()

        return {
          _id: view.volunteerId._id,
          name: application?.nameEnglish || view.volunteerId.name || "Unknown",
          email: application?.emailId || view.volunteerId.email || "N/A",
          unitNo: application?.unitNo || "N/A",
          viewedAt: view.viewedAt,
          clickedPlatforms: view.clickedPlatforms || [],
          likedPlatforms: view.likedPlatforms || [],
          pointsAwarded: view.pointsAwarded || false,
        }
      })
    )

    return NextResponse.json({
      success: true,
      viewers: viewerDetails,
      totalViews: viewerDetails.length,
      totalLikes: viewerDetails.filter((v) => v.likedPlatforms.length > 0).length,
      totalCompleted: viewerDetails.filter((v) => v.pointsAwarded).length,
    })
  } catch (error) {
    console.error("Get viewers error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

