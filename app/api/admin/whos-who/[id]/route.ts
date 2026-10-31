import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import dbConnect from "@/lib/mongodb"
import Leadership from "@/models/Leadership"

export async function PATCH(request: NextRequest, context: any) {
  try {
    const session = (await getServerSession(authOptions)) as any
    if (!session || (session.user.role !== "admin" && session.user.role !== "sub-admin")) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const { id } = await (context.params || {})
    if (!id) {
      return NextResponse.json({ success: false, message: "ID is required" }, { status: 400 })
    }

    const body = await request.json()
    await dbConnect()

    const member = await Leadership.findById(id)
    if (!member) {
      return NextResponse.json({ success: false, message: "Member not found" }, { status: 404 })
    }

    const fields = [
      "name",
      "designation",
      "category",
      "unitNo",
      "department",
      "school",
      "email",
      "phone",
      "photo",
      "bio",
      "order",
      "isActive",
    ]

    fields.forEach((field) => {
      if (body[field] !== undefined) {
        member[field] = body[field]
      }
    })

    await member.save()

    return NextResponse.json({
      success: true,
      message: "Member updated successfully",
      member,
    })
  } catch (error: any) {
    console.error("Admin error updating leadership member:", error)
    return NextResponse.json(
      { success: false, message: error.message || "Failed to update member" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, context: any) {
  try {
    const session = (await getServerSession(authOptions)) as any
    if (!session || (session.user.role !== "admin" && session.user.role !== "sub-admin")) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const { id } = await (context.params || {})
    if (!id) {
      return NextResponse.json({ success: false, message: "ID is required" }, { status: 400 })
    }

    await dbConnect()
    const member = await Leadership.findByIdAndDelete(id)
    if (!member) {
      return NextResponse.json({ success: false, message: "Member not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "Member deleted successfully",
    })
  } catch (error: any) {
    console.error("Admin error deleting leadership member:", error)
    return NextResponse.json(
      { success: false, message: error.message || "Failed to delete member" },
      { status: 500 }
    )
  }
}
