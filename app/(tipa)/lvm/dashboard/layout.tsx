import QueryProvider from "@/lib/QueryProvider";

export default function TipaLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="h-screen flex ">
      {/* Main content area */}
      <div className=" bg-gray-100 p-2 overflow-scroll">
        <QueryProvider>{children}</QueryProvider>
      </div>
    </div>
  );
}
