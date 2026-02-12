export default function BillsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm p-4">
        <h1 className="text-xl font-bold">Bills Management</h1>
      </nav>
      <main className="p-8">{children}</main>
    </div>
  );
}