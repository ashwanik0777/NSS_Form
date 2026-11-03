import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import dbConnect from "@/lib/mongodb"
import User from "@/models/User"
import NSSApplication from "@/models/NSSApplication"
import VolunteerProject from "@/models/VolunteerProject"
import VolunteerEvent from "@/models/VolunteerEvent"
import VolunteerMeeting from "@/models/VolunteerMeeting"
import { getUnitNoQuery, normalizeUnitNo } from "@/lib/unit"

const MAX_STUDENTS_PER_UNIT = 100

export async function POST(request: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as any
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    // STRICT CHECK: Only Super Admin can reinstate or free past volunteers
    if (session.user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Forbidden: Only Super Admin can manage past volunteers" },
        { status: 403 }
      )
    }

    await dbConnect()
    const body = await request.json()
    const { action, volunteerId, applicationId, unitNo } = body

    if (!action || (action !== "reinstate" && action !== "free")) {
      return NextResponse.json(
        { success: false, message: "Invalid action. Allowed actions are 'reinstate' or 'free'." },
        { status: 400 }
      )
    }

    if (!volunteerId && !applicationId) {
      return NextResponse.json(
        { success: false, message: "Volunteer ID or Application ID is required." },
        { status: 400 }
      )
    }

    // Locate the NSSApplication
    let application = null
    if (applicationId) {
      application = await NSSApplication.findById(applicationId)
    }
    if (!application && volunteerId) {
      application = await NSSApplication.findOne({ userId: volunteerId })
    }
    if (!application && volunteerId) {
      application = await NSSApplication.findById(volunteerId)
    }

    // Locate User
    const targetUserId = application?.userId || volunteerId
    let user = targetUserId ? await User.findById(targetUserId) : null
    if (!user && application?.emailId) {
      user = await User.findOne({ email: application.emailId.toLowerCase().trim() })
    }

    // OPTION 1: REINSTATE VOLUNTEER (whi se wapas ka option, unit change ka option dekr)
    if (action === "reinstate") {
      const normalizedUnitNo = normalizeUnitNo(unitNo || application?.unitNo)
      if (!normalizedUnitNo || !["1", "2", "3", "4", "5", "6"].includes(normalizedUnitNo)) {
        return NextResponse.json(
          { success: false, message: "A valid unit number (1 to 6) is required for reinstatement." },
          { status: 400 }
        )
      }

      // Check capacity of target unit
      const currentUnitCount = await NSSApplication.countDocuments({
        unitNo: getUnitNoQuery(normalizedUnitNo),
        status: "approved",
      })

      if (currentUnitCount >= MAX_STUDENTS_PER_UNIT) {
        return NextResponse.json(
          {
            success: false,
            message: `Unit ${normalizedUnitNo} is full (${currentUnitCount}/${MAX_STUDENTS_PER_UNIT} seats filled). Please select another unit.`,
          },
          { status: 400 }
        )
      }

      if (!application) {
        return NextResponse.json(
          { success: false, message: "Volunteer application record not found." },
          { status: 404 }
        )
      }

      // 1. Restore Application to approved status, assign unit, and wipe removal fields
      await NSSApplication.findByIdAndUpdate(
        application._id,
        {
          $set: {
            status: "approved",
            unitNo: normalizedUnitNo,
          },
          $unset: {
            removalReason: 1,
            removedAt: 1,
            removedBy: 1,
          },
        },
        { new: true }
      )

      // 2. Restore User status to accepted and role to volunteer
      if (user) {
        await User.findByIdAndUpdate(user._id, {
          $set: {
            status: "accepted",
            role: "volunteer",
          },
        })
      } else if (targetUserId) {
        await User.findByIdAndUpdate(targetUserId, {
          $set: {
            status: "accepted",
            role: "volunteer",
          },
        })
      }

      const volunteerName = application.nameEnglish || user?.name || "Volunteer"
      return NextResponse.json({
        success: true,
        message: `${volunteerName} has been reinstated successfully to Unit ${normalizedUnitNo}.`,
        reinstatedUnit: normalizedUnitNo,
      })
    }

    // OPTION 2: FREE TO RE-REGISTER (bss free kr denge ki vo dubara register kr skta hai)
    if (action === "free") {
      // Prevent deleting any admin accounts
      if (user && (user.role === "admin" || user.role === "sub-admin")) {
        return NextResponse.json(
          { success: false, message: "Cannot free or delete administrative accounts." },
          { status: 403 }
        )
      }

      const volunteerName = application?.nameEnglish || user?.name || "Volunteer"
      const volunteerEmail = application?.emailId || user?.email || ""

      // 1. Delete application record(s) to free unique constraints (emailId, mobileNo, formNo)
      if (application) {
        await NSSApplication.findByIdAndDelete(application._id)
      }
      if (targetUserId) {
        await NSSApplication.deleteMany({ userId: targetUserId })
      }
      if (volunteerEmail) {
        await NSSApplication.deleteMany({ emailId: volunteerEmail.toLowerCase().trim() })
      }

      // 2. Delete user record to free unique email constraint and login blocks
      if (user) {
        await User.findByIdAndDelete(user._id)
      } else if (targetUserId) {
        await User.findByIdAndDelete(targetUserId)
      }
      if (volunteerEmail) {
        await User.deleteMany({ email: volunteerEmail.toLowerCase().trim() })
      }

      // 3. Clean up associated project/event registrations
      if (targetUserId) {
        await VolunteerProject.deleteMany({ volunteerId: targetUserId })
        await VolunteerEvent.deleteMany({
          volunteerId: targetUserId,
          status: { $in: ["registered", "pending", "cancelled"] },
        })
        await VolunteerMeeting.deleteMany({
          volunteerId: targetUserId,
          status: { $in: ["registered", "pending"] },
        })
      }

      return NextResponse.json({
        success: true,
        message: `${volunteerName} (${volunteerEmail}) has been freed. Their past records are removed and they can now register afresh on the portal.`,
      })
    }

    return NextResponse.json({ success: false, message: "Unhandled action" }, { status: 400 })
  } catch (error: any) {
    console.error("Error managing past volunteer:", error)
    return NextResponse.json(
      { success: false, message: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

