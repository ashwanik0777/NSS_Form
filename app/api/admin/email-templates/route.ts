import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import dbConnect from "@/lib/mongodb"
import EmailTemplate from "@/models/EmailTemplate"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    await dbConnect()
    const templates = await EmailTemplate.find().sort({ createdAt: -1 })

    return NextResponse.json({
      success: true,
      templates,
    })
  } catch (error) {
    console.error("Error fetching templates:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    await dbConnect()
    const body = await request.json()
    const { name, subject, content, type } = body

    const template = await EmailTemplate.create({
      name,
      subject,
      content,
      type,
    })

    return NextResponse.json({
      success: true,
      template,
    })
  } catch (error) {
    console.error("Error creating template:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
