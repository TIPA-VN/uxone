"use client";
import { signOut } from "next-auth/react";
import Image from "next/image";
import { useState, useRef, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { Dialog } from "@/components/ui/card";
import { useForm } from "react-hook-form";

// Types
type Notification = {
  id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  link?: string;
  type?: string;
  createdAt: string;
}

type User = {
  id: string;
  name: string | null;
  email: string | null;
  username: string;
  department: string | null;
  departmentName: string | null;
  role: string | null;
}

type UserOption = {
  value: string;
  label: string;
}

function useNotifications() {
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

const DEPARTMENTS = [
  { value: "logistics", label: "Logistics" },
  { value: "procurement", label: "Procurement" },
  { value: "pc", label: "Production Planning" },
  { value: "qa", label: "Quality Assurance" },
  { value: "qc", label: "Quality Control" },
  { value: "pm", label: "Production Maintenance" },
  { value: "fm", label: "Facility Management" },
  { value: "hra", label: "Human Resources" },
  { value: "cs", label: "Customer Service" },
  { value: "sales", label: "Sales" },
];

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notificationsModalOpen, setNotificationsModalOpen] = useState(false);
  const [announceOpen, setAnnounceOpen] = useState(false);
  const [announceStatus, setAnnounceStatus] = useState<string | null>(null);
  const [announceConfirm, setAnnounceConfirm] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { data: session } = useSession();
  const user = session?.user;
  const {
    notifications,
    unreadCount,
    loading: notifLoading,
    setNotifications,
  } = useNotifications();

  const [announceTarget, setAnnounceTarget] = useState("users");
  const [userOptions, setUserOptions] = useState<UserOption[]>([]);

  // Announcement form
  const { register, reset, formState: { isSubmitting }, watch, getValues, setValue } = useForm();
  const canAnnounce = ["ADMIN", "HR", "SENIOR MANAGER"].includes(user?.role?.toUpperCase() || "");
  
  // Removed unused watchBroadcast, watchDepartments, watchUsers

  const onAnnounce = async (data: Record<string, unknown>) => {
    setAnnounceStatus(null);
    setAnnounceConfirm(false);
    try {
      const res = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          broadcast: !!data.broadcast,
          type: "announcement",
        }),
      });
      if (res.ok) {
        setAnnounceStatus("Announcement sent!");
        reset();
        setTimeout(() => {
          setAnnounceOpen(false);
          setAnnounceStatus(null);
        }, 1200);
      } else {
        setAnnounceStatus("Failed to send announcement.");
      }
    } catch {
      setAnnounceStatus("Failed to send announcement.");
    }
  };

  useEffect(() => {
    if (announceTarget === "users") {
      fetch("/api/notifications/users")
        .then(res => res.json())
        .then((users: User[]) => {
          if (!Array.isArray(users)) {
            console.error("Expected array from /api/notifications/users, got:", users);
            setUserOptions([]);
            return;
          }
          const mappedUsers: UserOption[] = users.map((user: User): UserOption => ({
            value: user.id,
            label: `${user.name || user.username} (${user.department || "-"})`
          }));
          setUserOptions(mappedUsers);
        });
    }
  }, [announceTarget]);

  useEffect(() => {
    if (
      announceTarget === "users" &&
      session?.user?.id // Only run if session and user are loaded
    ) {
      fetch("/api/notifications/users")
        .then(res => res.json())
        .then((users: User[]) => {
          if (!Array.isArray(users)) {
            console.error("Expected array from /api/notifications/users, got:", users);
            setUserOptions([]);
            return;
          }
          const mappedUsers: UserOption[] = users.map((user: User): UserOption => ({
            value: user.id,
            label: `${user.name || user.username} (${user.department || "-"})`
          }));
          setUserOptions(mappedUsers);
        });
    }
  }, [announceTarget, session?.user?.id]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Removed unused handleNotificationClick

  return (
    <div className="flex items-center justify-between p-4 bg-indigo-100 shadow-md text-slate-600 rounded-lg relative">
      {/* SEARCH BAR */}
      <div className="hidden md:flex items-center gap-2 bg-slate-50 text-xs rounded-full ring-[1.5px] ring-gray-400 px-2">
        <Image src="/images/search.png" alt="Search" width={14} height={14} />
        <input
          type="text"
          placeholder="Search..."
          className="w-[200px] p-2 bg-transparent outline-none"
        />
      </div>

      {/* ICONS AND USER */}
      <div
        className="flex items-center gap-6 justify-end w-full relative"
        ref={dropdownRef}
      >
        {/* Message icon triggers announcement dialog for authorized users */}
        <div
          className="rounded-full w-7 h-7 flex items-center justify-center cursor-pointer"
          onClick={() => setAnnounceOpen(true)}
          title={canAnnounce ? "Send Announcement" : undefined}
        >
          <Image
            src="/images/message.png"
            alt="Messages"
            width={20}
            height={20}
          />
        </div>

        {/* Notification Dropdown */}
        <div className="rounded-full w-7 h-7 flex items-center justify-center cursor-pointer relative" onClick={() => setNotifOpen((v) => !v)}>
          <Image
            src="/images/announcement.png"
            alt="Notifications"
            width={20}
            height={20}
          />
          {unreadCount > 0 && (
            <div className="absolute -top-2 -right-2 min-w-[20px] h-5 flex items-center justify-center bg-rose-600 text-white rounded-full text-xs px-1">
              {unreadCount}
            </div>
          )}
          {notifOpen && (
            <div className="absolute top-10 right-0 w-96 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                    <span className="font-semibold text-sm">Notifications</span>
                  </div>
                  {unreadCount > 0 && (
                    <span className="bg-white/20 text-white text-xs px-2 py-1 rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                </div>
              </div>

              {/* Notifications List */}
              <div className="max-h-96 overflow-y-auto">
                {notifLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                    <span className="ml-2 text-sm text-gray-500">Loading...</span>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5z" />
                      </svg>
                    </div>
                    <span className="text-sm">No notifications</span>
                    <span className="text-xs">You're all caught up!</span>
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {notifications.map((n) => (
                      <li
                        key={n.id}
                        className={`group transition-all duration-200 ${
                          n.read 
                            ? "bg-white hover:bg-gray-50" 
                            : "bg-blue-50 hover:bg-blue-100 border-l-4 border-blue-500"
                        }`}
                      >
                        <div className="p-4">
                          {/* Notification Header */}
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-3 flex-1">
                              {/* Notification Icon */}
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                n.type === 'announcement' ? 'bg-purple-100 text-purple-600' :
                                n.type === 'approval' ? 'bg-green-100 text-green-600' :
                                n.type === 'comment' ? 'bg-blue-100 text-blue-600' :
                                'bg-gray-100 text-gray-600'
                              }`}>
                                {n.type === 'announcement' ? (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                                  </svg>
                                ) : n.type === 'approval' ? (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                ) : n.type === 'comment' ? (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                  </svg>
                                ) : (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                )}
                              </div>
                              
                              {/* Title and Time */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <h4 className={`text-sm font-medium truncate ${
                                    n.read ? 'text-gray-700' : 'text-gray-900'
                                  }`}>
                                    {n.title || "Notification"}
                                  </h4>
                                  <span className="text-xs text-gray-400 ml-2 flex-shrink-0">
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
                                </div>
                                
                                {/* Message */}
                                <p className={`text-xs mt-1 line-clamp-2 ${
                                  n.read ? 'text-gray-500' : 'text-gray-600'
                                }`}>
                                  {n.message || "No message content"}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center gap-2">
                              {/* Mark as read button */}
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
                                    
                                    setNotifications((prev) =>
                                      prev.map((notif) =>
                                        notif.id === n.id ? { ...notif, read: true } : notif
                                      )
                                    );
                                  }}
                                  className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
                                >
                                  Mark as read
                                </button>
                              )}
                            </div>
                            
                            {/* View link */}
                            {n.link && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.location.href = n.link!;
                                }}
                                className="text-xs bg-blue-600 text-white px-3 py-1 rounded-full hover:bg-blue-700 transition-colors font-medium"
                              >
                                View
                              </button>
                            )}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Footer */}
              {notifications.length > 0 && (
                <div className="bg-gray-50 px-4 py-2 border-t border-gray-100">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{notifications.length} notification{notifications.length !== 1 ? 's' : ''}</span>
                    <button
                      onClick={() => {
                        setNotificationsModalOpen(true);
                        setNotifOpen(false);
                      }}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      View all
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col text-right">
          <span className="text-xs leading-3 font-medium">{user?.name}</span>
          <span className="text-[10px] text-gray-500">{user?.role}</span>
        </div>

        {/* Profile image toggle */}
        <button onClick={() => setOpen(!open)} className="cursor-pointer focus:outline-none">
          <Image
            src="/images/eric_avatar.png"
            alt="User Avatar"
            width={40}
            height={40}
            className="rounded-full"
          />
        </button>

        {/* Dropdown */}
        {open && (
          <div className="absolute top-16 right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
            {/* User Info */}
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <Image
                  src="/images/eric_avatar.png"
                  alt="User Avatar"
                  width={40}
                  height={40}
                  className="rounded-full"
                />
                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    {user?.name}
                  </p>
                  <p className="text-xs text-gray-500">{user?.role}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
              </div>
            </div>

            {/* Menu Options */}
            <ul className="py-2 text-sm text-gray-700">
              <li>
                <button
                  onClick={() => { setProfileOpen(true); setOpen(false); }}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                >
                  View Profile
                </button>
              </li>
              {/* Announcement button removed from dropdown */}
              <li>
                <button
                  onClick={() => {
                    signOut();
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100"
                >
                  Logout
                </button>
              </li>
            </ul>
          </div>
        )}
      </div>
      
      {/* Profile Dialog Popup */}
      <Dialog open={profileOpen} onClose={() => setProfileOpen(false)}>
        <div className="flex flex-col items-center mb-6">
          <Image
            src={user?.image || "/images/avatar.png"}
            alt="User Avatar"
            width={80}
            height={80}
            className="rounded-full border border-gray-200"
          />
          <h2 className="mt-4 text-2xl font-bold text-gray-800">{user?.name || "No Name"}</h2>
          <p className="text-gray-500 text-sm">{user?.email}</p>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-gray-700">
            <span className="font-semibold">Username:</span>
            <span>{user?.username}</span>
          </div>
          <div className="flex justify-between text-gray-700">
            <span className="font-semibold">Role:</span>
            <span>{user?.role}</span>
          </div>
          <div className="flex justify-between text-gray-700">
            <span className="font-semibold">Department:</span>
            <span>{user?.department || "-"}</span>
          </div>
          <div className="flex justify-between text-gray-700">
            <span className="font-semibold">Department Name:</span>
            <span>{user?.departmentName || "-"}</span>
          </div>
        </div>
      </Dialog>
      
      {/* Announcement Dialog Popup */}
      <Dialog open={announceOpen} onClose={() => { setAnnounceOpen(false); setAnnounceStatus(null); setAnnounceConfirm(false); }}>
        <form
          onSubmit={e => {
            e.preventDefault();
            setAnnounceConfirm(true);
          }}
          className="space-y-4 w-80"
        >
          <h2 className="text-xl font-bold mb-2">Send Announcement</h2>
          {/* Targeting radio group */}
          <div>
            <label className="block text-sm font-medium mb-1">Target</label>
            <div className="flex flex-col gap-1">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="announceTarget"
                  value="broadcast"
                  checked={announceTarget === "broadcast"}
                  onChange={() => { setAnnounceTarget("broadcast"); setValue("broadcast", true); }}
                />
                <span className="text-sm">Broadcast to all users</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="announceTarget"
                  value="departments"
                  checked={announceTarget === "departments"}
                  onChange={() => { setAnnounceTarget("departments"); setValue("broadcast", false); }}
                />
                <span className="text-sm">Broadcast to selected departments</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="announceTarget"
                  value="users"
                  checked={announceTarget === "users"}
                  onChange={() => { setAnnounceTarget("users"); setValue("broadcast", false); }}
                />
                <span className="text-sm">Send to individual users</span>
              </label>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input {...register("title", { required: true })} className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Message</label>
            <textarea {...register("message", { required: true })} className="w-full border rounded px-3 py-2" rows={3} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Link (optional)</label>
            <input {...register("link")} className="w-full border rounded px-3 py-2" />
          </div>
          {announceTarget === "departments" && (
            <div>
              <label className="block text-sm font-medium mb-1">Departments</label>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                {DEPARTMENTS.map((d) => (
                  <label key={d.value} className="flex items-center gap-1 justify-start">
                    <input
                      type="checkbox"
                      value={d.value}
                      {...register("departments")}
                      className="accent-blue-600"
                    />
                    <span className="text-xs">{d.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
          {announceTarget === "users" && (
            <div>
              <label className="block text-sm font-medium mb-1">Users</label>
              <select {...register("users")}
                multiple
                className="w-full border rounded px-3 py-2">
                {userOptions.map((u) => (
                  <option key={u.value} value={u.value}>{u.label}</option>
                ))}
              </select>
            </div>
          )}
          <button
            type="submit"
            disabled={isSubmitting ||
              (announceTarget === "departments" && (!watch("departments") || watch("departments").length === 0)) ||
              (announceTarget === "users" && (!watch("users") || watch("users").length === 0))}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
          >
            {isSubmitting ? "Sending..." : "Send Announcement"}
          </button>
          {announceStatus && <div className="text-center text-sm mt-2">{announceStatus}</div>}
        </form>
        {/* Confirmation Dialog */}
        {announceConfirm && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-xl shadow-lg p-6 max-w-xs w-full">
              <h3 className="text-lg font-bold mb-4">Confirm Send</h3>
              <p className="mb-4">Are you sure you want to send this announcement?</p>
              <div className="flex gap-2 justify-end">
                <button
                  className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
                  onClick={() => setAnnounceConfirm(false)}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                  onClick={async () => {
                    setAnnounceConfirm(false);
                    await onAnnounce(getValues());
                  }}
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}
      </Dialog>
      
      {/* Notifications Modal */}
      {notificationsModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-3 rounded-t-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  <h2 className="text-lg font-bold">All Notifications</h2>
                  {unreadCount > 0 && (
                    <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full">
                      {unreadCount} unread
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setNotificationsModalOpen(false)}
                  className="text-white hover:text-gray-200 p-2 rounded-full hover:bg-white/10 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="p-3 border-b border-gray-200 bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                {/* Search */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Search</label>
                  <input
                    type="text"
                    placeholder="Search notifications..."
                    className="w-full px-2 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                  />
                </div>
                
                {/* Message Type Filter */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
                  <select className="w-full px-2 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs">
                    <option value="">All Types</option>
                    <option value="announcement">Announcements</option>
                    <option value="approval">Approvals</option>
                    <option value="comment">Comments</option>
                    <option value="general">General</option>
                  </select>
                </div>
                
                {/* Project Filter */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Project</label>
                  <select className="w-full px-2 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs">
                    <option value="">All Projects</option>
                    <option value="project1">Project 1</option>
                    <option value="project2">Project 2</option>
                  </select>
                </div>
                
                {/* Sender Filter */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Sender</label>
                  <select className="w-full px-2 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs">
                    <option value="">All Senders</option>
                    <option value="admin">Admin</option>
                    <option value="manager">Manager</option>
                    <option value="user">User</option>
                  </select>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-2">
                  <button className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-xs font-medium">
                    Mark All as Read
                  </button>
                  <button className="px-3 py-1.5 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors text-xs font-medium">
                    Clear All
                  </button>
                </div>
                <div className="text-xs text-gray-500">
                  {notifications.length} total notifications
                </div>
              </div>
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto p-3">
              {notifLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  <span className="ml-2 text-sm text-gray-500">Loading notifications...</span>
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                  </div>
                  <span className="text-base font-medium">No notifications found</span>
                  <span className="text-xs">Try adjusting your filters</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`border rounded p-3 transition-all duration-200 ${
                        n.read 
                          ? "bg-white border-gray-200 hover:border-gray-300" 
                          : "bg-blue-50 border-blue-200 hover:border-blue-300"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Notification Icon */}
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          n.type === 'announcement' ? 'bg-purple-100 text-purple-600' :
                          n.type === 'approval' ? 'bg-green-100 text-green-600' :
                          n.type === 'comment' ? 'bg-blue-100 text-blue-600' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {n.type === 'announcement' ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                            </svg>
                          ) : n.type === 'approval' ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          ) : n.type === 'comment' ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          )}
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-1">
                            <div className="flex-1">
                              <h3 className={`text-sm font-semibold ${
                                n.read ? 'text-gray-700' : 'text-gray-900'
                              }`}>
                                {n.title || "Notification"}
                              </h3>
                              <p className={`text-xs mt-0.5 ${
                                n.read ? 'text-gray-500' : 'text-gray-600'
                              }`}>
                                {n.message || "No message content"}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 ml-3">
                              <span className="text-[10px] text-gray-400">
                                {new Date(n.createdAt).toLocaleString()}
                              </span>
                              {!n.read && (
                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                              )}
                            </div>
                          </div>
                          
                          {/* Actions */}
                          <div className="flex items-center gap-2 mt-2">
                            {!n.read && (
                              <button
                                onClick={async () => {
                                  if (!n.id) return;
                                  
                                  await fetch("/api/notifications", {
                                    method: "PATCH",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ id: n.id }),
                                  });
                                  
                                  setNotifications((prev) =>
                                    prev.map((notif) =>
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
                                  className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                                  title="View Details"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                                  setNotifications((prev) => prev.filter((notif) => notif.id !== n.id));
                                }}
                                className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                                title="Delete"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
      )}
    </div>
  );
};

export default Navbar;
