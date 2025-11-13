import { NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import NSSApplication from "@/models/NSSApplication"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { hasPermission, PermissionKey } from "@/lib/permissions"

export async function GET() {
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
      if (!hasPermission(userPermissions, "applications.view" as PermissionKey)) {
        return NextResponse.json({ success: false, message: "Permission denied" }, { status: 403 })
      }
    }

    await dbConnect()

    // Get unique school names from applications
    const schools = await NSSApplication.distinct("schoolName", {
      schoolName: { $exists: true, $ne: "", $ne: null }
    })

    // Sort schools alphabetically
    const sortedSchools = schools
      .filter((school) => school && school.trim())
      .sort((a, b) => a.localeCompare(b))

    return NextResponse.json({
      success: true,
      schools: sortedSchools,
    })
  } catch (error) {
    console.error("Error fetching schools:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

