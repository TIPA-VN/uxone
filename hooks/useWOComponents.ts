
import { useQuery } from "@tanstack/react-query";

export const useWOComponents = (rangeType: "day" | "week" | "month") =>
  useQuery({
    queryKey: ["wo-components", rangeType],
    queryFn: async () => {
      const res = await fetch(process.env.NEXT_PUBLIC_API_URL || "http://10.116.2.72:8091/api/wo-comp-query", {
        method: "POST",
        body: JSON.stringify({ range_type: rangeType }),
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    staleTime: 5 * 60 * 1000, // 5 min caching
  });
