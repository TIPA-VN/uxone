import { NextResponse } from "next/server"
import { authenticateUser, mapPositionToRole } from "@/lib/auth-middleware"

// Force Node.js runtime for bcrypt
export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { username, password } = body

    // Use enhanced authentication function
    const user = await authenticateUser(username, password)

    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      )
    }

    // Check if user is active
    if (!user.isActive) {
      return NextResponse.json(
        { error: "User account is disabled. Please contact your administrator." },
        { status: 401 }
      )
    }

    // Map position to role if not already set
    const role = user.role || mapPositionToRole(user.departmentName || 'STAFF')

    const result = {
      message: "OK",
      id: user.id,
      emp_code: user.empCode || user.username,
      emp_pos: user.departmentName || 'STAFF',
      emp_dept: user.centralDepartment || user.department || 'OPS',
      emp_dept_name: user.departmentName || 'Unknown Department',
      emp_name: user.name || user.username,
      email: user.email || `${user.username}@tipa.co.th`,
      role: role
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Authentication failed" },
      { status: 401 }
    )
  }
} 