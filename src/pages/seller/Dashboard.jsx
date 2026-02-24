import { useEffect, useState, useCallback, memo } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { LayoutDashboard, ShoppingBag, Heart, DollarSign, Calendar } from "lucide-react";
import { API_ENDPOINTS } from "../../config/api";

// Memoized Stat Card
const StatCard = memo(function StatCard({ title, value, icon, color }) {
  return (
    <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${color}`}>{icon}</div>
      <div>
        <p className="text-xs text-slate-400 font-bold uppercase">{title}</p>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
      </div>
    </div>
  );
});

// Memoized Activity Chart
const ActivityChart = memo(function ActivityChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-slate-400">
        No activity data available
      </div>
    );
  }
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
        <XAxis dataKey="date" hide />
        <Tooltip />
        <Area type="monotone" dataKey="count" stroke="#3b82f6" fill="#dbeafe" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  );
});

export default function SellerDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(API_ENDPOINTS.SELLER.STATS, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setStats(data);
    } catch (error) {
      console.error("Stats fetch error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (loading) return <div className="p-6 text-slate-500">Loading Dashboard...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Seller Overview</h1>
        <div className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-bold border border-blue-100 flex items-center gap-2">
          <Calendar size={16} /> Subscription: Premium (Active)
        </div>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Posts" value={stats?.totalPosts} icon={<LayoutDashboard />} color="text-blue-600 bg-blue-50" />
        <StatCard title="Total Engagement" value={stats?.totalLikes} icon={<Heart />} color="text-pink-600 bg-pink-50" />
        <StatCard title="Total Orders" value={stats?.totalOrders} icon={<ShoppingBag />} color="text-amber-600 bg-amber-50" />
        <StatCard title="Revenue (UI Only)" value={`$${stats?.revenue}`} icon={<DollarSign />} color="text-emerald-600 bg-emerald-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* GRAPH: Activity */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
          <h3 className="font-bold text-slate-700 mb-4">Post Activity</h3>
          <div className="h-64" style={{ minHeight: 256 }}>
            <ActivityChart data={stats?.graphData} />
          </div>
        </div>

        {/* SUBSCRIPTION UI */}
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
          <h3 className="font-bold text-slate-700 mb-4">Plan Details</h3>
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-lg">
              <p className="text-xs text-slate-400 font-bold uppercase">Next Billing Date</p>
              <p className="text-lg font-bold text-slate-800">July 20, 2026</p>
            </div>
            <ul className="text-sm space-y-2 text-slate-600">
              <li className="flex items-center gap-2">✅ Unlimited Post Uploads</li>
              <li className="flex items-center gap-2">✅ HD Image Processing</li>
              <li className="flex items-center gap-2">✅ Priority Support</li>
            </ul>
            <button className="w-full py-2 bg-slate-900 text-white rounded-lg text-sm font-bold">Manage Subscription</button>
          </div>
        </div>
      </div>
    </div>
  );
}