import { handlers } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export const GET = async (req: NextRequest) => {
  try {
    const response = await handlers.GET(req);
    
    // Ensure we're returning a JSON response
    if (response) {
      const headers = new Headers(response.headers);
      headers.set("Content-Type", "application/json");
      
      return new NextResponse(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    }
    
    return new NextResponse(
      JSON.stringify({ error: "No response from auth handler" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Auth GET Error:", error);
    return new NextResponse(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
};

export const POST = async (req: NextRequest) => {
  try {
    const response = await handlers.POST(req);
    
    // Ensure we're returning a JSON response
    if (response) {
      const headers = new Headers(response.headers);
      headers.set("Content-Type", "application/json");
      
      return new NextResponse(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    }
    
    return new NextResponse(
      JSON.stringify({ error: "No response from auth handler" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Auth POST Error:", error);
    return new NextResponse(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
};