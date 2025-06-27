"use client";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { useEffect, useState, useRef } from "react";
import { useWOComponents } from "@/hooks/useWOComponents";
import { useQueryClient } from "@tanstack/react-query";

type FrameTypeGroupItem = {
  frame_type: string | null;
  count: number;
};

const rangeOptions: ("day" | "week" | "month")[] = ["day", "week", "month"];
const COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#ef4444",
  "#14b8a6",
  "#6366f1",
  "#eab308",
  "#ec4899",
  "#22c55e",
  "#ea580c",
  "#f472b6",
  "#a3e635",
  "#facc15",
  "#818cf8",
];

export default function FrameGroupChart() {
  const [rangeType, setRangeType] = useState<"day" | "week" | "month">("day");
  const [showPercentage, setShowPercentage] = useState(false);
  const queryClient = useQueryClient();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

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
        value:
          total > 0 ? parseFloat(((+d.count / total) * 100).toFixed(2)) : 0,
        label: d.group,
      }))
    : rawData.map((d) => ({
        ...d,
        value: d.count,
        label: d.group,
      }));

  useEffect(() => {
    intervalRef.current = setInterval(() => {
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
    },3 * 60 * 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [rangeType, queryClient]);

  return (
    <div className="bg-white rounded-lg p-4 shadow relative">
      <div className="flex justify-evenly items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-cyan-700">
            Production Report
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

      {isLoading && <p>Loading chart...</p>}
      {isError && <p className="text-red-500">Failed to load chart data.</p>}
      {!isLoading && !isError && chartData.length === 0 && (
        <p className="text-gray-500 text-center">No data available.</p>
      )}

      {!isLoading && !isError && chartData.length > 0 && (
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1 min-w-0 relative">
            <ResponsiveContainer width="100%" height={375}>
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  outerRadius={120}
                  innerRadius={60}
                  isAnimationActive
                  label={false}
                >
                  {chartData.map((entry, idx) => (
                    <Cell
                      key={`cell-${idx}`}
                      fill={COLORS[idx % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: number) =>
                    showPercentage
                      ? [`${val}%`, "Percentage"]
                      : [val.toLocaleString(), "Count"]
                  }
                  labelFormatter={(label: string) => `Frame Type: ${label}`}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Centered total label */}
            {!showPercentage && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <div className="bg-white/90 px-4 py-1 rounded shadow text-center">
                  <p className="text-xs text-gray-600">Total Motors</p>
                  <p className="text-lg font-bold text-gray-800">{total}</p>
                </div>
              </div>
            )}
          </div>
          <div className="flex-1 max-w-[100px] max-h-[375px] overflow-y-auto">
            <h3 className="text-base font-semibold mb-2 text-cyan-700">
              Frames
            </h3>
            <ul className="space-y-2 text-sm">
              {chartData.map((item, idx) => (
                <li key={item.label} className="flex items-center gap-2">
                  <span
                    className="inline-block w-4 h-4 rounded-full"
                    style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                  ></span>
                  <span className="flex-1">{item.label}</span>
                  <span className="font-semibold text-gray-700">
                    {showPercentage
                      ? `${item.value}%`
                      : Number(item.value).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}