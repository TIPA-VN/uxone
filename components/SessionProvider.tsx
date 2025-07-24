"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import { useEffect } from "react";

export function SessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Add global error handler for fetch errors
    const originalFetch = window.fetch;
    window.fetch = async function (...args) {
      try {
        const response = await originalFetch.apply(this, args);
        
        // Check if the response is JSON
        const contentType = response.headers.get("content-type");
        if (contentType?.includes("text/html")) {
          console.error("Received HTML response instead of JSON");
          throw new Error("Invalid response type: expected JSON, got HTML");
        }
        
        return response;
      } catch (error) {
        console.error("Fetch error:", error);
        throw error;
      }
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  return (
    <NextAuthSessionProvider
      refetchOnWindowFocus={false}
      refetchWhenOffline={false}
      refetchInterval={5 * 60} // 5 minutes
    >
      {children}
    </NextAuthSessionProvider>
  );
} 