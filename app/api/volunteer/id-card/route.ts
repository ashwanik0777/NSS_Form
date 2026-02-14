import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import dbConnect from "@/lib/mongodb"
import NSSApplication from "@/models/NSSApplication"
import NSSProject from "@/models/NSSProject"
import VolunteerProject from "@/models/VolunteerProject"
import { generateVolunteerIDCard } from "@/lib/generateVolunteerIDCard"

export const dynamic = "force-dynamic"

export async function GET(_request: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as any
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    await dbConnect()

    // Get volunteer's application
    const application = await NSSApplication.findOne({ userId: session.user.id }).lean()
    if (!application) {
      return NextResponse.json({ success: false, message: "Application not found" }, { status: 404 })
    }

    // Check profile completion
    const required: Array<[string, any]> = [
      ["photo", application.photo],
      ["signature", application.signature],
      ["institutionalIdCard", application.institutionalIdCard],
    ]
    const missing = required.filter(([, v]) => !v)
    
    if (missing.length > 0) {
      return NextResponse.json(
        { success: false, message: "Profile not complete. Please complete your profile first." },
        { status: 400 }
      )
    }

    // Get volunteer's selected project
    const volunteerProject = await VolunteerProject.findOne({
      volunteerId: session.user.id,
      status: "active",
    })
      .populate("projectId")
      .lean()

    if (!volunteerProject?.projectId) {
      return NextResponse.json(
        { success: false, message: "No project selected. Please select a project first." },
        { status: 400 }
      )
    }

    const project = volunteerProject.projectId as any
    const appData = application as any

    // Prepare ID card data
    const idCardData = {
      name: appData.nameEnglish || "",
      nameHindi: appData.nameHindi,
      photo: appData.photo,
      signature: appData.signature,
      bloodGroup: appData.bloodGroup || "",
      email: appData.emailId || session.user.email || "",
      mobileNo: appData.mobileNo || "",
      institutionName: appData.institutionName || "",
      schoolName: appData.schoolName || "",
      departmentName: appData.departmentName || "",
      enrollment: appData.enrollment,
      institutionalIdCard: appData.institutionalIdCard || "",
      formNo: appData.formNo || "",
      projectName: project.title || "",
      role: "Volunteer",
      addressType: appData.addressType,
      hostelAddress: appData.hostelAddress,
      homeAddress: appData.homeAddress,
      coordinatorName: project.coordinator || appData.programOfficerName || "",
      volunteerId: session.user.id || "",
    }

    // Generate ID card PDF
    const pdfBytes = await generateVolunteerIDCard(idCardData)

    // Return PDF as response
    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="NSS_ID_Card_${appData.nameEnglish?.replace(/\s+/g, "_") || "Volunteer"}.pdf"`,
      },
    })
  } catch (error) {
    console.error("ID card generation error:", error)
    return NextResponse.json(
      { success: false, message: "Failed to generate ID card" },
      { status: 500 }
    )
  }
}

