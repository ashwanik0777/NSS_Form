import { NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import NSSApplication from "@/models/NSSApplication"

const MAX_STUDENTS_PER_UNIT = 100
const TRACKED_UNITS = ["1", "2", "3", "4", "5", "6"]
const CAPACITY_STATUSES = ["approved"]

export async function GET() {
  try {
    await dbConnect()

    const unitStats = await Promise.all(
      TRACKED_UNITS.map(async (unitNo) => {
        const count = await NSSApplication.countDocuments({
          unitNo,
          status: { $in: CAPACITY_STATUSES },
        })

        return {
          unitNo,
          count,
          maxCapacity: MAX_STUDENTS_PER_UNIT,
          available: Math.max(MAX_STUDENTS_PER_UNIT - count, 0),
          isFull: count >= MAX_STUDENTS_PER_UNIT,
        }
      }),
    )

    return NextResponse.json({
      success: true,
      units: unitStats,
      updatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error fetching public unit capacity:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Unable to fetch unit capacity right now. Please try again later.",
      },
      { status: 500 },
    )
  }
}


