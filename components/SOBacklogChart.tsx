"use client";
import { useBacklogSummary } from "@/hooks/useBacklogSummary";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from "recharts";
import { useEffect } from "react";

export default function SOBacklogChart() {
  const { mutate, data, isPending, isError } = useBacklogSummary();

  useEffect(() => {
    mutate(2000); // hardcoded business unit for demo
  }, [mutate]);

  if (isPending) return <p>Loading chart...</p>;
  if (isError) return <p>Failed to load data.</p>;

  return (
    <div className="bg-white rounded-lg p-4 shadow">
      <h2 className="text-lg font-semibold mb-4 text-red-700">SO Backlogs by Customer</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} barSize={20}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ddd" />
          <XAxis dataKey="name" tick={{ fill: "#6b7280" }} />
          <YAxis tick={{ fill: "#6b7280" }} />
          <Tooltip />
          <Legend />
          <Bar dataKey="ordered" fill="#FAE27C" radius={[10, 10, 0, 0]} />
          <Bar dataKey="shipped" fill="#C3EBFA" radius={[10, 10, 0, 0]} />
          <Bar dataKey="backordered" fill="#FCA5A5" radius={[10, 10, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

