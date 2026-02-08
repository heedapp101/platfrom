import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, Eye, MousePointer, DollarSign, Calendar, X, Image, ExternalLink, ToggleLeft, ToggleRight } from "lucide-react";
import { API_BASE_URL } from "../../config/api";

export default function AdminAds() {
  const [ads, setAds] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAd, setEditingAd] = useState(null);
  const [activeTab, setActiveTab] = useState("all"); // all, in-feed, banner
  const [imagePreview, setImagePreview] = useState(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    linkUrl: "",
    type: "in-feed",
    startDate: "",
    endDate: "",
    payment: {
      amount: "",
      currency: "INR",
      method: "manual",
      status: "pending",
      transactionId: ""
    },
    advertiser: {
      name: "",
      email: "",
      company: "",
      phone: ""
    }
  });
  const [imageFile, setImageFile] = useState(null);

  useEffect(() => {
    fetchAds();
  }, []);

  const fetchAds = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_BASE_URL}/ads`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setAds(data.ads);
        setStats(data.stats);
      }
    } catch (err) {
      console.error("Failed to fetch ads:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    const formPayload = new FormData();
    formPayload.append("title", formData.title);
    formPayload.append("description", formData.description);
    formPayload.append("linkUrl", formData.linkUrl);
    formPayload.append("type", formData.type);
    formPayload.append("startDate", formData.startDate);
    formPayload.append("endDate", formData.endDate);
    formPayload.append("payment", JSON.stringify(formData.payment));
    formPayload.append("advertiser", JSON.stringify(formData.advertiser));
    
    if (imageFile) {
      formPayload.append("image", imageFile);
    } else if (editingAd?.imageUrl) {
      formPayload.append("imageUrl", editingAd.imageUrl);
    }

    try {
      const url = editingAd 
        ? `${API_BASE_URL}/ads/${editingAd._id}`
        : `${API_BASE_URL}/ads`;
      
      const res = await fetch(url, {
        method: editingAd ? "PUT" : "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formPayload
      });

      if (res.ok) {
        fetchAds();
        resetForm();
      }
    } catch (err) {
      console.error("Failed to save ad:", err);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this ad?")) return;
    
    const token = localStorage.getItem("token");
    try {
      await fetch(`${API_BASE_URL}/ads/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchAds();
    } catch (err) {
      console.error("Failed to delete ad:", err);
    }
  };

  const handleToggleStatus = async (id) => {
    const token = localStorage.getItem("token");
    try {
      await fetch(`${API_BASE_URL}/ads/${id}/toggle`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchAds();
    } catch (err) {
      console.error("Failed to toggle ad status:", err);
    }
  };

  const handlePaymentUpdate = async (id, status) => {
    const token = localStorage.getItem("token");
    try {
      await fetch(`${API_BASE_URL}/ads/${id}/payment`, {
        method: "PATCH",
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status })
      });
      fetchAds();
    } catch (err) {
      console.error("Failed to update payment:", err);
    }
  };

  const openEditModal = (ad) => {
    setEditingAd(ad);
    setFormData({
      title: ad.title,
      description: ad.description || "",
      linkUrl: ad.linkUrl,
      type: ad.type,
      startDate: ad.startDate?.split("T")[0] || "",
      endDate: ad.endDate?.split("T")[0] || "",
      payment: ad.payment || { amount: "", currency: "INR", method: "manual", status: "pending", transactionId: "" },
      advertiser: ad.advertiser || { name: "", email: "", company: "", phone: "" }
    });
    setImagePreview(ad.imageUrl);
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      linkUrl: "",
      type: "in-feed",
      startDate: "",
      endDate: "",
      payment: { amount: "", currency: "INR", method: "manual", status: "pending", transactionId: "" },
      advertiser: { name: "", email: "", company: "", phone: "" }
    });
    setEditingAd(null);
    setImageFile(null);
    setImagePreview(null);
    setShowModal(false);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const filteredAds = activeTab === "all" 
    ? ads 
    : ads.filter(ad => ad.type === activeTab);

  const isAdActive = (ad) => {
    const now = new Date();
    return ad.isActive && new Date(ad.startDate) <= now && new Date(ad.endDate) >= now;
  };

  if (loading) return <div className="p-8 text-slate-500">Loading Ads...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Ads Management</h1>
          <p className="text-slate-500 text-sm">Create and manage in-feed and banner advertisements</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} /> Create Ad
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard title="Total Ads" value={stats?.total || 0} icon={<Image size={20} />} color="bg-blue-50 text-blue-600" />
        <StatCard title="Active Ads" value={stats?.active || 0} icon={<ToggleRight size={20} />} color="bg-green-50 text-green-600" />
        <StatCard title="Total Impressions" value={stats?.totalImpressions?.toLocaleString() || 0} icon={<Eye size={20} />} color="bg-purple-50 text-purple-600" />
        <StatCard title="Total Clicks" value={stats?.totalClicks?.toLocaleString() || 0} icon={<MousePointer size={20} />} color="bg-amber-50 text-amber-600" />
        <StatCard title="Total Revenue" value={`₹${stats?.totalRevenue?.toLocaleString() || 0}`} icon={<DollarSign size={20} />} color="bg-emerald-50 text-emerald-600" />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        {[
          { id: "all", label: "All Ads", count: ads.length },
          { id: "in-feed", label: "In-Feed Ads", count: stats?.inFeed || 0 },
          { id: "banner", label: "Banner Ads", count: stats?.banner || 0 }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id 
                ? "border-blue-600 text-blue-600" 
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Ads Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredAds.map(ad => (
          <AdCard 
            key={ad._id} 
            ad={ad} 
            isActive={isAdActive(ad)}
            onEdit={() => openEditModal(ad)}
            onDelete={() => handleDelete(ad._id)}
            onToggle={() => handleToggleStatus(ad._id)}
            onPaymentUpdate={(status) => handlePaymentUpdate(ad._id, status)}
          />
        ))}
      </div>

      {filteredAds.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-100">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Image size={32} className="text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-700">No ads found</h3>
          <p className="text-slate-500 text-sm">Create your first ad to get started</p>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">
                {editingAd ? "Edit Ad" : "Create New Ad"}
              </h2>
              <button onClick={resetForm} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="font-bold text-slate-700 border-b pb-2">Ad Details</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-600 mb-1">Ad Title *</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-600 mb-1">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={2}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Ad Type *</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="in-feed">In-Feed Ad</option>
                      <option value="banner">Banner Ad</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Link URL <span className="text-slate-400 font-normal">(optional)</span></label>
                    <input
                      type="url"
                      value={formData.linkUrl}
                      onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="https://... (leave empty if no external link)"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Start Date *</label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">End Date *</label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Ad Image *</label>
                  <div className="border-2 border-dashed border-slate-200 rounded-lg p-4 text-center">
                    {imagePreview ? (
                      <div className="relative">
                        <img src={imagePreview} alt="Preview" className="max-h-40 mx-auto rounded-lg" />
                        <button
                          type="button"
                          onClick={() => { setImageFile(null); setImagePreview(null); }}
                          className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer">
                        <div className="py-4">
                          <Image size={32} className="mx-auto text-slate-400 mb-2" />
                          <p className="text-sm text-slate-500">Click to upload image</p>
                        </div>
                        <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                      </label>
                    )}
                  </div>
                </div>
              </div>

              {/* Advertiser Info */}
              <div className="space-y-4">
                <h3 className="font-bold text-slate-700 border-b pb-2">Advertiser Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Name *</label>
                    <input
                      type="text"
                      value={formData.advertiser.name}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        advertiser: { ...formData.advertiser, name: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Email *</label>
                    <input
                      type="email"
                      value={formData.advertiser.email}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        advertiser: { ...formData.advertiser, email: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Company</label>
                    <input
                      type="text"
                      value={formData.advertiser.company}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        advertiser: { ...formData.advertiser, company: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={formData.advertiser.phone}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        advertiser: { ...formData.advertiser, phone: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Info */}
              <div className="space-y-4">
                <h3 className="font-bold text-slate-700 border-b pb-2">Payment Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Amount (₹) *</label>
                    <input
                      type="number"
                      value={formData.payment.amount}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        payment: { ...formData.payment, amount: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Payment Method</label>
                    <select
                      value={formData.payment.method}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        payment: { ...formData.payment, method: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="manual">Manual</option>
                      <option value="upi">UPI</option>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="card">Card</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Payment Status</label>
                    <select
                      value={formData.payment.status}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        payment: { ...formData.payment, status: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="pending">Pending</option>
                      <option value="paid">Paid</option>
                      <option value="refunded">Refunded</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Transaction ID</label>
                    <input
                      type="text"
                      value={formData.payment.transactionId}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        payment: { ...formData.payment, transactionId: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingAd ? "Update Ad" : "Create Ad"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Stats Card Component
function StatCard({ title, value, icon, color }) {
  return (
    <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-slate-400 font-medium uppercase">{title}</p>
        <p className="text-xl font-bold text-slate-800">{value}</p>
      </div>
    </div>
  );
}

// Ad Card Component
function AdCard({ ad, isActive, onEdit, onDelete, onToggle, onPaymentUpdate }) {
  const daysLeft = ad.endDate 
    ? Math.max(0, Math.ceil((new Date(ad.endDate) - new Date()) / (1000 * 60 * 60 * 24)))
    : 0;

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="flex">
        {/* Image */}
        <div className="w-32 h-32 bg-slate-100 flex-shrink-0">
          <img 
            src={ad.imageUrl} 
            alt={ad.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Content */}
        <div className="flex-1 p-4">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="font-bold text-slate-800">{ad.title}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                  ad.type === "banner" 
                    ? "bg-purple-100 text-purple-700" 
                    : "bg-blue-100 text-blue-700"
                }`}>
                  {ad.type === "banner" ? "Banner" : "In-Feed"}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                  isActive 
                    ? "bg-green-100 text-green-700" 
                    : "bg-slate-100 text-slate-600"
                }`}>
                  {isActive ? "Active" : "Inactive"}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                  ad.payment?.status === "paid" 
                    ? "bg-emerald-100 text-emerald-700"
                    : ad.payment?.status === "refunded"
                    ? "bg-red-100 text-red-700"
                    : "bg-amber-100 text-amber-700"
                }`}>
                  {ad.payment?.status?.toUpperCase() || "PENDING"}
                </span>
              </div>
            </div>
            <div className="flex gap-1">
              <button onClick={onToggle} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded">
                {ad.isActive ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
              </button>
              <button onClick={onEdit} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded">
                <Edit2 size={16} />
              </button>
              <button onClick={onDelete} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded">
                <Trash2 size={16} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs mt-3">
            <div>
              <p className="text-slate-400">Impressions</p>
              <p className="font-bold text-slate-700">{ad.impressions?.toLocaleString() || 0}</p>
            </div>
            <div>
              <p className="text-slate-400">Clicks</p>
              <p className="font-bold text-slate-700">{ad.clicks?.toLocaleString() || 0}</p>
            </div>
            <div>
              <p className="text-slate-400">Days Left</p>
              <p className={`font-bold ${daysLeft > 3 ? "text-slate-700" : daysLeft > 0 ? "text-amber-600" : "text-red-600"}`}>
                {daysLeft > 0 ? daysLeft : "Expired"}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
            <div className="text-xs text-slate-500">
              <span className="font-medium">{ad.advertiser?.company || ad.advertiser?.name}</span>
              <span className="mx-1">•</span>
              <span>₹{ad.payment?.amount?.toLocaleString() || 0}</span>
            </div>
            <a 
              href={ad.linkUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:underline flex items-center gap-1"
            >
              <ExternalLink size={12} /> View Link
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
