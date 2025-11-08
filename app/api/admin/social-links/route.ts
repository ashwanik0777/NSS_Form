import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import dbConnect from "@/lib/mongodb"
import SocialLinks from "@/models/SocialLinks"
import { hasPermission, PermissionKey } from "@/lib/permissions"

export async function GET(request: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as any
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "admin" && session.user.role !== "sub-admin") {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 })
    }

    // Check permission for sub-admin
    if (session.user.role === "sub-admin") {
      const userPermissions = session.user.permissions || []
      if (!hasPermission(userPermissions, "social.view" as PermissionKey)) {
        return NextResponse.json({ success: false, message: "Permission denied" }, { status: 403 })
      }
    }

    await dbConnect()
    const doc = await SocialLinks.findOne({ key: "nss" }).lean()
    return NextResponse.json({ success: true, links: doc || {} })
  } catch (e) {
    return NextResponse.json({ success: false, message: "Failed to load" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as any
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "admin" && session.user.role !== "sub-admin") {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 })
    }

    // Check permission for sub-admin - require social.edit
    if (session.user.role === "sub-admin") {
      const userPermissions = session.user.permissions || []
      if (!hasPermission(userPermissions, "social.edit" as PermissionKey)) {
        return NextResponse.json({ success: false, message: "Permission denied. You need 'social.edit' permission." }, { status: 403 })
      }
    }

    const body = await request.json()
    await dbConnect()
    const updated = await SocialLinks.findOneAndUpdate(
      { key: "nss" },
      { $set: {
        facebook: body.facebook || "",
        instagram: body.instagram || "",
        twitter: body.twitter || "",
        linkedin: body.linkedin || "",
      } },
      { new: true, upsert: true }
    ).lean()

    return NextResponse.json({ success: true, links: updated })
  } catch (e) {
    return NextResponse.json({ success: false, message: "Failed to save" }, { status: 500 })
  }
}


