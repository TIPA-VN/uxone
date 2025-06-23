"use client";

import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useFetchBacklogTrends } from "@/hooks/useBacklogHooks";

const customerOptions = [
  { id: "2000021", name: "TIPS-LVM" },
  { id: "2000161", name: "PRODRIVE-LVM" },
  { id: "2000151", name: "HEJ-LVM" },
  { id: "2000031", name: "TICA-LVM" },
  { id: "2000131", name: "TIPSH-LVM" },
  { id: "2000011", name: "TIC-LVM" },
  { id: "2000111", name: "NGOCTIEN-LVM" },
];

export default function CustomerBacklogTrends() {
  const [selectedCustomer, setSelectedCustomer] = useState<string | undefined>();
  const [startWeek, setStartWeek] = useState("2025-W20");
  const [endWeek, setEndWeek] = useState("2025-W25");

  const { mutate, data, isPending, error } = useFetchBacklogTrends();

  // Auto-set default customer if not selected
  useEffect(() => {
    if (!selectedCustomer && customerOptions.length > 0) {
      setSelectedCustomer(customerOptions[0].id);
    }
  }, [selectedCustomer]);

  // Auto-fetch data once default customer is set
  useEffect(() => {
    if (selectedCustomer) {
      mutate({ customerId: selectedCustomer, startWeek, endWeek });
    }
  }, [selectedCustomer, startWeek, endWeek]);

  const chartData =
    data?.map((d: any) => ({
      week: d.week,
      backlogs: d.backlogs,
      inDock: d.inDock,
      inProgress: d.inProgress,
    })) || [];

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
            selectedCustomer &&
            mutate({ customerId: selectedCustomer, startWeek, endWeek })
          }
          className="bg-blue-500 text-white px-4 py-1 rounded"
          disabled={!selectedCustomer}
        >
          Apply
        </button>
      </div>

      {isPending ? (
        <p>Loading...</p>
      ) : error ? (
        <p className="text-red-500">Failed to load data.</p>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="week" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="backlogs" stroke="#60A5FA" strokeWidth={3} />
            <Line type="monotone" dataKey="inDock" stroke="#FBBF24" strokeWidth={3} />
            <Line type="monotone" dataKey="inProgress" stroke="#34D399" strokeWidth={3} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
