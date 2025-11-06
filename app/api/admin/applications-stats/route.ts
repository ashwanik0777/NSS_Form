import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import dbConnect from "@/lib/mongodb"
import NSSApplication from "@/models/NSSApplication"
import User from "@/models/User"

export async function GET(request: NextRequest) {
  try {
    await dbConnect()
    
    // Check if user is sub-admin and get their assigned units
    const session = await getServerSession(authOptions) as any
    let userAssignedUnits: string[] | null = null
    if (session?.user?.role === "sub-admin") {
      const user = await User.findById(session.user.id).select("assignedUnits")
      if (user && (user as any).assignedUnits && (user as any).assignedUnits.length > 0) {
        userAssignedUnits = (user as any).assignedUnits
      }
    }
    
    const { searchParams } = new URL(request.url)
    const unitNo = searchParams.get('unitNo')
    const enrollment = searchParams.get('enrollment')
    const schoolName = searchParams.get('schoolName')
    const departmentName = searchParams.get('departmentName')

    const match: any = {}
    
    // If sub-admin has assigned units, filter by those units
    if (userAssignedUnits && userAssignedUnits.length > 0) {
      match.unitNo = { $in: userAssignedUnits }
    } else if (unitNo && unitNo !== 'all') {
      match.unitNo = unitNo
    }
    
    if (enrollment && (enrollment === 'first-year' || enrollment === 'second-year')) match.enrollment = enrollment
    if (schoolName && schoolName.trim()) match.schoolName = { $regex: new RegExp(`${schoolName.trim()}`, 'i') }
    if (departmentName && departmentName.trim()) match.departmentName = { $regex: new RegExp(`${departmentName.trim()}`, 'i') }

    const pipeline = [
      { $match: match },
      {
        $group: {
          _id: { unitNo: "$unitNo", status: "$status" },
          count: { $sum: 1 },
        }
      }
    ]

    const rows = await NSSApplication.aggregate(pipeline)

    // Compute per-unit breakdowns
    const unitMap: Record<string, { total: number; submitted: number; underReview: number; approved: number; rejected: number }> = {}
    for (const r of rows) {
      const unit = r._id.unitNo || 'Unknown'
      const status = r._id.status
      if (!unitMap[unit]) unitMap[unit] = { total: 0, submitted: 0, underReview: 0, approved: 0, rejected: 0 }
      unitMap[unit].total += r.count
      if (status === 'submitted') unitMap[unit].submitted += r.count
      else if (status === 'under-review') unitMap[unit].underReview += r.count
      else if (status === 'approved') unitMap[unit].approved += r.count
      else if (status === 'rejected') unitMap[unit].rejected += r.count
    }

    // Also compute overall totals
    const overall = Object.values(unitMap).reduce((acc, u) => ({
      total: acc.total + u.total,
      submitted: acc.submitted + u.submitted,
      underReview: acc.underReview + u.underReview,
      approved: acc.approved + u.approved,
      rejected: acc.rejected + u.rejected,
    }), { total: 0, submitted: 0, underReview: 0, approved: 0, rejected: 0 })

    return NextResponse.json({ success: true, units: unitMap, overall })
  } catch (e) {
    console.error('applications-stats error', e)
    return NextResponse.json({ success: false, message: 'Failed to load stats' }, { status: 500 })
  }
}




