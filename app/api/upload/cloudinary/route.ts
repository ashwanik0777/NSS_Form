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
    const data = await request.formData()
    const file = data.get("file") as File

    if (!file) {
      return NextResponse.json({ success: false, message: "No file received" }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png"]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, message: "Only JPG, JPEG, and PNG files are allowed" },
        { status: 400 }
      )
    }

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, message: "File size must be less than 2MB" },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: "image",
          folder: "nss-registration", // Optional: organize uploads in a folder
          transformation: [
            { width: 800, height: 800, crop: "limit" }, // Resize large images
            { quality: "auto" }, // Optimize quality
          ],
        },
        (error, result) => {
          if (error) reject(error)
          else resolve(result)
        }
      ).end(buffer)
    })

    const uploadResult = result as any

    return NextResponse.json({
      success: true,
      url: uploadResult.secure_url,
      public_id: uploadResult.public_id,
      message: "File uploaded successfully",
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json(
      { success: false, message: "Upload failed" },
      { status: 500 }
    )
  }
}