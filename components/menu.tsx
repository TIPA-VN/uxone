import { SidebarLinks } from "@/lib/constant";
import Link from "next/link";
import React from "react";
import { BsFillGridFill } from "react-icons/bs";

const MenuPage = () => {
  return (
    <div className="mt-4 text-sm" >
      {SidebarLinks.map((i) => (
        <div
          key={i.title}
          className="flex flex-col gap-2 rounded"
        >
          <span className="hidden lg:block my-5 text-amber-200">{i.title}</span>
          {i.items.map((item) => (
            <Link
              key={item.label}
              href={item.route}
              className="flex items-center justify-center gap-4 py-2 lg:justify-start rounded"
            >
              <span className="text-cyan-100 text-xl">
                {item.icon || <BsFillGridFill />}
              </span>
              <span className="hidden lg:block">{item.label}</span>
            </Link>
          ))}
        </div>
      ))}
    </div>
  );
};

export default MenuPage;