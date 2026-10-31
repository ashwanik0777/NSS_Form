import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import dbConnect from "@/lib/mongodb"
import EmailTemplate from "@/models/EmailTemplate"

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = (await getServerSession(authOptions)) as any
    if (!session?.user || (session.user.role !== "admin" && session.user.role !== "sub-admin")) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    await dbConnect()
    const { id } = await context.params

    const deletedTemplate = await EmailTemplate.findByIdAndDelete(id)
    if (!deletedTemplate) {
      return NextResponse.json({ success: false, message: "Template not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: "Template deleted successfully" })
  } catch (error: any) {
    console.error("Error deleting template:", error)
    return NextResponse.json({ success: false, message: error.message || "Internal server error" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = (await getServerSession(authOptions)) as any
    if (!session?.user || (session.user.role !== "admin" && session.user.role !== "sub-admin")) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    await dbConnect()
    const { id } = await context.params
    const body = await request.json()
    const { name, subject, content, type } = body

    const updatedTemplate = await EmailTemplate.findByIdAndUpdate(
      id,
      { name, subject, content, type },
      { new: true }
    )

    if (!updatedTemplate) {
      return NextResponse.json({ success: false, message: "Template not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, template: updatedTemplate })
  } catch (error: any) {
    console.error("Error updating template:", error)
    return NextResponse.json({ success: false, message: error.message || "Internal server error" }, { status: 500 })
  }
}
