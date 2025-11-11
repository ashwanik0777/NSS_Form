import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import connectDB from "@/lib/mongodb"
import SocialMediaPost from "@/models/SocialMediaPost"
import PostView from "@/models/PostView"
import User from "@/models/User"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const user = session.user as any
    if (user.role !== "admin" && user.role !== "sub-admin") {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 })
    }

    await connectDB()

    const { searchParams } = new URL(request.url)
    const includeStats = searchParams.get("stats") === "true"

    const posts = await SocialMediaPost.find()
      .populate("postedBy", "name email")
      .sort({ createdAt: -1 })
      .lean()

    if (includeStats) {
      const postsWithStats = await Promise.all(
        posts.map(async (post: any) => {
          const viewCount = await PostView.countDocuments({ postId: post._id })
          const totalVolunteers = await User.countDocuments({ role: "volunteer" })
          return {
            ...post,
            viewCount,
            totalVolunteers,
            viewPercentage: totalVolunteers > 0 ? Math.round((viewCount / totalVolunteers) * 100) : 0,
          }
        }),
      )
      return NextResponse.json({ success: true, posts: postsWithStats })
    }

    return NextResponse.json({ success: true, posts })
  } catch (error: any) {
    console.error("Error fetching social posts:", error)
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const user = session.user as any
    if (user.role !== "admin" && user.role !== "sub-admin") {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 })
    }

    await connectDB()

    const body = await request.json()
    const { title, description, image, platform, postUrl, pointsReward } = body

    if (!title || !platform) {
      return NextResponse.json({ success: false, message: "Title and platform are required" }, { status: 400 })
    }

    const post = await SocialMediaPost.create({
      title,
      description,
      image,
      platform,
      postUrl,
      postedBy: user.id,
      pointsReward: pointsReward || 10,
      isActive: true,
    })

    await post.populate("postedBy", "name email")

    return NextResponse.json({ success: true, post }, { status: 201 })
  } catch (error: any) {
    console.error("Error creating social post:", error)
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const user = session.user as any
    if (user.role !== "admin" && user.role !== "sub-admin") {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 })
    }

    await connectDB()

    const body = await request.json()
    const { postId, title, description, image, platform, postUrl, isActive, pointsReward } = body

    if (!postId) {
      return NextResponse.json({ success: false, message: "Post ID is required" }, { status: 400 })
    }

    const updateData: any = {}
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (image !== undefined) updateData.image = image
    if (platform !== undefined) updateData.platform = platform
    if (postUrl !== undefined) updateData.postUrl = postUrl
    if (isActive !== undefined) updateData.isActive = isActive
    if (pointsReward !== undefined) updateData.pointsReward = pointsReward

    const post = await SocialMediaPost.findByIdAndUpdate(postId, updateData, { new: true }).populate(
      "postedBy",
      "name email",
    )

    if (!post) {
      return NextResponse.json({ success: false, message: "Post not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, post })
  } catch (error: any) {
    console.error("Error updating social post:", error)
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const user = session.user as any
    if (user.role !== "admin" && user.role !== "sub-admin") {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 })
    }

    await connectDB()

    const { searchParams } = new URL(request.url)
    const postId = searchParams.get("postId")

    if (!postId) {
      return NextResponse.json({ success: false, message: "Post ID is required" }, { status: 400 })
    }

    await SocialMediaPost.findByIdAndDelete(postId)
    await PostView.deleteMany({ postId })

    return NextResponse.json({ success: true, message: "Post deleted successfully" })
  } catch (error: any) {
    console.error("Error deleting social post:", error)
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}

