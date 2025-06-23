import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getISOWeekString } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const {business} = await req.json();

    if (typeof business !== "string") {
      return NextResponse.json({ error: "Invalid business ID" }, { status: 400 });
    }

    const res = await fetch("http://10.116.2.72:5002/api/per-customer-backlogs", {
      method: "POST",
      body: JSON.stringify({ business }),
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch backlog data" }, { status: res.status });
    }

    const data = await res.json();
    const weekLabel = getISOWeekString();

    await prisma.sOPeriodBacklog.createMany({
      data: data.map((item: any) => ({
        week: weekLabel,
        customerName: item.customer_name,
        customerId: item.customer_id,
        business,
        backlogs: item.Backlogs,
        inDock: item["In-Dock"],
        inProgress: item["In-Progress"],
      })),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in backlog handler:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

