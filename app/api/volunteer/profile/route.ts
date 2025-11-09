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
    if (!app || Array.isArray(app)) return NextResponse.json({ success: false, message: "Application not found" }, { status: 404 })

    const required: Array<[string, any]> = [
      ["photo", app.photo],
      ["signature", app.signature],
      ["institutionalIdCard", app.institutionalIdCard],
      ["highSchoolCertificate", (app as any).highSchoolCertificate],
      ["myBharatPortalRegistered", app.myBharatPortalRegistered],
      // Social profiles required before project selection
      ["socialFacebook", (app as any).socialFacebook],
      ["socialInstagram", (app as any).socialInstagram],
      ["socialTwitter", (app as any).socialTwitter],
      ["socialLinkedin", (app as any).socialLinkedin],
    ]
    const missing = required.filter(([, v]) => !v).map(([k]) => {
      const labels: Record<string, string> = {
        photo: "Student Photo",
        signature: "Student Signature",
        institutionalIdCard: "Institution I-Card Number",
        highSchoolCertificate: "High School Certificate",
        myBharatPortalRegistered: "My Bharat Portal Registration",
        socialFacebook: "Facebook Profile URL",
        socialInstagram: "Instagram Profile URL",
        socialTwitter: "Twitter/X Profile URL",
        socialLinkedin: "LinkedIn Profile URL",
      }
      return labels[k] || k
    })
    const percent = Math.round(((required.length - missing.length) / required.length) * 100)

    return NextResponse.json({ success: true, application: app, completion: { percent, missing } })
  } catch (e) {
    console.error("Profile fetch error:", e)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as any
    if (!session?.user?.id) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })

    const body = await request.json()
    await dbConnect()

    const app = await NSSApplication.findOneAndUpdate(
      { userId: session.user.id },
      { $set: body },
      { new: true }
    ).lean()

    if (!app || Array.isArray(app)) {
      return NextResponse.json({ success: false, message: "Application not found" }, { status: 404 })
    }

    // Recalculate completion
    const required: Array<[string, any]> = [
      ["photo", app.photo],
      ["signature", app.signature],
      ["institutionalIdCard", app.institutionalIdCard],
      ["highSchoolCertificate", (app as any).highSchoolCertificate],
      ["myBharatPortalRegistered", app.myBharatPortalRegistered],
      // Social profiles required before project selection
      ["socialFacebook", (app as any).socialFacebook],
      ["socialInstagram", (app as any).socialInstagram],
      ["socialTwitter", (app as any).socialTwitter],
      ["socialLinkedin", (app as any).socialLinkedin],
    ]
    const missing = required.filter(([, v]) => !v).map(([k]) => {
      const labels: Record<string, string> = {
        photo: "Student Photo",
        signature: "Student Signature",
        institutionalIdCard: "Institution I-Card Number",
        highSchoolCertificate: "High School Certificate",
        myBharatPortalRegistered: "My Bharat Portal Registration",
        socialFacebook: "Facebook Profile URL",
        socialInstagram: "Instagram Profile URL",
        socialTwitter: "Twitter/X Profile URL",
        socialLinkedin: "LinkedIn Profile URL",
      }
      return labels[k] || k
    })
    const percent = Math.round(((required.length - missing.length) / required.length) * 100)

    return NextResponse.json({ success: true, application: app, completion: { percent, missing } })
  } catch (e) {
    console.error("Profile update error:", e)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
