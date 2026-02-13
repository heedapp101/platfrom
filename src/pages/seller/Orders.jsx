import { useState, useEffect } from "react";
import { API_ENDPOINTS } from "../../config/api";
import {
  Package, Clock, CheckCircle, Truck, XCircle, RefreshCw,
  Eye, Phone, MapPin, User, ChevronRight, X, Link2, Hash,
  CreditCard, ShoppingBag, Ban, ArrowRight
} from "lucide-react";

const STATUS_CONFIG = {
  pending: { label: "Pending", color: "bg-amber-100 text-amber-700", dot: "bg-amber-500", icon: Clock },
  confirmed: { label: "Confirmed", color: "bg-blue-100 text-blue-700", dot: "bg-blue-500", icon: CheckCircle },
  processing: { label: "Processing", color: "bg-purple-100 text-purple-700", dot: "bg-purple-500", icon: Package },
  shipped: { label: "Shipped", color: "bg-cyan-100 text-cyan-700", dot: "bg-cyan-500", icon: Truck },
  out_for_delivery: { label: "Out for Delivery", color: "bg-teal-100 text-teal-700", dot: "bg-teal-500", icon: Truck },
  delivered: { label: "Delivered", color: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500", icon: CheckCircle },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-700", dot: "bg-red-500", icon: XCircle },
  refund_requested: { label: "Refund Requested", color: "bg-orange-100 text-orange-700", dot: "bg-orange-500", icon: RefreshCw },
  refunded: { label: "Refunded", color: "bg-gray-100 text-gray-600", dot: "bg-gray-500", icon: RefreshCw },
};

const TABS = [
  { key: "orders", label: "Orders", statuses: "pending,confirmed,processing", statusKeys: ["pending", "confirmed", "processing"], icon: ShoppingBag },
  { key: "shipping", label: "Shipping", statuses: "shipped,out_for_delivery", statusKeys: ["shipped"], icon: Truck },
  { key: "delivered", label: "Delivered", statuses: "delivered", statusKeys: ["delivered"], icon: CheckCircle },
  { key: "cancelled", label: "Cancelled", statuses: "cancelled,refund_requested,refunded", statusKeys: ["cancelled"], icon: Ban },
];

const STATUS_ACTIONS = {
  pending: [
    { next: "processing", label: "Process Order", color: "bg-purple-600 hover:bg-purple-700 text-white" },
    { next: "cancelled", label: "Cancel & Refund", color: "bg-white border border-red-200 text-red-600 hover:bg-red-50" },
  ],
  confirmed: [
    { next: "processing", label: "Start Processing", color: "bg-purple-600 hover:bg-purple-700 text-white" },
  ],
  processing: [
    { next: "shipped", label: "Ship Order", color: "bg-cyan-600 hover:bg-cyan-700 text-white", needsModal: true },
  ],
  shipped: [
    { next: "delivered", label: "Mark Delivered", color: "bg-emerald-600 hover:bg-emerald-700 text-white" },
  ],
  out_for_delivery: [
    { next: "delivered", label: "Mark Delivered", color: "bg-emerald-600 hover:bg-emerald-700 text-white" },
  ],
  delivered: [],
  cancelled: [],
  refund_requested: [
    { next: "refunded", label: "Process Refund", color: "bg-orange-600 hover:bg-orange-700 text-white" },
  ],
  refunded: [],
};

export default function SellerOrders() {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("orders");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updating, setUpdating] = useState(null); // orderId being updated

  // Shipping modal
  const [shipModalOrder, setShipModalOrder] = useState(null);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [shippingCarrier, setShippingCarrier] = useState("");
  const [trackingLink, setTrackingLink] = useState("");

  const currentTab = TABS.find((t) => t.key === activeTab);

  const fetchOrders = async () => {
    const token = localStorage.getItem("token");
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append("status", currentTab.statuses);

      const res = await fetch(`${API_ENDPOINTS.SELLER.ORDERS}?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setOrders(data.orders || []);
        setStats(data.stats || null);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [activeTab]);

  const handleStatusUpdate = async (orderId, newStatus, extraData = {}) => {
    const token = localStorage.getItem("token");
    try {
      setUpdating(orderId);
      const res = await fetch(API_ENDPOINTS.SELLER.ORDER_STATUS(orderId), {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus, ...extraData }),
      });
      if (res.ok) {
        fetchOrders();
        setSelectedOrder(null);
      } else {
        const data = await res.json();
        alert(data.message || "Failed to update status");
      }
    } catch (error) {
      alert("Error updating order status");
    } finally {
      setUpdating(null);
    }
  };

  const handleShipOrder = async () => {
    if (!shipModalOrder) return;
    const extra = {};
    if (trackingNumber) {
      extra.trackingNumber = trackingNumber;
      extra.shippingCarrier = shippingCarrier || "Standard Shipping";
      if (trackingLink) extra.trackingLink = trackingLink;
    }
    await handleStatusUpdate(shipModalOrder._id, "shipped", extra);
    setShipModalOrder(null);
    setTrackingNumber("");
    setShippingCarrier("");
    setTrackingLink("");
  };

  const handleAction = (order, action) => {
    if (action.needsModal) {
      setShipModalOrder(order);
    } else {
      handleStatusUpdate(order._id, action.next);
    }
  };

  const getTabCount = (tab) => {
    if (!stats) return 0;
    return tab.statusKeys.reduce((sum, key) => sum + (stats[key] || 0), 0);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatDateTime = (date) => {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Orders</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage and track your customer orders</p>
        </div>
        <button
          onClick={fetchOrders}
          className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 flex items-center gap-2 text-sm font-medium shadow-sm transition-colors"
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Summary Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                <ShoppingBag size={18} className="text-slate-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{stats.totalOrders}</p>
                <p className="text-xs text-slate-500 font-medium">Total Orders</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                <Clock size={18} className="text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
                <p className="text-xs text-slate-500 font-medium">Pending</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                <CheckCircle size={18} className="text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-600">{stats.delivered}</p>
                <p className="text-xs text-slate-500 font-medium">Delivered</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                <CreditCard size={18} className="text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">₹{((stats.totalRevenue || 0) / 1000).toFixed(1)}k</p>
                <p className="text-xs text-slate-500 font-medium">Revenue</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Bar */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-1.5 flex gap-1">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          const count = getTabCount(tab);
          const TabIcon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-medium text-sm transition-all ${
                isActive
                  ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
              }`}
            >
              <TabIcon size={16} />
              <span>{tab.label}</span>
              {count > 0 && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold min-w-[20px] text-center ${
                    isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Loading orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Package size={28} className="text-slate-400" />
          </div>
          <p className="text-slate-700 font-semibold">No {currentTab.label.toLowerCase()} orders</p>
          <p className="text-slate-400 text-sm mt-1">
            {activeTab === "orders"
              ? "New customer orders will appear here"
              : activeTab === "shipping"
              ? "Shipped orders will be listed here"
              : activeTab === "delivered"
              ? "Completed deliveries show here"
              : "Cancelled or refunded orders appear here"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <OrderCard
              key={order._id}
              order={order}
              onView={() => setSelectedOrder(order)}
              onAction={(action) => handleAction(order, action)}
              updating={updating}
              formatDate={formatDate}
            />
          ))}
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onAction={(action) => handleAction(selectedOrder, action)}
          updating={updating}
          formatDateTime={formatDateTime}
        />
      )}

      {/* Ship Order Modal */}
      {shipModalOrder && (
        <ShipModal
          order={shipModalOrder}
          onClose={() => {
            setShipModalOrder(null);
            setTrackingNumber("");
            setShippingCarrier("");
            setTrackingLink("");
          }}
          onShip={handleShipOrder}
          updating={updating === shipModalOrder._id}
          trackingNumber={trackingNumber}
          setTrackingNumber={setTrackingNumber}
          shippingCarrier={shippingCarrier}
          setShippingCarrier={setShippingCarrier}
          trackingLink={trackingLink}
          setTrackingLink={setTrackingLink}
        />
      )}
    </div>
  );
}

/* ───────── Order Card ───────── */
function OrderCard({ order, onView, onAction, updating, formatDate }) {
  const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
  const StatusIcon = statusConfig.icon;
  const actions = STATUS_ACTIONS[order.status] || [];
  const isUpdating = updating === order._id;

  return (
    <div
      className="bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 transition-all cursor-pointer group"
      onClick={onView}
    >
      <div className="flex items-stretch">
        {/* Color strip */}
        <div className={`w-1 rounded-l-xl ${statusConfig.dot}`} />

        <div className="flex-1 p-4">
          {/* Top row: order number, status, amount */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-slate-800 tracking-wide">
                #{order.orderNumber?.slice(-6).toUpperCase()}
              </span>
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${statusConfig.color}`}>
                <StatusIcon size={12} />
                {statusConfig.label}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-lg font-bold text-slate-800">₹{order.totalAmount?.toLocaleString()}</span>
              <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
            </div>
          </div>

          {/* Product info row */}
          <div className="flex items-center gap-3">
            <img
              src={order.items?.[0]?.image || order.items?.[0]?.post?.images?.[0]?.low || "/placeholder.png"}
              alt=""
              className="w-11 h-11 rounded-lg object-cover bg-slate-100 flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-700 truncate">
                {order.items?.[0]?.title || "Product"}
                {order.items?.length > 1 && (
                  <span className="text-slate-400 ml-1">+{order.items.length - 1} more</span>
                )}
              </p>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <User size={11} /> {order.buyer?.name?.split(" ")[0] || "Customer"}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <MapPin size={11} /> {order.shippingAddress?.city || "N/A"}
                </span>
                <span>•</span>
                <span>{order.paymentMethod === "cod" ? "COD" : "Paid"}</span>
                <span>•</span>
                <span>{formatDate(order.createdAt)}</span>
              </div>
            </div>

            {/* Action buttons */}
            {actions.length > 0 && (
              <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                {actions.map((action, idx) => (
                  <button
                    key={idx}
                    onClick={() => onAction(action)}
                    disabled={isUpdating}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 ${action.color}`}
                  >
                    {isUpdating ? "..." : action.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────── Order Detail Modal ───────── */
function OrderDetailModal({ order, onClose, onAction, updating, formatDateTime }) {
  const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
  const StatusIcon = statusConfig.icon;
  const actions = STATUS_ACTIONS[order.status] || [];
  const isUpdating = updating === order._id;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-slate-800">Order #{order.orderNumber}</h2>
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${statusConfig.color}`}>
                <StatusIcon size={12} />
                {statusConfig.label}
              </div>
            </div>
            <p className="text-sm text-slate-400 mt-1">{formatDateTime(order.createdAt)}</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-180px)]">
          <div className="p-6 space-y-6">
            {/* Items */}
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Items</h3>
              <div className="space-y-2">
                {order.items?.map((item, idx) => (
                  <div key={idx} className="flex gap-3 p-3 bg-slate-50 rounded-xl">
                    <img src={item.image || "/placeholder.png"} alt="" className="w-16 h-16 rounded-lg object-cover" />
                    <div className="flex-1">
                      <p className="font-medium text-slate-800 text-sm">{item.title}</p>
                      {item.selectedSize && (
                        <p className="text-xs text-slate-500 mt-0.5">Size: {item.selectedSize}</p>
                      )}
                      <p className="text-sm text-slate-500 mt-1">
                        ₹{item.price} × {item.quantity} = <span className="font-semibold text-slate-700">₹{item.price * item.quantity}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Customer */}
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Customer</h3>
              <div className="bg-slate-50 rounded-xl p-4 space-y-2.5">
                <div className="flex items-center gap-2.5 text-sm">
                  <User size={15} className="text-slate-400" />
                  <span className="text-slate-700 font-medium">{order.buyer?.name || "N/A"}</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm">
                  <Phone size={15} className="text-slate-400" />
                  <span className="text-slate-700">{order.shippingAddress?.phone || order.buyer?.phone || "N/A"}</span>
                </div>
                <div className="flex items-start gap-2.5 text-sm">
                  <MapPin size={15} className="text-slate-400 mt-0.5" />
                  <div className="text-slate-700">
                    <p>{order.shippingAddress?.fullName}</p>
                    <p>{order.shippingAddress?.addressLine1}</p>
                    {order.shippingAddress?.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
                    <p>{order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.pincode}</p>
                    {order.shippingAddress?.landmark && <p className="text-slate-400">Landmark: {order.shippingAddress.landmark}</p>}
                  </div>
                </div>
              </div>
            </div>

            {/* Tracking info */}
            {order.trackingNumber && (
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Tracking</h3>
                <div className="bg-cyan-50 rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2.5 text-sm">
                    <Hash size={15} className="text-cyan-600" />
                    <span className="text-slate-700 font-mono font-medium">{order.trackingNumber}</span>
                    {order.shippingCarrier && <span className="text-slate-400">({order.shippingCarrier})</span>}
                  </div>
                  {order.trackingLink && (
                    <div className="flex items-center gap-2.5 text-sm">
                      <Link2 size={15} className="text-cyan-600" />
                      <a href={order.trackingLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate">
                        {order.trackingLink}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Payment */}
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Payment</h3>
              <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-sm">
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
                <div className="flex justify-between text-slate-400 pt-1">
                  <span>Method</span>
                  <span className="uppercase font-medium">{order.paymentMethod}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Status</span>
                  <span className={`font-medium ${order.paymentStatus === "completed" ? "text-emerald-600" : "text-amber-600"}`}>
                    {order.paymentStatus?.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            {order.buyerNotes && (
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Buyer Notes</h3>
                <p className="text-sm text-slate-700 bg-amber-50 p-3 rounded-xl border border-amber-100">
                  {order.buyerNotes}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-slate-100 flex justify-between items-center bg-slate-50/50">
          <button onClick={onClose} className="px-5 py-2 text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors">
            Close
          </button>
          {actions.length > 0 && (
            <div className="flex gap-2">
              {actions.map((action, idx) => (
                <button
                  key={idx}
                  onClick={() => onAction(action)}
                  disabled={isUpdating}
                  className={`px-5 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 flex items-center gap-2 ${action.color}`}
                >
                  {isUpdating ? "Updating..." : action.label}
                  <ArrowRight size={14} />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ───────── Ship Modal ───────── */
function ShipModal({
  order, onClose, onShip, updating,
  trackingNumber, setTrackingNumber,
  shippingCarrier, setShippingCarrier,
  trackingLink, setTrackingLink,
}) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl max-w-md w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Ship Order</h2>
            <p className="text-sm text-slate-400 mt-0.5">
              #{order.orderNumber?.slice(-6).toUpperCase()} • ₹{order.totalAmount}
            </p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Product preview */}
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
            <img
              src={order.items?.[0]?.image || "/placeholder.png"}
              alt=""
              className="w-10 h-10 rounded-lg object-cover"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-700 truncate">{order.items?.[0]?.title}</p>
              <p className="text-xs text-slate-400">{order.buyer?.name} • {order.shippingAddress?.city}</p>
            </div>
          </div>

          {/* Inputs */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Tracking Number</label>
            <input
              type="text"
              placeholder="Enter tracking number"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Shipping Carrier</label>
            <input
              type="text"
              placeholder="e.g., BlueDart, Delhivery"
              value={shippingCarrier}
              onChange={(e) => setShippingCarrier(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Tracking Link</label>
            <input
              type="url"
              placeholder="https://track.example.com/..."
              value={trackingLink}
              onChange={(e) => setTrackingLink(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-50 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onShip}
            disabled={updating}
            className="px-6 py-2.5 bg-cyan-600 text-white rounded-xl text-sm font-semibold hover:bg-cyan-700 disabled:opacity-50 flex items-center gap-2 transition-colors"
          >
            {updating ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Shipping...
              </>
            ) : (
              <>
                <Truck size={16} /> Mark as Shipped
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}