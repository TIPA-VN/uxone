'use client'
import { useMutation } from "@tanstack/react-query";

export const useBacklogSummary = () =>
  useMutation({
    mutationFn: async (business: string) => {
      const res = await fetch("http://10.116.2.72:8091/api/backlog-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ business }),
      });
      if (!res.ok) throw new Error("Failed to fetch backlog summary");
      return res.json();
    },
  });

export const useBacklogCustomers = () =>
  useMutation({
    mutationFn: async (business: string) => {
      const res = await fetch("http://10.116.2.72:8091/api/customer-backlogs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ business }),
      });
      if (!res.ok) throw new Error("Failed to fetch backlog summary");
      return res.json();
    },
  });

  export const useBacklogPerCustomer = () =>
  useMutation({
    mutationFn: async (business: string) => {
      const res = await fetch("http://10.116.2.72:8091/api/per-customer-backlogs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ business }),
      });

      if (!res.ok) throw new Error("Failed to fetch customer backlog");
      return res.json(); // array of { customer_name, Backlogs, In-Dock, In-Progress }
    },
  });

export const useFetchBacklogTrends = () =>
  useMutation({
    mutationFn: async ({
      customerId,
      startWeek,
      endWeek,
    }: {
      customerId: string;
      startWeek: string;
      endWeek: string;
    }) => {
      const params = new URLSearchParams({
        customerId,
        startWeek,
        endWeek,
      });

      const res = await fetch(`/api/sales/backlogs?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch backlog trends");
      return res.json();
    },
  });

  export const useGroupBacklogs = () =>
  useMutation({
    mutationFn: async (business: string) => {
      const res = await fetch("http://10.116.2.72:8091/api/customer-backlogs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ business }),
      });

      if (!res.ok) throw new Error("Failed to fetch grouped backlogs");
      return res.json();
    },
  });
