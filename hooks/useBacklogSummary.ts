'use client'
import { useMutation } from "@tanstack/react-query";

export const useBacklogSummary = () =>
  useMutation({
    mutationFn: async (business: number) => {
      const res = await fetch("http://10.116.2.72:5002/backlog-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ business }),
      });
      if (!res.ok) throw new Error("Failed to fetch backlog summary");
      return res.json();
    },
  });

