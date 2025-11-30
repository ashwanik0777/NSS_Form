import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import dbConnect from "@/lib/mongodb"
import Announcement from "@/models/Announcement"
import User from "@/models/User"
import NSSApplication from "@/models/NSSApplication"
import AnnouncementView from "@/models/AnnouncementView"
import { sendCustomEmail } from "@/lib/email"
import { hasPermission, PermissionKey } from "@/lib/permissions"

export async function GET(_request: NextRequest) {
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
      if (!hasPermission(userPermissions, "announcements.view" as PermissionKey)) {
        return NextResponse.json({ success: false, message: "Permission denied" }, { status: 403 })
      }
    }

    await dbConnect()

    const announcements = await Announcement.find()
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 })
      .lean()

    // Get total eligible volunteers count for each announcement
    const announcementIds = announcements.map((a: any) => a._id)
    const viewCounts = await AnnouncementView.aggregate([
      {
        $match: {
          announcementId: { $in: announcementIds },
        },
      },
      {
        $group: {
          _id: "$announcementId",
          count: { $sum: 1 },
        },
      },
    ])

    const viewCountMap = new Map(
      viewCounts.map((vc: any) => [vc._id.toString(), vc.count])
    )

    // Calculate total eligible volunteers for each announcement
    const announcementsWithStats = await Promise.all(
      announcements.map(async (announcement: any) => {
        let totalEligible = 0

        if (announcement.targetType === "units" && Array.isArray(announcement.targetUnits) && announcement.targetUnits.length > 0) {
          // Count volunteers in specific units
          totalEligible = await NSSApplication.countDocuments({
            status: "approved",
            unitNo: { $in: announcement.targetUnits },
          })
        } else {
          // Count all approved volunteers
          totalEligible = await NSSApplication.countDocuments({
            status: "approved",
          })
        }

        const views = viewCountMap.get(announcement._id.toString()) || 0

        return {
          ...announcement,
          viewCount: views,
          totalEligible: totalEligible,
        }
      })
    )

    return NextResponse.json({
      success: true,
      announcements: announcementsWithStats,
    })
  } catch (error) {
    console.error("Announcements fetch error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as any
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "admin" && session.user.role !== "sub-admin") {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 })
    }

    // Check permission for sub-admin - require announcements.create
    if (session.user.role === "sub-admin") {
      const userPermissions = session.user.permissions || []
      if (!hasPermission(userPermissions, "announcements.create" as PermissionKey)) {
        return NextResponse.json({ success: false, message: "Permission denied. You need 'announcements.create' permission." }, { status: 403 })
      }
    }

    const body = await request.json()
    const { title, content, type, sendEmail, targetType, targetUnits } = body

    if (!title || !content) {
      return NextResponse.json(
        { success: false, message: "Title and content are required" },
        { status: 400 }
      )
    }

    await dbConnect()

    const isSuperAdmin = session.user.role === "admin"
    const normalizedTargetType =
      isSuperAdmin && targetType === "units" && Array.isArray(targetUnits) && targetUnits.length > 0
        ? "units"
        : "all"
    const normalizedTargetUnits =
      normalizedTargetType === "units"
        ? Array.from(
            new Set(
              (targetUnits || [])
                .map((unit: string) => unit?.toString().trim())
                .filter((unit: string) => unit.length > 0),
            ),
          )
        : []

    // Create announcement
    const announcement = new Announcement({
      title,
      content,
      type: type || "announcement",
      sendEmail: sendEmail || false,
      createdBy: session.user.id,
      status: "active",
      targetType: normalizedTargetType,
      targetUnits: normalizedTargetUnits,
    })

    await announcement.save()

    // Send emails if requested
    if (sendEmail) {
      try {
        const applicationQuery: Record<string, any> = { status: "approved" }
        if (normalizedTargetType === "units" && normalizedTargetUnits.length > 0) {
          applicationQuery.unitNo = { $in: normalizedTargetUnits }
        }

        // Get approved volunteers based on targeting
        const approvedApplications = await NSSApplication.find(applicationQuery)
          .select("userId emailId nameEnglish")
          .lean()

        if (!approvedApplications || approvedApplications.length === 0) {
          console.log("⚠️ No approved applications found for email sending")
        } else {
          console.log(`📧 Found ${approvedApplications.length} approved applications`)
          
          const approvedUserIds = approvedApplications.map((app: any) => app.userId).filter(Boolean)

          if (approvedUserIds.length === 0) {
            console.log("⚠️ No valid user IDs found in approved applications")
          } else {
            const volunteers = await User.find({
              _id: { $in: approvedUserIds },
              role: { $in: ["volunteer", "user"] },
            })
              .select("_id email name")
              .lean()

            if (!volunteers || volunteers.length === 0) {
              console.log("⚠️ No volunteers found with matching user IDs")
            } else {
              console.log(`📧 Found ${volunteers.length} volunteers to send emails to`)
              
              const applicationMap = new Map(
                approvedApplications.map((app: any) => [app.userId?.toString(), app])
              )

              // Send emails to all approved volunteers
              let successCount = 0
              let failCount = 0

              const emailPromises = volunteers.map(async (volunteer: any) => {
                const application = applicationMap.get(volunteer._id.toString())
                // Use emailId from application first, then fallback to user email
                const volunteerEmail = application?.emailId || volunteer.email
                
                if (!volunteerEmail || !volunteerEmail.includes("@")) {
                  console.error(`❌ Invalid email for volunteer ${volunteer._id}: ${volunteerEmail}`)
                  failCount++
                  return
                }

                const volunteerName = application?.nameEnglish || volunteer.name || "Volunteer"

                // Convert URLs to clickable links in content
                const linkifyContent = (text: string) => {
                  const urlRegex = /(https?:\/\/[^\s]+)/g
                  return text.replace(urlRegex, '<a href="$1" style="color: #1e40af; text-decoration: underline;" target="_blank" rel="noopener noreferrer">$1</a>')
                }

                const htmlContent = linkifyContent(content.replace(/\n/g, "<br>"))

                try {
                  await sendCustomEmail(
                    volunteerEmail,
                    `NSS Announcement: ${title}`,
                    `<h2 style="color: #1e40af; margin-bottom: 15px;">${title}</h2><p>Dear ${volunteerName},</p><p style="line-height: 1.6;">${htmlContent}</p><p style="margin-top: 20px;">Best regards,<br>NSS Team</p>`
                  )
                  console.log(`✓ Email sent successfully to ${volunteerEmail} (${volunteerName})`)
                  successCount++
                } catch (error: any) {
                  console.error(`✗ Failed to send email to ${volunteerEmail}:`, error?.message || error)
                  failCount++
                }
              })

              await Promise.allSettled(emailPromises)
              console.log(
                `📊 Email sending completed: ${successCount} successful, ${failCount} failed out of ${approvedApplications.length} total applications`
              )
            }
          }
        }
      } catch (error: any) {
        console.error("❌ Error in email sending process:", error?.message || error)
      }
    }

    return NextResponse.json({
      success: true,
      message: sendEmail
        ? "Announcement created and emails sent to all approved volunteers"
        : "Announcement created successfully",
      announcement,
    })
  } catch (error) {
    console.error("Announcement creation error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as any
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "admin" && session.user.role !== "sub-admin") {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 })
    }

    // Check permission for sub-admin - require announcements.edit
    if (session.user.role === "sub-admin") {
      const userPermissions = session.user.permissions || []
      if (!hasPermission(userPermissions, "announcements.edit" as PermissionKey)) {
        return NextResponse.json({ success: false, message: "Permission denied. You need 'announcements.edit' permission." }, { status: 403 })
      }
    }

    const body = await request.json()
    const { announcementId, ...updateData } = body

    if (!announcementId) {
      return NextResponse.json(
        { success: false, message: "Announcement ID required" },
        { status: 400 }
      )
    }

    const isSuperAdmin = session.user.role === "admin"
    let normalizedTargetType: "all" | "units" | undefined
    let normalizedTargetUnits: string[] | undefined

    if (isSuperAdmin) {
      if (updateData.targetType === "units" && Array.isArray(updateData.targetUnits) && updateData.targetUnits.length > 0) {
        normalizedTargetType = "units"
        normalizedTargetUnits = Array.from(
          new Set(
            updateData.targetUnits
              .map((unit: string) => unit?.toString().trim())
              .filter((unit: string) => unit.length > 0),
          ),
        )
      } else if (updateData.targetType) {
        normalizedTargetType = "all"
        normalizedTargetUnits = []
      }
    } else {
      delete updateData.targetType
      delete updateData.targetUnits
    }

    await dbConnect()

    const updatePayload: Record<string, any> = { ...updateData }
    if (isSuperAdmin) {
      if (normalizedTargetType) {
        updatePayload.targetType = normalizedTargetType
        updatePayload.targetUnits = normalizedTargetType === "units" ? normalizedTargetUnits : []
      } else if (normalizedTargetType === "all") {
        updatePayload.targetUnits = []
      }
    }

    const announcement = await Announcement.findByIdAndUpdate(announcementId, updatePayload, { new: true })

    if (!announcement) {
      return NextResponse.json({ success: false, message: "Announcement not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "Announcement updated successfully",
      announcement,
    })
  } catch (error) {
    console.error("Announcement update error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as any
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "admin" && session.user.role !== "sub-admin") {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 })
    }

    // Check permission for sub-admin - require announcements.delete
    if (session.user.role === "sub-admin") {
      const userPermissions = session.user.permissions || []
      if (!hasPermission(userPermissions, "announcements.delete" as PermissionKey)) {
        return NextResponse.json({ success: false, message: "Permission denied. You need 'announcements.delete' permission." }, { status: 403 })
      }
    }

    const { searchParams } = new URL(request.url)
    const announcementId = searchParams.get("id")

    if (!announcementId) {
      return NextResponse.json(
        { success: false, message: "Announcement ID required" },
        { status: 400 }
      )
    }

    await dbConnect()

    const announcement = await Announcement.findByIdAndDelete(announcementId)

    if (!announcement) {
      return NextResponse.json({ success: false, message: "Announcement not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "Announcement deleted successfully",
    })
  } catch (error) {
    console.error("Announcement deletion error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

