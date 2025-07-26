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
            <div className="absolute top-10 right-0 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-2">
              <div className="font-semibold text-gray-800 mb-2">Notifications</div>
              {notifLoading ? (
                <div className="text-xs text-gray-400 p-2">Loading...</div>
              ) : notifications.length === 0 ? (
                <div className="text-xs text-gray-400 p-2">No notifications</div>
              ) : (
                <ul className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
                  {notifications.map((n) => (
                    <li
                      key={n.id}
                      className={`p-2 text-sm rounded transition ${
                        n.read ? "bg-gray-50" : "bg-sky-50 font-semibold"
                      }`}
                    >
                      <div 
                        className="cursor-pointer"
                        onClick={async () => {
                          if (!n.id) {
                            alert("Notification is missing an ID and cannot be marked as read.");
                            return;
                          }
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
                      >
                        <div className="flex justify-between items-center">
                          <span>{n.title || "No Title"}</span>
                          <span className="text-xs text-gray-400 ml-2">
                            {new Date(n.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600 mt-1">{n.message || "No Message"}</div>
                      </div>
                      {n.link && (
                        <div 
                          className="text-xs text-blue-600 underline mt-1 cursor-pointer hover:text-blue-800"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.location.href = n.link!;
                          }}
                        >
                          View
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
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
    </div>
  );
};

export default Navbar;
