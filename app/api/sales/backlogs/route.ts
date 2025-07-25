import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// Force Node.js runtime for Prisma
export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const customerId = searchParams.get("customerId");
    const startWeek = searchParams.get("startWeek");
    const endWeek = searchParams.get("endWeek");

    // Replace `any` with proper Prisma type
    const whereClause: Prisma.SOPeriodBacklogWhereInput = {};

    if (customerId) {
      whereClause.customerId = customerId;
    }

    if (startWeek && endWeek) {
      whereClause.week = {
        gte: startWeek,
        lte: endWeek,
      };
    }

    const data = await prisma.sOPeriodBacklog.findMany({
      where: whereClause,
      orderBy: { week: "asc" },
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching backlogs:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
