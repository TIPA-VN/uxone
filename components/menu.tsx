"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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

const menuItems = [
  {
    imgURL: "/assets/home.svg",
    route: "/lvm",
    label: "Home",
    icon: <IoHome size={22} />,
  },
  {
    route: "/lvm/dashboard",
    label: "Dashboard",
    icon: <MdSpaceDashboard size={22} />,
  },
  {
    route: "/lvm/projects",
    label: "Projects",
    icon: <ImBooks size={22} />,
  },
  // Customer Service
  {
    imgURL: "/assets/community.svg",
    route: "/lvm/cs",
    label: "Customer Service",
    icon: <RiCustomerService2Fill size={22} />,
  },
  {
    imgURL: "/assets/heart.svg",
    route: "/lvm/logistics",
    label: "Logistics",
    icon: <GiCargoShip size={22} />,
  },
  {
    imgURL: "/assets/heart.svg",
    route: "/lvm/purchasing",
    label: "Procurement",
    icon: <BsCart4 size={22} />,
  },
  {
    imgURL: "/assets/search.svg",
    route: "/lvm/pc",
    label: "Prod. Planning",
    icon: <ImCalendar size={20} />,
  },
  // Sales
  {
    imgURL: "/assets/heart.svg",
    route: "/lvm/sales",
    label: "Sales",
    icon: <FaRegChartBar size={22} />,
  },
  {
    imgURL: "/assets/heart.svg",
    route: "/lvm/qa",
    label: "Quality Assurance",
    icon: <LiaPencilRulerSolid size={23} />,
  },
  {
    imgURL: "/assets/create.svg",
    route: "/lvm/qc",
    label: "Quality Control",
    icon: <HiOutlineShieldCheck size={23} />,
  },
  {
    imgURL: "/assets/search.svg",
    route: "/lvm/pm",
    label: "Production Maintenance",
    icon: <MdEngineering size={24} />,
  },
  {
    imgURL: "/assets/search.svg",
    route: "/lvm/fm",
    label: "Facility Management",
    icon: <LiaToolsSolid size={22} />,
  },
  {
    imgURL: "/assets/community.svg",
    route: "/lvm/hra",
    label: "Human Resources",
    icon: <HiOutlineUserGroup size={22} />,
  },
];

export default function Menu() {
  const pathname = usePathname();

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
    </nav>
  );
}
