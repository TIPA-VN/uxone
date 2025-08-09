import { useState, useEffect, useMemo, useCallback } from "react";
import { Notification as NotificationType } from "@/types";

export function useNotifications() {
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  // Check browser notification support and permission
  const checkNotificationSupport = useCallback(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
      return true;
    }
    return false;
  }, []);

  // Request notification permission safely
  const requestPermission = useCallback(async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const result = await Notification.requestPermission();
        setPermission(result);
        return result;
      } catch (error) {
        console.error('Error requesting notification permission:', error);
        return 'denied';
      }
    }
    return 'denied';
  }, []);

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
    // Check notification support on mount
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
    }
    
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
          // Handle notification updates (read status changes)
          if (notif.type === 'notification_update') {
            return prev.map((n) => 
              n.id === notif.id ? { ...n, read: notif.read, hidden: notif.hidden } : n
            );
          }
          
          // Handle new notifications
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
  }, []); // Remove checkNotificationSupport from dependencies

  const unreadCount = useMemo(() => 
    notifications.filter((n) => !n.read).length,
    [notifications]
  );

  return {
    notifications,
    unreadCount,
    loading,
    error,
    permission,
    refetch: fetchNotifications,
    setNotifications,
    requestPermission,
    checkNotificationSupport,
  };
} 