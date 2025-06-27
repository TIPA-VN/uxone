"use client";

import { useState, useEffect, useRef } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useFetchBacklogTrends } from "@/hooks/useBacklogHooks";

type BacklogTrendItem = {
  week: string;
  inDock: number;
  inProgress: number;
};

const customerOptions = [
  { id: "1", name: "TIPA-OVERALL" },
  { id: "2000021", name: "TIPS-LVM" },
  { id: "2000161", name: "PRODRIVE-LVM" },
  { id: "2000151", name: "HEJ-LVM" },
  { id: "2000031", name: "TICA-LVM" },
  { id: "2000131", name: "TIPSH-LVM" },
  { id: "2000011", name: "TIC-LVM" },
  { id: "2000111", name: "NGOCTIEN-LVM" },
];

// Helper to get ISO week string (YYYY-Www)
function getISOWeekString(date: Date) {
  const year = date.getFullYear();
  // Get week number
  const tempDate = new Date(date.getTime());
  tempDate.setHours(0, 0, 0, 0);
  // Thursday in current week decides the year
  tempDate.setDate(tempDate.getDate() + 3 - ((tempDate.getDay() + 6) % 7));
  const week1 = new Date(tempDate.getFullYear(), 0, 4);
  const weekNo = 1 + Math.round(
    ((tempDate.getTime() - week1.getTime()) / 86400000
      - 3 + ((week1.getDay() + 6) % 7)) / 7
  );
  return `${year}-W${String(weekNo).padStart(2, "0")}`;
}

export default function CustomerBacklogTrends() {
  // Calculate default weeks
  const today = new Date();
  const fourWeeksAgo = new Date(today);
  fourWeeksAgo.setDate(today.getDate() - 28);
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);

  const [selectedCustomer, setSelectedCustomer] = useState<string>(customerOptions[0].id);
  const [startWeek, setStartWeek] = useState(getISOWeekString(fourWeeksAgo));
  const [endWeek, setEndWeek] = useState(getISOWeekString(nextWeek));
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const { mutate, data, isPending, error } = useFetchBacklogTrends();

  // Auto cycle customers
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setSelectedCustomer((prev) => {
        const idx = customerOptions.findIndex((c) => c.id === prev);
        return customerOptions[(idx + 1) % customerOptions.length].id;
      });
    }, 5000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Fetch for selected customer
  useEffect(() => {
    mutate({ customerId: selectedCustomer, startWeek, endWeek });
  }, [selectedCustomer, startWeek, endWeek, mutate]);

  // Use only API data for chart
  const chartData: BacklogTrendItem[] =
    data?.map((d: any) => ({
      week: d.week,
      inDock: d.inDock,
      inProgress: d.inProgress,
    })) ?? [];

  return (
    <div className="bg-white p-4 rounded-xl w-full h-full">
      <div className="flex flex-wrap gap-4 mb-4 items-end">
        <select
          value={selectedCustomer}
          onChange={(e) => setSelectedCustomer(e.target.value)}
          className="border px-2 py-1 rounded"
        >
          {customerOptions.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <input
          type="week"
          value={startWeek}
          onChange={(e) => setStartWeek(e.target.value)}
          className="border px-2 py-1 rounded"
        />
        <input
          type="week"
          value={endWeek}
          onChange={(e) => setEndWeek(e.target.value)}
          className="border px-2 py-1 rounded"
        />
        <button
          onClick={() =>
            mutate({ customerId: selectedCustomer, startWeek, endWeek })
          }
          className="bg-blue-500 text-white px-4 py-1 rounded"
        >
          Apply
        </button>
      </div>

      <div>
        <h3 className="font-semibold mb-2 text-indigo-700">
          {customerOptions.find((c) => c.id === selectedCustomer)?.name} Backlog Trends
        </h3>
        {isPending ? (
          <p>Loading...</p>
        ) : error ? (
          <p className="text-red-500">Failed to load data.</p>
        ) : chartData.length === 0 ? (
          <p className="text-gray-500 text-center">
            No data available for this period.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area
                type="linear"
                dataKey="inProgress"
                stroke="#06923E"
                fill="#06923E"
                fillOpacity={1}
                name="In Progress"
              />
              <Area
                type="linear"
                dataKey="inDock"
                stroke="#E67514"
                fill="#E67514"
                fillOpacity={1}
                name="In Dock"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}