"use client";
import { useBacklogCustomers } from "@/hooks/useBacklogSummary";
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
  const { mutate, data, isPending, isError } = useBacklogCustomers();

  useEffect(() => {
    mutate("2000"); // demo BU
  }, [mutate]);

  if (isPending) return <p>Loading chart...</p>;
  if (isError) return <p>Failed to load data.</p>;

  return (
    <div className="bg-white rounded-lg p-4 shadow">
      <h2 className="text-lg font-semibold mb-4 text-red-700">
        SO Backlogs by Groups
      </h2>
      <ResponsiveContainer width="100%" height={375}>
        <BarChart
          data={data}
          barSize={20}
          margin={{ top: 40, right: 30, left: 20, bottom: 60 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ddd" />
          <XAxis
            dataKey="Group"
            interval={0}
            height={80}
            tick={{
              angle: -35,
              textAnchor: "end",
              fill: "#6b7280",
              fontSize: 13,
            }as any}
          />
          <YAxis tick={{ fill: "#6b7280" }} />
          <Tooltip />
          <Legend
            verticalAlign="top"
            align="right"
            wrapperStyle={{ top: -10 }}
          />
          <Bar dataKey="Backlogs" fill="#FAE27C" radius={[10, 10, 0, 0]} />
          <Bar dataKey="In-Dock" fill="#C3EBFA" radius={[10, 10, 0, 0]} />
          <Bar dataKey="In-Progress" fill="#FCA5A5" radius={[10, 10, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
