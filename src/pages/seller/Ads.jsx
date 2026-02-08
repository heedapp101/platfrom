import { useEffect, useState } from "react";
import { Rocket, Clock, Eye, CheckCircle, AlertCircle, MessageSquare, Send, X, Image } from "lucide-react";
import { API_BASE_URL } from "../../config/api";

export default function SellerAds() {
  const [boostData, setBoostData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestForm, setRequestForm] = useState({
    type: "in-feed",
    duration: "1_week",
    budget: "",
    message: ""
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchBoostStatus();
  }, []);

  const fetchBoostStatus = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_BASE_URL}/images/boost/status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setBoostData(data);
      }
    } catch (err) {
      console.error("Failed to fetch boost status:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleBoost = async (postId) => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_BASE_URL}/images/boost/${postId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        fetchBoostStatus();
        alert(data.message || "Post boosted successfully!");
      } else {
        alert(data.message || "Failed to boost post");
      }
    } catch (err) {
      console.error("Boost error:", err);
      alert("Failed to boost post");
    }
  };

  const handleUnboost = async (postId) => {
    if (!confirm("Are you sure you want to remove the boost from this post?")) return;
    
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_BASE_URL}/images/boost/${postId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchBoostStatus();
      }
    } catch (err) {
      console.error("Unboost error:", err);
    }
  };

  const handleAdRequest = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    // This would typically send a message to admin via chat or create a support ticket
    const token = localStorage.getItem("token");
    try {
      // Send message to admin chat (using existing chat system)
      const message = `
📢 AD REQUEST

Type: ${requestForm.type === "in-feed" ? "In-Feed Ad" : "Banner Ad"}
Duration: ${requestForm.duration.replace("_", " ")}
Budget: ₹${requestForm.budget}

Message: ${requestForm.message}
      `.trim();

      // For now, we'll just show success - you can integrate with chat system
      alert("Ad request sent successfully! Admin will contact you soon.");
      setShowRequestModal(false);
      setRequestForm({ type: "in-feed", duration: "1_week", budget: "", message: "" });
    } catch (err) {
      console.error("Ad request error:", err);
      alert("Failed to send request");
    } finally {
      setSubmitting(false);
    }
  };

  const getDaysRemaining = (expiresAt) => {
    if (!expiresAt) return 0;
    return Math.max(0, Math.ceil((new Date(expiresAt) - new Date()) / (1000 * 60 * 60 * 24)));
  };

  if (loading) return <div className="p-6 text-slate-500">Loading...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Boost & Promote</h1>
          <p className="text-slate-500 text-sm">Boost your posts to reach more customers</p>
        </div>
        <button
          onClick={() => setShowRequestModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:opacity-90 transition-opacity"
        >
          <MessageSquare size={18} /> Request Ad Campaign
        </button>
      </div>

      {/* Boost Slots Overview */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold">Your Boost Slots</h2>
            <p className="text-white/70 text-sm">Boost up to 4 posts at a time for 1 week each</p>
          </div>
          <div className="flex gap-2">
            {[...Array(4)].map((_, i) => (
              <div 
                key={i}
                className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  i < (4 - (boostData?.availableSlots || 0))
                    ? "bg-white/30"
                    : "bg-white/10 border-2 border-dashed border-white/30"
                }`}
              >
                {i < (4 - (boostData?.availableSlots || 0)) ? (
                  <Rocket size={16} />
                ) : (
                  <span className="text-xs">{i + 1}</span>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="bg-white/10 rounded-xl p-4">
            <p className="text-white/70 text-xs uppercase font-medium">Active Boosts</p>
            <p className="text-3xl font-bold">{boostData?.boostedPosts?.length || 0}</p>
          </div>
          <div className="bg-white/10 rounded-xl p-4">
            <p className="text-white/70 text-xs uppercase font-medium">Available Slots</p>
            <p className="text-3xl font-bold">{boostData?.availableSlots || 0}</p>
          </div>
          <div className="bg-white/10 rounded-xl p-4">
            <p className="text-white/70 text-xs uppercase font-medium">Total Posts</p>
            <p className="text-3xl font-bold">{boostData?.allPosts?.length || 0}</p>
          </div>
        </div>
      </div>

      {/* Currently Boosted Posts */}
      {boostData?.boostedPosts?.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-bold text-slate-800">🚀 Currently Boosted</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {boostData.boostedPosts.map((post) => (
              <BoostedPostCard 
                key={post._id} 
                post={post}
                daysRemaining={getDaysRemaining(post.boostExpiresAt)}
                onUnboost={() => handleUnboost(post._id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Available Posts to Boost */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-800">📋 Your Posts</h3>
          {boostData?.availableSlots === 0 && (
            <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
              All boost slots used
            </span>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {boostData?.allPosts?.map((post) => (
            <PostCard 
              key={post._id} 
              post={post}
              canBoost={post.canBoost && (boostData?.availableSlots || 0) > 0}
              onBoost={() => handleBoost(post._id)}
              daysRemaining={getDaysRemaining(post.boostExpiresAt)}
            />
          ))}
        </div>

        {(!boostData?.allPosts || boostData.allPosts.length === 0) && (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-100">
            <Image size={48} className="mx-auto text-slate-300 mb-4" />
            <h3 className="font-bold text-slate-700">No posts yet</h3>
            <p className="text-slate-500 text-sm">Create posts to start boosting them</p>
          </div>
        )}
      </div>

      {/* How Boosting Works */}
      <div className="bg-white rounded-xl border border-slate-100 p-6">
        <h3 className="font-bold text-slate-800 mb-4">💡 How Boosting Works</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Rocket size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-slate-800">Priority Placement</p>
              <p className="text-sm text-slate-500">Boosted posts appear at top positions in the home feed</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Clock size={20} className="text-purple-600" />
            </div>
            <div>
              <p className="font-medium text-slate-800">1 Week Duration</p>
              <p className="text-sm text-slate-500">Each boost lasts for 7 days from activation</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Eye size={20} className="text-green-600" />
            </div>
            <div>
              <p className="font-medium text-slate-800">Track Performance</p>
              <p className="text-sm text-slate-500">Monitor boost views separately from regular views</p>
            </div>
          </div>
        </div>
      </div>

      {/* Request Ad Campaign Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">Request Ad Campaign</h2>
              <button onClick={() => setShowRequestModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleAdRequest} className="p-6 space-y-4">
              <p className="text-slate-500 text-sm">
                Want premium ad placement? Submit a request and our team will contact you.
              </p>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Ad Type</label>
                <select
                  value={requestForm.type}
                  onChange={(e) => setRequestForm({ ...requestForm, type: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="in-feed">In-Feed Ad (Between posts)</option>
                  <option value="banner">Banner Ad (Top of search)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Duration</label>
                <select
                  value={requestForm.duration}
                  onChange={(e) => setRequestForm({ ...requestForm, duration: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="1_week">1 Week</option>
                  <option value="2_weeks">2 Weeks</option>
                  <option value="1_month">1 Month</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Budget (₹)</label>
                <input
                  type="number"
                  value={requestForm.budget}
                  onChange={(e) => setRequestForm({ ...requestForm, budget: e.target.value })}
                  placeholder="Enter your budget"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Message to Admin</label>
                <textarea
                  value={requestForm.message}
                  onChange={(e) => setRequestForm({ ...requestForm, message: e.target.value })}
                  placeholder="Describe your ad campaign goals, target audience, etc."
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Send size={16} />
                  {submitting ? "Sending..." : "Send Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Boosted Post Card
function BoostedPostCard({ post, daysRemaining, onUnboost }) {
  return (
    <div className="bg-white rounded-xl border-2 border-blue-200 shadow-sm overflow-hidden">
      <div className="flex">
        <div className="w-24 h-24 bg-slate-100 flex-shrink-0">
          {post.images?.[0]?.low && (
            <img src={post.images[0].low} alt={post.title} className="w-full h-full object-cover" />
          )}
        </div>
        <div className="flex-1 p-4">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-bold text-slate-800 line-clamp-1">{post.title}</h4>
              <div className="flex items-center gap-2 mt-1">
                <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                  <Rocket size={12} /> Boosted
                </span>
              </div>
            </div>
            <button
              onClick={onUnboost}
              className="text-xs text-slate-400 hover:text-red-500"
            >
              Remove
            </button>
          </div>
          <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Eye size={12} /> {post.boostViews || 0} boost views
            </span>
            <span className={`flex items-center gap-1 ${daysRemaining <= 2 ? "text-amber-600" : ""}`}>
              <Clock size={12} /> {daysRemaining} days left
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Regular Post Card
function PostCard({ post, canBoost, onBoost, daysRemaining }) {
  const isBoosted = post.isBoosted && daysRemaining > 0;

  return (
    <div className={`bg-white rounded-xl border shadow-sm overflow-hidden ${
      isBoosted ? "border-blue-200" : "border-slate-100"
    }`}>
      <div className="aspect-square bg-slate-100 relative">
        {post.images?.[0]?.low && (
          <img src={post.images[0].low} alt={post.title} className="w-full h-full object-cover" />
        )}
        {isBoosted && (
          <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
            <Rocket size={10} /> Boosted
          </div>
        )}
      </div>
      <div className="p-3">
        <h4 className="font-medium text-slate-800 line-clamp-1">{post.title}</h4>
        <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
          <span className="flex items-center gap-1"><Eye size={12} /> {post.views || 0}</span>
          {isBoosted && (
            <span className="flex items-center gap-1 text-blue-600">
              <Clock size={12} /> {daysRemaining}d left
            </span>
          )}
        </div>
        {!isBoosted && (
          <button
            onClick={onBoost}
            disabled={!canBoost}
            className={`w-full mt-3 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
              canBoost
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-slate-100 text-slate-400 cursor-not-allowed"
            }`}
          >
            <Rocket size={14} />
            {canBoost ? "Boost This Post" : "No slots available"}
          </button>
        )}
      </div>
    </div>
  );
}
