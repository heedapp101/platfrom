import { useState, useEffect } from "react";
import { API_ENDPOINTS } from "../../config/api";
import { 
  Package, Clock, CheckCircle, Truck, XCircle, RefreshCw,
  Eye, Phone, MapPin, User
} from "lucide-react";

const STATUS_CONFIG = {
  pending: { label: "Pending", color: "bg-amber-100 text-amber-700", icon: Clock },
  confirmed: { label: "Confirmed", color: "bg-blue-100 text-blue-700", icon: CheckCircle },
  processing: { label: "Processing", color: "bg-purple-100 text-purple-700", icon: Package },
  shipped: { label: "Shipped", color: "bg-indigo-100 text-indigo-700", icon: Truck },
  out_for_delivery: { label: "Out for Delivery", color: "bg-cyan-100 text-cyan-700", icon: Truck },
  delivered: { label: "Delivered", color: "bg-emerald-100 text-emerald-700", icon: CheckCircle },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-700", icon: XCircle },
  refund_requested: { label: "Refund Requested", color: "bg-orange-100 text-orange-700", icon: RefreshCw },
  refunded: { label: "Refunded", color: "bg-gray-100 text-gray-700", icon: RefreshCw },
};

const TABS = [
  { key: "all", label: "All Orders" },
  { key: "pending", label: "Pending" },
  { key: "confirmed", label: "Confirmed" },
  { key: "processing", label: "Processing" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
  { key: "cancelled", label: "Cancelled" },
];

export default function SellerOrders() {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updating, setUpdating] = useState(false);

  const fetchOrders = async (status = null) => {
    const token = localStorage.getItem("token");
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (status && status !== "all") params.append("status", status);
      
      const res = await fetch(`${API_ENDPOINTS.SELLER.ORDERS}?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      
      if (res.ok) {
        setOrders(data.orders || []);
        setStats(data.stats || null);
      } else {
        console.error("Failed to fetch orders:", data.message);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(activeTab);
  }, [activeTab]);

  const handleStatusUpdate = async (orderId, newStatus) => {
    const token = localStorage.getItem("token");
    try {
      setUpdating(true);
      const res = await fetch(API_ENDPOINTS.SELLER.ORDER_STATUS(orderId), {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        fetchOrders(activeTab);
        setSelectedOrder(null);
      } else {
        const data = await res.json();
        alert(data.message || "Failed to update status");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Error updating order status");
    } finally {
      setUpdating(false);
    }
  };

  const getNextStatus = (currentStatus) => {
    const flow = {
      pending: "confirmed",
      confirmed: "processing",
      processing: "shipped",
      shipped: "out_for_delivery",
      out_for_delivery: "delivered",
    };
    return flow[currentStatus];
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold text-slate-800">Orders</h1>
        <button
          onClick={() => fetchOrders(activeTab)}
          className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 flex items-center gap-1.5 text-sm"
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          <StatCard label="Total" value={stats.totalOrders} color="bg-slate-50" />
          <StatCard label="Pending" value={stats.pending} color="bg-amber-50 text-amber-700" />
          <StatCard label="Processing" value={stats.processing} color="bg-purple-50 text-purple-700" />
          <StatCard label="Shipped" value={stats.shipped} color="bg-indigo-50 text-indigo-700" />
          <StatCard label="Delivered" value={stats.delivered} color="bg-emerald-50 text-emerald-700" />
          <StatCard label="Revenue" value={`₹${((stats.totalRevenue || 0) / 1000).toFixed(1)}k`} color="bg-green-50 text-green-700" />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-2">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-3 py-1.5 rounded-lg font-medium text-xs whitespace-nowrap transition-colors ${
              activeTab === tab.key
                ? "bg-blue-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {tab.label}
            {stats && tab.key !== "all" && stats[tab.key] > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 bg-white/20 rounded-full text-[10px]">
                {stats[tab.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="text-center py-8 text-slate-500">Loading orders...</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-xl border border-slate-100">
          <Package size={40} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500 text-sm">No orders found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {orders.map((order) => (
            <OrderCard
              key={order._id}
              order={order}
              onView={() => setSelectedOrder(order)}
              onStatusUpdate={handleStatusUpdate}
              formatDate={formatDate}
              getNextStatus={getNextStatus}
            />
          ))}
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onStatusUpdate={handleStatusUpdate}
          updating={updating}
          formatDate={formatDate}
          getNextStatus={getNextStatus}
        />
      )}
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div className={`px-3 py-2.5 rounded-lg ${color} border border-slate-100`}>
      <p className="text-[10px] font-bold uppercase tracking-wide opacity-60">{label}</p>
      <p className="text-lg font-bold">{value || 0}</p>
    </div>
  );
}

function OrderCard({ order, onView, onStatusUpdate, formatDate, getNextStatus }) {
  const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
  const StatusIcon = statusConfig.icon;
  const nextStatus = getNextStatus(order.status);

  return (
    <div 
      className="bg-white rounded-lg border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all cursor-pointer"
      onClick={onView}
    >
      <div className="flex items-center gap-4 p-3">
        {/* Product Image */}
        <img
          src={order.items?.[0]?.image || order.items?.[0]?.post?.images?.[0]?.low || "/placeholder.png"}
          alt={order.items?.[0]?.title}
          className="w-12 h-12 rounded-lg object-cover bg-slate-100 flex-shrink-0"
        />
        
        {/* Main Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-slate-800 truncate text-sm">{order.items?.[0]?.title || `Order #${order.orderNumber}`}</p>
            {order.items?.length > 1 && (
              <span className="text-xs text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">+{order.items.length - 1}</span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
            <span>{order.buyer?.name?.split(' ')[0] || 'Customer'}</span>
            <span>•</span>
            <span>{order.shippingAddress?.city}</span>
            <span>•</span>
            <span>{order.paymentMethod?.toUpperCase()}</span>
          </div>
        </div>

        {/* Amount */}
        <div className="text-right flex-shrink-0">
          <p className="font-bold text-slate-800">₹{order.totalAmount}</p>
          <p className="text-[11px] text-slate-400">{formatDate(order.createdAt).split(',')[0]}</p>
        </div>

        {/* Status Badge */}
        <div className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1 flex-shrink-0 ${statusConfig.color}`}>
          <StatusIcon size={12} /> {statusConfig.label}
        </div>

        {/* Quick Action */}
        {nextStatus && (
          <button
            onClick={(e) => { e.stopPropagation(); onStatusUpdate(order._id, nextStatus); }}
            className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 flex-shrink-0 whitespace-nowrap"
          >
            {STATUS_CONFIG[nextStatus]?.label}
          </button>
        )}
        
        {/* View Arrow */}
        <Eye size={16} className="text-slate-400 flex-shrink-0" />
      </div>
    </div>
  );
}

function OrderDetailModal({ order, onClose, onStatusUpdate, updating, formatDate, getNextStatus }) {
  const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
  const nextStatus = getNextStatus(order.status);
  const StatusIcon = statusConfig.icon;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-slate-100">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold text-slate-800">Order #{order.orderNumber}</h2>
              <p className="text-sm text-slate-500 mt-1">{formatDate(order.createdAt)}</p>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
              <XCircle size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status */}
          <div>
            <h3 className="text-sm font-bold text-slate-500 uppercase mb-2">Status</h3>
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${statusConfig.color}`}>
              <StatusIcon size={18} />
              <span className="font-medium">{statusConfig.label}</span>
            </div>
          </div>

          {/* Items */}
          <div>
            <h3 className="text-sm font-bold text-slate-500 uppercase mb-3">Items</h3>
            {order.items?.map((item, idx) => (
              <div key={idx} className="flex gap-4 p-3 bg-slate-50 rounded-lg">
                <img
                  src={item.image || "/placeholder.png"}
                  alt={item.title}
                  className="w-20 h-20 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <p className="font-medium text-slate-800">{item.title}</p>
                  <p className="text-sm text-slate-500 mt-1">
                    ₹{item.price} × {item.quantity} = ₹{item.price * item.quantity}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Buyer Details */}
          <div>
            <h3 className="text-sm font-bold text-slate-500 uppercase mb-3">Customer Details</h3>
            <div className="bg-slate-50 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-3">
                <User size={18} className="text-slate-400" />
                <span className="text-slate-700">{order.buyer?.name || "N/A"}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone size={18} className="text-slate-400" />
                <span className="text-slate-700">{order.shippingAddress?.phone || order.buyer?.phone || "N/A"}</span>
              </div>
              <div className="flex items-start gap-3">
                <MapPin size={18} className="text-slate-400 mt-0.5" />
                <div className="text-slate-700">
                  <p>{order.shippingAddress?.fullName}</p>
                  <p>{order.shippingAddress?.addressLine1}</p>
                  {order.shippingAddress?.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
                  <p>
                    {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.pincode}
                  </p>
                  {order.shippingAddress?.landmark && (
                    <p className="text-sm text-slate-500">Landmark: {order.shippingAddress.landmark}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Payment Summary */}
          <div>
            <h3 className="text-sm font-bold text-slate-500 uppercase mb-3">Payment</h3>
            <div className="bg-slate-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span>₹{order.subtotal}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Shipping</span>
                <span>₹{order.shippingCharge}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-₹{order.discount}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-slate-800 pt-2 border-t border-slate-200">
                <span>Total</span>
                <span>₹{order.totalAmount}</span>
              </div>
              <div className="flex justify-between text-sm text-slate-500 pt-2">
                <span>Payment Method</span>
                <span className="uppercase">{order.paymentMethod}</span>
              </div>
              <div className="flex justify-between text-sm text-slate-500">
                <span>Payment Status</span>
                <span className={order.paymentStatus === "completed" ? "text-green-600" : "text-amber-600"}>
                  {order.paymentStatus?.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* Buyer Notes */}
          {order.buyerNotes && (
            <div>
              <h3 className="text-sm font-bold text-slate-500 uppercase mb-2">Buyer Notes</h3>
              <p className="text-slate-700 bg-amber-50 p-3 rounded-lg border border-amber-100">
                {order.buyerNotes}
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-slate-100 flex justify-between items-center">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50"
          >
            Close
          </button>
          {nextStatus && (
            <button
              onClick={() => onStatusUpdate(order._id, nextStatus)}
              disabled={updating}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {updating ? "Updating..." : `Mark as ${STATUS_CONFIG[nextStatus]?.label}`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}