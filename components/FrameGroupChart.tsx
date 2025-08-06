"use client";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { useEffect, useState, useRef } from "react";
import { useWOComponents } from "@/hooks/useWOComponents";

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

      // Prefetch next range data (without React Query)
              fetch(process.env.NEXT_PUBLIC_API_URL || "http://10.116.2.72:8091/api/wo-comp-query", {
        method: "POST",
        body: JSON.stringify({ range_type: nextRange }),
        headers: { "Content-Type": "application/json" },
      }).catch(() => {
        // Silently fail prefetch
      });

      setTimeout(() => setRangeType(nextRange), 200);
    }, 60 * 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [rangeType]);

  return (
    <div className="bg-white rounded-lg p-4 shadow relative min-h-[400px] flex flex-col">
      <div className="flex justify-evenly items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold text-cyan-700">
            Production <span className="hidden lg:inline">Report</span>
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
          className=" bg-cyan-600 hover:bg-cyan-700 text-white px-2 text-sm py-1 rounded"
        >
          {showPercentage ? "Count" : "Percentage"}
        </button>
      </div>

      <div className="flex-1 flex flex-col justify-center">
        {isLoading && (
          <div className="flex-1 flex items-center justify-center">
            <p>Loading chart...</p>
          </div>
        )}
        {isError && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-red-500">Failed to load chart data.</p>
          </div>
        )}
        {!isLoading && !isError && chartData.length === 0 && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-gray-500 text-center">No data available.</p>
          </div>
        )}
        {!isLoading && !isError && chartData.length > 0 && (
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 min-w-0 relative">
              {!showPercentage && (
                <div className="absolute top-15 left-20 bg-white/90 px-2 py-1 rounded shadow text-left z-10">
                  <p className="text-xs flex justify-center text-gray-600">Total Products</p>
                  <p className="text-base flex justify-center font-bold text-gray-800">{total}</p>
                </div>
              )}
              <ResponsiveContainer width="90%" height={375}>
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={40}
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
            </div>
            <div className="flex-1 max-w-[120px] max-h-[375px] overflow-y-auto">
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
    </div>
  );
}