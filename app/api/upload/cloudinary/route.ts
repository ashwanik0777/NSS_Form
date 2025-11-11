import { NextRequest, NextResponse } from "next/server"
import { v2 as cloudinary } from "cloudinary"

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function POST(request: NextRequest) {
  try {
    const form = await request.formData()
    const file = form.get("file") as unknown as File | null
    if (!file) {
      return NextResponse.json({ success: false, message: "No file provided" }, { status: 400 })
    }

    // Determine if it's an image or video
    const isImage = file.type.startsWith("image/")
    const isVideo = file.type.startsWith("video/")

    if (!isImage && !isVideo) {
      return NextResponse.json(
        { success: false, message: "Only image and video files are allowed" },
        { status: 400 }
      )
    }

    // Validate file size (10MB for images, 100MB for videos)
    const maxSize = isImage ? 10 * 1024 * 1024 : 100 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, message: `File size must be less than ${isImage ? "10MB" : "100MB"}` },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      const uploadOptions: any = {
        folder: isImage ? "nss-uploads/images" : "nss-uploads/videos",
        resource_type: isImage ? "image" : "video",
      }

      // Add transformations for images
      if (isImage) {
        uploadOptions.transformation = [
          { width: 1920, height: 1920, crop: "limit" }, // Resize large images
          { quality: "auto" }, // Optimize quality
        ]
      }

      // Add video transformations
      if (isVideo) {
        uploadOptions.transformation = [
          { quality: "auto" }, // Optimize video quality
        ]
      }

      cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
        if (error) reject(error)
        else resolve(result)
      }).end(buffer)
    })

    const uploadResult = result as any

    return NextResponse.json({
      success: true,
      url: uploadResult.secure_url,
      public_id: uploadResult.public_id,
      message: "File uploaded successfully",
    })
  } catch (error: any) {
    console.error("Upload error:", error)
    return NextResponse.json(
      { success: false, message: error.message || "Upload failed" },
      { status: 500 }
    )
  }
}