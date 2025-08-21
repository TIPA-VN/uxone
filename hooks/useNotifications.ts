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
        // Handle permission error silently
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
      // Handle fetch error silently
      setNotifications([]);
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
    let evtSource: EventSource | null = null;
    
    try {
      evtSource = new EventSource("/api/notifications/stream");
      
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
          // Handle SSE message error silently
        }
      };

      evtSource.onerror = (error) => {
        // Handle SSE connection error silently
        
        // Close the connection
        if (evtSource) {
          evtSource.close();
          evtSource = null;
        }
      };

      evtSource.onopen = () => {
        // Connection opened successfully
      };
    } catch (error) {
      // Handle SSE connection error silently
    }

    return () => {
      if (evtSource) {
        evtSource.close();
      }
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