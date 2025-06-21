"use client";

import { SidebarLinks } from "@/lib/constant";
import Link from "next/link";
import React from "react";
import { BsFillGridFill } from "react-icons/bs";
import { Button } from "./ui/button";
import Image from "next/image";
import { signOut } from "next-auth/react";

const MenuPage = () => {
  return (
    <div className="mt-4 text-sm">
      {SidebarLinks.map((i) => (
        <div key={i.title} className="flex flex-col gap-2 rounded">
          <span className="hidden lg:block my-5 text-amber-200">{i.title}</span>
          {i.items.map((item) => (
            <Link
              key={item.label}
              href={item.route}
              className="flex items-center justify-center gap-4 py-2 lg:justify-start rounded"
            >
              <span className="text-sky-200 text-xl">
                {item.icon || <BsFillGridFill />}
              </span>
              <span className="hidden lg:block">{item.label}</span>
            </Link>
          ))}
        </div>
      ))}
      <div className="flex items-center justify-center gap-4 py-2 rounded">
        <Button className="bg-slate-800 mt-10" onClick={() => signOut()}>
          <div className="flex cursor-pointer text-2xl p-1">
            <Image
              src="/images/logout.svg"
              alt="logout"
              width={23}
              height={23}
            />
          </div>
          <span className="hidden lg:block text-sky-200">Đăng Xuất</span>
        </Button>
      </div>
    </div>
  );
};

export default MenuPage;
