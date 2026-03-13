import React from 'react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="admin-layout-wrapper">
      {/* You can move the Sidebar/Topbar here later if you add more admin pages */}
      {children}
    </div>
  );
}