export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex-1">
        <div className="p-8">
          {/* Page Content */}
          {children}
        </div>
      </div>
    </div>
  );
}
