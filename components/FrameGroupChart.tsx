"use client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { useEffect, useState } from "react";
import { useWOComponents } from "@/hooks/useWOComponents";
import { useQueryClient } from "@tanstack/react-query";

type FrameTypeGroupItem = {
  frame_type: string | null;
  count: number;
};

const rangeOptions: ("day" | "week" | "month")[] = ["day", "week", "month"];

export default function FrameGroupChart() {
  const [rangeType, setRangeType] = useState<"day" | "week" | "month">("day");
  const [showPercentage, setShowPercentage] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useWOComponents(rangeType);
  const total = data?.total ?? 0;

  const rawData: (FrameTypeGroupItem & { group: string })[] =
    data?.frame_type_group_count?.map((d: FrameTypeGroupItem) => ({
      ...d,
      group: d.frame_type ?? "Others",
    })) ?? [];

  const chartData = showPercentage
    ? rawData.map((d) => ({
        ...d,
        count:
          total > 0 ? parseFloat(((+d.count / total) * 100).toFixed(2)) : 0,
      }))
    : rawData;

  useEffect(() => {
    const interval = setInterval(() => {
      const currentIndex = rangeOptions.indexOf(rangeType);
      const nextRange = rangeOptions[(currentIndex + 1) % rangeOptions.length];

      queryClient.prefetchQuery({
        queryKey: ["wo-components", nextRange],
        queryFn: async () => {
          const res = await fetch("http://10.116.2.72:5002/api/wo-comp-query", {
            method: "POST",
            body: JSON.stringify({ range_type: nextRange }),
            headers: { "Content-Type": "application/json" },
          });
          return res.json();
        },
      });

      setTimeout(() => setRangeType(nextRange), 200);
    }, 60 * 1000);

    return () => clearInterval(interval);
  }, [rangeType, queryClient]);

  return (
    <div className="bg-white rounded-lg p-4 shadow relative">
      <div className="flex justify-evenly items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-cyan-700">
            Production Report by Frame Group
          </h2>
          <select
            aria-label="Select time range"
            className="border rounded px-2 py-1 text-sm"
            value={rangeType}
            onChange={(e) =>
              setRangeType(e.target.value as "day" | "week" | "month")
            }
          >
            {rangeOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt.charAt(0).toUpperCase() + opt.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={() => setShowPercentage((prev) => !prev)}
          className="text-sm bg-cyan-600 hover:bg-cyan-700 text-white px-3 py-1 rounded"
        >
          {showPercentage ? "Show Count" : "Show Percentage"}
        </button>
      </div>

      {!showPercentage && (
        <div className="absolute left-1/2 top-14 -translate-x-1/2 z-10 pointer-events-none">
          <div className="bg-white/90 px-4 py-1 rounded shadow text-center">
            <p className="text-xs text-gray-600">Total Motors Count</p>
            <p className="text-lg font-bold text-gray-800">{total}</p>
          </div>
        </div>
      )}

      {isLoading && <p>Loading chart...</p>}
      {isError && <p>Failed to load chart data.</p>}

      {!isLoading && !isError && (
        <ResponsiveContainer width="100%" height={375}>
          <BarChart
            key={`${rangeType}-${showPercentage}`}
            data={chartData}
            barSize={30}
            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#ddd"
            />
            <XAxis
              dataKey="group"
              interval={0}
              height={60}
              tick={(props) => (
                <text
                  {...props}
                  transform={`rotate(-35 ${props.x},${props.y})`}
                  textAnchor="end"
                  fill="#6b7280"
                  fontSize={13}
                >
                  {props.payload.value}
                </text>
              )}
            />

            <YAxis
              tick={{ fill: "#6b7280" }}
              domain={showPercentage ? [0, 100] : undefined}
              tickFormatter={(val) =>
                showPercentage ? `${val}%` : val.toLocaleString()
              }
            />
            <Tooltip
              formatter={(val: number) =>
                showPercentage ? `${val}%` : val.toLocaleString()
              }
              labelFormatter={(label: string) => `Frame Type: ${label}`}
            />
            <Bar
              dataKey="count"
              fill="#60A5FA"
              radius={[10, 10, 0, 0]}
              animationDuration={600}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
