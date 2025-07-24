"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { usePermissions } from "@/lib/rbac";
import { PERMISSIONS } from "@/lib/rbac";
import { IoHome } from "react-icons/io5";
import { ImBooks } from "react-icons/im";
import { GiCargoShip } from "react-icons/gi";
import { BsCart4 } from "react-icons/bs";
import { LiaPencilRulerSolid, LiaToolsSolid } from "react-icons/lia";
import { HiOutlineShieldCheck, HiOutlineUserGroup } from "react-icons/hi";
import { MdEngineering } from "react-icons/md";
import { TfiAnnouncement } from "react-icons/tfi";

interface MenuItem {
  id: string;
  name: string;
  href: string;
  icon?: React.ReactNode;
  permission: string;
  subItems?: MenuItem[];
}

const menuItems: MenuItem[] = [
  {
    id: "home",
    name: "Home",
    href: "/dashboard",
    icon: <IoHome className="w-5 h-5" />,
    permission: PERMISSIONS.VIEW_DASHBOARD,
  },
  {
    id: "projects",
    name: "Projects",
    href: "/projects/dashboard",
    icon: <ImBooks className="w-5 h-5" />,
    permission: PERMISSIONS.VIEW_DASHBOARD,
  },
  {
    id: "lvm",
    name: "LVM",
    href: "/lvm/dashboard",
    icon: <MdEngineering className="w-5 h-5" />,
    permission: PERMISSIONS.VIEW_LVM,
    subItems: [
      {
        id: "lvm-logistics",
        name: "Logistics",
        href: "/lvm/logistics",
        icon: <GiCargoShip className="w-5 h-5" />,
        permission: PERMISSIONS.VIEW_LVM,
      },
      {
        id: "lvm-purchasing",
        name: "Mua Hàng",
        href: "/lvm/purchasing",
        icon: <BsCart4 className="w-5 h-5" />,
        permission: PERMISSIONS.VIEW_PURCHASING,
      },
      {
        id: "lvm-qa",
        name: "QA",
        href: "/lvm/qa",
        icon: <LiaPencilRulerSolid className="w-5 h-5" />,
        permission: PERMISSIONS.VIEW_LVM,
      },
      {
        id: "lvm-qc",
        name: "QC",
        href: "/lvm/qc",
        icon: <HiOutlineShieldCheck className="w-5 h-5" />,
        permission: PERMISSIONS.VIEW_LVM,
      },
      {
        id: "lvm-pm",
        name: "PM",
        href: "/lvm/pm",
        icon: <MdEngineering className="w-5 h-5" />,
        permission: PERMISSIONS.VIEW_LVM,
      },
      {
        id: "lvm-fm",
        name: "FM",
        href: "/lvm/fm",
        icon: <LiaToolsSolid className="w-5 h-5" />,
        permission: PERMISSIONS.VIEW_LVM,
      },
      {
        id: "lvm-hra",
        name: "Nhân Sự",
        href: "/lvm/hra",
        icon: <HiOutlineUserGroup className="w-5 h-5" />,
        permission: PERMISSIONS.VIEW_LVM,
      },
    ],
  },
  {
    id: "announcements",
    name: "Thông Báo",
    href: "/announcement",
    icon: <TfiAnnouncement className="w-5 h-5" />,
    permission: PERMISSIONS.VIEW_DASHBOARD,
  },
  {
    id: "user-management",
    name: "User Management",
    href: "/admin/users",
    permission: PERMISSIONS.MANAGE_USERS,
  },
];

export default function Menu() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { hasPermission } = usePermissions(
    session?.user?.role,
    session?.user?.department
  );

  const filteredMenuItems = menuItems.filter((item) => {
    const hasMainPermission = hasPermission(item.permission);
    if (item.subItems) {
      const hasSubPermissions = item.subItems.some((subItem) =>
        hasPermission(subItem.permission)
      );
      return hasMainPermission || hasSubPermissions;
    }
    return hasMainPermission;
  });

  return (
    <nav className="space-y-1">
      {filteredMenuItems.map((item) => {
        const isMainActive = pathname === item.href;
        const hasSubActive = item.subItems?.some(
          (subItem) => pathname === subItem.href
        );

        return (
          <div key={item.id}>
            <Link
              href={item.href}
              className={cn(
                "flex items-center px-4 py-2 text-sm font-medium rounded-md group",
                isMainActive || hasSubActive
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              {item.icon && (
                <span className="flex-shrink-0 mr-3">{item.icon}</span>
              )}
              <span className="hidden lg:block">{item.name}</span>
              <span className="lg:hidden absolute left-full ml-2 bg-gray-900 text-white px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-200">
                {item.name}
              </span>
            </Link>

            {item.subItems && (isMainActive || hasSubActive) && (
              <div className="ml-4 mt-1 space-y-1">
                {item.subItems
                  .filter((subItem) => hasPermission(subItem.permission))
                  .map((subItem) => (
                    <Link
                      key={subItem.id}
                      href={subItem.href}
                      className={cn(
                        "flex items-center px-4 py-2 text-sm font-medium rounded-md group",
                        pathname === subItem.href
                          ? "bg-gray-100 text-gray-900"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      )}
                    >
                      {subItem.icon && (
                        <span className="flex-shrink-0 mr-3">{subItem.icon}</span>
                      )}
                      <span className="hidden lg:block">{subItem.name}</span>
                      <span className="lg:hidden absolute left-full ml-2 bg-gray-900 text-white px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-200">
                        {subItem.name}
                      </span>
                    </Link>
                  ))}
              </div>
            )}
          </div>
        );
      })}

      {/* Show department info if available */}
      {session?.user?.department && (
        <div className="mt-8 px-4 py-2 text-sm text-gray-500">
          <span className="hidden lg:inline">Department: </span>
          <span>{session.user.department}</span>
        </div>
      )}
    </nav>
  );
}
