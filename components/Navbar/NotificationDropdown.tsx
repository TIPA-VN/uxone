import { Notification as NotificationType } from "@/types";
import { Dispatch, SetStateAction, useState, useEffect, useRef } from "react";

interface NotificationDropdownProps {
  notifications: NotificationType[];
  unreadCount: number;
  setNotificationsModalOpen: (open: boolean) => void;
  setNotifications: Dispatch<SetStateAction<NotificationType[]>>;
  notifLoading: boolean;
}

export function NotificationDropdown({
  notifications,
  unreadCount,
  setNotificationsModalOpen,
  setNotifications,
  notifLoading
}: NotificationDropdownProps) {
  const [notifOpen, setNotifOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setNotifOpen(false);
      }
    };

    if (notifOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [notifOpen]);

  // Function to clean project name by removing quotes
  const cleanProjectName = (name: string) => {
    return name.replace(/^["']|["']$/g, '').trim();
  };

  // Function to parse notification message and extract department and project
  const parseNotification = (notification: NotificationType) => {
    const message = notification.message || "";
    const title = notification.title || "";
    
    // Check if message contains "by" pattern (e.g., "Project ABC Approved by LVM-EXPAT")
    const byPattern = /(.+)\s+by\s+(.+)/i;
    const match = message.match(byPattern);
    
    // Check if message contains "has APPROVED project" pattern (e.g., "LVM-EXPAT has APPROVED project "test project 2"")
    const hasApprovedPattern = /(.+)\s+has\s+(APPROVED|REJECTED|DISAPPROVED)\s+project\s+["'](.+)["']/i;
    const hasApprovedMatch = message.match(hasApprovedPattern);
    
    if (hasApprovedMatch) {
      const department = hasApprovedMatch[1].trim();
      const action = hasApprovedMatch[2].trim();
      const projectName = hasApprovedMatch[3].trim();
      
      return {
        title: `${action.charAt(0) + action.slice(1).toLowerCase()} Project`,
        department: department,
        project: cleanProjectName(projectName),
        hasDepartment: true,
        hasProject: true
      };
    } else if (match) {
      const actionPart = match[1].trim();
      const department = match[2].trim();
      
      // Try to extract project name from the action part
      const projectPatterns = [
        /project\s+["']?([a-zA-Z0-9\-]+)["']?\s+(approved|rejected|disapproved)/i,
        /["']?([a-zA-Z0-9\-]+)["']?\s+project\s+(approved|rejected|disapproved)/i,
        /["']?([a-zA-Z0-9\-]+)["']?\s+(approved|rejected|disapproved)/i
      ];
      
      let projectName = "";
      let cleanTitle = actionPart;
      
      for (const pattern of projectPatterns) {
        const projectMatch = actionPart.match(pattern);
        if (projectMatch) {
          const extractedName = projectMatch[1].trim();
          if (extractedName.toLowerCase() !== 'project') {
            projectName = extractedName;
            cleanTitle = actionPart
              .replace(projectMatch[0], '')
              .replace(/\b(approved|rejected|disapproved|project)\b/gi, '')
              .trim();
            break;
          }
        }
      }
      
      if (!projectName) {
        const startProjectMatch = actionPart.match(/^["']?([A-Z0-9\-]{2,})["']?\s+/);
        const endProjectMatch = actionPart.match(/\s+["']?([A-Z0-9\-]{2,})["']?$/);
        
        if (startProjectMatch && startProjectMatch[1].toLowerCase() !== 'project') {
          projectName = startProjectMatch[1];
          cleanTitle = actionPart.replace(startProjectMatch[0], '').trim();
        } else if (endProjectMatch && endProjectMatch[1].toLowerCase() !== 'project') {
          projectName = endProjectMatch[1];
          cleanTitle = actionPart.replace(endProjectMatch[0], '').trim();
        }
      }
      
      return {
        title: cleanTitle,
        department: department,
        project: cleanProjectName(projectName),
        hasDepartment: true,
        hasProject: !!projectName
      };
    }
    
    // Check if title contains department info
    const titleByPattern = /(.+)\s+by\s+(.+)/i;
    const titleMatch = title.match(titleByPattern);
    
    // Check if title contains "has APPROVED project" pattern
    const titleHasApprovedPattern = /(.+)\s+has\s+(APPROVED|REJECTED|DISAPPROVED)\s+project\s+["'](.+)["']/i;
    const titleHasApprovedMatch = title.match(titleHasApprovedPattern);
    
    if (titleHasApprovedMatch) {
      const department = titleHasApprovedMatch[1].trim();
      const action = titleHasApprovedMatch[2].trim();
      const projectName = titleHasApprovedMatch[3].trim();
      
      return {
        title: `${action.charAt(0) + action.slice(1).toLowerCase()} Project`,
        department: department,
        project: cleanProjectName(projectName),
        hasDepartment: true,
        hasProject: true
      };
    } else if (titleMatch) {
      const actionPart = titleMatch[1].trim();
      const department = titleMatch[2].trim();
      
      const projectPatterns = [
        /project\s+["']?([a-zA-Z0-9\-]+)["']?\s+(approved|rejected|disapproved)/i,
        /["']?([a-zA-Z0-9\-]+)["']?\s+project\s+(approved|rejected|disapproved)/i,
        /["']?([a-zA-Z0-9\-]+)["']?\s+(approved|rejected|disapproved)/i
      ];
      
      let projectName = "";
      let cleanTitle = actionPart;
      
      for (const pattern of projectPatterns) {
        const projectMatch = actionPart.match(pattern);
        if (projectMatch) {
          const extractedName = projectMatch[1].trim();
          if (extractedName.toLowerCase() !== 'project') {
            projectName = extractedName;
            cleanTitle = actionPart
              .replace(projectMatch[0], '')
              .replace(/\b(approved|rejected|disapproved|project)\b/gi, '')
              .trim();
            break;
          }
        }
      }
      
      if (!projectName) {
        const startProjectMatch = actionPart.match(/^["']?([A-Z0-9\-]{2,})["']?\s+/);
        const endProjectMatch = actionPart.match(/\s+["']?([A-Z0-9\-]{2,})["']?$/);
        
        if (startProjectMatch && startProjectMatch[1].toLowerCase() !== 'project') {
          projectName = startProjectMatch[1];
          cleanTitle = actionPart.replace(startProjectMatch[0], '').trim();
        } else if (endProjectMatch && endProjectMatch[1].toLowerCase() !== 'project') {
          projectName = endProjectMatch[1];
          cleanTitle = actionPart.replace(endProjectMatch[0], '').trim();
        }
      }
      
      return {
        title: cleanTitle,
        department: department,
        project: cleanProjectName(projectName),
        hasDepartment: true,
        hasProject: !!projectName
      };
    }
    
    return {
      title: title || "Notification",
      message: message,
      hasDepartment: false,
      hasProject: false
    };
  };

  // Function to get status icon and color based on notification content
  const getStatusIcon = (notification: NotificationType) => {
    const title = notification.title?.toLowerCase() || "";
    const message = notification.message?.toLowerCase() || "";
    const content = `${title} ${message}`;
    
    const parsed = parseNotification(notification);
    const parsedTitle = parsed.title?.toLowerCase() || "";
    
    // Prioritize parsed title over original content for status detection
    if (parsedTitle.includes('rejected') || parsedTitle.includes('disapproved') || 
        content.includes('rejected') || content.includes('disapproved') || content.includes('rejection')) {
      return {
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ),
        color: 'text-red-600',
        bgColor: 'bg-red-100'
      };
    }
    
    if (parsedTitle.includes('approved') || content.includes('approved') || content.includes('approval')) {
      return {
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
        color: 'text-green-600',
        bgColor: 'bg-green-100'
      };
    }
    
    return {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'text-gray-600',
      bgColor: 'bg-gray-100'
    };
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div 
        className="rounded-full w-7 h-7 flex items-center justify-center cursor-pointer relative" 
        onClick={() => setNotifOpen(!notifOpen)}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <div className="absolute -top-2 -right-2 min-w-[20px] h-5 flex items-center justify-center bg-rose-600 text-white rounded-full text-xs px-1">
            {unreadCount}
          </div>
        )}
      </div>

      {notifOpen && (
        <div className="absolute top-10 right-0 w-80 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                <span className="font-semibold text-xs">Notifications</span>
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <span className="bg-white/20 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                    {unreadCount} new
                  </span>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setNotifOpen(false);
                  }}
                  className="text-white hover:text-gray-200 transition-colors p-0.5 cursor-pointer"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-72 overflow-y-auto">
            {notifLoading ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                <span className="ml-2 text-xs text-gray-500">Loading...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-4 text-gray-400">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mb-1.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <span className="text-xs">No notifications</span>
                <span className="text-[10px]">You're all caught up!</span>
              </div>
            ) : (
              <div className="space-y-0.5">
                {notifications.slice(0, 5).map((n) => {
                  const parsed = parseNotification(n);
                  const statusIcon = getStatusIcon(n);
                  
                  return (
                    <div
                      key={n.id}
                      className={`p-2 transition-all duration-200 ${
                        n.read 
                          ? "bg-white hover:bg-gray-50" 
                          : "bg-blue-50 hover:bg-blue-100"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {/* Status Icon */}
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${statusIcon.bgColor} ${statusIcon.color}`}>
                          {statusIcon.icon}
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          {/* Title */}
                          <h4 className={`text-xs font-semibold ${
                            parsed.title.toLowerCase().includes('rejected') || parsed.title.toLowerCase().includes('disapproved')
                              ? 'text-red-600'
                              : parsed.title.toLowerCase().includes('approved')
                              ? 'text-green-600'
                              : n.read ? 'text-gray-700' : 'text-gray-900'
                          }`}>
                            {parsed.title}
                          </h4>
                          
                          {/* Project and Department */}
                          <div className="flex flex-col gap-0 mt-0.5">
                            {parsed.hasProject && (
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] text-gray-500">Project:</span>
                                <span className="text-[10px] px-1 py-0.5 rounded-full font-medium bg-purple-100 text-purple-700">
                                  {parsed.project}
                                </span>
                              </div>
                            )}
                            {parsed.hasDepartment && (
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] text-gray-500">Dept:</span>
                                <span className="text-[10px] px-1 py-0.5 rounded-full font-medium bg-blue-100 text-blue-700">
                                  {parsed.department}
                                </span>
                              </div>
                            )}
                            {!parsed.hasDepartment && !parsed.hasProject && (
                              <p className="text-[10px] text-gray-500 mt-0.5 line-clamp-1">
                                {parsed.message || "No message content"}
                              </p>
                            )}
                          </div>
                          
                          {/* Time and Actions */}
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-[10px] text-gray-400">
                              {(() => {
                                const date = new Date(n.createdAt);
                                const now = new Date();
                                const diffMs = now.getTime() - date.getTime();
                                const diffMins = Math.floor(diffMs / 60000);
                                const diffHours = Math.floor(diffMs / 3600000);
                                const diffDays = Math.floor(diffMs / 86400000);
                                
                                if (diffMins < 1) return 'Just now';
                                if (diffMins < 60) return `${diffMins}m ago`;
                                if (diffHours < 24) return `${diffHours}h ago`;
                                if (diffDays < 7) return `${diffDays}d ago`;
                                return date.toLocaleDateString();
                              })()}
                            </span>
                            
                            <div className="flex items-center gap-1.5">
                              {!n.read && (
                                <button
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    if (!n.id) return;
                                    
                                    await fetch("/api/notifications", {
                                      method: "PATCH",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({ id: n.id }),
                                    });
                                    
                                    setNotifications((prev: NotificationType[]) =>
                                      prev.map((notif: NotificationType) =>
                                        notif.id === n.id ? { ...notif, read: true } : notif
                                      )
                                    );
                                  }}
                                  className="text-[10px] text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
                                >
                                  Mark read
                                </button>
                              )}
                              {n.link && (
                                <a
                                  href={n.link}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                  }}
                                  className="text-[10px] text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
                                >
                                  View
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="bg-gray-50 px-3 py-1.5 border-t border-gray-100">
              <div className="flex items-center justify-between text-[10px] text-gray-500">
                <span>Showing {Math.min(5, notifications.length)} of {notifications.length}</span>
                <button
                  onClick={() => {
                    setNotificationsModalOpen(true);
                    setNotifOpen(false);
                  }}
                  className="text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
                >
                  View all
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 