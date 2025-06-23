"use client";
import { useEffect } from "react";
import { useBacklogSummary } from "@/hooks/useBacklogHooks";
import UserCard from "@/components/UserCard";

export default function CustomerCards() {
  const { mutate, data, isSuccess } = useBacklogSummary();

  // Trigger fetch on initial render
  useEffect(() => {
    mutate("2000"); // Replace with actual business unit if needed
  }, [mutate]);

  // Build up to 4 cards with fallback "Others"
  const filledCustomers = (() => {
    const base = isSuccess && Array.isArray(data) ? data.slice(0, 4) : [];
    const result = [...base];
    const othersCount = 4 - result.length;

    for (let i = 0; i < othersCount; i++) {
      result.push({
        Group: "Others",
        Customers: ["N/A"],
        Backlogs: 0,
        "In-Dock": 0,
        "In-Progress": 0,
      });
    }

    return result;
  })();

  return (
    <div className="flex gap-4 justify-between flex-wrap">
      {filledCustomers.map((c, index) => (
        <UserCard
          key={`${c.Group}-${index}`}
          group={c.Group}
          customer={c.Customers}
          backlogs={c.Backlogs}
          inDock={c["In-Dock"]}
          inProgress={c["In-Progress"]}
        />
      ))}
    </div>
  );
}
