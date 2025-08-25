export default function FinalizedContractsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900">Finalized Contracts</h1>
          <p className="text-gray-600 mt-2">
            Audit and review finalized contract documents
          </p>
        </div>
      </div>
      {children}
    </div>
  );
}
