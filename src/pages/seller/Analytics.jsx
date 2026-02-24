import { useEffect, useState } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  TrendingUp, IndianRupee, ShoppingBag, Package, Eye,
  Heart, MessageSquare, AlertTriangle, Clock, CheckCircle, Truck,
  XCircle, ArrowUpRight, ArrowDownRight, BarChart3, RefreshCw,
  Layers, Zap, Users, UserCheck, Calendar,
} from "lucide-react";
import { API_ENDPOINTS } from "../../config/api";

const PERIODS = [
  { label: "7 Days", value: 7 },
  { label: "30 Days", value: 30 },
  { label: "90 Days", value: 90 },
];

const STATUS_LABELS = {
  pending: { label: "Pending", color: "#f59e0b", icon: Clock },
  confirmed: { label: "Confirmed", color: "#3b82f6", icon: CheckCircle },
  shipping_initiated: { label: "Shipping", color: "#0ea5e9", icon: Package },
  shipped: { label: "Shipped", color: "#06b6d4", icon: Truck },
  out_for_delivery: { label: "Out for Delivery", color: "#14b8a6", icon: Truck },
  delivered: { label: "Delivered", color: "#10b981", icon: CheckCircle },
  cancelled: { label: "Cancelled", color: "#ef4444", icon: XCircle },
  disputed: { label: "Disputed", color: "#f43f5e", icon: AlertTriangle },
  refund_requested: { label: "Refund Req.", color: "#f97316", icon: RefreshCw },
  refunded: { label: "Refunded", color: "#6b7280", icon: RefreshCw },
};

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState(30);

  const fetchAnalytics = async () => {
    const token = localStorage.getItem("token");
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(API_ENDPOINTS.SELLER.ANALYTICS(period), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (res.ok) {
        setData(json);
      } else {
        setError(json.message || "Failed to fetch analytics");
      }
    } catch (err) {
      setError("Network error — please try again");
      console.error("Analytics fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="h-8 w-48 bg-slate-200 rounded animate-pulse" />
          <div className="h-10 w-64 bg-slate-200 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm h-28 animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-100 shadow-sm h-80 animate-pulse" />
          <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm h-80 animate-pulse" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <AlertTriangle className="text-red-400" size={48} />
        <p className="text-slate-600 text-lg">{error}</p>
        <button onClick={fetchAnalytics} className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold">
          Retry
        </button>
      </div>
    );
  }

  const { overview, statusCounts, charts, topProducts, paymentMethods, engagement, lowStockAlerts, recentOrders, customerStats, repeatedCustomers, allCustomers } = data;

  const orderStatusData = Object.entries(statusCounts || {}).map(([key, count]) => ({
    name: STATUS_LABELS[key]?.label || key,
    value: count,
    color: STATUS_LABELS[key]?.color || "#6b7280",
  }));

  const paymentData = (paymentMethods || []).map((p) => ({
    name: p.method === "cod" ? "Cash on Delivery" : "Online",
    value: p.count,
    amount: p.amount,
  }));

  return (
    <div className="space-y-6">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Analytics</h1>
          <p className="text-sm text-slate-500 mt-1">Track your store performance and growth</p>
        </div>
        <div className="flex items-center gap-2 bg-white rounded-lg border border-slate-200 p-1">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                period === p.value
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── KEY METRICS ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Revenue"
          value={`₹${(overview.revenue || 0).toLocaleString("en-IN")}`}
          change={overview.revenueGrowth}
          icon={<IndianRupee size={20} />}
          color="text-emerald-600 bg-emerald-50"
        />
        <MetricCard
          title="Total Orders"
          value={overview.totalOrders}
          change={overview.ordersGrowth}
          icon={<ShoppingBag size={20} />}
          color="text-blue-600 bg-blue-50"
        />
        <MetricCard
          title="Avg. Order Value"
          value={`₹${(overview.avgOrderValue || 0).toLocaleString("en-IN")}`}
          icon={<BarChart3 size={20} />}
          color="text-violet-600 bg-violet-50"
        />
        <MetricCard
          title="Pending Actions"
          value={overview.pendingOrders}
          icon={<AlertTriangle size={20} />}
          color={overview.pendingOrders > 0 ? "text-amber-600 bg-amber-50" : "text-slate-500 bg-slate-50"}
          alert={overview.pendingOrders > 0}
        />
      </div>

      {/* ── REVENUE CHART + ORDER STATUS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
          <h3 className="font-bold text-slate-700 mb-1">Revenue Trend</h3>
          <p className="text-xs text-slate-400 mb-4">Daily revenue for the last {period} days</p>
          <div className="h-64">
            {charts.revenueByDay && charts.revenueByDay.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={charts.revenueByDay}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    tickFormatter={(d) => {
                      const date = new Date(d);
                      return `${date.getDate()}/${date.getMonth() + 1}`;
                    }}
                  />
                  <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} tickFormatter={(v) => `₹${v}`} />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 13 }}
                    formatter={(value) => [`₹${value.toLocaleString("en-IN")}`, "Revenue"]}
                    labelFormatter={(d) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#10b981" fill="url(#revenueGrad)" strokeWidth={2.5} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart message="No revenue data for this period" />
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
          <h3 className="font-bold text-slate-700 mb-4">Order Breakdown</h3>
          {orderStatusData.length > 0 ? (
            <>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={orderStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      dataKey="value"
                      strokeWidth={2}
                      stroke="#fff"
                    >
                      {orderStatusData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 13 }}
                      formatter={(value, name) => [value, name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 mt-2">
                {orderStatusData.map((s, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                      <span className="text-slate-600">{s.name}</span>
                    </div>
                    <span className="font-bold text-slate-800">{s.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <EmptyChart message="No orders yet" />
          )}
        </div>
      </div>

      {/* ── ORDERS CHART + ENGAGEMENT STATS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
          <h3 className="font-bold text-slate-700 mb-1">Order Volume</h3>
          <p className="text-xs text-slate-400 mb-4">Daily orders placed</p>
          <div className="h-56">
            {charts.ordersByDay && charts.ordersByDay.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.ordersByDay}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    tickFormatter={(d) => {
                      const date = new Date(d);
                      return `${date.getDate()}/${date.getMonth() + 1}`;
                    }}
                  />
                  <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 13 }}
                    formatter={(value) => [value, "Orders"]}
                    labelFormatter={(d) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  />
                  <Bar dataKey="orders" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={32} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart message="No order data for this period" />
            )}
          </div>
        </div>

        {/* Engagement */}
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
          <h3 className="font-bold text-slate-700 mb-4">Engagement</h3>
          <div className="space-y-4">
            <EngagementRow icon={<Layers size={16} />} label="Active Posts" value={engagement.activePosts} color="text-blue-600" />
            <EngagementRow icon={<Eye size={16} />} label="Total Views" value={(engagement.totalViews || 0).toLocaleString()} color="text-cyan-600" />
            <EngagementRow icon={<Heart size={16} />} label="Total Likes" value={(engagement.totalLikes || 0).toLocaleString()} color="text-pink-600" />
            <EngagementRow icon={<MessageSquare size={16} />} label="Total Comments" value={(engagement.totalComments || 0).toLocaleString()} color="text-violet-600" />
            <EngagementRow icon={<Zap size={16} />} label="Boosted Posts" value={engagement.boostedPosts} color="text-amber-600" />
            <div className="pt-3 border-t border-slate-100">
              <EngagementRow
                icon={<AlertTriangle size={16} />}
                label="Out of Stock"
                value={engagement.outOfStock}
                color={engagement.outOfStock > 0 ? "text-red-600" : "text-slate-500"}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── TOP PRODUCTS + PAYMENT METHODS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
          <h3 className="font-bold text-slate-700 mb-4">Top Selling Products</h3>
          {topProducts && topProducts.length > 0 ? (
            <div className="space-y-3">
              {topProducts.map((product, i) => (
                <div key={i} className="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-sm font-bold text-slate-500">
                    {i + 1}
                  </div>
                  {product.image ? (
                    <img src={product.image} alt="" className="w-12 h-12 rounded-lg object-cover border border-slate-100" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center">
                      <Package size={18} className="text-slate-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{product.title || "Untitled Product"}</p>
                    <p className="text-xs text-slate-400">{product.totalSold} sold · {product.orderCount} orders</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-emerald-600">₹{product.totalRevenue.toLocaleString("en-IN")}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyChart message="No product sales data yet" />
          )}
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
          <h3 className="font-bold text-slate-700 mb-4">Payment Methods</h3>
          {paymentData.length > 0 ? (
            <>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={paymentData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      dataKey="value"
                      strokeWidth={2}
                      stroke="#fff"
                    >
                      <Cell fill="#3b82f6" />
                      <Cell fill="#10b981" />
                    </Pie>
                    <Tooltip
                      contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 13 }}
                      formatter={(value, name) => [value, name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3 mt-2">
                {paymentData.map((p, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: i === 0 ? "#3b82f6" : "#10b981" }} />
                      <span className="text-sm text-slate-700 font-medium">{p.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-800">{p.value} orders</p>
                      <p className="text-xs text-slate-400">₹{p.amount.toLocaleString("en-IN")}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <EmptyChart message="No payment data yet" />
          )}
        </div>
      </div>

      {/* ── LOW STOCK ALERTS + RECENT ORDERS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Alerts */}
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={18} className="text-amber-500" />
            <h3 className="font-bold text-slate-700">Low Stock Alerts</h3>
          </div>
          {lowStockAlerts && lowStockAlerts.length > 0 ? (
            <div className="space-y-3">
              {lowStockAlerts.map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-amber-50/50 border border-amber-100">
                  {item.image ? (
                    <img src={item.image} alt="" className="w-10 h-10 rounded-lg object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                      <Package size={16} className="text-amber-500" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{item.title}</p>
                    <p className="text-xs text-slate-400">₹{item.price}</p>
                  </div>
                  <div className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">
                    {item.stock} left
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-slate-400 gap-2">
              <CheckCircle size={24} />
              <p className="text-sm">All products well stocked</p>
            </div>
          )}
        </div>

        {/* Recent Orders */}
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
          <h3 className="font-bold text-slate-700 mb-4">Recent Orders</h3>
          {recentOrders && recentOrders.length > 0 ? (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {recentOrders.map((order, i) => {
                const statusConfig = STATUS_LABELS[order.status] || {};
                return (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                    {order.buyerInfo?.profilePic ? (
                      <img src={order.buyerInfo.profilePic} alt="" className="w-9 h-9 rounded-full object-cover" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-xs font-bold">
                        {(order.buyerInfo?.name || "?")[0].toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-slate-800">{order.orderNumber}</p>
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                          style={{ backgroundColor: statusConfig.color + "20", color: statusConfig.color }}
                        >
                          {statusConfig.label || order.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">
                        {order.buyerInfo?.name || order.buyerInfo?.username} · {order.items} item{order.items !== 1 && "s"} · {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </p>
                    </div>
                    <p className="text-sm font-bold text-slate-800">₹{order.totalAmount.toLocaleString("en-IN")}</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyChart message="No orders yet" />
          )}
        </div>
      </div>

      {/* ── CUSTOMER STATS ── */}
      {customerStats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard
            title="Total Customers"
            value={customerStats.totalUniqueCustomers || 0}
            icon={<Users size={20} />}
            color="text-blue-600 bg-blue-50"
          />
          <MetricCard
            title="Repeat Customers"
            value={customerStats.repeatedCustomersCount || 0}
            icon={<UserCheck size={20} />}
            color="text-emerald-600 bg-emerald-50"
          />
          <MetricCard
            title="Repeat Rate"
            value={`${customerStats.repeatRate || 0}%`}
            icon={<RefreshCw size={20} />}
            color="text-violet-600 bg-violet-50"
          />
        </div>
      )}

      {/* ── REPEATED CUSTOMERS + ALL CUSTOMERS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Repeated Customers */}
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <UserCheck size={18} className="text-emerald-500" />
            <h3 className="font-bold text-slate-700">Repeat Customers</h3>
            {repeatedCustomers && repeatedCustomers.length > 0 && (
              <span className="ml-auto text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                {repeatedCustomers.length} customers
              </span>
            )}
          </div>
          {repeatedCustomers && repeatedCustomers.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {repeatedCustomers.map((customer, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50/50 border border-emerald-100 hover:bg-emerald-50 transition-colors">
                  {customer.profilePic ? (
                    <img src={customer.profilePic} alt="" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-sm font-bold">
                      {(customer.name || customer.username || "?")[0].toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{customer.name || customer.username}</p>
                    <p className="text-xs text-slate-400">
                      {customer.totalOrders} orders · ₹{customer.totalSpent.toLocaleString("en-IN")} spent
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
                      {customer.totalOrders}x
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-slate-400 gap-2">
              <UserCheck size={24} />
              <p className="text-sm">No repeat customers yet</p>
            </div>
          )}
        </div>

        {/* All Customers List */}
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Users size={18} className="text-blue-500" />
            <h3 className="font-bold text-slate-700">All Customers</h3>
            {allCustomers && allCustomers.length > 0 && (
              <span className="ml-auto text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                {allCustomers.length} recent
              </span>
            )}
          </div>
          {allCustomers && allCustomers.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {allCustomers.map((customer, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors border border-slate-100">
                  {customer.profilePic ? (
                    <img src={customer.profilePic} alt="" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 text-sm font-bold">
                      {(customer.name || customer.username || "?")[0].toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-800 truncate">{customer.name || customer.username}</p>
                      {customer.totalOrders > 1 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold">
                          Repeat
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span>{customer.totalOrders} order{customer.totalOrders !== 1 && "s"}</span>
                      <span>·</span>
                      <span>₹{customer.avgOrderValue.toLocaleString("en-IN")} avg</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-700">₹{customer.totalSpent.toLocaleString("en-IN")}</p>
                    <div className="flex items-center gap-1 text-[10px] text-slate-400">
                      <Calendar size={10} />
                      <span>{new Date(customer.lastOrder).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-slate-400 gap-2">
              <Users size={24} />
              <p className="text-sm">No customers yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Sub-components ── */

function MetricCard({ title, value, change, icon, color, alert }) {
  const isPositive = change > 0;
  const hasChange = change !== undefined && change !== null;

  return (
    <div className={`bg-white p-5 rounded-xl border shadow-sm flex items-center gap-4 ${alert ? "border-amber-200" : "border-slate-100"}`}>
      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${color}`}>{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-400 font-bold uppercase">{title}</p>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
      </div>
      {hasChange && (
        <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${isPositive ? "text-emerald-700 bg-emerald-50" : "text-red-600 bg-red-50"}`}>
          {isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          {Math.abs(change)}%
        </div>
      )}
    </div>
  );
}

function EngagementRow({ icon, label, value, color }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <span className={color}>{icon}</span>
        <span className="text-sm text-slate-600">{label}</span>
      </div>
      <span className="text-sm font-bold text-slate-800">{value}</span>
    </div>
  );
}

function EmptyChart({ message }) {
  return (
    <div className="h-full flex items-center justify-center text-slate-400 min-h-[120px]">
      <p className="text-sm">{message}</p>
    </div>
  );
}