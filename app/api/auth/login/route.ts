import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    // Hash the password before sending to central API
    const hashedPassword = await bcrypt.hash(password, 10);
    const centralResponse = await fetch("http://10.116.3.138:8888/api/web_check_login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password: hashedPassword }),
    });
    const centralData = await centralResponse.json();

    if (!centralResponse.ok || centralData.message !== "OK") {
      return NextResponse.json({ message: "err", content: centralData.message || "Invalid password" }, { status: 401 });
    }

    if (!centralData.emp_code) {
      return NextResponse.json({ message: "err", content: "Central API did not return emp_code (username)" }, { status: 401 });
    }

    console.log("Central API response:", centralData);
    // Upsert user in local database
    const userData = {
      username: centralData.emp_code,
      name: centralData.emp_name,
      email: centralData.email || `${centralData.emp_code}@tipa.co.th`,
      department: centralData.emp_dept,
      departmentName: centralData.emp_dept_name,
      position: centralData.emp_pos,
      role: centralData.role || "USER",
      image: centralData.image || null,
      hashedPassword: 'centrally-authenticated',
    };

    const user = await prisma.user.upsert({
      where: { username: userData.username },
      update: userData,
      create: userData,
    });

    return NextResponse.json({
      message: "OK",
      emp_code: userData.username,
      emp_pos: userData.position,
      emp_dept: userData.department,
      emp_dept_name: userData.departmentName,
      emp_name: userData.name,
      email: userData.email,
      role: userData.role,
      image: userData.image,
    });
  } catch (error) {
    return NextResponse.json(
      { message: "err", error: error instanceof Error ? error.message : "Unknown error" },
      { status: 401 }
    );
  }
} 