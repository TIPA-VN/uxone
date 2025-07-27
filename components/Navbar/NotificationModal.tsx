import { Notification } from "@/hooks/useNotifications";
import { Dispatch, SetStateAction, useState, useMemo } from "react";

interface NotificationModalProps {
  open: boolean;
  onClose: () => void;
  notifications: Notification[];
  setNotifications: Dispatch<SetStateAction<Notification[]>>;
  unreadCount: number;
  notifLoading: boolean;
}

export function NotificationModal({
  open,
  onClose,
  notifications,
  setNotifications,
  unreadCount,
  notifLoading
}: NotificationModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  // Function to clean project name by removing quotes
  const cleanProjectName = (name: string) => {
    return name.replace(/^["']|["']$/g, '').trim();
  };

  // Function to parse notification message and extract department and project
  const parseNotification = (notification: Notification) => {
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
      // Common patterns: "Project [NAME] Approved", "[NAME] Project Approved", etc.
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
          // Make sure we're not capturing "Project" itself
          if (extractedName.toLowerCase() !== 'project') {
            projectName = extractedName;
            // Clean up the title by removing the project name and action words
            cleanTitle = actionPart
              .replace(projectMatch[0], '')
              .replace(/\b(approved|rejected|disapproved|project)\b/gi, '')
              .trim();
            break;
          }
        }
      }
      
      // If no project found, try to extract from the beginning or end
      if (!projectName) {
        // Look for common project patterns at the start or end
        // More specific patterns to avoid capturing "Project" itself
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
          // Make sure we're not capturing "Project" itself
          if (extractedName.toLowerCase() !== 'project') {
            projectName = extractedName;
            // Clean up the title by removing the project name and action words
            cleanTitle = actionPart
              .replace(projectMatch[0], '')
              .replace(/\b(approved|rejected|disapproved|project)\b/gi, '')
              .trim();
            break;
          }
        }
      }
      
      // If no project found, try to extract from the beginning or end
      if (!projectName) {
        // Look for common project patterns at the start or end
        // More specific patterns to avoid capturing "Project" itself
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
    
    // Fallback to original format
    return {
      title: title || "Notification",
      message: message,
      hasDepartment: false,
      hasProject: false
    };
  };

  // Function to get status icon and color based on notification content
  const getStatusIcon = (notification: Notification) => {
    const title = notification.title?.toLowerCase() || "";
    const message = notification.message?.toLowerCase() || "";
    const content = `${title} ${message}`;
    
    // Parse the notification to get the clean title
    const parsed = parseNotification(notification);
    const parsedTitle = parsed.title?.toLowerCase() || "";
    
    // Prioritize parsed title over original content for status detection
    // Check for rejection/disapproval status first (parsed title takes priority)
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
    
    // Check for approval status (parsed title takes priority)
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
    
    // Default icon based on notification type
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

  // Filter notifications based on search and filters
  const filteredNotifications = useMemo(() => {
    return notifications.filter((notification) => {
      // Search filter
      const searchLower = searchTerm.toLowerCase();
      const parsed = parseNotification(notification);
      const searchText = `${parsed.title} ${parsed.project || ""} ${parsed.department || parsed.message || ""}`.toLowerCase();
      const matchesSearch = !searchTerm || searchText.includes(searchLower);

      // Type filter
      const matchesType = !typeFilter || notification.type === typeFilter;

      return matchesSearch && matchesType;
    });
  }, [notifications, searchTerm, typeFilter]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-2 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <h2 className="text-base font-bold">All Notifications</h2>
              {unreadCount > 0 && (
                <span className="bg-white/20 text-white text-xs px-1.5 py-0.5 rounded-full">
                  {unreadCount} unread
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 p-1 rounded-full hover:bg-white/10 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="p-2 border-b border-gray-200 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {/* Search */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Search</label>
              <input
                type="text"
                placeholder="Search notifications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
              />
            </div>
            
            {/* Message Type Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
              <select 
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
              >
                <option value="">All Types</option>
                <option value="announcement">Announcements</option>
                <option value="approval">Approvals</option>
                <option value="comment">Comments</option>
                <option value="general">General</option>
              </select>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2">
              <button 
                onClick={async () => {
                  // Mark all notifications as read
                  const unreadNotifications = notifications.filter(n => !n.read);
                  if (unreadNotifications.length === 0) return;
                  
                  try {
                    await fetch("/api/notifications/mark-all-read", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                    });
                    
                    setNotifications((prev: Notification[]) =>
                      prev.map((notif: Notification) => ({ ...notif, read: true }))
                    );
                  } catch (error) {
                    console.error("Failed to mark all as read:", error);
                  }
                }}
                disabled={notifications.filter(n => !n.read).length === 0}
                className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs font-medium"
              >
                Mark All as Read
              </button>
              <button 
                onClick={async () => {
                  if (notifications.length === 0) return;
                  
                  if (confirm("Are you sure you want to clear all notifications? This action cannot be undone.")) {
                    try {
                      await fetch("/api/notifications/clear-all", {
                        method: "DELETE",
                        headers: { "Content-Type": "application/json" },
                      });
                      
                      setNotifications([]);
                    } catch (error) {
                      console.error("Failed to clear all notifications:", error);
                    }
                  }
                }}
                disabled={notifications.length === 0}
                className="px-2 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs font-medium"
              >
                Clear All
              </button>
            </div>
            <div className="text-xs text-gray-500">
              {filteredNotifications.length} of {notifications.length} notifications
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-2">
          {notifLoading ? (
            <div className="flex items-center justify-center py-6">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              <span className="ml-2 text-xs text-gray-500">Loading notifications...</span>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 text-gray-400">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <span className="text-sm font-medium">
                {notifications.length === 0 ? "No notifications found" : "No notifications match your filters"}
              </span>
              <span className="text-xs">
                {notifications.length === 0 ? "You're all caught up!" : "Try adjusting your search or filters"}
              </span>
            </div>
          ) : (
            <div className="space-y-1.5">
              {filteredNotifications.map((n) => (
                <div
                  key={n.id}
                  className={`border rounded p-2 transition-all duration-200 ${
                    n.read 
                      ? "bg-white border-gray-200 hover:border-gray-300" 
                      : "bg-blue-50 border-blue-200 hover:border-blue-300"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {/* Notification Icon */}
                    {(() => {
                      const statusIcon = getStatusIcon(n);
                      return (
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${statusIcon.bgColor} ${statusIcon.color}`}>
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {statusIcon.icon.props.children}
                          </svg>
                        </div>
                      );
                    })()}
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <div className="flex-1">
                          {(() => {
                            const parsed = parseNotification(n);
                            return (
                              <>
                                <h3 className={`text-xs font-semibold ${
                                  parsed.title.toLowerCase().includes('rejected') || parsed.title.toLowerCase().includes('disapproved')
                                    ? 'text-red-600'
                                    : parsed.title.toLowerCase().includes('approved')
                                    ? 'text-green-600'
                                    : n.read ? 'text-gray-700' : 'text-gray-900'
                                }`}>
                                  {parsed.title}
                                </h3>
                                <div className="flex flex-col gap-0.5 mt-0.5">
                                  {parsed.hasProject && (
                                    <div className="flex items-center gap-1">
                                      <span className="text-xs text-gray-500 font-medium">Project:</span>
                                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                                        n.read 
                                          ? 'bg-purple-100 text-purple-700' 
                                          : 'bg-purple-100 text-purple-700'
                                      }`}>
                                        {parsed.project}
                                      </span>
                                    </div>
                                  )}
                                  {parsed.hasDepartment && (
                                    <div className="flex items-center gap-1">
                                      <span className="text-xs text-gray-500 font-medium">Department:</span>
                                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                                        n.read 
                                          ? 'bg-gray-100 text-gray-600' 
                                          : 'bg-blue-100 text-blue-700'
                                      }`}>
                                        {parsed.department}
                                      </span>
                                    </div>
                                  )}
                                  {!parsed.hasDepartment && !parsed.hasProject && (
                                    <p className={`text-xs ${
                                      n.read ? 'text-gray-500' : 'text-gray-600'
                                    }`}>
                                      {parsed.message || "No message content"}
                                    </p>
                                  )}
                                </div>
                              </>
                            );
                          })()}
                        </div>
                        <div className="flex items-center gap-1 ml-2">
                          <span className="text-[10px] text-gray-400">
                            {new Date(n.createdAt).toLocaleString()}
                          </span>
                          {!n.read && (
                            <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex items-center gap-1 mt-1">
                        {!n.read && (
                          <button
                            onClick={async () => {
                              if (!n.id) return;
                              
                              await fetch("/api/notifications", {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ id: n.id }),
                              });
                              
                              setNotifications((prev: Notification[]) =>
                                prev.map((notif: Notification) =>
                                  notif.id === n.id ? { ...notif, read: true } : notif
                                )
                              );
                            }}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
                          >
                            Mark as read
                          </button>
                        )}
                        
                        {/* Action Icons */}
                        <div className="flex items-center gap-1 ml-auto">
                          {n.link && (
                            <button
                              onClick={() => {
                                window.location.href = n.link!;
                              }}
                              className="p-0.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                              title="View Details"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                          )}
                          
                          <button
                            onClick={async () => {
                              await fetch('/api/notifications', {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ id: n.id, hidden: true })
                              });
                              setNotifications((prev: Notification[]) => prev.filter((notif: Notification) => notif.id !== n.id));
                            }}
                            className="p-0.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                            title="Delete"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 