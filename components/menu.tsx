"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { IoHome } from "react-icons/io5";
import { ImBooks } from "react-icons/im";
import { GiCargoShip } from "react-icons/gi";
import { BsCart4 } from "react-icons/bs";
import { LiaPencilRulerSolid, LiaToolsSolid } from "react-icons/lia";
import { HiOutlineShieldCheck, HiOutlineUserGroup } from "react-icons/hi";
import { MdEngineering } from "react-icons/md";
import { MdSpaceDashboard } from "react-icons/md";
import { ImCalendar } from "react-icons/im";
import { RiCustomerService2Fill } from "react-icons/ri";
import { FaRegChartBar } from "react-icons/fa";
import { MdTask } from "react-icons/md";
import { Settings } from "lucide-react";
import { canAccessPage } from "@/config/app";

const menuItems = [
  {
    imgURL: "/assets/home.svg",
    route: "/lvm",
    label: "Home",
    icon: <IoHome size={22} />,
  },
  {
    route: "/lvm/projects",
    label: "Projects",
    icon: <ImBooks size={22} />,
  },
  {
    route: "/lvm/tasks",
    label: "Tasks",
    icon: <MdTask size={22} />,
  },
  {
    route: "/lvm/team",
    label: "Team Management",
    icon: <HiOutlineUserGroup size={22} />,
  },
  {
    route: "/lvm/helpdesk",
    label: "Helpdesk",
    icon: <RiCustomerService2Fill size={22} />,
  }
];

export default function Menu() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const hasAdminAccess = session?.user?.role &&
    canAccessPage(session.user.role, 'admin'); // Updated to pass role as string

  return (
    <nav className="space-y-2">
      {menuItems.map((item) => {
        const isActive = pathname === item.route;
        return (
          <Link
            key={item.route}
            href={item.route}
            className={cn(
              // Responsive: row on lg, col on small
              "flex flex-col lg:flex-row items-center lg:items-center text-center lg:text-left mx-auto px-4 py-2 text-sm font-medium rounded-md group transition-colors duration-200",
              isActive
                ? "bg-gray-400 text-gray-700"
                : "text-slate-200 hover:bg-gray-400 hover:text-gray-600"
            )}
            style={{ fontFamily: "Roboto, sans-serif", width: "100%" }}
          >
            {item.icon && (
              <span
                className="text-sky-200 mb-1 lg:mb-0 lg:mr-3"
                style={{ fontFamily: "Roboto, sans-serif" }}
              >
                {item.icon}
              </span>
            )}
            {/* Show label only on large screens */}
            <span
              className="hidden lg:block text-slate-200"
              style={{ fontFamily: "Roboto, sans-serif" }}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
      
      {/* Admin Link - Only show for admin users */}
      {hasAdminAccess && (
        <Link
          href="/admin"
          className={cn(
            "flex flex-col lg:flex-row items-center lg:items-center text-center lg:text-left mx-auto px-4 py-2 text-sm font-medium rounded-md group transition-colors duration-200",
            pathname === "/admin"
              ? "bg-red-400 text-white"
              : "text-red-200 hover:bg-red-400 hover:text-white"
          )}
          style={{ fontFamily: "Roboto, sans-serif", width: "100%" }}
        >
          <span
            className="text-red-200 mb-1 lg:mb-0 lg:mr-3"
            style={{ fontFamily: "Roboto, sans-serif" }}
          >
            <Settings size={22} />
          </span>
          <span
            className="hidden lg:block text-red-200"
            style={{ fontFamily: "Roboto, sans-serif" }}
          >
            Admin
          </span>
        </Link>
      )}
    </nav>
  );
}
