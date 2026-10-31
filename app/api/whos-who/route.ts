import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Leadership from "@/models/Leadership"

const DEFAULT_LEADERSHIP = [
  {
    name: "Dr. Nagendra Singh",
    designation: "NSS Program Coordinator",
    category: "coordinator",
    unitNo: "All Units",
    department: "",
    school: "",
    email: "nss@gbu.ac.in",
    phone: "",
    photo: "",
    bio: "",
    order: 1,
    isActive: true,
  },
  {
    name: "Dr. Gaurav Kumar",
    designation: "Program Officer (PO)",
    category: "officer",
    unitNo: "Unit 1",
    department: "",
    school: "",
    email: "",
    phone: "",
    photo: "",
    bio: "",
    order: 2,
    isActive: true,
  },
  {
    name: "Dr. Bhaswati Banerjee",
    designation: "Program Officer (PO)",
    category: "officer",
    unitNo: "Unit 2",
    department: "",
    school: "",
    email: "",
    phone: "",
    photo: "",
    bio: "",
    order: 3,
    isActive: true,
  },
  {
    name: "Dr. Rahul Kapoor",
    designation: "Program Officer (PO)",
    category: "officer",
    unitNo: "Unit 3",
    department: "",
    school: "",
    email: "",
    phone: "",
    photo: "",
    bio: "",
    order: 4,
    isActive: true,
  },
  {
    name: "Dr. Rakesh Kumar",
    designation: "Program Officer (PO)",
    category: "officer",
    unitNo: "Unit 4",
    department: "",
    school: "",
    email: "",
    phone: "",
    photo: "",
    bio: "",
    order: 5,
    isActive: true,
  },
  {
    name: "Dr. Shrutee Kanwar",
    designation: "Program Officer (PO)",
    category: "officer",
    unitNo: "Unit 5",
    department: "",
    school: "",
    email: "",
    phone: "",
    photo: "",
    bio: "",
    order: 6,
    isActive: true,
  },
  {
    name: "Dr. Samar Raqshin",
    designation: "Program Officer (PO)",
    category: "officer",
    unitNo: "Unit 6",
    department: "",
    school: "",
    email: "",
    phone: "",
    photo: "",
    bio: "",
    order: 7,
    isActive: true,
  },
]

export async function GET(request: NextRequest) {
  try {
    await dbConnect()
    let members = await Leadership.find({ isActive: true }).sort({ order: 1, createdAt: 1 }).lean()

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
