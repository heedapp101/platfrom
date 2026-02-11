import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Sidebar({ collapsed }) {
  const { user } = useAuth();
  
  // Determine base path based on role
  const basePath = user?.role === "admin" ? "/admin" : "/seller";

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 transition-colors ${
      isActive ? "bg-slate-800 text-white border-r-4 border-blue-500" : "text-slate-400 hover:bg-slate-800 hover:text-white"
    }`;

  return (
    <aside
      className={`bg-slate-900 text-white transition-all duration-300 flex flex-col ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      <div className="h-14 flex items-center justify-center border-b border-slate-800">
        <h1 className={`font-bold text-xl transition-all ${collapsed ? "scale-0 w-0" : "scale-100"}`}>
          HEED
        </h1>
        {collapsed && <span className="font-bold text-xl">H</span>}
      </div>

      <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
        <NavLink to={`${basePath}`} end className={linkClass}>
          <span>📊</span>
          {!collapsed && <span>Overview</span>}
        </NavLink>

        {/* Admin Specific Links */}
        {user?.role === "admin" ? (
          <>
            <NavLink to={`${basePath}/users`} className={linkClass}>
               <span>👥</span>
               {!collapsed && <span>Users</span>}
            </NavLink>
            <NavLink to={`${basePath}/deleted-users`} className={linkClass}>
               <span>DEL</span>
               {!collapsed && <span>Deleted Users</span>}
            </NavLink>
            <NavLink to={`${basePath}/approvals`} className={linkClass}>
               <span>✅</span>
               {!collapsed && <span>Approvals</span>}
            </NavLink>
            <NavLink to={`${basePath}/ads`} className={linkClass}>
               <span>📢</span>
               {!collapsed && <span>Ads Management</span>}
            </NavLink>
            <NavLink to={`${basePath}/boosts`} className={linkClass}>
               <span>🚀</span>
               {!collapsed && <span>Boost Control</span>}
            </NavLink>
            <NavLink to={`${basePath}/revenue`} className={linkClass}>
               <span>💰</span>
               {!collapsed && <span>Revenue</span>}
            </NavLink>
            <NavLink to={`${basePath}/chat`} className={linkClass}>
               <span>💬</span>
               {!collapsed && <span>Support Chat</span>}
            </NavLink>
            <NavLink to={`${basePath}/compliance`} className={linkClass}>
               <span>🛡️</span>
               {!collapsed && <span>Compliance</span>}
            </NavLink>
            <NavLink to={`${basePath}/legal`} className={linkClass}>
               <span>ðŸ“„</span>
               {!collapsed && <span>Legal Docs</span>}
            </NavLink>
            <NavLink to={`${basePath}/reports`} className={linkClass}>
               <span>🚩</span>
               {!collapsed && <span>Reported Posts</span>}
            </NavLink>
          </>
        ) : (
          /* Seller Specific Links */
          <>
            <NavLink to={`${basePath}/posts`} className={linkClass}>
              <span>🖼️</span>
              {!collapsed && <span>Posts</span>}
            </NavLink>
            <NavLink to={`${basePath}/orders`} className={linkClass}>
              <span>📦</span>
              {!collapsed && <span>Orders</span>}
            </NavLink>
            <NavLink to={`${basePath}/analytics`} className={linkClass}>
              <span>📉</span>
              {!collapsed && <span>Analytics</span>}
            </NavLink>
            <NavLink to={`${basePath}/ads`} className={linkClass}>
              <span>🚀</span>
              {!collapsed && <span>Boost & Ads</span>}
            </NavLink>
            <NavLink to={`${basePath}/settings`} className={linkClass}>
              <span>⚙️</span>
              {!collapsed && <span>Settings</span>}
            </NavLink>
          </>
        )}
      </nav>
    </aside>
  );
} 


