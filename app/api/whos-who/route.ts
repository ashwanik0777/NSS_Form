import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Leadership from "@/models/Leadership"

// Sensible initial placeholder data so the page looks complete immediately
const DEFAULT_LEADERSHIP = [
  {
    name: "Dr. K. K. Dwivedi",
    designation: "NSS Program Coordinator",
    category: "coordinator",
    unitNo: "All Units",
    department: "University NSS Cell",
    school: "Gautam Buddha University",
    email: "nss@gbu.ac.in",
    phone: "",
    photo: "/1.png",
    bio: "Leading NSS activities and youth engagement across all units of Gautam Buddha University.",
    order: 1,
    isActive: true,
  },
  {
    name: "Unit 1 Program Officer",
    designation: "Program Officer (PO)",
    category: "officer",
    unitNo: "Unit 1",
    department: "School of Information & Communication Technology",
    school: "SOICT",
    email: "po.unit1@gbu.ac.in",
    photo: "",
    bio: "Overseeing Unit 1 volunteer activities and campus social drives.",
    order: 2,
    isActive: true,
  },
  {
    name: "Unit 1 Faculty Mentor",
    designation: "Faculty Mentor",
    category: "mentor",
    unitNo: "Unit 1",
    department: "SOICT",
    school: "SOICT",
    email: "mentor.unit1@gbu.ac.in",
    photo: "",
    bio: "Guiding volunteers on community impact and technical outreach.",
    order: 3,
    isActive: true,
  },
  {
    name: "Unit 2 Program Officer",
    designation: "Program Officer (PO)",
    category: "officer",
    unitNo: "Unit 2",
    department: "School of Engineering",
    school: "SOE",
    email: "po.unit2@gbu.ac.in",
    photo: "",
    bio: "Managing Unit 2 cleanliness campaigns and technical workshops.",
    order: 4,
    isActive: true,
  },
  {
    name: "Unit 2 Faculty Mentor",
    designation: "Faculty Mentor",
    category: "mentor",
    unitNo: "Unit 2",
    department: "SOE",
    school: "SOE",
    email: "mentor.unit2@gbu.ac.in",
    photo: "",
    bio: "Mentoring volunteers on civil infrastructure and rural development.",
    order: 5,
    isActive: true,
  },
  {
    name: "Unit 3 Program Officer",
    designation: "Program Officer (PO)",
    category: "officer",
    unitNo: "Unit 3",
    department: "School of Biotechnology",
    school: "SOBT",
    email: "po.unit3@gbu.ac.in",
    photo: "",
    bio: "Leading health awareness and environmental conservation drives.",
    order: 6,
    isActive: true,
  },
  {
    name: "Unit 3 Faculty Mentor",
    designation: "Faculty Mentor",
    category: "mentor",
    unitNo: "Unit 3",
    department: "SOBT",
    school: "SOBT",
    email: "mentor.unit3@gbu.ac.in",
    photo: "",
    bio: "Guiding public health checkups and blood donation camps.",
    order: 7,
    isActive: true,
  },
  {
    name: "Unit 4 Program Officer",
    designation: "Program Officer (PO)",
    category: "officer",
    unitNo: "Unit 4",
    department: "School of Management",
    school: "SOM",
    email: "po.unit4@gbu.ac.in",
    photo: "",
    bio: "Coordinating event management and community engagement campaigns.",
    order: 8,
    isActive: true,
  },
  {
    name: "Unit 4 Faculty Mentor",
    designation: "Faculty Mentor",
    category: "mentor",
    unitNo: "Unit 4",
    department: "SOM",
    school: "SOM",
    email: "mentor.unit4@gbu.ac.in",
    photo: "",
    bio: "Mentoring volunteers on leadership and financial literacy outreach.",
    order: 9,
    isActive: true,
  },
  {
    name: "Unit 5 Program Officer",
    designation: "Program Officer (PO)",
    category: "officer",
    unitNo: "Unit 5",
    department: "School of Humanities & Social Sciences",
    school: "SOHSS",
    email: "po.unit5@gbu.ac.in",
    photo: "",
    bio: "Leading village adoption and social welfare programs.",
    order: 10,
    isActive: true,
  },
  {
    name: "Unit 5 Faculty Mentor",
    designation: "Faculty Mentor",
    category: "mentor",
    unitNo: "Unit 5",
    department: "SOHSS",
    school: "SOHSS",
    email: "mentor.unit5@gbu.ac.in",
    photo: "",
    bio: "Advising volunteers on grassroots surveys and literacy programs.",
    order: 11,
    isActive: true,
  },
  {
    name: "Unit 6 Program Officer",
    designation: "Program Officer (PO)",
    category: "officer",
    unitNo: "Unit 6",
    department: "School of Vocational Studies & Applied Sciences",
    school: "SOVSAS",
    email: "po.unit6@gbu.ac.in",
    photo: "",
    bio: "Overseeing special national camps and sustainability projects.",
    order: 12,
    isActive: true,
  },
  {
    name: "Unit 6 Faculty Mentor",
    designation: "Faculty Mentor",
    category: "mentor",
    unitNo: "Unit 6",
    department: "SOVSAS",
    school: "SOVSAS",
    email: "mentor.unit6@gbu.ac.in",
    photo: "",
    bio: "Guiding skill development and vocational training drives.",
    order: 13,
    isActive: true,
  },
]

export async function GET(request: NextRequest) {
  try {
    await dbConnect()
    let members = await Leadership.find({ isActive: true }).sort({ order: 1, createdAt: 1 }).lean()

    // If no records in database yet, initialize with defaults
    if (!members || members.length === 0) {
      await Leadership.insertMany(DEFAULT_LEADERSHIP)
      members = await Leadership.find({ isActive: true }).sort({ order: 1, createdAt: 1 }).lean()
    }

    return NextResponse.json({
      success: true,
      members,
    })
  } catch (error: any) {
    console.error("Error fetching leadership:", error)
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch leadership" },
      { status: 500 }
    )
  }
}

