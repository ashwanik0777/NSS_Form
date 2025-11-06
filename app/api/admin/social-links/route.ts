import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import dbConnect from "@/lib/mongodb"
import SocialLinks from "@/models/SocialLinks"

export async function GET() {
  try {
    await dbConnect()
    const doc = await SocialLinks.findOne({ key: "nss" }).lean()
    return NextResponse.json({ success: true, links: doc || {} })
  } catch (e) {
    return NextResponse.json({ success: false, message: "Failed to load" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session as any).user?.role === "user") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
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


