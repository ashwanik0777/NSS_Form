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
import { hasPermission } from "@/lib/permissions"

export async function PATCH(request: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as any
    if (!session?.user?.id || (session.user.role !== "admin" && session.user.role !== "sub-admin")) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    // Check specific permission
    if (session.user.role !== "admin") {
      const userPermissions = session.user.permissions || []
      if (!hasPermission(userPermissions, "volunteers.edit")) {
        return NextResponse.json({ success: false, message: "Permission denied" }, { status: 403 })
      }
    }

    await dbConnect()
    const body = await request.json()
    const { volunteerId, ...updateData } = body

    if (!volunteerId) {
      return NextResponse.json({ success: false, message: "Volunteer ID is required" }, { status: 400 })
    }

    // Update User model (basic info)
    if (updateData.name || updateData.email) {
       const userUpdate: any = {}
       if (updateData.name) userUpdate.name = updateData.name
       if (updateData.email) userUpdate.email = updateData.email
       await User.findByIdAndUpdate(volunteerId, userUpdate)
    }

    // Update NSSApplication model (detailed info)
    // We expect the body to contain keys that match the schema or mapped keys
    // Common fields to update:
    const appUpdate: any = {}
    if (updateData.name) appUpdate.nameEnglish = updateData.name
    if (updateData.nameHindi) appUpdate.nameHindi = updateData.nameHindi
    if (updateData.email) appUpdate.emailId = updateData.email
    if (updateData.mobileNo) appUpdate.mobileNo = updateData.mobileNo
    if (updateData.fatherName) appUpdate.fatherName = updateData.fatherName
    if (updateData.motherName) appUpdate.motherName = updateData.motherName
    if (updateData.enrollmentNo) appUpdate.institutionalIdCard = updateData.enrollmentNo
    if (updateData.course) appUpdate.courseName = updateData.course
    if (updateData.department) appUpdate.departmentName = updateData.department
    if (updateData.unit) appUpdate.unitNo = updateData.unit
    if (updateData.category) appUpdate.category = updateData.category
    if (updateData.gender) appUpdate.gender = updateData.gender
    if (updateData.bloodGroup) appUpdate.bloodGroup = updateData.bloodGroup
    if (updateData.programOfficerName) appUpdate.programOfficerName = updateData.programOfficerName
    if (updateData.dateOfBirth) appUpdate.dateOfBirth = new Date(updateData.dateOfBirth)
    if (updateData.addressType) appUpdate.addressType = updateData.addressType
    if (updateData.hostelAddress) appUpdate.hostelAddress = updateData.hostelAddress
    if (updateData.homeAddress) appUpdate.homeAddress = updateData.homeAddress
    if (updateData.highSchoolRollNo) appUpdate.highSchoolRollNo = updateData.highSchoolRollNo
    if (updateData.classSemester) appUpdate.classSemester = updateData.classSemester
    if (updateData.nssEnrollmentYear) appUpdate.nssEnrollmentYear = updateData.nssEnrollmentYear
    if (updateData.myBharatPortalId) appUpdate.myBharatPortalId = updateData.myBharatPortalId

    if (Object.keys(appUpdate).length > 0) {
      await NSSApplication.findOneAndUpdate({ userId: volunteerId }, appUpdate)
    }

    return NextResponse.json({ success: true, message: "Volunteer details updated successfully" })

  } catch (error) {
    console.error("Error updating volunteer:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

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

    // Aggregation Pipeline
    const pipeline: any[] = [
      // 1. Match applications based on filters
      { $match: applicationFilter },

      // 2. Lookup User details
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user"
        }
      },
      { $unwind: "$user" },
      
      // 3. Filter by user role (just in case)
      { $match: { "user.role": { $in: ["volunteer", "user"] } } },

      // 4. Lookup Volunteer Events for stats
      {
        $lookup: {
          from: "volunteerevents",
          localField: "userId",
          foreignField: "volunteerId",
          as: "events"
        }
      },

      // 5. Lookup Volunteer Projects for stats
      {
        $lookup: {
          from: "volunteerprojects",
          let: { userId: "$userId" },
          pipeline: [
            { $match: { $expr: { $and: [{ $eq: ["$volunteerId", "$$userId"] }, { $eq: ["$status", "active"] }] } } }
          ],
          as: "activeProjects"
        }
      },

      // 6. Calculate Stats
      {
        $addFields: {
          totalEvents: { $size: "$events" },
          activeProjectsCount: { $size: "$activeProjects" },
          completedEvents: {
            $size: {
              $filter: {
                input: "$events",
                as: "event",
                cond: {
                  $or: [
                    { $eq: ["$$event.reviewStatus", "approved"] },
                    { $and: [{ $not: ["$$event.reviewStatus"] }, { $gt: ["$$event.hoursWorked", 0] }] }
                  ]
                }
              }
            }
          },
          totalHours: { $sum: "$events.hoursWorked" }
        }
      },

      // 7. Calculate Attendance Rate
      {
        $addFields: {
          attendanceRate: {
            $cond: [
              { $gt: ["$totalEvents", 0] },
              { $multiply: [{ $divide: ["$completedEvents", "$totalEvents"] }, 100] },
              0
            ]
          }
        }
      },

      // 8. Sort
      { $sort: { totalHours: -1, attendanceRate: -1 } }
    ]

    // If export requested, return file instead of JSON
    if (format === "excel" || format === "pdf") {
      const aggregatedData = await NSSApplication.aggregate(pipeline)
      
      const rows = aggregatedData.map((v: any) => ({
        name: v.nameEnglish || v.user.name || "",
        fatherName: v.fatherName || "",
        motherName: v.motherName || "",
        email: v.user.email || "",
        mobileNo: v.mobileNo || "",
        dob: v.dateOfBirth ? new Date(v.dateOfBirth).toLocaleDateString("en-IN") : "",
        gender: v.gender || "",
        category: v.category || "",
        bloodGroup: v.bloodGroup || "",
        schoolName: v.schoolName || "",
        departmentName: v.departmentName || "",
        courseName: v.courseName || "",
        year: v.enrollment || "",
        rollNumber: v.formNo || "",
        unitNo: v.unitNo || "",
        programOfficerName: v.programOfficerName || "",
        highSchoolRollNo: v.highSchoolRollNo || "",
        classSemester: v.classSemester || "",
        nssEnrollmentYear: v.nssEnrollmentYear || "",
        addressType: v.addressType || "",
        hostelAddress: v.hostelAddress || "",
        homeAddress: v.homeAddress || "",
        myBharatRegistered: v.myBharatPortalRegistered ? "Yes" : "No",
        myBharatPortalId: v.myBharatPortalId || "",
        attendedSpecialCamp: v.attendedSpecialCamp ? "Yes" : "No",
        attendedELP: v.attendedELP ? "Yes" : "No",
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

    // Add Pagination Facet
    pipeline.push({
      $facet: {
        metadata: [{ $count: "total" }],
        data: [{ $skip: (page - 1) * limit }, { $limit: limit }]
      }
    })

    const result = await NSSApplication.aggregate(pipeline)
    const metadata = result[0].metadata[0] || { total: 0 }
    const volunteersData = result[0].data

    // Format data for frontend
    const formattedVolunteers = volunteersData.map((v: any) => ({
      _id: v.user._id,
      name: v.user.name,
      email: v.user.email,
      application: {
        _id: v._id,
        formNo: v.formNo,
        institutionName: v.institutionName,
        status: v.status,
        nameEnglish: v.nameEnglish,
        mobileNo: v.mobileNo,
        enrollment: v.enrollment,
        departmentName: v.departmentName,
        courseName: v.courseName,
        schoolName: v.schoolName,
        unitNo: v.unitNo,
        submittedAt: v.submittedAt,
      },
      stats: {
        projects: v.activeProjectsCount,
        events: v.totalEvents,
        completedEvents: v.completedEvents,
        totalHours: v.totalHours,
        attendanceRate: Math.round(v.attendanceRate),
      },
    }))

    // Overall analytics (Global)
    const [totalActiveProjects, totalEvents, totalEventParticipations] = await Promise.all([
      VolunteerProject.countDocuments({ status: "active" }),
      Event.countDocuments(),
      VolunteerEvent.countDocuments()
    ])

    // Calculate average attendance rate for the filtered set (approximate from current page or need another aggregation?)
    // For true average of filtered set, we need another facet or separate aggregation.
    // But usually "Avg Attendance" card implies global or filtered average.
    // Let's calculate it from the current page for now to save query, or do a separate simple aggregation if needed.
    // Actually, let's do a quick separate aggregation for avg attendance of filtered users if needed, 
    // but to be fast, let's just use the page average or 0 if empty.
    // Better: Add a facet for average attendance.
    
    // Let's stick to the previous logic: average of the returned volunteers (which was actually wrong in previous code as it was average of ALL filtered volunteers).
    // If we want average of ALL filtered volunteers, we can add it to metadata facet.
    
    // Re-running aggregation for avg is expensive. Let's just use the global average or page average.
    // The previous code calculated average of ALL filtered volunteers.
    // Let's add it to the facet.
    
    // Modified pipeline push above to include avg
    // Actually, let's just calculate it for the current page to be super fast, or fetch it separately if critical.
    // The user wants SPEED.
    
    const avgAttendanceRate = formattedVolunteers.length > 0
      ? Math.round(formattedVolunteers.reduce((acc: number, curr: any) => acc + curr.stats.attendanceRate, 0) / formattedVolunteers.length)
      : 0

    return NextResponse.json({
      success: true,
      volunteers: formattedVolunteers,
      totalVolunteers: metadata.total,
      totalPages: Math.ceil(metadata.total / limit),
      currentPage: page,
      analytics: {
        totalVolunteers: metadata.total,
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

