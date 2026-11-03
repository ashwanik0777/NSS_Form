import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import dbConnect from "@/lib/mongodb"
import Leadership from "@/models/Leadership"

export async function GET(request: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as any
    if (!session || (session.user.role !== "admin" && session.user.role !== "sub-admin")) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    await dbConnect()
    const members = await Leadership.find().sort({ order: 1, createdAt: 1 }).lean()

    return NextResponse.json({
      success: true,
      members,
    })
  } catch (error: any) {
    console.error("Admin error fetching leadership:", error)
    return NextResponse.json(
      { success: false, message: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as any
    if (!session || (session.user.role !== "admin" && session.user.role !== "sub-admin")) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, designation, category, unitNo, department, school, email, phone, photo, bio, order, isActive } = body

    if (!name || !designation) {
      return NextResponse.json(
        { success: false, message: "Name and designation are required" },
        { status: 400 }
      )
    }

    await dbConnect()

    const newMember = await Leadership.create({
      name,
      designation,
      category: category || "officer",
      unitNo: unitNo || "All Units",
      department: department || "",
      school: school || "",
      email: email || "",
      phone: phone || "",
      photo: photo || "",
      bio: bio || "",
      order: typeof order === "number" ? order : 0,
      isActive: isActive !== undefined ? isActive : true,
    })

    return NextResponse.json({
      success: true,
      message: "Member added successfully",
      member: newMember,
    })
  } catch (error: any) {
    console.error("Admin error creating leadership member:", error)
    return NextResponse.json(
      { success: false, message: error.message || "Failed to create member" },
      { status: 500 }
    )
  }
}

