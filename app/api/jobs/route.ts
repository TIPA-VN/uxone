import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const business = await req.json(); // expects just a string, like "2000"

  const res = await fetch("http://10.116.2.72:5002/api/per-customer-backlogs", {
    method: "POST",
    body: JSON.stringify({ business }),
    headers: { "Content-Type": "application/json" },
  });

  const data = await res.json();

  await prisma.sOPeriodBacklog.createMany({
    data: data.map((item: any) => ({
      customerName: item.customer_name,
      customerId: item.customer_id,
      business,
      backlogs: item.Backlogs,
      inDock: item["In-Dock"],
      inProgress: item["In-Progress"],
    })),
  });

  return NextResponse.json({ success: true });
}
