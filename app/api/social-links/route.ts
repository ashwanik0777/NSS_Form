import { NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import SocialLinks from "@/models/SocialLinks"

export async function GET() {
  try {
    await dbConnect()
    const doc = await SocialLinks.findOne({ key: "nss" }).lean()
    return NextResponse.json({ success: true, links: {
      facebook: doc?.facebook || "",
      instagram: doc?.instagram || "",
      twitter: doc?.twitter || "",
      linkedin: doc?.linkedin || "",
    } })
  } catch (e) {
    return NextResponse.json({ success: false, message: "Failed to load" }, { status: 500 })
  }
}


