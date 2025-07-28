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
          // Get the URL that caused the issue
          const url = args[0] instanceof Request ? args[0].url : args[0];
          console.error("Received HTML response instead of JSON from:", url);
          console.error("Response status:", response.status);
          console.error("Response status text:", response.statusText);
          
          // Try to get the response text for debugging
          try {
            const responseText = await response.text();
            console.error("Response body (first 500 chars):", responseText.substring(0, 500));
          } catch (e) {
            console.error("Could not read response body:", e);
          }
          
          throw new Error(`Invalid response type: expected JSON, got HTML from ${url}`);
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