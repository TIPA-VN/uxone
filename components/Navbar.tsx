"use client";
import { signOut } from "next-auth/react";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  // Inside your Navbar component
  const { data: session } = useSession();
  const user = session?.user;

  // Close dropdown when clicking outside
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
        <div className="rounded-full w-7 h-7 flex items-center justify-center cursor-pointer">
          <Image
            src="/images/message.png"
            alt="Messages"
            width={20}
            height={20}
          />
        </div>

        <div className="rounded-full w-7 h-7 flex items-center justify-center cursor-pointer relative">
          <Image
            src="/images/announcement.png"
            alt="Notifications"
            width={20}
            height={20}
          />
          <div className="absolute -top-3 -right-3 w-5 h-5 flex items-center justify-center bg-rose-600 text-white rounded-full text-xs">
            1
          </div>
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
                <a
                  href="/profile"
                  className="block px-4 py-2 hover:bg-gray-100"
                >
                  View Profile
                </a>
              </li>
              <li>
                <button
                  onClick={() => {
                    // Replace with real logout function
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
    </div>
  );
};

export default Navbar;
