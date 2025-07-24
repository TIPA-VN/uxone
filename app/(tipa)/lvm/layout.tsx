import MenuPage from "@/components/menu";
import Navbar from "@/components/Navbar";
import Image from "next/image";
import Link from "next/link";
import QueryProvider from "@/lib/QueryProvider";

export default function TipaLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="h-screen flex">
      {/* Sidebar  */}
      <div className="w-16 lg:w-64 bg-gray-800 text-white flex flex-col relative">
        {/* Fixed Logo Section */}
        <div className="p-4 border-b border-gray-700">
          <Link
            href="/"
            className="flex items-center justify-center lg:justify-start gap-2 text-center cursor-pointer"
          >
            <Image
              src={"/images/tipa_logo.png"}
              alt="tipa_logo"
              width={40}
              height={40}
              className="flex-shrink-0"
            />
            <span className="hidden lg:block text-xl font-bold">
              TipaWeb
            </span>
          </Link>
        </div>

        {/* Scrollable Menu Section - Hidden Scrollbar */}
        <div className="flex-1 overflow-y-auto p-4 hide-scrollbar">
          <MenuPage />
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 bg-gray-100 flex flex-col">
        {/* Fixed Navbar */}
        <div className="sticky top-0 z-10 bg-white shadow-sm p-2">
          <Navbar />
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-2">
          <QueryProvider>{children}</QueryProvider>
        </div>
      </div>
    </div>
  );
}
