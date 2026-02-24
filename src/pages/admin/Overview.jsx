import { useEffect, useState, useMemo, useCallback, memo } from "react";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from "recharts";
import { Activity, TrendingUp, Clock, ThumbsUp, Users } from "lucide-react";
import { API_ENDPOINTS } from "../../config/api";

// Memoized Stats Card Component
const StatCard = memo(function StatCard({ title, value, icon, bg }) {
  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4 transition-transform hover:-translate-y-1">
      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${bg}`}>
        {icon}
      </div>
      <div>
        <p className="text-slate-400 text-xs font-bold uppercase tracking-wide">{title}</p>
        <h2 className="text-2xl font-bold text-slate-800">{value?.toLocaleString() || 0}</h2>
      </div>
    </div>
  );
});

// Memoized Metric Card Component
const MetricCard = memo(function MetricCard({ icon, title, value, subtitle, color, bgColor }) {
  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-lg ${bgColor} ${color}`}>
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold text-slate-800 mb-1">{value}</p>
      <p className="text-xs font-medium text-slate-600 mb-1">{title}</p>
      <p className="text-xs text-slate-400">{subtitle}</p>
    </div>
  );
});

// Memoized chart components to prevent unnecessary re-renders
const UserGrowthChart = memo(function UserGrowthChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-slate-400">
        No growth data available
      </div>
    );
  }
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
        <XAxis dataKey="date" tick={{fontSize: 12}} stroke="#94a3b8" />
        <YAxis tick={{fontSize: 12}} stroke="#94a3b8" allowDecimals={false} />
        <Tooltip 
          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
        />
        <Line 
          type="monotone" 
          dataKey="users" 
          stroke="#3b82f6" 
          strokeWidth={3} 
          dot={{ r: 4, fill: "#3b82f6", strokeWidth: 2, stroke: "#fff" }} 
          activeDot={{ r: 6 }} 
        />
      </LineChart>
    </ResponsiveContainer>
  );
});

const UserTypesPieChart = memo(function UserTypesPieChart({ data, colors }) {
  if (!data || data.length === 0 || !data.some(d => d.value > 0)) {
    return <div className="text-slate-400">No user data available</div>;
  }
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={80}
          paddingAngle={5}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
});

const DailyTrendChart = memo(function DailyTrendChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-slate-400">
        No trend data available
      </div>
    );
  }
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
        <XAxis 
          dataKey="date" 
          tick={{ fontSize: 11 }} 
          stroke="#94a3b8"
          angle={-15}
          textAnchor="end"
          height={60}
        />
        <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
        <Tooltip 
          contentStyle={{ 
            borderRadius: '8px', 
            border: 'none', 
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' 
          }} 
        />
        <Legend />
        <Line 
          type="monotone" 
          dataKey="views" 
          stroke="#3b82f6" 
          strokeWidth={2}
          name="Views"
          dot={{ r: 3 }}
        />
        <Line 
          type="monotone" 
          dataKey="likes" 
          stroke="#ec4899" 
          strokeWidth={2}
          name="Likes"
          dot={{ r: 3 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
});

const EngagementBySourceChart = memo(function EngagementBySourceChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-slate-400">
        No source data available
      </div>
    );
  }
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
        <XAxis 
          dataKey="_id" 
          tick={{ fontSize: 11 }} 
          stroke="#94a3b8"
        />
        <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
        <Tooltip 
          contentStyle={{ 
            borderRadius: '8px', 
            border: 'none', 
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' 
          }} 
        />
        <Legend />
        <Bar dataKey="views" fill="#3b82f6" name="Views" radius={[4, 4, 0, 0]} />
        <Bar dataKey="likes" fill="#ec4899" name="Likes" radius={[4, 4, 0, 0]} />
        <Bar dataKey="comments" fill="#10b981" name="Comments" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
});

// Memoized Top Posts Row
const TopPostRow = memo(function TopPostRow({ post, idx }) {
  const likeRate = useMemo(() => 
    post.views > 0 ? ((post.likes / post.views) * 100).toFixed(1) : 0
  , [post.views, post.likes]);
  
  return (
    <tr className="border-b border-slate-100 hover:bg-slate-50">
      <td className="py-3 px-4">
        <div className="flex items-center gap-3">
          {post.post?.images?.[0] && (
            <img
              src={post.post.images[0]}
              alt={post.post.title}
              className="w-12 h-12 rounded-lg object-cover"
              loading="lazy"
            />
          )}
          <div>
            <p className="font-medium text-slate-800 text-sm">
              {post.post?.title || "Untitled"}
            </p>
            <p className="text-xs text-slate-500">Post #{idx + 1}</p>
          </div>
        </div>
      </td>
      <td className="text-center py-3 px-4 text-slate-700">{post.views}</td>
      <td className="text-center py-3 px-4 text-slate-700">{post.likes}</td>
      <td className="text-center py-3 px-4">
        <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
          {post.engagementScore}
        </span>
      </td>
      <td className="text-center py-3 px-4">
        <span className={`font-medium ${
          likeRate > 10 ? 'text-emerald-600' : 
          likeRate > 5 ? 'text-amber-600' : 
          'text-slate-600'
        }`}>
          {likeRate}%
        </span>
      </td>
    </tr>
  );
});

// Memoized Recent User Row
const RecentUserRow = memo(function RecentUserRow({ user }) {
  const formattedDate = useMemo(() => 
    new Date(user.createdAt).toLocaleDateString()
  , [user.createdAt]);
  
  return (
    <tr className="hover:bg-slate-50 transition-colors">
      <td className="px-4 py-3 font-medium text-slate-700">
        <div className="flex flex-col">
          <span>{user.username}</span>
          <span className="text-xs text-slate-400 font-normal">{user.email}</span>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className={`px-2 py-1 rounded text-xs font-bold ${
          user.userType === 'business' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'
        }`}>
          {user.userType.toUpperCase()}
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-slate-500">{formattedDate}</td>
      <td className="px-4 py-3">
        <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded">
          Active
        </span>
      </td>
    </tr>
  );
});

const COLORS = ["#3b82f6", "#10b981"];

export default function Overview() {
  const [dashboardData, setDashboardData] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState(7);

  const fetchAllData = useCallback(async () => {
    const token = localStorage.getItem("token");
    setLoading(true);
    
    try {
      // Fetch both Dashboard stats and Analytics in parallel
      const [dashRes, analyticsRes] = await Promise.all([
        fetch(API_ENDPOINTS.ADMIN.STATS, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_ENDPOINTS.ADMIN.ANALYTICS}?days=${timeRange}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
      ]);

      const [dashResult, analyticsResult] = await Promise.all([
        dashRes.json(),
        analyticsRes.json()
      ]);

      if (dashRes.ok) setDashboardData(dashResult);
      if (analyticsRes.ok) setAnalyticsData(analyticsResult);
    } catch (err) {
      console.error("Failed to fetch data", err);
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const handleTimeRangeChange = useCallback((e) => {
    setTimeRange(Number(e.target.value));
  }, []);

  // Memoize pieData computation
  const pieData = useMemo(() => [
    { name: "General Users", value: (dashboardData?.stats.totalUsers || 0) - (dashboardData?.stats.businessUsers || 0) },
    { name: "Business Users", value: dashboardData?.stats.businessUsers || 0 },
  ], [dashboardData?.stats.totalUsers, dashboardData?.stats.businessUsers]);

  const { summary, engagementBySource, dailyTrend, topPosts } = analyticsData || {};

  if (loading) return <div className="p-8 text-slate-500">Loading Overview...</div>;

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Platform Overview</h1>
          <p className="text-slate-500">User stats & engagement analytics at a glance</p>
        </div>
        <select
          value={timeRange}
          onChange={handleTimeRangeChange}
          className="px-4 py-2 border border-slate-200 rounded-lg bg-white text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
        >
          <option value={7}>Last 7 Days</option>
          <option value={14}>Last 14 Days</option>
          <option value={30}>Last 30 Days</option>
        </select>
      </div>

      {/* PLATFORM STAT CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard 
          title="Total Users" 
          value={dashboardData?.stats.totalUsers} 
          icon="👥" 
          bg="bg-blue-50 text-blue-600" 
        />
        <StatCard 
          title="Deleted Users" 
          value={dashboardData?.stats.deletedUsers} 
          icon="DEL" 
          bg="bg-rose-50 text-rose-600" 
        />
        <StatCard 
          title="Total Posts" 
          value={dashboardData?.stats.totalPosts} 
          icon="🖼️" 
          bg="bg-purple-50 text-purple-600" 
        />
        <StatCard 
          title="Active Businesses" 
          value={dashboardData?.stats.businessUsers} 
          icon="🏢" 
          bg="bg-green-50 text-green-600" 
        />
        <StatCard 
          title="Pending Approvals" 
          value={dashboardData?.stats.pendingApprovals} 
          icon="⏳" 
          bg="bg-amber-50 text-amber-600" 
        />
      </div>

      {/* ENGAGEMENT METRIC CARDS */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <MetricCard
            icon={<TrendingUp className="w-5 h-5" />}
            title="CTR"
            value={`${summary.ctr}%`}
            subtitle="Click-through rate"
            color="text-blue-600"
            bgColor="bg-blue-50"
          />
          <MetricCard
            icon={<Clock className="w-5 h-5" />}
            title="Avg Dwell Time"
            value={`${summary.avgDwellTime}s`}
            subtitle="Time on posts"
            color="text-purple-600"
            bgColor="bg-purple-50"
          />
          <MetricCard
            icon={<ThumbsUp className="w-5 h-5" />}
            title="Like Rate"
            value={`${summary.likeRate}%`}
            subtitle="Views → Likes"
            color="text-pink-600"
            bgColor="bg-pink-50"
          />
          <MetricCard
            icon={<Users className="w-5 h-5" />}
            title="Return Rate"
            value={`${summary.returnRate}%`}
            subtitle="Daily active users"
            color="text-emerald-600"
            bgColor="bg-emerald-50"
          />
          <MetricCard
            icon={<Activity className="w-5 h-5" />}
            title="Total Views"
            value={summary.viewedRecommendations}
            subtitle="Recommendations shown"
            color="text-indigo-600"
            bgColor="bg-indigo-50"
          />
        </div>
      )}

      {/* CHARTS ROW 1: User Growth + User Types */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Growth Line Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 lg:col-span-2">
          <h3 className="font-bold text-lg mb-4 text-slate-700">User Growth (Last 7 Days)</h3>
          <div className="h-64" style={{ minHeight: 256 }}>
            <UserGrowthChart data={dashboardData?.graphData} />
          </div>
        </div>

        {/* User Distribution Pie Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="font-bold text-lg mb-4 text-slate-700">User Types</h3>
          <div className="h-64 flex items-center justify-center" style={{ minHeight: 256 }}>
            <UserTypesPieChart data={pieData} colors={COLORS} />
          </div>
          <div className="flex justify-center gap-4 text-sm mt-2">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500"></span> General
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span> Business
            </div>
          </div>
        </div>
      </div>

      {/* CHARTS ROW 2: Daily Engagement + Engagement by Source */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Trend Line Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="font-bold text-lg mb-4 text-slate-700">Daily Engagement Trend</h3>
          <div className="h-72">
            <DailyTrendChart data={dailyTrend} />
          </div>
        </div>

        {/* Engagement by Source Bar Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="font-bold text-lg mb-4 text-slate-700">Engagement by Source</h3>
          <div className="h-72">
            <EngagementBySourceChart data={engagementBySource} />
          </div>
        </div>
      </div>

      {/* TOP PERFORMING POSTS */}
      {topPosts && topPosts.length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="font-bold text-lg mb-4 text-slate-700">Top Performing Posts</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Post</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-slate-600">Views</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-slate-600">Likes</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-slate-600">Engagement</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-slate-600">Like Rate</th>
                </tr>
              </thead>
              <tbody>
                {topPosts.map((post, idx) => (
                  <TopPostRow key={post._id} post={post} idx={idx} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* RECENT REGISTRATIONS */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg text-slate-700">Newest Users</h3>
          <button className="text-sm text-blue-600 hover:underline">View All</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
              <tr>
                <th className="px-4 py-3 rounded-l-md">User</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3 rounded-r-md">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {dashboardData?.recentUsers?.map((u) => (
                <RecentUserRow key={u._id} user={u} />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ALGORITHM PERFORMANCE SUMMARY */}
      {summary && (
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-6 rounded-xl border border-purple-100">
          <h3 className="font-bold text-lg mb-3 text-slate-800">📊 Algorithm Performance Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-600 mb-2">
                <strong>Total Recommendations Served:</strong> {summary.totalRecommendations}
              </p>
              <p className="text-slate-600 mb-2">
                <strong>Successfully Viewed:</strong> {summary.viewedRecommendations} ({summary.ctr}%)
              </p>
              <p className="text-slate-600">
                <strong>Converted to Likes:</strong> {summary.likedRecommendations} ({summary.likeRate}% of views)
              </p>
            </div>
            <div>
              <p className="text-slate-600 mb-2">
                <strong>Average Engagement Time:</strong> {summary.avgDwellTime} seconds
              </p>
              <p className="text-slate-600 mb-2">
                <strong>Active Users (24h):</strong> {summary.activeUsers}
              </p>
              <p className="text-slate-600">
                <strong>Daily Return Rate:</strong> {summary.returnRate}%
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}