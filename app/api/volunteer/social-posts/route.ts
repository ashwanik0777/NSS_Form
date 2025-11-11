import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import connectDB from "@/lib/mongodb"
import SocialMediaPost from "@/models/SocialMediaPost"
import PostView from "@/models/PostView"
import VolunteerPoints from "@/models/VolunteerPoints"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const user = session.user as any
    if (user.role !== "volunteer") {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 })
    }

    await connectDB()

    // Get all active posts
    const posts = await SocialMediaPost.find({ isActive: true })
      .sort({ createdAt: -1 })
      .lean()

    // Get volunteer's views
    const volunteerViews = await PostView.find({ volunteerId: user.id }).lean()
    const viewedPostIds = new Set(volunteerViews.map((v) => v.postId.toString()))

    // Get volunteer's points
    const volunteerPoints = await VolunteerPoints.findOne({ volunteerId: user.id }).lean()

    // Calculate missing posts count
    const allPostIds = posts.map((p: any) => p._id.toString())
    const missingCount = allPostIds.filter((id) => !viewedPostIds.has(id)).length

    // Add view status to each post
    const postsWithStatus = posts.map((post: any) => {
      const view = volunteerViews.find((v) => v.postId.toString() === post._id.toString())
      return {
        ...post,
        isViewed: !!view,
        viewedAt: view?.viewedAt || null,
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
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const user = session.user as any
    if (user.role !== "volunteer") {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 })
    }

    await connectDB()

    const body = await request.json()
    const { postId } = body

    if (!postId) {
      return NextResponse.json({ success: false, message: "Post ID is required" }, { status: 400 })
    }

    // Check if post exists and is active
    const post = await SocialMediaPost.findById(postId)
    if (!post || !post.isActive) {
      return NextResponse.json({ success: false, message: "Post not found or inactive" }, { status: 404 })
    }

    // Check if already viewed (for points tracking)
    let postView = await PostView.findOne({ volunteerId: user.id, postId })
    let pointsAwarded = false
    let pointsEarned = 0

    if (!postView) {
      // First time viewing - create view record
      postView = await PostView.create({
        volunteerId: user.id,
        postId,
        viewedAt: new Date(),
        pointsAwarded: false,
      })

      // Award points (only once per post)
      const pointsDoc = await VolunteerPoints.findOneAndUpdate(
        { volunteerId: user.id },
        {
          $inc: { totalPoints: post.pointsReward },
          $push: {
            pointsHistory: {
              points: post.pointsReward,
              source: "social_post",
              sourceId: post._id,
              description: `Viewed social media post: ${post.title}`,
              earnedAt: new Date(),
            },
          },
        },
        { upsert: true, new: true },
      )

      // Mark points as awarded
      postView.pointsAwarded = true
      await postView.save()

      pointsAwarded = true
      pointsEarned = post.pointsReward

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
    } else {
      // Update view time (but don't award points again)
      postView.viewedAt = new Date()
      await postView.save()
    }

    return NextResponse.json({
      success: true,
      viewed: true,
      pointsAwarded,
      pointsEarned,
      totalPoints: (await VolunteerPoints.findOne({ volunteerId: user.id }))?.totalPoints || 0,
    })
  } catch (error: any) {
    console.error("Error recording post view:", error)
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}

