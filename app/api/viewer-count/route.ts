import { NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import ViewerCount from "@/models/ViewerCount"

export async function GET() {
  try {
    await dbConnect()
    
    const viewerCount = await ViewerCount.findOne({})
    
    if (!viewerCount) {
      // Create initial count if doesn't exist
      const newCount = new ViewerCount({ count: 0 })
      await newCount.save()
      return NextResponse.json({ success: true, count: 0 })
    }
    
    return NextResponse.json({ success: true, count: viewerCount.count })
  } catch (error) {
    console.error("Error fetching viewer count:", error)
    return NextResponse.json({ success: false, count: 0 }, { status: 500 })
  }
}

export async function POST() {
  try {
    await dbConnect()
    
    // Increment count for unique visitor
    // Note: Uniqueness is checked on client side via localStorage
    // This endpoint is only called when client detects first-time visit
    const viewerCount = await ViewerCount.findOne({})
    
    if (!viewerCount) {
      const newCount = new ViewerCount({ count: 1 })
      await newCount.save()
      return NextResponse.json({ success: true, count: 1, isNew: true })
    }
    
    // Increment the count
    viewerCount.count += 1
    await viewerCount.save()
    
    return NextResponse.json({ success: true, count: viewerCount.count, isNew: true })
  } catch (error) {
    console.error("Error incrementing viewer count:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

