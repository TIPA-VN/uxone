"use client";
import { signOut } from "next-auth/react";
import Image from "next/image";
import { useState, useRef, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { Dialog } from "@/components/ui/card";
import { canAccessFeature } from "@/config/app";

import { AnnouncementDialog } from "./Navbar/AnnouncementDialog";
import { NotificationModal } from "./Navbar/NotificationModal";
import { NotificationDropdown } from "./Navbar/NotificationDropdown";


import { useNotifications } from "@/hooks/useNotifications";

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
  const [notificationsModalOpen, setNotificationsModalOpen] = useState(false);
  const [announceOpen, setAnnounceOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { data: session } = useSession();
  const user = session?.user;
  const {
    notifications,
    unreadCount,
    loading: notifLoading,
    setNotifications,
  } = useNotifications();


  const canAnnounce = canAccessFeature(user?.role as any, "announcements");

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);

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
        <NotificationDropdown
          notifications={notifications}
          unreadCount={unreadCount}
          setNotificationsModalOpen={setNotificationsModalOpen}
          setNotifications={setNotifications}
          notifLoading={notifLoading}
        />

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
      
      {/* Announcement Dialog */}
      <AnnouncementDialog 
        open={announceOpen} 
        onClose={() => setAnnounceOpen(false)} 
        canAnnounce={canAnnounce}
      />
      
      {/* Notifications Modal */}
      <NotificationModal
        open={notificationsModalOpen}
        onClose={() => setNotificationsModalOpen(false)}
        notifications={notifications}
        setNotifications={setNotifications}
        unreadCount={unreadCount}
        notifLoading={notifLoading}
      />
    </div>
  );
};

export default Navbar;
