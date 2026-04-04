import { useState, useEffect, useCallback } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, Cell,
} from "recharts";
import {
  DollarSign, CreditCard, TrendingUp, AlertCircle, CheckCircle,
  Search, RefreshCw, Package,
} from "lucide-react";
import { API_ENDPOINTS } from "../../config/api";

// ─── Plan colours ──────────────────────────────────────────────
const PLAN_COLORS = {
  basic:  { bg: "bg-slate-100",   text: "text-slate-600"   },
  growth: { bg: "bg-indigo-100",  text: "text-indigo-700"  },
  pro:    { bg: "bg-purple-100",  text: "text-purple-700"  },
};

const PLAN_BAR_COLORS = {
  basic:  "#94a3b8",
  growth: "#6366f1",
  pro:    "#a855f7",
};

// ─── Main Component ─────────────────────────────────────────────
export default function Revenue() {
  const [data, setData]       = useState(null);   // raw API response
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [searchTerm, setSearchTerm]     = useState("");
  const [filterPlan, setFilterPlan]     = useState("all");

  // ── Fetch ──────────────────────────────────────────────────────
  const fetchRevenue = useCallback(async () => {
    const token = localStorage.getItem("token");
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(API_ENDPOINTS.ADMIN.REVENUE, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("Revenue fetch error:", err);
      setError("Failed to load revenue data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRevenue(); }, [fetchRevenue]);

  // ── Derived values ─────────────────────────────────────────────
  const totalRevenue         = data?.totalRevenue         ?? 0;
  const activeSubscriptions  = data?.activeSubscriptions  ?? 0;
  const monthlyRevenue       = data?.monthlyRevenue       ?? [];
  const planDistribution     = data?.planDistribution     ?? { basic: 0, growth: 0, pro: 0 };
  const recentSubscriptions  = data?.recentSubscriptions  ?? [];

  // Plan bar-chart data
  const planChartData = [
    { plan: "Basic ₹149",  count: planDistribution.basic,  fill: PLAN_BAR_COLORS.basic  },
    { plan: "Growth ₹299", count: planDistribution.growth, fill: PLAN_BAR_COLORS.growth },
    { plan: "Pro ₹499",    count: planDistribution.pro,    fill: PLAN_BAR_COLORS.pro    },
  ];

  // Filter recent subscriptions table
  const filteredSubs = recentSubscriptions.filter((sub) => {
    const matchSearch =
      (sub.userName  || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sub.userEmail || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchPlan = filterPlan === "all" || sub.plan === filterPlan;
    return matchSearch && matchPlan;
  });

  // ── Loading state ──────────────────────────────────────────────
  if (loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center gap-3 text-slate-500 min-h-[400px]">
        <RefreshCw className="animate-spin" size={28} />
        <p className="text-sm font-medium">Loading revenue data…</p>
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────
  if (error) {
    return (
      <div className="p-8 flex flex-col items-center justify-center gap-4 text-slate-500 min-h-[400px]">
        <AlertCircle size={36} className="text-red-400" />
        <p className="text-sm font-medium text-red-500">{error}</p>
        <button
          onClick={fetchRevenue}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <RefreshCw size={14} /> Retry
        </button>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-8 animate-fade-in">

      {/* 1. HEADER */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Revenue</h1>
          <p className="text-slate-500 text-sm">Subscription revenue from active plans.</p>
        </div>
        <button
          onClick={fetchRevenue}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 text-sm font-medium transition-colors"
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* 2. STAT CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <FinancialCard
          title="Total Revenue"
          value={`₹${totalRevenue.toLocaleString("en-IN")}`}
          subtitle="All subscriptions (all-time)"
          icon={<DollarSign size={22} />}
          bg="bg-emerald-50 text-emerald-600"
        />
        <FinancialCard
          title="Active Subscriptions"
          value={activeSubscriptions}
          subtitle="status = active & not expired"
          icon={<CreditCard size={22} />}
          bg="bg-blue-50 text-blue-600"
        />
        <FinancialCard
          title="Plans Sold"
          value={planDistribution.basic + planDistribution.growth + planDistribution.pro}
          subtitle={`Basic ${planDistribution.basic} · Growth ${planDistribution.growth} · Pro ${planDistribution.pro}`}
          icon={<TrendingUp size={22} />}
          bg="bg-purple-50 text-purple-600"
        />
      </div>

      {/* 3. CHARTS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Revenue over time — Area chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 lg:col-span-2">
          <h3 className="font-bold text-lg text-slate-700 mb-6">Revenue Growth (by Month)</h3>
          <div className="h-72">
            {monthlyRevenue.length === 0 ? (
              <EmptyChart message="No monthly revenue data yet." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyRevenue}>
                  <defs>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#10b981" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}    />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="month"
                    axisLine={false} tickLine={false}
                    tick={{ fill: "#64748b", fontSize: 12 }}
                  />
                  <YAxis
                    axisLine={false} tickLine={false}
                    tick={{ fill: "#64748b", fontSize: 12 }}
                    tickFormatter={(v) => `₹${v.toLocaleString("en-IN")}`}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                    formatter={(value) => [`₹${value.toLocaleString("en-IN")}`, "Revenue"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="#10b981"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorAmount)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Plan distribution — Bar chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="font-bold text-lg text-slate-700 mb-6">Plan Distribution</h3>
          <div className="h-72">
            {planChartData.every((d) => d.count === 0) ? (
              <EmptyChart message="No subscriptions yet." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={planChartData} layout="vertical" margin={{ left: 8, right: 24 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis
                    type="number"
                    axisLine={false} tickLine={false}
                    tick={{ fill: "#64748b", fontSize: 12 }}
                    allowDecimals={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="plan"
                    axisLine={false} tickLine={false}
                    tick={{ fill: "#64748b", fontSize: 11 }}
                    width={84}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                    formatter={(value) => [value, "Subscribers"]}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {planChartData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* 4. RECENT SUBSCRIPTIONS TABLE */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">

        {/* Table controls */}
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
          <h3 className="font-bold text-lg text-slate-700">Recent Subscriptions</h3>
          <div className="flex gap-3 w-full sm:w-auto">
            {/* Search */}
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={15} />
              <input
                type="text"
                placeholder="Search by name or email…"
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {/* Filter by plan */}
            <select
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filterPlan}
              onChange={(e) => setFilterPlan(e.target.value)}
            >
              <option value="all">All Plans</option>
              <option value="basic">Basic</option>
              <option value="growth">Growth</option>
              <option value="pro">Pro</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Plan</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4">Billing Period</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredSubs.length > 0 ? (
                filteredSubs.map((sub) => (
                  <tr key={sub._id} className="hover:bg-slate-50 transition-colors">

                    {/* User info */}
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-700">{sub.userName || "—"}</p>
                      <p className="text-xs text-slate-400">{sub.userEmail || ""}</p>
                    </td>

                    {/* Plan badge */}
                    <td className="px-6 py-4">
                      <PlanBadge plan={sub.plan} />
                    </td>

                    {/* Price */}
                    <td className="px-6 py-4 font-mono font-medium text-slate-700">
                      ₹{sub.price ?? "—"}
                    </td>

                    {/* Billing period */}
                    <td className="px-6 py-4 text-slate-500">
                      <div className="flex flex-col">
                        <span>
                          {sub.startDate
                            ? new Date(sub.startDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                            : "—"}
                        </span>
                        <span className="text-xs text-slate-400">
                          Ends:{" "}
                          {sub.endDate
                            ? new Date(sub.endDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                            : "—"}
                        </span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <StatusBadge status={sub.status} endDate={sub.endDate} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <Package size={28} />
                      <p className="text-sm italic">
                        {recentSubscriptions.length === 0
                          ? "No subscriptions on the platform yet."
                          : "No subscriptions match your filters."}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ─── Helper Components ─────────────────────────────────────────── */

function FinancialCard({ title, value, subtitle, icon, bg }) {
  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
      <div>
        <p className="text-slate-400 text-xs font-bold uppercase tracking-wide mb-1">{title}</p>
        <h2 className="text-2xl font-bold text-slate-800">{value}</h2>
        <p className="text-xs text-slate-400 mt-1">{subtitle}</p>
      </div>
      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${bg}`}>
        {icon}
      </div>
    </div>
  );
}

function PlanBadge({ plan }) {
  const colours = PLAN_COLORS[plan] ?? { bg: "bg-slate-100", text: "text-slate-600" };
  return (
    <span className={`px-2 py-1 rounded text-xs font-bold ${colours.bg} ${colours.text}`}>
      {plan ? plan.toUpperCase() : "—"}
    </span>
  );
}

function StatusBadge({ status, endDate }) {
  // Double-check: mark expired if endDate is in the past even if status says active
  const isReallyActive =
    status === "active" && endDate && new Date(endDate) > new Date();

  if (isReallyActive) {
    return (
      <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full text-xs font-bold border border-emerald-100 w-fit">
        <CheckCircle size={11} /> Active
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-slate-500 bg-slate-100 px-2 py-1 rounded-full text-xs font-bold border border-slate-200 w-fit">
      <AlertCircle size={11} /> Expired
    </span>
  );
}

function EmptyChart({ message }) {
  return (
    <div className="h-full flex items-center justify-center text-slate-400 text-sm italic">
      {message}
    </div>
  );
}
