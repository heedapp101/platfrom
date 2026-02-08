import { useState } from "react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend
} from "recharts";
import { 
  DollarSign, CreditCard, TrendingUp, Calendar, 
  AlertCircle, CheckCircle, Search, Download 
} from "lucide-react";

/* ==========================================
   MOCK DATA (Replace with API calls later)
   ========================================== */
const MOCK_REVENUE_DATA = [
  { month: "Jan", revenue: 4000, subscriptions: 24 },
  { month: "Feb", revenue: 3000, subscriptions: 18 },
  { month: "Mar", revenue: 5000, subscriptions: 35 },
  { month: "Apr", revenue: 7800, subscriptions: 50 },
  { month: "May", revenue: 6500, subscriptions: 42 },
  { month: "Jun", revenue: 9000, subscriptions: 65 },
  { month: "Jul", revenue: 12000, subscriptions: 85 },
];

const MOCK_SUBSCRIPTIONS = [
  { id: 1, business: "TechNova Ltd", plan: "Premium", price: 49.99, status: "Active", startDate: "2025-01-15", renewsOn: "2026-01-15", totalPaid: 599.88 },
  { id: 2, business: "Urban Styles", plan: "Basic", price: 19.99, status: "Active", startDate: "2025-03-10", renewsOn: "2026-03-10", totalPaid: 239.88 },
  { id: 3, business: "Green Grocers", plan: "Premium", price: 49.99, status: "Past Due", startDate: "2024-12-01", renewsOn: "2025-12-01", totalPaid: 599.88 },
  { id: 4, business: "Pixel Studio", plan: "Enterprise", price: 199.00, status: "Active", startDate: "2025-06-20", renewsOn: "2026-06-20", totalPaid: 1194.00 },
  { id: 5, business: "Bakery 101", plan: "Basic", price: 19.99, status: "Cancelled", startDate: "2024-05-05", renewsOn: "-", totalPaid: 100.00 },
];

export default function Revenue() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");

  // Filter Logic
  const filteredSubs = MOCK_SUBSCRIPTIONS.filter(sub => {
    const matchesSearch = sub.business.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === "All" || sub.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="p-6 space-y-8 animate-fade-in">
      
      {/* 1. HEADER */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Revenue</h1>
          <p className="text-slate-500 text-sm">Track platform revenue and business subscriptions.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 text-sm font-medium transition-colors">
          <Download size={16} /> Export Report
        </button>
      </div>

      {/* 2. REVENUE CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <FinancialCard 
          title="Total Revenue" 
          value="$45,200" 
          trend="+12.5%" 
          trendUp={true}
          icon={<DollarSign size={24} />} 
          bg="bg-emerald-50 text-emerald-600"
        />
        <FinancialCard 
          title="Active Subscriptions" 
          value="85" 
          trend="+5 New" 
          trendUp={true}
          icon={<CreditCard size={24} />} 
          bg="bg-blue-50 text-blue-600"
        />
        <FinancialCard 
          title="Avg. Revenue Per User" 
          value="$531.00" 
          trend="-2.4%" 
          trendUp={false}
          icon={<TrendingUp size={24} />} 
          bg="bg-purple-50 text-purple-600"
        />
      </div>

      {/* 3. REVENUE CHART */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <h3 className="font-bold text-lg text-slate-700 mb-6">Revenue Growth (2025)</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={MOCK_REVENUE_DATA}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} tickFormatter={(val) => `$${val}`} />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                formatter={(value) => [`$${value}`, "Revenue"]}
              />
              <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. SUBSCRIPTION TABLE SECTION */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        
        {/* Table Header / Controls */}
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
          <h3 className="font-bold text-lg text-slate-700">Business Subscriptions</h3>
          
          <div className="flex gap-3 w-full sm:w-auto">
            {/* Search */}
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Search business..." 
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            {/* Filter */}
            <select 
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Past Due">Past Due</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* The Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
              <tr>
                <th className="px-6 py-4">Business Name</th>
                <th className="px-6 py-4">Plan</th>
                <th className="px-6 py-4">Billing Cycle</th>
                <th className="px-6 py-4">Total Revenue</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredSubs.length > 0 ? (
                filteredSubs.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-700">
                      {sub.business}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        sub.plan === 'Enterprise' ? 'bg-purple-100 text-purple-700' : 
                        sub.plan === 'Premium' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {sub.plan.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      <div className="flex flex-col">
                        <span>Started: {sub.startDate}</span>
                        <span className="text-xs text-slate-400">Renews: {sub.renewsOn}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono font-medium text-slate-700">
                      ${sub.totalPaid.toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={sub.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-blue-600 hover:text-blue-800 font-medium text-xs">Manage</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-slate-500 italic">
                    No subscriptions found matching your filters.
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

/* ==========================================
   HELPER COMPONENTS
   ========================================== */

function FinancialCard({ title, value, trend, trendUp, icon, bg }) {
  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
      <div>
        <p className="text-slate-400 text-xs font-bold uppercase tracking-wide mb-1">{title}</p>
        <h2 className="text-2xl font-bold text-slate-800">{value}</h2>
        <p className={`text-xs font-semibold mt-1 flex items-center gap-1 ${trendUp ? 'text-emerald-600' : 'text-red-500'}`}>
          {trendUp ? '↑' : '↓'} {trend} <span className="text-slate-400 font-normal">vs last month</span>
        </p>
      </div>
      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${bg}`}>
        {icon}
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  if (status === "Active") {
    return (
      <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full text-xs font-bold border border-emerald-100 w-fit">
        <CheckCircle size={12} /> Active
      </span>
    );
  }
  if (status === "Past Due") {
    return (
      <span className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-1 rounded-full text-xs font-bold border border-amber-100 w-fit">
        <AlertCircle size={12} /> Past Due
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-slate-500 bg-slate-100 px-2 py-1 rounded-full text-xs font-bold border border-slate-200 w-fit">
      Cancelled
    </span>
  );
}
