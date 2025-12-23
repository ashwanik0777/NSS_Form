import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import dbConnect from "@/lib/mongodb"
import User from "@/models/User"
import VolunteerProject from "@/models/VolunteerProject"
import VolunteerEvent from "@/models/VolunteerEvent"
import Event from "@/models/Event"
import NSSApplication from "@/models/NSSApplication"
import NSSProject from "@/models/NSSProject"
import { generateVolunteerExportPDF } from "@/lib/generateVolunteerExportPDF"

export async function GET(request: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as any
    if (!session?.user?.id || (session.user.role !== "admin" && session.user.role !== "sub-admin")) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    await dbConnect()
    
    // Ensure NSSProject model is registered before populate
    // This prevents the "Schema hasn't been registered" error
    // Access the model to ensure it's registered with Mongoose
    try {
      await NSSProject.findOne({}).limit(0).lean()
    } catch (e) {
      // Model might not be registered yet, but that's okay - the import should handle it
    }
    
    const { searchParams } = new URL(request.url)
    const volunteerId = searchParams.get("volunteerId")
    const format = searchParams.get("format") // "excel" | "pdf" | undefined

    if (volunteerId && !format) {
      // Get detailed info for a specific volunteer
      const volunteer = await User.findById(volunteerId).lean()
      if (!volunteer || (volunteer.role !== "volunteer" && volunteer.role !== "user")) {
        return NextResponse.json({ success: false, message: "Volunteer not found" }, { status: 404 })
      }

      const application = await NSSApplication.findOne({ userId: volunteerId }).lean()
      
      // Check unit access for sub-admin
      if (session.user.role === "sub-admin" && application) {
        const user = await User.findById(session.user.id).select("assignedUnits").lean()
        const userAssignedUnits = (user as any)?.assignedUnits || []
        if (userAssignedUnits.length > 0 && !userAssignedUnits.includes(application.unitNo)) {
          return NextResponse.json({ success: false, message: "Access denied" }, { status: 403 })
        }
      }

      const projectAssignment = await VolunteerProject.findOne({
        volunteerId,
        status: "active",
      })
        .populate("projectId")
        .lean()

      const events = await VolunteerEvent.find({ volunteerId })
        .populate("eventId")
        .populate("projectId")
        .sort({ createdAt: -1 })
        .lean()

      const totalEvents = events.length
      const approvedEvents = events.filter(
        (e: any) => e.reviewStatus === "approved" || (!e.reviewStatus && (e.hoursWorked || 0) > 0),
      )
      const completedEvents = approvedEvents.length
      const totalHours = events.reduce((sum: number, e: any) => sum + (e.hoursWorked || 0), 0)
      const attendanceRate = totalEvents > 0 ? (completedEvents / totalEvents) * 100 : 0

      return NextResponse.json({
        success: true,
        volunteer: {
          ...volunteer,
          application: application || null,
          project: projectAssignment?.projectId || null,
          stats: {
            totalEvents,
            completedEvents,
            totalHours,
            attendanceRate: Math.round(attendanceRate),
          },
          events: events.map((e: any) => ({
            _id: e._id,
            eventTitle: e.eventId?.title || "Unknown Event",
            projectTitle: e.projectId?.title || "Unknown Project",
            status: e.status,
             reviewStatus: e.reviewStatus || "pending",
             reviewNotes: e.reviewNotes,
             reviewedAt: e.reviewedAt,
            startTime: e.startTime,
            endTime: e.endTime,
            hoursWorked: e.hoursWorked || 0,
            pendingHours: e.pendingHours || 0,
            workDescription: e.workDescription,
            startPhoto: e.startPhoto,
            endPhoto: e.endPhoto,
          })),
        },
      })
    }

    // Get filter parameters
    const unitNo = searchParams.get("unitNo")
    const enrollment = searchParams.get("enrollment")
    const schoolName = searchParams.get("schoolName")
    const departmentName = searchParams.get("departmentName")
    const nameSearch = searchParams.get("nameSearch")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")

    // Build application filter query
    const applicationFilter: any = { status: "approved" }
    
    // Unit-based filtering for sub-admins
    let unitFilter: any = {}
    if (session.user.role === "sub-admin") {
      const user = await User.findById(session.user.id).select("assignedUnits").lean()
      const userAssignedUnits = (user as any)?.assignedUnits || []
      if (userAssignedUnits.length > 0) {
        applicationFilter.unitNo = { $in: userAssignedUnits }
      } else {
        // No units assigned, return empty
        return NextResponse.json({
          success: true,
          volunteers: [],
          analytics: {
            totalVolunteers: 0,
            totalActiveProjects: 0,
            totalEvents: 0,
            totalEventParticipations: 0,
            avgAttendanceRate: 0,
          },
        })
      }
    } else if (unitNo && unitNo !== "all") {
      applicationFilter.unitNo = unitNo
    }
    
    if (enrollment && (enrollment === "first-year" || enrollment === "second-year")) {
      applicationFilter.enrollment = enrollment
    }
    if (schoolName && schoolName.trim()) {
      applicationFilter.schoolName = schoolName.trim()
    }
    if (departmentName && departmentName.trim()) {
      applicationFilter.departmentName = { $regex: new RegExp(`${departmentName.trim()}`, 'i') }
    }
    if (nameSearch && nameSearch.trim()) {
      applicationFilter.nameEnglish = { $regex: new RegExp(`${nameSearch.trim()}`, 'i') }
    }

    // Get all volunteers with approved applications matching filters
    const approvedApplications = await NSSApplication.find(applicationFilter)
      .select("userId")
      .lean()
    
    const approvedUserIds = approvedApplications.map((app) => app.userId)

    // Get only volunteers with approved applications
    const volunteers = await User.find({
      _id: { $in: approvedUserIds },
      role: { $in: ["volunteer", "user"] }
    }).lean()

    const volunteersWithStats = await Promise.all(
      volunteers.map(async (volunteer) => {
        const projectCount = await VolunteerProject.countDocuments({
          volunteerId: volunteer._id,
          status: "active",
        })
        const eventCount = await VolunteerEvent.countDocuments({ volunteerId: volunteer._id })
        const completedEvents = await VolunteerEvent.countDocuments({
          volunteerId: volunteer._id,
          $or: [{ reviewStatus: "approved" }, { reviewStatus: { $exists: false }, hoursWorked: { $gt: 0 } }],
        })
        const totalHours = await VolunteerEvent.aggregate([
          { $match: { volunteerId: volunteer._id } },
          { $group: { _id: null, total: { $sum: "$hoursWorked" } } },
        ])

        const application = await NSSApplication.findOne({ userId: volunteer._id }).lean()

        return {
          _id: volunteer._id,
          name: volunteer.name,
          email: volunteer.email,
          application: application
            ? {
                ...application,
              }
            : null,
          stats: {
            projects: projectCount,
            events: eventCount,
            completedEvents,
            totalHours: totalHours[0]?.total || 0,
            attendanceRate:
              eventCount > 0 ? Math.round((completedEvents / eventCount) * 100) : 0,
          },
        }
      })
    )

    // If export requested, return file instead of JSON
    if (format === "excel" || format === "pdf") {
      const rows = volunteersWithStats.map((v: any) => ({
        name: v.application?.nameEnglish || v.name || "",
        fatherName: v.application?.fatherName || "",
        motherName: v.application?.motherName || "",
        email: v.email || "",
        mobileNo: v.application?.mobileNo || "",
        dob: v.application?.dateOfBirth ? new Date(v.application.dateOfBirth).toLocaleDateString("en-IN") : "",
        gender: v.application?.gender || "",
        category: v.application?.category || "",
        bloodGroup: v.application?.bloodGroup || "",
        schoolName: v.application?.schoolName || "",
        departmentName: v.application?.departmentName || "",
        courseName: v.application?.courseName || "",
        year: v.application?.enrollment || "",
        rollNumber: v.application?.formNo || "",
        unitNo: v.application?.unitNo || "",
        programOfficerName: v.application?.programOfficerName || "",
        highSchoolRollNo: v.application?.highSchoolRollNo || "",
        classSemester: v.application?.classSemester || "",
        nssEnrollmentYear: v.application?.nssEnrollmentYear || "",
        addressType: v.application?.addressType || "",
        hostelAddress: v.application?.hostelAddress || "",
        homeAddress: v.application?.homeAddress || "",
        myBharatRegistered: v.application?.myBharatPortalRegistered ? "Yes" : "No",
        myBharatPortalId: v.application?.myBharatPortalId || "",
        attendedSpecialCamp: v.application?.attendedSpecialCamp ? "Yes" : "No",
        attendedELP: v.application?.attendedELP ? "Yes" : "No",
      }))

      const fileNameBase =
        (searchParams.get("unitNo") && searchParams.get("unitNo") !== "all")
          ? `volunteers_unit_${searchParams.get("unitNo")}`
          : "volunteers_all_units"

      if (format === "pdf") {
        // Generate actual PDF
        const unitInfo =
          searchParams.get("unitNo") && searchParams.get("unitNo") !== "all"
            ? `Unit ${searchParams.get("unitNo")} Volunteers`
            : "All Units Volunteers"
        const pdfBytes = await generateVolunteerExportPDF(rows, unitInfo)

        return new NextResponse(pdfBytes, {
          status: 200,
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="${fileNameBase}.pdf"`,
          },
        })
      } else {
        // Excel format (tab-separated)
        const header =
          "Name\tFather Name\tMother Name\tEmail\tMobile No\tDOB\tGender\tCategory\tBlood Group\tSchool\tDepartment\tCourse\tYear\tRoll Number\tUnit\tProgram Officer\tHigh School Roll No\tClass/Semester\tNSS Enrollment Year\tAddress Type\tHostel Address\tHome Address\tMy Bharat Registered\tMy Bharat ID\tAttended Special Camp\tAttended ELP\n"
        const body = rows
          .map(
            (r) =>
              `${r.name}\t${r.fatherName}\t${r.motherName}\t${r.email}\t${r.mobileNo}\t${r.dob}\t${r.gender}\t${r.category}\t${r.bloodGroup}\t${r.schoolName}\t${r.departmentName}\t${r.courseName}\t${r.year}\t${r.rollNumber}\t${r.unitNo}\t${r.programOfficerName}\t${r.highSchoolRollNo}\t${r.classSemester}\t${r.nssEnrollmentYear}\t${r.addressType}\t${r.hostelAddress}\t${r.homeAddress}\t${r.myBharatRegistered}\t${r.myBharatPortalId}\t${r.attendedSpecialCamp}\t${r.attendedELP}`,
          )
          .join("\n")
        const content = header + body + "\n"

        return new NextResponse(content, {
          status: 200,
          headers: {
            "Content-Type": "application/vnd.ms-excel; charset=utf-8",
            "Content-Disposition": `attachment; filename="${fileNameBase}.xls"`,
          },
        })
      }
    }

    // Sort volunteers: highest hours first, then attendance rate
    volunteersWithStats.sort((a, b) => {
      const hourDiff = (b.stats?.totalHours || 0) - (a.stats?.totalHours || 0)
      if (hourDiff !== 0) {
        return hourDiff
      }
      return (b.stats?.attendanceRate || 0) - (a.stats?.attendanceRate || 0)
    })

    // Pagination
    const totalVolunteers = volunteersWithStats.length
    const totalPages = Math.ceil(totalVolunteers / limit)
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedVolunteers = volunteersWithStats.slice(startIndex, endIndex)

    // Overall analytics
    const totalActiveProjects = await VolunteerProject.countDocuments({ status: "active" })
    const totalEvents = await Event.countDocuments()
    const totalEventParticipations = await VolunteerEvent.countDocuments()
    const avgAttendanceRate =
      volunteersWithStats.length > 0
        ? Math.round(
            volunteersWithStats.reduce((sum, v) => sum + v.stats.attendanceRate, 0) /
              volunteersWithStats.length
          )
        : 0

    return NextResponse.json({
      success: true,
      volunteers: paginatedVolunteers,
      totalVolunteers,
      totalPages,
      currentPage: page,
      analytics: {
        totalVolunteers,
        totalActiveProjects,
        totalEvents,
        totalEventParticipations,
        avgAttendanceRate,
      },
    })
  } catch (error) {
    console.error("Volunteer management error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

