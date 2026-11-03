import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import dbConnect from "@/lib/mongodb"
import Gallery from "@/models/Gallery"
import { v2 as cloudinary } from "cloudinary"

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

function isAuthorized(session: any) {
  return session?.user?.id && (session.user.role === "admin" || session.user.role === "sub-admin")
}

// ── GET: Fetch gallery photos with filters & pagination ──────────────────────
export async function GET(request: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as any
    if (!isAuthorized(session)) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    await dbConnect()

    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")
    const search = searchParams.get("search")?.trim()
    const featured = searchParams.get("featured")
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "30", 10)))
    const skip = (page - 1) * limit

    const query: Record<string, any> = {}

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

    const [items, total, categoryCounts] = await Promise.all([
      Gallery.find(query)
        .populate("uploadedBy", "name email")
        .sort({ eventDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Gallery.countDocuments(query),
      Gallery.aggregate([
        { $group: { _id: "$category", count: { $sum: 1 } } },
      ]),
    ])

    const stats: Record<string, number> = { All: 0 }
    categoryCounts.forEach((c: any) => {
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
    console.error("Error fetching admin gallery:", error)
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch gallery" },
      { status: 500 }
    )
  }
}

// ── POST: Add photo (direct Cloudinary upload or pre-uploaded JSON) ──────────
export async function POST(request: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as any
    if (!isAuthorized(session)) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    await dbConnect()

    const contentType = request.headers.get("content-type") || ""

    // Case 1: Multi-part FormData with direct file upload
    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData()
      const file = form.get("file") as unknown as File | null
      const title = form.get("title") as string
      const description = (form.get("description") as string) || ""
      const category = (form.get("category") as string) || "Events"
      const eventDate = form.get("eventDate") ? new Date(form.get("eventDate") as string) : new Date()
      const isFeatured = form.get("isFeatured") === "true"
      const isVisibleVal = form.get("isVisible") !== "false"

      if (!file) {
        return NextResponse.json({ success: false, message: "No image file provided" }, { status: 400 })
      }
      let finalTitle = title?.trim()
      if (!finalTitle) {
        const fallback = file.name ? file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ") : "NSS Gallery Photo"
        finalTitle = fallback.charAt(0).toUpperCase() + fallback.slice(1)
      }

      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)

      // Upload directly to Cloudinary in "nss-gallery" folder
      const uploadResult = await new Promise<any>((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              folder: "nss-gallery",
              resource_type: "image",
              transformation: [
                { width: 1920, height: 1920, crop: "limit" },
                { quality: "auto" },
              ],
            },
            (err, res) => {
              if (err) reject(err)
              else resolve(res)
            }
          )
          .end(buffer)
      })

      const newItem = await Gallery.create({
        title: finalTitle,
        description: description.trim(),
        imageUrl: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        category: category || "Other",
        eventDate,
        isFeatured,
        isVisible: isVisibleVal,
        uploadedBy: session.user.id,
      })

      return NextResponse.json({
        success: true,
        message: "Photo uploaded and added to gallery successfully",
        item: newItem,
      })
    }

    // Case 2: JSON payload (image already uploaded to Cloudinary via frontend)
    const body = await request.json()
    const { title, description, imageUrl, publicId, category, eventDate, isFeatured, isVisible, tags } = body

    if (!title || !imageUrl) {
      return NextResponse.json(
        { success: false, message: "Title and Image URL are required" },
        { status: 400 }
      )
    }

    const newItem = await Gallery.create({
      title: title.trim(),
      description: description ? description.trim() : "",
      imageUrl,
      publicId: publicId || "",
      category: category || "Other",
      eventDate: eventDate ? new Date(eventDate) : new Date(),
      isFeatured: !!isFeatured,
      isVisible: isVisible !== false,
      tags: Array.isArray(tags) ? tags : [],
      uploadedBy: session.user.id,
    })

    return NextResponse.json({
      success: true,
      message: "Gallery item created successfully",
      item: newItem,
    })
  } catch (error: any) {
    console.error("Error creating gallery item:", error)
    return NextResponse.json(
      { success: false, message: error.message || "Failed to create gallery item" },
      { status: 500 }
    )
  }
}

// ── PATCH: Update existing photo details or bulk toggle visibility ──────────
export async function PATCH(request: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as any
    if (!isAuthorized(session)) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    await dbConnect()

    const body = await request.json()
    const { id, action, isVisible, title, description, category, eventDate, isFeatured, tags, ids } = body

    // ── Bulk Visibility Action (Show all / Hide all at once) ─────────────────
    if (action === "bulkVisibility") {
      const visibilityVal = isVisible !== false
      const filter: Record<string, any> = {}
      if (Array.isArray(ids) && ids.length > 0) {
        filter._id = { $in: ids }
      }
      const result = await Gallery.updateMany(filter, { $set: { isVisible: visibilityVal } })
      return NextResponse.json({
        success: true,
        message: `Successfully set ${result.modifiedCount} photos to ${visibilityVal ? "visible" : "hidden"}`,
        modifiedCount: result.modifiedCount,
      })
    }

    if (!id) {
      return NextResponse.json({ success: false, message: "Item ID is required" }, { status: 400 })
    }

    const updateData: Record<string, any> = {}
    if (title !== undefined) updateData.title = title.trim()
    if (description !== undefined) updateData.description = description.trim()
    if (category !== undefined) updateData.category = category || "Other"
    if (eventDate !== undefined) updateData.eventDate = new Date(eventDate)
    if (isFeatured !== undefined) updateData.isFeatured = !!isFeatured
    if (isVisible !== undefined) updateData.isVisible = !!isVisible
    if (tags !== undefined) updateData.tags = Array.isArray(tags) ? tags : []

    const updated = await Gallery.findByIdAndUpdate(id, updateData, { new: true })

    if (!updated) {
      return NextResponse.json({ success: false, message: "Item not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "Gallery item updated successfully",
      item: updated,
    })
  } catch (error: any) {
    console.error("Error updating gallery item:", error)
    return NextResponse.json(
      { success: false, message: error.message || "Failed to update item" },
      { status: 500 }
    )
  }
}

// ── DELETE: Remove photo from database & delete from Cloudinary ──────────────
export async function DELETE(request: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as any
    if (!isAuthorized(session)) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    await dbConnect()

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ success: false, message: "Item ID is required" }, { status: 400 })
    }

    const item = await Gallery.findById(id)
    if (!item) {
      return NextResponse.json({ success: false, message: "Item not found" }, { status: 404 })
    }

    // Try deleting from Cloudinary if publicId exists
    if (item.publicId) {
      try {
        await cloudinary.uploader.destroy(item.publicId)
      } catch (cloudErr) {
        console.warn("Could not delete image from Cloudinary (publicId may not match):", cloudErr)
      }
    }

    await Gallery.findByIdAndDelete(id)

    return NextResponse.json({
      success: true,
      message: "Gallery photo deleted successfully",
    })
  } catch (error: any) {
    console.error("Error deleting gallery photo:", error)
    return NextResponse.json(
      { success: false, message: error.message || "Failed to delete photo" },
      { status: 500 }
    )
  }
}

