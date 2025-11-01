import { type NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import User from "@/models/User"
import bcrypt from "bcryptjs"

export async function GET(request: NextRequest) {
  try {
    await dbConnect()

    const users = await User.find({ status: "accepted" }).select("-password").sort({ createdAt: -1 })

    return NextResponse.json({
      success: true,
      users,
    })
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect()

    const body = await request.json()
    const { name, email, role, permissions } = body

    // Validate required fields
    if (!name || !email || !role) {
      return NextResponse.json({ success: false, message: "Name, email, and role are required" }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return NextResponse.json({ success: false, message: "User with this email already exists" }, { status: 400 })
    }

    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-8)
    const hashedPassword = await bcrypt.hash(tempPassword, 12)

    // Create user
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role,
      permissions: permissions || [],
    })

    await user.save()

    // TODO: Send email with login credentials
    console.log(`Temporary password for ${email}: ${tempPassword}`)

    return NextResponse.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
      },
      tempPassword, // In production, this should be sent via email
    })
  } catch (error) {
    console.error("Error creating user:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
