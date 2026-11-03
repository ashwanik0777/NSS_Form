import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Gallery from "@/models/Gallery"

export async function GET(request: NextRequest) {
  try {
    await dbConnect()

    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")
    const search = searchParams.get("search")?.trim()
    const featured = searchParams.get("featured")
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "24", 10)))
    const skip = (page - 1) * limit

    const query: Record<string, any> = {
      isVisible: { $ne: false },
    }

    if (category && category !== "All") {
      query.category = category
    }

    if (featured === "true") {
      query.isFeatured = true
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } },
      ]
    }

    const [items, total, categoriesAggregation] = await Promise.all([
      Gallery.find(query)
        .select("title description imageUrl category eventDate isFeatured tags createdAt")
        .sort({ isFeatured: -1, eventDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Gallery.countDocuments(query),
      Gallery.aggregate([
        { $group: { _id: "$category", count: { $sum: 1 } } },
      ]),
    ])

    const stats: Record<string, number> = { All: 0 }
    categoriesAggregation.forEach((c: any) => {
      stats[c._id] = c.count
      stats.All += c.count
    })

    return NextResponse.json({
      success: true,
      items,
      stats,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit) || 1,
      },
    })
  } catch (error: any) {
    console.error("Public gallery error:", error)
    return NextResponse.json(
      { success: false, message: "Failed to fetch gallery items" },
      { status: 500 }
    )
  }
}

