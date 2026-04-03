import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  Package,
  RefreshCw,
  Search,
  Store,
  User,
} from "lucide-react";
import { API_ENDPOINTS } from "../../config/api";

const STATUS_STYLES = {
  pending: "bg-amber-100 text-amber-700",
  confirmed: "bg-blue-100 text-blue-700",
  processing: "bg-violet-100 text-violet-700",
  shipping_initiated: "bg-sky-100 text-sky-700",
  shipped: "bg-cyan-100 text-cyan-700",
  out_for_delivery: "bg-teal-100 text-teal-700",
  delivered: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-rose-100 text-rose-700",
  disputed: "bg-red-100 text-red-700",
  refund_requested: "bg-orange-100 text-orange-700",
  refunded: "bg-slate-100 text-slate-700",
};

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "shipping_initiated,shipped,out_for_delivery", label: "Shipping" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled,disputed,refund_requested,refunded", label: "Cancelled / Disputes" },
];

const getOrderIdentifier = (order) => String(order?.id || order?._id || "").trim();
const getOrderLabel = (order) =>
  String(order?.displayId || order?.orderNumber || getOrderIdentifier(order)).trim();

const getUserLabel = (user, fallback) =>
  user?.companyName || user?.name || user?.username || fallback;

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "-";

const formatDateTime = (value) =>
  value
    ? new Date(value).toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "-";

const formatCurrency = (amount) => `₹${Number(amount || 0).toLocaleString("en-IN")}`;

export default function AdminOrders() {
  const navigate = useNavigate();
  const { orderId } = useParams();

  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const token = useMemo(() => localStorage.getItem("token"), []);

  const fetchOrders = useCallback(
    async (page = 1, silent = false) => {
      if (!token || orderId) return;

      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(pagination.limit || 20),
        });
        if (statusFilter && statusFilter !== "all") params.set("status", statusFilter);
        if (search.trim()) params.set("search", search.trim());

        const res = await fetch(API_ENDPOINTS.ADMIN.ORDERS(`?${params.toString()}`), {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();

        if (res.ok) {
          setOrders(Array.isArray(data.orders) ? data.orders : []);
          setPagination(data.pagination || { page: 1, limit: 20, total: 0, pages: 1 });
        }
      } catch (error) {
        console.error("Failed to fetch admin orders", error);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [orderId, pagination.limit, search, statusFilter, token]
  );

  const fetchOrderDetails = useCallback(async () => {
    if (!token || !orderId) return;

    setDetailLoading(true);
    try {
      const res = await fetch(API_ENDPOINTS.ADMIN.ORDER_DETAILS(orderId), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (res.ok) {
        setSelectedOrder(data);
      } else {
        setSelectedOrder(null);
      }
    } catch (error) {
      console.error("Failed to fetch admin order details", error);
      setSelectedOrder(null);
    } finally {
      setDetailLoading(false);
    }
  }, [orderId, token]);

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    } else {
      fetchOrders(1);
    }
  }, [fetchOrderDetails, fetchOrders, orderId]);

  if (orderId) {
    const order = selectedOrder;
    const statusClass = STATUS_STYLES[order?.status] || "bg-slate-100 text-slate-700";

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/admin/orders")}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              <ArrowLeft size={16} />
              Back
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Order Details</h1>
              <p className="text-sm text-slate-500">Marketplace-wide order inspection</p>
            </div>
          </div>
          <button
            onClick={fetchOrderDetails}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>

        {detailLoading ? (
          <div className="rounded-2xl border border-slate-100 bg-white p-12 text-center text-slate-500">
            Loading order details...
          </div>
        ) : !order ? (
          <div className="rounded-2xl border border-slate-100 bg-white p-12 text-center text-slate-500">
            Order not found.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm lg:col-span-2">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Order ID</p>
                    <h2 className="mt-1 text-xl font-bold text-slate-800">{getOrderLabel(order)}</h2>
                    <p className="mt-2 text-sm text-slate-500">Placed {formatDateTime(order.createdAt)}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${statusClass}`}>
                    {String(order.status || "").replace(/_/g, " ")}
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Order Total</p>
                <p className="mt-2 text-2xl font-bold text-slate-800">{formatCurrency(order.totalAmount)}</p>
                <div className="mt-4 space-y-2 text-sm text-slate-500">
                  <p>Payment: <span className="font-semibold text-slate-700 uppercase">{order.paymentMethod}</span></p>
                  <p>Status: <span className="font-semibold text-slate-700 uppercase">{order.paymentStatus}</span></p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <EntityCard
                icon={<User size={16} />}
                title="Buyer"
                name={getUserLabel(order.buyer, "Buyer")}
                subtitle={order.buyer?.email || order.buyer?.username || "-"}
                lines={[
                  order.buyer?.phone || order.shippingAddress?.phone || "-",
                  order.shippingAddress
                    ? `${order.shippingAddress.addressLine1}${order.shippingAddress.addressLine2 ? `, ${order.shippingAddress.addressLine2}` : ""}`
                    : "-",
                  order.shippingAddress
                    ? `${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}`
                    : "-",
                ]}
              />
              <EntityCard
                icon={<Store size={16} />}
                title="Seller"
                name={getUserLabel(order.seller, "Seller")}
                subtitle={order.seller?.email || order.seller?.username || "-"}
                lines={[
                  order.seller?.phone || "-",
                  order.seller?.companyName || "-",
                  order.seller?.address || "-",
                ]}
              />
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-4">
                <h3 className="text-lg font-bold text-slate-800">Items</h3>
              </div>
              <div className="divide-y divide-slate-100">
                {(order.items || []).map((item, index) => (
                  <div key={`${getOrderIdentifier(order)}-${index}`} className="flex gap-4 px-5 py-4">
                    <img
                      src={item.image || item.post?.images?.[0]?.low || "/placeholder.png"}
                      alt=""
                      className="h-16 w-16 rounded-xl object-cover bg-slate-100"
                    />
                    <div className="flex-1">
                      <p className="font-semibold text-slate-800">{item.productName || item.title}</p>
                      <div className="mt-1 flex flex-wrap gap-4 text-sm text-slate-500">
                        <span>Size: {item.selectedSize || "-"}</span>
                        <span>Qty: {item.quantity || 1}</span>
                        <span>Price: {formatCurrency(item.price)}</span>
                        <span>Shipping: {formatCurrency(item.shipping)}</span>
                        <span>Total: {formatCurrency(item.total)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800">Price Breakdown</h3>
                <div className="mt-4 space-y-3 text-sm">
                  <PriceRow label="Subtotal" value={formatCurrency(order.subtotal)} />
                  <PriceRow label="Shipping" value={formatCurrency(order.shippingCharge)} />
                  <PriceRow label="Discount" value={`-${formatCurrency(order.discount || 0)}`} tone={order.discount ? "text-green-600" : "text-slate-500"} />
                  <PriceRow label="Total" value={formatCurrency(order.totalAmount)} strong />
                </div>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800">Shipping & Notes</h3>
                <div className="mt-4 space-y-3 text-sm text-slate-600">
                  <p>Tracking Number: <span className="font-semibold text-slate-800">{order.trackingNumber || "-"}</span></p>
                  <p>Carrier: <span className="font-semibold text-slate-800">{order.shippingCarrier || "-"}</span></p>
                  <p>Estimated Delivery: <span className="font-semibold text-slate-800">{formatDate(order.estimatedDelivery)}</span></p>
                  <p>Buyer Notes: <span className="font-semibold text-slate-800">{order.buyerNotes || "-"}</span></p>
                  <p>Seller Notes: <span className="font-semibold text-slate-800">{order.sellerNotes || "-"}</span></p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Orders</h1>
          <p className="text-sm text-slate-500">All marketplace orders across buyers and sellers</p>
        </div>
        <button
          onClick={() => fetchOrders(pagination.page || 1, true)}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
        >
          <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      <div className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:max-w-sm">
          <Search className="absolute left-3 top-3 text-slate-400" size={16} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order ID, buyer, seller"
            className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm focus:border-blue-400 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <CalendarDays className="absolute left-3 top-3 text-slate-400" size={16} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-8 text-sm focus:border-blue-400 focus:outline-none"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => fetchOrders(1)}
            className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Apply
          </button>
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-slate-100 bg-white p-12 text-center text-slate-500">
          Loading orders...
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-4">Order ID</th>
                <th className="px-5 py-4">Date</th>
                <th className="px-5 py-4">Buyer</th>
                <th className="px-5 py-4">Seller</th>
                <th className="px-5 py-4 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map((order) => (
                <tr
                  key={getOrderIdentifier(order)}
                  onClick={() => navigate(`/admin/orders/${getOrderIdentifier(order)}`)}
                  className="cursor-pointer transition-colors hover:bg-slate-50"
                >
                  <td className="px-5 py-4">
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-800">{getOrderLabel(order)}</span>
                      <span className={`mt-1 inline-flex w-fit rounded-full px-2 py-1 text-[11px] font-bold ${STATUS_STYLES[order.status] || "bg-slate-100 text-slate-700"}`}>
                        {String(order.status || "").replace(/_/g, " ")}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-500">{formatDate(order.createdAt)}</td>
                  <td className="px-5 py-4 text-sm text-slate-700">{getUserLabel(order.buyer, "Buyer")}</td>
                  <td className="px-5 py-4 text-sm text-slate-700">{getUserLabel(order.seller, "Seller")}</td>
                  <td className="px-5 py-4 text-right text-sm font-semibold text-slate-800">{formatCurrency(order.totalAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {orders.length === 0 && (
            <div className="p-12 text-center text-slate-500">
              <Package className="mx-auto mb-3 text-slate-300" size={24} />
              No orders found for the current filters.
            </div>
          )}
        </div>
      )}

      {!loading && orders.length > 0 && (
        <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">
          <p>
            Showing page {pagination.page} of {Math.max(1, pagination.pages)}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => fetchOrders(Math.max(1, pagination.page - 1))}
              disabled={pagination.page <= 1}
              className="rounded-lg border border-slate-200 px-3 py-1.5 font-medium text-slate-600 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => fetchOrders(Math.min(pagination.pages, pagination.page + 1))}
              disabled={pagination.page >= pagination.pages}
              className="rounded-lg border border-slate-200 px-3 py-1.5 font-medium text-slate-600 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function EntityCard({ icon, title, name, subtitle, lines }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-400">
        {icon}
        {title}
      </div>
      <p className="mt-3 text-lg font-bold text-slate-800">{name}</p>
      <p className="text-sm text-slate-500">{subtitle}</p>
      <div className="mt-4 space-y-2 text-sm text-slate-600">
        {lines.filter(Boolean).map((line, index) => (
          <p key={`${title}-${index}`}>{line}</p>
        ))}
      </div>
    </div>
  );
}

function PriceRow({ label, value, strong = false, tone = "text-slate-600" }) {
  return (
    <div className={`flex items-center justify-between ${strong ? "border-t border-slate-100 pt-3 text-base font-bold text-slate-800" : `text-sm ${tone}`}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
