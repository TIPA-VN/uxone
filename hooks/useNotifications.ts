import { useState, useEffect, useMemo } from "react";

// Types
export type Notification = {
  id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  link?: string;
  type?: string;
  createdAt: string;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Fetch initial notifications
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) throw new Error('Failed to fetch notifications');
      const data = await res.json();
      
      setNotifications(data);
    } catch (e) {
      console.error('Error fetching notifications:', e);
      if (e instanceof Error) {
        setError(e);
      } else {
        setError(new Error(String(e)));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Real-time SSE connection
    const evtSource = new EventSource("/api/notifications/stream");
    
    evtSource.onmessage = (event) => {
      try {
        const notif = JSON.parse(event.data);
        if (notif.type === 'heartbeat') return;
        if (!notif.id) {
          return;
        }
        
        setNotifications((prev) => {
          // Avoid duplicates by id
          if (prev.some((n) => n.id === notif.id)) {
            return prev;
          }
          
          return [notif, ...prev];
        });
      } catch (error) {
        console.error('Error handling SSE message:', error);
      }
    };

    evtSource.onerror = (error) => {
      console.error('SSE connection error:', error);
      evtSource.close();
    };

    evtSource.onopen = () => {
      // Connection opened
    };

    return () => {
      evtSource.close();
    };
  }, []);

  const unreadCount = useMemo(() => 
    notifications.filter((n) => !n.read).length,
    [notifications]
  );

  return {
    notifications,
    unreadCount,
    loading,
    error,
    refetch: fetchNotifications,
    setNotifications,
  };
} 