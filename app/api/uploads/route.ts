import { NextRequest, NextResponse } from "next/server"
import fs from "fs/promises"
import path from "path"

export async function POST(request: NextRequest) {
  try {
    const form = await request.formData()
    const file = form.get("file") as unknown as File | null
    if (!file) {
      return NextResponse.json({ success: false, message: "No file provided" }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const uploadsDir = path.join(process.cwd(), "public", "uploads")
    await fs.mkdir(uploadsDir, { recursive: true })

    const ext = (file.name.split(".").pop() || "").toLowerCase()
    const safeExt = ext.slice(0, 8)
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${safeExt || "bin"}`
    const filepath = path.join(uploadsDir, filename)

    await fs.writeFile(filepath, buffer)

    const url = `/uploads/${filename}`
    return NextResponse.json({ success: true, url })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ success: false, message: "Upload failed" }, { status: 500 })
  }
}


