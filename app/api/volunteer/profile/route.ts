import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import dbConnect from "@/lib/mongodb"
import NSSApplication from "@/models/NSSApplication"

export async function GET(_request: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as any
    if (!session?.user?.id) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })

    await dbConnect()
    const app = await NSSApplication.findOne({ userId: session.user.id }).lean()
    if (!app) return NextResponse.json({ success: false, message: "Application not found" }, { status: 404 })

    const required: Array<[string, any]> = [
      ["photo", app.photo],
      ["signature", app.signature],
      ["institutionalIdCard", app.institutionalIdCard],
      ["highSchoolCertificate", app.highSchoolCertificate],
      ["myBharatPortalRegistered", app.myBharatPortalRegistered],
    ]
    const missing = required.filter(([, v]) => !v).map(([k]) => k as string)
    const percent = Math.round(((required.length - missing.length) / required.length) * 100)

    return NextResponse.json({ success: true, application: app, completion: { percent, missing } })
  } catch (e) {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}


