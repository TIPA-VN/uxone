import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"

// Force Node.js runtime for bcrypt
export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { username, password } = body
  

    // Hash password with salt rounds 12 (as expected by central API)
    const hashedPassword = await bcrypt.hash(password, 12)

    // Call central authentication API
    const response = await fetch("http://10.116.3.138:8888/api/web_check_login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password: hashedPassword }),
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        { error: data.content || data.message || "Authentication failed" },
        { status: 401 }
      )
    }

    if (data.message !== "OK") {
      return NextResponse.json(
        { error: data.content || "Invalid credentials" },
        { status: 401 }
      )
    }

    if (!data.emp_code) {
      return NextResponse.json(
        { error: "Missing employee code" },
        { status: 401 }
      )
    }

    const result = {
      message: "OK",
      id: data.emp_code, // Use emp_code as ID
      emp_code: data.emp_code,
      emp_pos: data.emp_pos,
      emp_dept: data.emp_dept,
      emp_dept_name: data.emp_dept_name,
      emp_name: data.emp_name,
      email: data.email || `${data.emp_code}@tipa.co.th`,
    }

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Authentication failed" },
      { status: 401 }
    )
  }
} 