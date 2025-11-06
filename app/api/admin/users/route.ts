import { type NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import User from "@/models/User"
import bcrypt from "bcryptjs"
import { sendCustomEmail } from "@/lib/email"

export async function GET(request: NextRequest) {
  try {
    await dbConnect()

    // Fetch all users except those with role "user" (temp users), exclude password field
    const users = await User.find({ role: { $ne: "user" } })
      .select("-password")
      .sort({ createdAt: -1 })

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
    const { name, email, role, permissions, password, assignedUnits } = body

    // Validate required fields
    if (!name || !email || !role) {
      return NextResponse.json({ success: false, message: "Name, email, and role are required" }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return NextResponse.json({ success: false, message: "User with this email already exists" }, { status: 400 })
    }

    // Use provided password or generate temporary
    let finalPassword: string
    let mustChangePassword = false
    if (password && password.trim().length >= 6) {
      finalPassword = password
      mustChangePassword = false // If password provided, no need to change
    } else {
      finalPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8).toUpperCase()
      mustChangePassword = true // Must change on first login
    }
    const hashedPassword = await bcrypt.hash(finalPassword, 12)

    // Create user
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role,
      permissions: permissions || [],
      assignedUnits: assignedUnits || [],
      mustChangePassword,
      status: "accepted", // Sub-admin is auto-accepted
    })

    await user.save()

    // Send email with login credentials
    try {
      await sendCustomEmail(
        email,
        "NSS Sub-Admin Account Created",
        `Dear ${name},\n\nYour NSS Sub-Admin account has been created successfully.\n\nLogin Details:\nEmail: ${email}\nPassword: ${finalPassword}\n\n${mustChangePassword ? "Please change your password after first login for security." : ""}\n\nAssigned Units: ${(assignedUnits || []).length > 0 ? assignedUnits.join(", ") : "All Units"}\n\nYou can now login at: ${process.env.NEXTAUTH_URL || "http://localhost:3000"}/login\n\nBest regards,\nNSS Administration Team`
      )
    } catch (emailError) {
      console.error("Error sending email:", emailError)
      // Don't fail user creation if email fails
    }

    return NextResponse.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
        assignedUnits: user.assignedUnits,
      },
    })
  } catch (error) {
    console.error("Error creating user:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
