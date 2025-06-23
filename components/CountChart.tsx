"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from "recharts";
import { useGroupBacklogs } from "@/hooks/useBacklogHooks";

// Define expected structure from API
type GroupBacklogItem = {
  Backlogs: number;
  "In-Dock": number;
  "In-Progress": number;
};

const CountChart = () => {
  const [totals, setTotals] = useState({
    backlogs: 0,
    inDock: 0,
    inProgress: 0,
  });

  const { mutate, isPending } = useGroupBacklogs();

  useEffect(() => {
    mutate("2000", {
      onSuccess: (data: GroupBacklogItem[]) => {
        const backlogs = data.reduce((sum, g) => sum + g.Backlogs, 0);
        const inDock = data.reduce((sum, g) => sum + g["In-Dock"], 0);
        const inProgress = data.reduce((sum, g) => sum + g["In-Progress"], 0);
        setTotals({ backlogs, inDock, inProgress });
      },
    });
  }, [mutate]);

  const { backlogs, inDock, inProgress } = totals;

  if (isPending || backlogs === 0) {
    return <div className="bg-white rounded-xl p-4">Loading...</div>;
  }

  const chartData = [
    {
      name: "Backlogs",
      "In-Progress": inProgress,
      "In-Dock": inDock,
    },
  ];

  return (
    <div className="bg-white rounded-xl w-full h-full p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-lg text-slate-600 font-semibold">SO Backlogs</h1>
        <Image src="/images/moreDark.png" alt="" width={20} height={20} />
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={250}>
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" axisLine={false} tickLine={false} />
          <YAxis allowDecimals={false} />
          <Tooltip formatter={(value: number) => value.toLocaleString()} />
          <Legend verticalAlign="top" height={36} />
          <Bar
            dataKey="In-Progress"
            stackId="a"
            fill="#FF6B6B"
            name="In-Progress"
            animationDuration={900}
          />
          <Bar
            dataKey="In-Dock"
            stackId="a"
            fill="#4ECDC4"
            name="In-Dock"
            animationDuration={900}
          />
        </BarChart>
      </ResponsiveContainer>

      {/* Summary */}
      <div className="flex justify-center mt-4">
        <div className="text-center">
          <p className="text-sm text-slate-500">Total Backlogs</p>
          <p className="font-bold text-slate-700 text-xl">
            {backlogs.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default CountChart;
