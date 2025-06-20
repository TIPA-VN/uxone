import MenuPage from "@/components/menu";
import Navbar from "@/components/Navbar";
import Image from "next/image";
import Link from "next/link";
import QueryProvider from "../../lib/QueryProvider"

export default function TipaLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="h-screen flex">
      {/* Sidebar  */}
      <div className="w-[14%] md:w-[8%] lg:w-[16%] xl:w-[12%] bg-gray-800 text-white p-4 ">
        <Link
          href="/"
          className="flex justify-center gap-2 text-center cursor-pointer "
        >
          <Image
            src={"/images/tipa_logo.png"}
            alt="tipa_logo"
            width={50}
            height={50}
          />
          <span className="hidden lg:block items-center justify-center pt-3 text-xl font-bold">
            TipaWeb
          </span>
        </Link>
        <MenuPage />
      </div>
      {/* Main content area */}
      <div className="w-[86%] md:w-[92%] lg:w-[84%] xl:w-[86%] bg-gray-100 p-2 overflow-scroll">
        <Navbar />

        <QueryProvider>{children}</QueryProvider>
      </div>
    </div>
  );
}
