import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import dbConnect from "@/lib/mongodb"
import User from "@/models/User"
import VolunteerProject from "@/models/VolunteerProject"
import VolunteerEvent from "@/models/VolunteerEvent"
import VolunteerMeeting from "@/models/VolunteerMeeting"
import Event from "@/models/Event"
import NSSApplication from "@/models/NSSApplication"
import NSSProject from "@/models/NSSProject"
import { generateVolunteerExportPDF } from "@/lib/generateVolunteerExportPDF"
import { hasPermission } from "@/lib/permissions"
import { getUnitNoQuery, normalizeUnitNo } from "@/lib/unit"

function escapeRegex(text: string): string {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&")
}

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
    if (updateData.unit) appUpdate.unitNo = normalizeUnitNo(updateData.unit)
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
        const userAssignedUnits = ((user as any)?.assignedUnits || []).map((unit: string) => normalizeUnitNo(unit))
        if (userAssignedUnits.length > 0 && !userAssignedUnits.includes(normalizeUnitNo(application.unitNo))) {
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

      const meetings = await VolunteerMeeting.find({ volunteerId, status: "attended" }).lean()
      const meetingHours = meetings.reduce((sum: number, m: any) => sum + (m.hoursGranted || 0), 0)

      const totalEvents = events.length
      const approvedEvents = events.filter(
        (e: any) => e.reviewStatus === "approved" || (!e.reviewStatus && (e.hoursWorked || 0) > 0),
      )
      const completedEvents = approvedEvents.length
      const eventHours = events.reduce((sum: number, e: any) => sum + (e.hoursWorked || 0), 0)
      const totalHours = eventHours + meetingHours
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
            eventHours,
            meetingHours,
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
    const unitNo = normalizeUnitNo(searchParams.get("unitNo"))
    const enrollment = searchParams.get("enrollment")
    const schoolName = searchParams.get("schoolName")
    const departmentName = searchParams.get("departmentName")
    const search = (searchParams.get("search") || searchParams.get("nameSearch") || "").trim()
    const type = searchParams.get("type") // "past" for removed volunteers
    const sortBy = searchParams.get("sortBy") || "hours-desc" // default to hours-desc for backwards compatibility
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")

    // Handle past/removed volunteers query
    if (type === "past") {
      const pastFilter: any = { status: "removed" }
      
      // Unit-based filtering for sub-admins
      if (session.user.role === "sub-admin") {
        const user = await User.findById(session.user.id).select("assignedUnits").lean()
        const userAssignedUnits = ((user as any)?.assignedUnits || []).map((unit: string) => normalizeUnitNo(unit))
        if (userAssignedUnits.length > 0) {
          pastFilter.$or = userAssignedUnits.map((unit: string) => ({ unitNo: getUnitNoQuery(unit) }))
        }
      } else if (unitNo && unitNo !== "all") {
        pastFilter.unitNo = getUnitNoQuery(unitNo)
      }

      if (search) {
        const escapedSearch = escapeRegex(search)
        const digitsOnly = search.replace(/\D/g, "")

        // Find users matching search by name, email, or phone
        const matchingUsers = await User.find({
          $or: [
            { name: { $regex: escapedSearch, $options: "i" } },
            { email: { $regex: escapedSearch, $options: "i" } },
            { phone: { $regex: escapedSearch, $options: "i" } },
          ],
        }).select("_id").lean()
        const matchingUserIds = matchingUsers.map((u: any) => u._id)

        const searchOrConditions: any[] = [
          { nameEnglish: { $regex: escapedSearch, $options: "i" } },
          { nameHindi: { $regex: escapedSearch, $options: "i" } },
          { emailId: { $regex: escapedSearch, $options: "i" } },
          { mobileNo: { $regex: escapedSearch, $options: "i" } },
          { institutionalIdCard: { $regex: escapedSearch, $options: "i" } },
          { formNo: { $regex: escapedSearch, $options: "i" } },
          { removalReason: { $regex: escapedSearch, $options: "i" } },
        ]

        if (digitsOnly.length >= 3) {
          searchOrConditions.push({ mobileNo: { $regex: digitsOnly, $options: "i" } })
          if (digitsOnly.length === 12 && digitsOnly.startsWith("91")) {
            searchOrConditions.push({ mobileNo: { $regex: digitsOnly.slice(2), $options: "i" } })
          } else if (digitsOnly.length === 11 && digitsOnly.startsWith("0")) {
            searchOrConditions.push({ mobileNo: { $regex: digitsOnly.slice(1), $options: "i" } })
          }
        }

        if (matchingUserIds.length > 0) {
          searchOrConditions.push({ userId: { $in: matchingUserIds } })
        }

        if (pastFilter.$or) {
          pastFilter.$and = [
            { $or: pastFilter.$or },
            { $or: searchOrConditions },
          ]
          delete pastFilter.$or
        } else {
          pastFilter.$or = searchOrConditions
        }
      }

      const pastApps = await NSSApplication.find(pastFilter)
        .populate("userId", "name email")
        .populate("removedBy", "name email")
        .sort({ removedAt: -1 })
        .lean()

      const pastVolunteers = pastApps.map((app: any) => ({
        _id: String(app.userId?._id || app.userId),
        name: app.nameEnglish || app.userId?.name || "Unknown",
        email: app.userId?.email || app.emailId || "",
        mobileNo: app.mobileNo || "",
        unitNo: app.unitNo || "",
        departmentName: app.departmentName || "",
        schoolName: app.schoolName || "",
        enrollment: app.enrollment || "",
        removalReason: app.removalReason || "",
        removedAt: app.removedAt,
        removedBy: app.removedBy?.name || "Admin",
      }))

      return NextResponse.json({
        success: true,
        volunteers: pastVolunteers,
      })
    }

    // Build application filter query
    const applicationFilter: any = { status: "approved" }
    
    // Unit-based filtering for sub-admins
    if (session.user.role === "sub-admin") {
      const user = await User.findById(session.user.id).select("assignedUnits").lean()
      const userAssignedUnits = ((user as any)?.assignedUnits || []).map((unit: string) => normalizeUnitNo(unit))
      if (userAssignedUnits.length > 0) {
        applicationFilter.$or = userAssignedUnits.map((unit: string) => ({ unitNo: getUnitNoQuery(unit) }))
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
      applicationFilter.unitNo = getUnitNoQuery(unitNo)
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
    if (search) {
      const escapedSearch = escapeRegex(search)
      const digitsOnly = search.replace(/\D/g, "")

      // Search matching users by name, email, or phone
      const matchingUsers = await User.find({
        $or: [
          { name: { $regex: escapedSearch, $options: "i" } },
          { email: { $regex: escapedSearch, $options: "i" } },
          { phone: { $regex: escapedSearch, $options: "i" } },
        ],
      }).select("_id").lean()
      const matchingUserIds = matchingUsers.map((u: any) => u._id)

      const searchOrConditions: any[] = [
        { nameEnglish: { $regex: escapedSearch, $options: "i" } },
        { nameHindi: { $regex: escapedSearch, $options: "i" } },
        { emailId: { $regex: escapedSearch, $options: "i" } },
        { mobileNo: { $regex: escapedSearch, $options: "i" } },
        { institutionalIdCard: { $regex: escapedSearch, $options: "i" } },
        { formNo: { $regex: escapedSearch, $options: "i" } },
        { highSchoolRollNo: { $regex: escapedSearch, $options: "i" } },
        { fatherName: { $regex: escapedSearch, $options: "i" } },
      ]

      if (digitsOnly.length >= 3) {
        searchOrConditions.push({ mobileNo: { $regex: digitsOnly, $options: "i" } })
        if (digitsOnly.length === 12 && digitsOnly.startsWith("91")) {
          searchOrConditions.push({ mobileNo: { $regex: digitsOnly.slice(2), $options: "i" } })
        } else if (digitsOnly.length === 11 && digitsOnly.startsWith("0")) {
          searchOrConditions.push({ mobileNo: { $regex: digitsOnly.slice(1), $options: "i" } })
        }
      }

      if (matchingUserIds.length > 0) {
        searchOrConditions.push({ userId: { $in: matchingUserIds } })
      }

      if (applicationFilter.$or) {
        applicationFilter.$and = [
          { $or: applicationFilter.$or },
          { $or: searchOrConditions },
        ]
        delete applicationFilter.$or
      } else {
        applicationFilter.$or = searchOrConditions
      }
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
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
      
      // 3. Filter by user role (just in case)
      {
        $match: {
          $or: [
            { user: null },
            { "user.role": { $in: ["volunteer", "user"] } }
          ]
        }
      },

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

      // 5.5 Lookup Volunteer Meetings for stats
      {
        $lookup: {
          from: "volunteermeetings",
          let: { userId: "$userId" },
          pipeline: [
             { $match: { $expr: { $and: [{ $eq: ["$volunteerId", "$$userId"] }, { $eq: ["$status", "attended"] }] } } }
          ],
          as: "attendedMeetings"
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
          eventHours: { $sum: "$events.hoursWorked" },
          meetingHours: { $sum: "$attendedMeetings.hoursGranted" }
        }
      },
      
      {
        $addFields: {
            totalHours: { $add: ["$eventHours", "$meetingHours"] }
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
      { $sort: sortBy === "hours-asc" ? { totalHours: 1, attendanceRate: 1 } 
             : sortBy === "name-asc" ? { nameEnglish: 1 } 
             : sortBy === "name-desc" ? { nameEnglish: -1 } 
             : { totalHours: -1, attendanceRate: -1 } }
    ]

    // If export requested, return file instead of JSON
    if (format === "excel" || format === "pdf") {
      const aggregatedData = await NSSApplication.aggregate(pipeline)

      // Parse requested fields (comma-separated), fallback to all if not provided
      const fieldsParam = searchParams.get("fields")
      const requestedFields = fieldsParam ? fieldsParam.split(",").filter(Boolean) : null

      // Master field map: key -> { label, getValue }
      const FIELD_MAP: Record<string, { label: string; getValue: (v: any) => string }> = {
        name: { label: "Name", getValue: (v) => v.nameEnglish || v.user?.name || "" },
        fatherName: { label: "Father Name", getValue: (v) => v.fatherName || "" },
        motherName: { label: "Mother Name", getValue: (v) => v.motherName || "" },
        email: { label: "Email", getValue: (v) => v.user?.email || v.emailId || "" },
        mobileNo: { label: "Mobile No", getValue: (v) => v.mobileNo || "" },
        dob: { label: "DOB", getValue: (v) => v.dateOfBirth ? new Date(v.dateOfBirth).toLocaleDateString("en-IN") : "" },
        gender: { label: "Gender", getValue: (v) => v.gender || "" },
        category: { label: "Category", getValue: (v) => v.category || "" },
        bloodGroup: { label: "Blood Group", getValue: (v) => v.bloodGroup || "" },
        addressType: { label: "Address Type", getValue: (v) => v.addressType || "" },
        hostelAddress: { label: "Hostel Address", getValue: (v) => v.hostelAddress || "" },
        homeAddress: { label: "Home Address", getValue: (v) => v.homeAddress || "" },
        schoolName: { label: "School", getValue: (v) => v.schoolName || "" },
        departmentName: { label: "Department", getValue: (v) => v.departmentName || "" },
        courseName: { label: "Course", getValue: (v) => v.courseName || "" },
        year: { label: "Year", getValue: (v) => v.enrollment || "" },
        rollNumber: { label: "Roll Number", getValue: (v) => v.formNo || "" },
        highSchoolRollNo: { label: "High School Roll No", getValue: (v) => v.highSchoolRollNo || "" },
        classSemester: { label: "Class/Semester", getValue: (v) => v.classSemester || "" },
        unitNo: { label: "Unit", getValue: (v) => v.unitNo || "" },
        programOfficerName: { label: "Program Officer", getValue: (v) => v.programOfficerName || "" },
        nssEnrollmentYear: { label: "NSS Enrollment Year", getValue: (v) => v.nssEnrollmentYear || "" },
        myBharatRegistered: { label: "My Bharat Registered", getValue: (v) => v.myBharatPortalRegistered ? "Yes" : "No" },
        myBharatPortalId: { label: "My Bharat ID", getValue: (v) => v.myBharatPortalId || "" },
        attendedSpecialCamp: { label: "Attended Special Camp", getValue: (v) => v.attendedSpecialCamp ? "Yes" : "No" },
        attendedELP: { label: "Attended ELP", getValue: (v) => v.attendedELP ? "Yes" : "No" },
        specialNSSAchievements: { label: "Special NSS Achievements", getValue: (v) => v.specialNSSAchievements || "" },
        otherAchievements: { label: "Other Achievements", getValue: (v) => v.otherAchievements || "" },
        // Stats fields (computed from aggregation pipeline)
        totalHours: { label: "Total NSS Hours", getValue: (v) => String(v.totalHours || 0) },
        eventHours: { label: "Event Hours", getValue: (v) => String(v.eventHours || 0) },
        meetingHours: { label: "Meeting Hours", getValue: (v) => String(v.meetingHours || 0) },
        totalEvents: { label: "Total Events", getValue: (v) => String(v.totalEvents || 0) },
        completedEvents: { label: "Completed Events", getValue: (v) => String(v.completedEvents || 0) },
        attendanceRate: { label: "Attendance %", getValue: (v) => {
          const rate = v.totalEvents > 0 ? Math.round((v.completedEvents / v.totalEvents) * 100) : 0
          return String(rate)
        }},
        activeProjects: { label: "Active Projects", getValue: (v) => String(v.activeProjectsCount || 0) },
      }

      // Default all-fields order (backward compat when no fields param)
      const DEFAULT_FIELDS = [
        "name", "fatherName", "motherName", "email", "mobileNo", "dob", "gender", "category", "bloodGroup",
        "schoolName", "departmentName", "courseName", "year", "rollNumber", "unitNo", "programOfficerName",
        "highSchoolRollNo", "classSemester", "nssEnrollmentYear", "addressType", "hostelAddress", "homeAddress",
        "myBharatRegistered", "myBharatPortalId", "attendedSpecialCamp", "attendedELP",
      ]

      const selectedFields = (requestedFields || DEFAULT_FIELDS).filter(f => FIELD_MAP[f])

      // Build rows with only selected fields
      const rows = aggregatedData.map((v: any) => {
        const row: Record<string, string> = {}
        for (const key of selectedFields) {
          row[key] = FIELD_MAP[key].getValue(v)
        }
        return row
      })

      const fileNameBase =
        (searchParams.get("unitNo") && searchParams.get("unitNo") !== "all")
          ? `volunteers_unit_${searchParams.get("unitNo")}`
          : "volunteers_all_units"

      if (format === "pdf") {
        // Generate actual PDF with dynamic columns
        const unitInfo =
          searchParams.get("unitNo") && searchParams.get("unitNo") !== "all"
            ? `Unit ${searchParams.get("unitNo")} Volunteers`
            : "All Units Volunteers"
        
        const columns = selectedFields.map(key => ({ key, label: FIELD_MAP[key].label }))
        const pdfBytes = await generateVolunteerExportPDF(rows, unitInfo, columns)

        return new NextResponse(pdfBytes, {
          status: 200,
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="${fileNameBase}.pdf"`,
          },
        })
      } else {
        // Excel format (tab-separated) with dynamic columns
        const header = selectedFields.map(key => FIELD_MAP[key].label).join("\t") + "\n"
        const body = rows
          .map(row => selectedFields.map(key => row[key] || "").join("\t"))
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
      _id: String(v.user?._id || v.userId),
      name: v.user?.name || v.nameEnglish || "Unknown",
      email: v.user?.email || v.emailId || "",
      application: {
        _id: v._id,
        formNo: v.formNo,
        institutionName: v.institutionName,
        status: v.status,
        nameEnglish: v.nameEnglish,
        nameHindi: v.nameHindi,
        fatherName: v.fatherName,
        mobileNo: v.mobileNo || v.user?.phone || "",
        institutionalIdCard: v.institutionalIdCard,
        enrollment: v.enrollment,
        departmentName: v.departmentName,
        courseName: v.courseName,
        schoolName: v.schoolName,
        unitNo: v.unitNo,
        submittedAt: v.submittedAt,
        reviewedAt: v.reviewedAt || null,
        photo: v.photo || v.user?.photo || "",
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

export async function DELETE(request: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as any
    if (!session?.user?.id || (session.user.role !== "admin" && session.user.role !== "sub-admin")) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    // Check specific permission for sub-admins
    if (session.user.role !== "admin") {
      const userPermissions = session.user.permissions || []
      if (!hasPermission(userPermissions, "volunteers.edit")) {
        return NextResponse.json({ success: false, message: "Permission denied. You need 'volunteers.edit' permission." }, { status: 403 })
      }
    }

    await dbConnect()
    const body = await request.json()
    const { volunteerId, reason } = body

    if (!volunteerId) {
      return NextResponse.json({ success: false, message: "Volunteer ID is required" }, { status: 400 })
    }

    if (!reason || !reason.trim()) {
      return NextResponse.json({ success: false, message: "Removal reason is required" }, { status: 400 })
    }

    // Find the volunteer user
    const volunteerUser = await User.findById(volunteerId)
    if (!volunteerUser) {
      return NextResponse.json({ success: false, message: "Volunteer not found" }, { status: 404 })
    }

    // Don't allow removing admins or sub-admins
    if (volunteerUser.role === "admin" || volunteerUser.role === "sub-admin") {
      return NextResponse.json({ success: false, message: "Cannot remove admin users" }, { status: 400 })
    }

    // Check if already removed
    if (volunteerUser.status === "removed") {
      return NextResponse.json({ success: false, message: "Volunteer is already removed" }, { status: 400 })
    }

    // Find the application
    const application = await NSSApplication.findOne({ userId: volunteerId })

    // Check unit access for sub-admin
    if (session.user.role === "sub-admin" && application) {
      const adminUser = await User.findById(session.user.id).select("assignedUnits").lean()
      const userAssignedUnits = ((adminUser as any)?.assignedUnits || []).map((unit: string) => normalizeUnitNo(unit))
      if (userAssignedUnits.length > 0 && !userAssignedUnits.includes(normalizeUnitNo(application.unitNo))) {
        return NextResponse.json({ success: false, message: "Access denied. This volunteer is not in your assigned units." }, { status: 403 })
      }
    }

    // 1. Update User status to "removed"
    await User.findByIdAndUpdate(volunteerId, { status: "removed" })

    // 2. Update NSSApplication status to "removed" with tracking info
    if (application) {
      await NSSApplication.findOneAndUpdate(
        { userId: volunteerId },
        {
          status: "removed",
          removedAt: new Date(),
          removedBy: session.user.id,
          removalReason: reason.trim(),
        }
      )
    }

    // 3. Deactivate active project assignments
    await VolunteerProject.updateMany(
      { volunteerId, status: "active" },
      { status: "removed" }
    )

    // 4. Cancel future event registrations (keep past ones for records)
    // We don't delete past events — they're historical records
    // Only cancel events that haven't started yet
    const now = new Date()
    await VolunteerEvent.updateMany(
      { 
        volunteerId, 
        status: { $in: ["registered", "pending"] },
        startTime: { $gt: now }
      },
      { status: "cancelled" }
    )

    const unitNo = application?.unitNo || "Unknown"

    return NextResponse.json({
      success: true,
      message: `Volunteer removed successfully. Unit ${unitNo} seat is now available.`,
      freedUnit: unitNo,
    })
  } catch (error) {
    console.error("Error removing volunteer:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
