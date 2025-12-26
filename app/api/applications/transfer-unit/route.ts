import { NextRequest, NextResponse } from "next/server"
import mongoose from "mongoose"
import dbConnect from "@/lib/mongodb"
import NSSApplication from "@/models/NSSApplication"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

const MAX_STUDENTS_PER_UNIT = 100

export async function POST(request: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as any
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    // Only super admin can transfer units
    if (session.user.role !== "admin") {
      return NextResponse.json({ success: false, message: "Only super admin can transfer units" }, { status: 403 })
    }

    await dbConnect()

    const body = await request.json()
    const { applicationId, newUnitNo } = body

    if (!applicationId || !newUnitNo) {
      return NextResponse.json({ success: false, message: "Application ID and new unit number are required" }, { status: 400 })
    }

    if (!mongoose.Types.ObjectId.isValid(applicationId)) {
      return NextResponse.json({ success: false, message: "Invalid Application ID" }, { status: 400 })
    }

    // Validate unit number
    if (!["1", "2", "3", "4", "5"].includes(newUnitNo)) {
      return NextResponse.json({ success: false, message: "Invalid unit number" }, { status: 400 })
    }

    // Get the application
    const application = await NSSApplication.findById(applicationId)
    if (!application) {
      return NextResponse.json({ success: false, message: "Application not found" }, { status: 404 })
    }

    const oldUnitNo = application.unitNo

    // Check if new unit has capacity (only for approved applications)
    if (application.status === "approved") {
      const currentCount = await NSSApplication.countDocuments({
        unitNo: newUnitNo,
        status: "approved",
      })

      if (currentCount >= MAX_STUDENTS_PER_UNIT) {
        return NextResponse.json(
          { 
            success: false, 
            message: `Unit ${newUnitNo} is full. Maximum ${MAX_STUDENTS_PER_UNIT} students allowed per unit.` 
          }, 
          { status: 400 }
        )
      }
    }

    // Update the unit using findByIdAndUpdate to bypass pre-save validation
    const updatedApplication = await NSSApplication.findByIdAndUpdate(
      applicationId,
      { unitNo: newUnitNo },
      { new: true }
    )

    return NextResponse.json({
      success: true,
      message: `Application transferred from Unit ${oldUnitNo} to Unit ${newUnitNo}`,
      application: updatedApplication,
    })
  } catch (error: any) {
    console.error("Error transferring unit:", error)
    return NextResponse.json({ 
      success: false, 
      message: error.message || "Internal server error" 
    }, { status: 500 })
  }
}

// Get unit capacity info
export async function GET(request: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as any
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "admin" && session.user.role !== "sub-admin") {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 })
    }

    await dbConnect()

    const { searchParams } = new URL(request.url)
    const unitNo = searchParams.get("unitNo")

    if (unitNo) {
      // Get count for specific unit
      const count = await NSSApplication.countDocuments({
        unitNo: unitNo,
        status: "approved",
      })
      return NextResponse.json({
        success: true,
        unitNo,
        count,
        maxCapacity: MAX_STUDENTS_PER_UNIT,
        available: MAX_STUDENTS_PER_UNIT - count,
        isFull: count >= MAX_STUDENTS_PER_UNIT,
      })
    } else {
      // Get counts for all units
      const units = ["1", "2", "3", "4", "5"]
      const unitStats = await Promise.all(
        units.map(async (unit) => {
          const count = await NSSApplication.countDocuments({
            unitNo: unit,
            status: "approved",
          })
          return {
            unitNo: unit,
            count,
            maxCapacity: MAX_STUDENTS_PER_UNIT,
            available: MAX_STUDENTS_PER_UNIT - count,
            isFull: count >= MAX_STUDENTS_PER_UNIT,
          }
        })
      )

      return NextResponse.json({
        success: true,
        units: unitStats,
      })
    }
  } catch (error) {
    console.error("Error fetching unit capacity:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

