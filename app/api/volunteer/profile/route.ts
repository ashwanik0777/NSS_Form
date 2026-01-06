import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import dbConnect from "@/lib/mongodb"
import NSSApplication from "@/models/NSSApplication"

export async function GET(_request: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as any
    if (!session?.user?.id) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })

    // Allow admin/sub-admin to access without restriction, but still try to find their application
    // If they don't have an application, we might return empty or specific message, but NOT error.

    await dbConnect()
    
    // Try to find application by userId first
    let app = (await NSSApplication.findOne({ userId: session.user.id }).lean()) as any
    
    // If not found, try to find by email (for newly created volunteers)
    if (!app || Array.isArray(app)) {
      app = (await NSSApplication.findOne({ emailId: session.user.email }).lean()) as any
      // If found by email, update it with userId
      if (app && !Array.isArray(app)) {
        await NSSApplication.updateOne(
          { _id: app._id },
          { $set: { userId: session.user.id } }
        )
      }
    }
    
    if (!app || Array.isArray(app)) {
      // Return empty application structure so user can still fill profile
      return NextResponse.json({ 
        success: true, 
        application: {}, 
        completion: { percent: 0, missing: [
          "Student Photo",
          "Student Signature",
          "Institution I-Card Number",
          "High School Certificate",
          "My Bharat Portal Registration",
          "Facebook Profile URL",
          "Instagram Profile URL",
          "Twitter/X Profile URL",
          "LinkedIn Profile URL"
        ]} 
      })
    }

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

    // Try to find application by userId first
    let app = await NSSApplication.findOne({ userId: session.user.id }).lean()
    
    // If not found, try to find by email
    if (!app || Array.isArray(app)) {
      app = await NSSApplication.findOne({ emailId: session.user.email }).lean()
    }
    
    // If still not found, create a new application entry
    if (!app || Array.isArray(app)) {
      app = await NSSApplication.create({
        userId: session.user.id,
        emailId: session.user.email,
        nameEnglish: session.user.name || "",
        ...body
      })
      app = app.toObject()
    } else {
      // Update existing application
      app = await NSSApplication.findOneAndUpdate(
        { _id: app._id },
        { $set: { ...body, userId: session.user.id } },
        { new: true }
      ).lean()
    }

    if (!app || Array.isArray(app)) {
      return NextResponse.json({ success: false, message: "Failed to save profile" }, { status: 500 })
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
