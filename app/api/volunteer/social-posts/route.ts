import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import dbConnect from "@/lib/mongodb"
import SocialMediaPost from "@/models/SocialMediaPost"
import PostView from "@/models/PostView"
import VolunteerPoints from "@/models/VolunteerPoints"

export async function GET(request: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as any
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "volunteer") {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 })
    }

    await dbConnect()

    // Get all active posts
    const posts = await SocialMediaPost.find({ isActive: true })
      .sort({ createdAt: -1 })
      .lean()

    // Get volunteer's views
    const volunteerViews = await PostView.find({ volunteerId: session.user.id }).lean()
    const viewedPostIds = new Set(volunteerViews.map((v) => v.postId.toString()))

    // Get volunteer's points
    const volunteerPoints = await VolunteerPoints.findOne({ volunteerId: session.user.id }).lean()

    // Calculate missing posts count
    const allPostIds = posts.map((p: any) => p._id.toString())
    const missingCount = allPostIds.filter((id) => !viewedPostIds.has(id)).length

    // Add view status and platform clicks to each post
    const postsWithStatus = posts.map((post: any) => {
      const view = volunteerViews.find((v) => v.postId.toString() === post._id.toString())
      const clickedPlatforms = view?.clickedPlatforms || []
      return {
        ...post,
        isViewed: !!view,
        viewedAt: view?.viewedAt || null,
        clickedPlatforms,
      }
    })

    return NextResponse.json({
      success: true,
      posts: postsWithStatus,
      missingCount,
      totalPoints: volunteerPoints?.totalPoints || 0,
    })
  } catch (error: any) {
    console.error("Error fetching social posts:", error)
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as any
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "volunteer") {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 })
    }

    await dbConnect()

    const body = await request.json()
    const { postId, platform } = body

    if (!postId || !platform) {
      return NextResponse.json({ success: false, message: "Post ID and platform are required" }, { status: 400 })
    }

    // Check if post exists and is active
    const post = await SocialMediaPost.findById(postId)
    if (!post || !post.isActive) {
      return NextResponse.json({ success: false, message: "Post not found or inactive" }, { status: 404 })
    }

    // Validate platform
    const validPlatforms = ["facebook", "instagram", "twitter", "linkedin", "youtube"]
    if (!validPlatforms.includes(platform)) {
      return NextResponse.json({ success: false, message: "Invalid platform" }, { status: 400 })
    }

    // Check if platform link exists for this post
    const platformLinks = post.platformLinks || {}
    if (!platformLinks[platform]) {
      return NextResponse.json({ success: false, message: `No ${platform} link available for this post` }, { status: 400 })
    }

    // Get or create post view
    let postView = await PostView.findOne({ volunteerId: session.user.id, postId })
    
    if (!postView) {
      // First time viewing - create view record
      postView = await PostView.create({
        volunteerId: session.user.id,
        postId,
        viewedAt: new Date(),
        clickedPlatforms: [],
        platformPoints: {},
      })
    }

    // Check if already clicked this platform
    const clickedPlatforms = postView.clickedPlatforms || []
    if (clickedPlatforms.includes(platform)) {
      return NextResponse.json({
        success: true,
        message: "Already clicked this platform",
        pointsAwarded: false,
        pointsEarned: 0,
        totalPoints: (await VolunteerPoints.findOne({ volunteerId: session.user.id }))?.totalPoints || 0,
      })
    }

    // Award 2.5 points per platform click
    const pointsPerPlatform = 2.5
    const pointsDoc = await VolunteerPoints.findOneAndUpdate(
      { volunteerId: session.user.id },
      {
        $inc: { totalPoints: pointsPerPlatform },
        $push: {
          pointsHistory: {
            points: pointsPerPlatform,
            source: "social_post",
            sourceId: post._id,
            description: `Clicked ${platform} link for post: ${post.title}`,
            earnedAt: new Date(),
          },
        },
      },
      { upsert: true, new: true },
    )

    // Update post view with clicked platform
    postView.clickedPlatforms = [...clickedPlatforms, platform]
    postView.platformPoints = {
      ...(postView.platformPoints || {}),
      [platform]: pointsPerPlatform,
    }
    postView.viewedAt = new Date()
    await postView.save()

    // Check for achievements
    const totalPoints = pointsDoc.totalPoints
    const achievements = []

    if (totalPoints >= 100 && !pointsDoc.achievements.find((a: any) => a.achievementId === "century")) {
      achievements.push({
        achievementId: "century",
        name: "Century Club",
        description: "Earned 100 points!",
      })
    }
    if (totalPoints >= 500 && !pointsDoc.achievements.find((a: any) => a.achievementId === "half_k")) {
      achievements.push({
        achievementId: "half_k",
        name: "Half K Champion",
        description: "Earned 500 points!",
      })
    }

    if (achievements.length > 0) {
      await VolunteerPoints.findByIdAndUpdate(pointsDoc._id, {
        $push: { achievements: { $each: achievements.map((a) => ({ ...a, earnedAt: new Date() })) } },
      })
    }

    return NextResponse.json({
      success: true,
      pointsAwarded: true,
      pointsEarned: pointsPerPlatform,
      totalPoints: pointsDoc.totalPoints,
    })
  } catch (error: any) {
    console.error("Error recording platform click:", error)
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}

