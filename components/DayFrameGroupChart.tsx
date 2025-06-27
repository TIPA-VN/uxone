"use client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { useEffect, useState, useCallback, useRef } from "react";

type FrameGroupCount = {
  frame: string;
  count: number;
};

type RawFrameGroupCount = {
  frame: string | null;
  count: number;
};

const colorPalette = [
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
];

export default function DayFrameGroupChart() {
  const [chartData, setChartData] = useState<FrameGroupCount[]>([]);
  const [othersBreakdown, setOthersBreakdown] = useState<FrameGroupCount[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Store interval id to clear on unmount
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(false);
      const res = await fetch("http://10.116.2.72:5002/api/wo-comp-query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ range_type: "day" }),
      });

      if (!res.ok) throw new Error("Failed to fetch data");

      const result = await res.json();
      const raw: RawFrameGroupCount[] = result.frame_group_count || [];

      const processed: FrameGroupCount[] = raw.map((d) => ({
        frame: d.frame ?? "Others",
        count: d.count,
      }));

      const topN = 10;
      const sorted = [...processed].sort((a, b) => b.count - a.count);
      const top = sorted.slice(0, topN);
      const others = sorted.slice(topN);
      const othersCount = others.reduce((sum, d) => sum + d.count, 0);

      const reduced =
        othersCount > 0
          ? [...top, { frame: "Others", count: othersCount }]
          : top;

      setChartData(reduced);
      setOthersBreakdown(others);
      setTotal(result.total || 0);
    } catch (err) {
      console.error("Failed to fetch chart data:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    intervalRef.current = setInterval(fetchData, 5 * 60 * 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchData]);

  const handleBarClick = (data: FrameGroupCount) => {
    if (data.frame === "Others") {
      setShowModal(true);
    }
  };

  const getBarColor = useCallback(
    (frame: string, index: number) =>
      frame === "Others"
        ? "#ea580c"
        : colorPalette[index % colorPalette.length],
    []
  );

  const exportCSV = useCallback(() => {
    const headers = ["Frame", "Count"];
    const rows = othersBreakdown.map((d) => [d.frame, d.count]);
    const csvContent = [headers, ...rows]
      .map((row) => row.map((v) => `"${v}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `others_breakdown_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [othersBreakdown]);

  return (
    <div className="bg-white rounded-lg p-4 shadow relative min-h-[400px] flex flex-col">
      <div className="flex justify-center items-center gap-2 mb-3">
        <h2 className="text-lg font-semibold text-cyan-700">
          Daily Production (Top 10)
        </h2>
      </div>

      {/* Move total label to top left and keep card full height */}
      <div className="absolute top-60 left-60 bg-white/90 px-4 py-1 min-w-30 rounded shadow text-left z-10">
        <p className="text-xs flex justify-center text-gray-500">Total Motors</p>
        <p className="text-base flex justify-center font-bold text-gray-800">{total}</p>
        <p className="text-xs flex justify-center text-gray-600">
          {new Date().toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric"
          })}
        </p>
      </div>

      <div className="flex-1 flex flex-col justify-center">
        {loading && (
          <div className="flex-1 flex items-center justify-center">
            <p>Loading chart...</p>
          </div>
        )}
        {error && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-red-500">Failed to load chart data.</p>
          </div>
        )}
        {!loading && !error && chartData.length === 0 && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-gray-500 text-center">No data available.</p>
          </div>
        )}
        {!loading && !error && chartData.length > 0 && (
          <ResponsiveContainer width="100%" height={375}>
            <BarChart
              data={chartData}
              layout="vertical"
              barSize={20}
              margin={{ top: 20, right: 30, left: 40, bottom: 20 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                horizontal={false}
                stroke="#ddd"
              />
              <XAxis type="number" tick={{ fill: "#6b7280" }} />
              <YAxis
                type="category"
                dataKey="frame"
                tick={{ fill: "#6b7280", fontSize: 13 }}
                width={80}
              />
              <Tooltip
                formatter={(val: number) => val.toLocaleString()}
                labelFormatter={(label: string) => `Frame: ${label}`}
              />
              <Bar
                dataKey="count"
                radius={[0, 10, 10, 0]}
                isAnimationActive
                animationDuration={800}
                animationEasing="ease-out"
                cursor="pointer"
                onClick={(data) => handleBarClick(data.payload)}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={getBarColor(entry.frame, index)}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {showModal && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[80vh] overflow-y-auto shadow-lg relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-2 right-3 text-gray-500 hover:text-red-500 text-xl"
              aria-label="Close modal"
            >
              ×
            </button>
            <h3 className="text-lg font-semibold mb-4 text-cyan-700">
              Others Breakdown
            </h3>
            <ul className="space-y-2 text-sm">
              {othersBreakdown.map((item, i) => (
                <li
                  key={i}
                  className="flex justify-between border-b pb-1 text-gray-700"
                >
                  <span>{item.frame}</span>
                  <span>{item.count.toLocaleString()}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex justify-end">
              <button
                onClick={exportCSV}
                className="bg-cyan-600 hover:bg-cyan-700 text-white px-3 py-1 rounded text-sm"
              >
                Export CSV
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
      );
    }
