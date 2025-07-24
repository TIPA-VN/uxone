import { NextResponse } from "next/server";
import { hash } from "bcrypt";

const saltRounds = 10;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    console.log("Login attempt for username:", username);

    // Hash the password using the original code
    const hashedPassword = await hash(password, saltRounds);

    console.log("Making request to central API...");

    // Call central API for authentication
    const response = await fetch(
      "http://10.116.3.138:8888/api/web_check_login",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          username,
          password: hashedPassword,
        }),
      }
    );

    const data = await response.json();
    console.log("Central API response:", data);

    return NextResponse.json(data);
  } catch (error) {
    console.error("Auth error details:", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { error: "Authentication failed", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 401 }
    );
  }
} 