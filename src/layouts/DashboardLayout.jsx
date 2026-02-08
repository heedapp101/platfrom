import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-slate-100">
      {/* Pass collapsed state to Sidebar */}
      <Sidebar role="seller" collapsed={collapsed} />
      
      <div className="flex-1 flex flex-col min-w-0">
        {/* Pass toggle function to Topbar */}
        <Topbar onToggle={() => setCollapsed(!collapsed)} />
        
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}