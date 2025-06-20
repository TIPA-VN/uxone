"use client";
import { useBacklogSummary } from "@/hooks/useBacklogSummary";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useEffect } from "react";

export default function SOBacklogChart() {
  const { mutate, data, isPending, isError } = useBacklogSummary();

  useEffect(() => {
    mutate("2000"); // hardcoded business unit for demo
  }, [mutate]);

  if (isPending) return <p>Loading chart...</p>;
  if (isError) return <p>Failed to load data.</p>;

  return (
    <div className="bg-white rounded-lg p-4 shadow">
      <h2 className="text-lg font-semibold mb-4 text-red-700">
        SO Backlogs by Customer
      </h2>
      <ResponsiveContainer width="100%" height={375}>
        <BarChart data={data} barSize={20}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ddd" />
          <XAxis
            dataKey="customer"
            height={80}  // increases space for rotated labels
            tick={
              {
                angle: -45,
                textAnchor: "end",
                fill: "#6b7280",
                fontSize: 10, // smaller font
              } as any
            }
            interval={0}
          />
          <YAxis tick={{ fill: "#6b7280" }} />
          <Tooltip />
          <Legend
            verticalAlign="top"
            align="right"
            wrapperStyle={{ paddingBottom: 10 }}
          />
          <Bar dataKey="Backlogs" fill="#FAE27C" radius={[10, 10, 0, 0]} />
          <Bar dataKey="In-Dock" fill="#C3EBFA" radius={[10, 10, 0, 0]} />
          <Bar dataKey="In-Progress" fill="#FCA5A5" radius={[10, 10, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
