import {
  Award,
  BarChart3,
  BellRing,
  CheckSquare,
  Crown,
  Flag,
  Image,
  LayoutDashboard,
  Megaphone,
  MessageSquare,
  Package,
  Rocket,
  Scale,
  Settings,
  ShieldCheck,
  Trash2,
  Trophy,
  Users,
  Wallet,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const iconClassName = "h-[18px] w-[18px] shrink-0";

export default function Sidebar({ collapsed }) {
  const { user } = useAuth();
  const basePath = user?.role === "admin" ? "/admin" : "/seller";

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 transition-colors ${
      isActive
        ? "bg-slate-800 text-white border-r-4 border-blue-500"
        : "text-slate-400 hover:bg-slate-800 hover:text-white"
    }`;

  return (
    <aside
      className={`bg-slate-900 text-white transition-all duration-300 flex flex-col ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      <div className="h-14 flex items-center justify-center border-b border-slate-800">
        <h1 className={`font-bold text-xl transition-all ${collapsed ? "scale-0 w-0" : "scale-100"}`}>
          HEESZO
        </h1>
        {collapsed && <span className="font-bold text-xl">H</span>}
      </div>

      <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
        <NavLink to={`${basePath}`} end className={linkClass}>
          <LayoutDashboard className={iconClassName} />
          {!collapsed && <span>Overview</span>}
        </NavLink>

        {user?.role === "admin" ? (
          <>
            <NavLink to={`${basePath}/users`} className={linkClass}>
              <Users className={iconClassName} />
              {!collapsed && <span>Users</span>}
            </NavLink>
            <NavLink to={`${basePath}/orders`} className={linkClass}>
              <Package className={iconClassName} />
              {!collapsed && <span>Orders</span>}
            </NavLink>
            <NavLink to={`${basePath}/badges`} className={linkClass}>
              <Trophy className={iconClassName} />
              {!collapsed && <span>Badge</span>}
            </NavLink>
            <NavLink to={`${basePath}/deleted-users`} className={linkClass}>
              <Trash2 className={iconClassName} />
              {!collapsed && <span>Deleted Users</span>}
            </NavLink>
            <NavLink to={`${basePath}/approvals`} className={linkClass}>
              <CheckSquare className={iconClassName} />
              {!collapsed && <span>Approvals</span>}
            </NavLink>
            <NavLink to={`${basePath}/ads`} className={linkClass}>
              <Megaphone className={iconClassName} />
              {!collapsed && <span>Ads Management</span>}
            </NavLink>
            <NavLink to={`${basePath}/boosts`} className={linkClass}>
              <Rocket className={iconClassName} />
              {!collapsed && <span>Boost Control</span>}
            </NavLink>
            <NavLink to={`${basePath}/revenue`} className={linkClass}>
              <Wallet className={iconClassName} />
              {!collapsed && <span>Revenue</span>}
            </NavLink>
            <NavLink to={`${basePath}/chat`} className={linkClass}>
              <MessageSquare className={iconClassName} />
              {!collapsed && <span>Support Chat</span>}
            </NavLink>
            <NavLink to={`${basePath}/compliance`} className={linkClass}>
              <ShieldCheck className={iconClassName} />
              {!collapsed && <span>Compliance</span>}
            </NavLink>
            <NavLink to={`${basePath}/legal`} className={linkClass}>
              <Scale className={iconClassName} />
              {!collapsed && <span>Legal Docs</span>}
            </NavLink>
            <NavLink to={`${basePath}/reports`} className={linkClass}>
              <Flag className={iconClassName} />
              {!collapsed && <span>Reported Posts</span>}
            </NavLink>
            <NavLink to={`${basePath}/awards`} className={linkClass}>
              <Award className={iconClassName} />
              {!collapsed && <span>Awards</span>}
            </NavLink>
            <NavLink to={`${basePath}/push-notifications`} className={linkClass}>
              <BellRing className={iconClassName} />
              {!collapsed && <span>Push Notification</span>}
            </NavLink>
            <NavLink to={`${basePath}/settings`} className={linkClass}>
              <Settings className={iconClassName} />
              {!collapsed && <span>Settings</span>}
            </NavLink>
          </>
        ) : (
          <>
            <NavLink to={`${basePath}/posts`} className={linkClass}>
              <Image className={iconClassName} />
              {!collapsed && <span>Posts</span>}
            </NavLink>
            <NavLink to={`${basePath}/orders`} className={linkClass}>
              <Package className={iconClassName} />
              {!collapsed && <span>My Orders</span>}
            </NavLink>
            <NavLink to={`${basePath}/analytics`} className={linkClass}>
              <BarChart3 className={iconClassName} />
              {!collapsed && <span>Analytics</span>}
            </NavLink>
            <NavLink to={`${basePath}/ads`} className={linkClass}>
              <Rocket className={iconClassName} />
              {!collapsed && <span>Boost & Ads</span>}
            </NavLink>
            <NavLink to={`${basePath}/subscription`} className={linkClass}>
              <Crown className={iconClassName} />
              {!collapsed && <span>Subscription</span>}
            </NavLink>
            <NavLink to={`${basePath}/chat`} className={linkClass}>
              <MessageSquare className={iconClassName} />
              {!collapsed && <span>Support Chat</span>}
            </NavLink>
            <NavLink to={`${basePath}/settings`} className={linkClass}>
              <Settings className={iconClassName} />
              {!collapsed && <span>Settings</span>}
            </NavLink>
          </>
        )}
      </nav>
    </aside>
  );
}
