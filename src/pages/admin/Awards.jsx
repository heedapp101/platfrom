import { useEffect, useState } from "react";
import { 
  Award, Trophy, Gift, User, Image, Eye, EyeOff, 
  Search, Filter, Check, Clock, X, DollarSign,
  MessageSquare, Phone, CreditCard, AlertCircle
} from "lucide-react";
import { API_ENDPOINTS, getDocumentUrl } from "../../config/api";

export default function Awards() {
  const [activeTab, setActiveTab] = useState("candidates"); // candidates, posts, users, all
  const [statusFilter, setStatusFilter] = useState("all"); // all, pending, paid
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Data states
  const [candidates, setCandidates] = useState({ topPosts: [], topUsers: [] });
  const [awards, setAwards] = useState([]);
  
  // Modal states
  const [showAwardModal, setShowAwardModal] = useState(false);
  const [awardTarget, setAwardTarget] = useState(null); // { type: 'post' | 'user', data: {} }
  const [awardForm, setAwardForm] = useState({
    message: "",
    amount: "",
    showInFeed: true,
    paymentMethodType: "upi",
    paymentMethodValue: "",
    editPaymentMethod: false,
  });
  const [submitting, setSubmitting] = useState(false);

  // Predefined messages
  const predefinedMessages = [
    "This post has exceptional engagement!",
    "Great content that our community loves",
    "Top performer this week - keep it up!",
    "Featured for outstanding quality",
    "Community favorite - well deserved!"
  ];

  useEffect(() => {
    if (activeTab === "candidates") {
      fetchCandidates();
    } else {
      fetchAwards();
    }
  }, [activeTab, statusFilter]);

  const fetchCandidates = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(API_ENDPOINTS.ADMIN.AWARDS_CANDIDATES, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setCandidates({
          topPosts: data.topPosts || data.candidates || [],
          topUsers: data.topUsers || [],
        });
      }
    } catch (err) {
      console.error("Failed to fetch candidates:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAwards = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    try {
      const params = new URLSearchParams();
      if (activeTab !== "all") params.append("type", activeTab === "posts" ? "post" : "user");
      if (statusFilter !== "all") params.append("status", statusFilter);

      const res = await fetch(`${API_ENDPOINTS.ADMIN.AWARDS_ALL}?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setAwards(data.awards || []);
      }
    } catch (err) {
      console.error("Failed to fetch awards:", err);
    } finally {
      setLoading(false);
    }
  };

  const openAwardModal = (type, data) => {
    const existingPayment =
      type === "post"
        ? data?.user?.awardPaymentMethod
        : data?.awardPaymentMethod;

    setAwardTarget({ type, data });
    setAwardForm({
      message: type === "user"
        ? "This account has exceptional engagement!"
        : predefinedMessages[0],
      amount: "",
      showInFeed: true,
      paymentMethodType: existingPayment?.type || "upi",
      paymentMethodValue: existingPayment?.value || "",
      editPaymentMethod: !existingPayment?.value,
    });
    setShowAwardModal(true);
  };

  const submitAward = async () => {
    if (!awardTarget) return;
    setSubmitting(true);
    const token = localStorage.getItem("token");

    try {
      const existingPayment =
        awardTarget.type === "post"
          ? awardTarget.data?.user?.awardPaymentMethod
          : awardTarget.data?.awardPaymentMethod;
      const hasExistingPayment = !!(existingPayment?.type && existingPayment?.value);
      const trimmedPaymentValue = awardForm.paymentMethodValue.trim();
      const amountValue = awardForm.amount ? parseFloat(awardForm.amount) : 0;

      if (awardForm.editPaymentMethod && !trimmedPaymentValue) {
        alert("Please enter payment details or turn off payment edit.");
        return;
      }

      if (amountValue > 0 && !hasExistingPayment && !trimmedPaymentValue) {
        alert("Add a UPI ID or phone number to pay this award amount.");
        return;
      }

      const endpoint = awardTarget.type === "post" 
        ? API_ENDPOINTS.ADMIN.AWARD_POST(awardTarget.data._id)
        : API_ENDPOINTS.ADMIN.AWARD_USER(awardTarget.data._id);

      const payload = {
        message: awardForm.message,
        amount: awardForm.amount ? parseFloat(awardForm.amount) : undefined,
        showInFeed: awardForm.showInFeed,
      };

      if (awardForm.editPaymentMethod && trimmedPaymentValue) {
        payload.paymentMethodType = awardForm.paymentMethodType;
        payload.paymentMethodValue = trimmedPaymentValue;
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok) {
        setShowAwardModal(false);
        setAwardTarget(null);
        // Refresh data
        if (activeTab === "candidates") {
          fetchCandidates();
        } else {
          fetchAwards();
        }
      } else {
        alert(data.message || "Failed to award");
      }
    } catch (err) {
      console.error("Award submission failed:", err);
      alert("Failed to submit award");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleShowInFeed = async (awardId, currentValue) => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(API_ENDPOINTS.ADMIN.UPDATE_AWARD(awardId), {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ showInFeed: !currentValue })
      });
      if (res.ok) {
        fetchAwards();
      }
    } catch (err) {
      console.error("Toggle failed:", err);
    }
  };

  const updateAwardStatus = async (awardId, status) => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(API_ENDPOINTS.ADMIN.UPDATE_AWARD(awardId), {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        fetchAwards();
      }
    } catch (err) {
      console.error("Status update failed:", err);
    }
  };

  const deleteAward = async (awardId) => {
    if (!confirm("Are you sure you want to remove this award?")) return;
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(API_ENDPOINTS.ADMIN.DELETE_AWARD(awardId), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchAwards();
      }
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  // Filter awards by search
  const filteredAwards = awards.filter(award => {
    const targetName = award.targetPost?.title || award.targetPost?.caption || award.targetUser?.name || "";
    const username = award.targetUser?.username || award.targetPost?.user?.username || "";
    return targetName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           username.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Trophy className="text-yellow-500" size={28} />
            Awards Management
          </h1>
          <p className="text-slate-500 mt-1">Recognize and reward top content and users</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab("candidates")}
          className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${
            activeTab === "candidates" 
              ? "bg-yellow-50 text-yellow-700 border-b-2 border-yellow-500" 
              : "text-slate-500 hover:bg-slate-50"
          }`}
        >
          <Gift size={16} className="inline mr-2" />
          Top Candidates
        </button>
        <button
          onClick={() => setActiveTab("posts")}
          className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${
            activeTab === "posts" 
              ? "bg-blue-50 text-blue-700 border-b-2 border-blue-500" 
              : "text-slate-500 hover:bg-slate-50"
          }`}
        >
          <Image size={16} className="inline mr-2" />
          Awarded Posts
        </button>
        <button
          onClick={() => setActiveTab("users")}
          className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${
            activeTab === "users" 
              ? "bg-purple-50 text-purple-700 border-b-2 border-purple-500" 
              : "text-slate-500 hover:bg-slate-50"
          }`}
        >
          <User size={16} className="inline mr-2" />
          Awarded Users
        </button>
        <button
          onClick={() => setActiveTab("all")}
          className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${
            activeTab === "all" 
              ? "bg-slate-100 text-slate-700 border-b-2 border-slate-500" 
              : "text-slate-500 hover:bg-slate-50"
          }`}
        >
          <Award size={16} className="inline mr-2" />
          All Awards
        </button>
      </div>

      {/* Filters (only for awarded tabs) */}
      {activeTab !== "candidates" && (
        <div className="flex items-center gap-4 flex-wrap">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search by name or username..."
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-slate-400" />
            <select
              className="px-3 py-2 border border-slate-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending Payment</option>
              <option value="paid">Paid</option>
            </select>
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="text-center py-12 text-slate-500">Loading...</div>
      ) : activeTab === "candidates" ? (
        <CandidatesView 
          candidates={candidates} 
          onAward={openAwardModal} 
        />
      ) : (
        <AwardsListView 
          awards={filteredAwards}
          onToggleVisibility={toggleShowInFeed}
          onUpdateStatus={updateAwardStatus}
          onDelete={deleteAward}
        />
      )}

      {/* Award Modal */}
      {showAwardModal && awardTarget && (
        <AwardModal
          target={awardTarget}
          form={awardForm}
          setForm={setAwardForm}
          predefinedMessages={predefinedMessages}
          onClose={() => {
            setShowAwardModal(false);
            setAwardTarget(null);
          }}
          onSubmit={submitAward}
          submitting={submitting}
        />
      )}
    </div>
  );
}

// Candidates View Component
function CandidatesView({ candidates, onAward }) {
  return (
    <div className="space-y-8">
      {/* Top Posts Section */}
      <div>
        <h2 className="text-lg font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <Image size={20} className="text-blue-500" />
          Top Performing Posts
        </h2>
        {candidates.topPosts?.length === 0 ? (
          <p className="text-slate-400 text-center py-8">No candidate posts found</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {candidates.topPosts?.map((post) => (
              <div key={post._id} className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-video relative bg-slate-100">
                  {post.images?.[0] && (
                    <img 
                      src={getDocumentUrl(post.images[0]?.high || post.images[0]?.low || post.images[0]?.url)} 
                      alt="" 
                      className="w-full h-full object-cover"
                    />
                  )}
                  {post.isAwarded && (
                    <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                      <Trophy size={12} /> Awarded
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <p className="text-sm text-slate-600 line-clamp-2 mb-2">{post.title || "No title"}</p>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-full bg-slate-200 overflow-hidden">
                      {post.user?.profilePic ? (
                        <img src={getDocumentUrl(post.user.profilePic)} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="flex items-center justify-center h-full text-xs font-bold text-slate-500">
                          {post.user?.username?.[0]?.toUpperCase()}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-500">@{post.user?.username}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
                    <span>Likes {post.likesCount || 0}</span>
                    <span>Comments {post.commentsCount || 0}</span>
                    <span>Score {post.engagementScore || 0}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={`/post/${post._id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 py-2 border border-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-all text-center text-sm"
                    >
                      View Post
                    </a>
                    {!post.isAwarded && (
                      <button
                        onClick={() => onAward("post", post)}
                        className="flex-1 py-2 bg-gradient-to-r from-yellow-400 to-orange-400 text-white rounded-lg font-medium hover:from-yellow-500 hover:to-orange-500 transition-all flex items-center justify-center gap-2"
                      >
                        <Award size={16} /> Award
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Top Users Section */}
      <div>
        <h2 className="text-lg font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <User size={20} className="text-purple-500" />
          Top Users
        </h2>
        {candidates.topUsers?.length === 0 ? (
          <p className="text-slate-400 text-center py-8">No candidate users found</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {candidates.topUsers?.map((user) => (
              <div key={user._id} className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-lg transition-shadow">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-slate-200 overflow-hidden mb-3">
                    {user.profilePic ? (
                      <img src={getDocumentUrl(user.profilePic)} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="flex items-center justify-center h-full text-xl font-bold text-slate-500">
                        {user.username?.[0]?.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-slate-700">{user.name || user.username}</h3>
                  <p className="text-xs text-slate-400 mb-2">@{user.username}</p>
                  {user.isAwarded && (
                    <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs font-medium mb-2">
                      Already Awarded
                    </span>
                  )}
                  <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
                    <span>📸 {user.postCount || 0} posts</span>
                    <span>Score {user.engagementScore || user.couponScore || 0}</span>
                  </div>
                  {!user.isAwarded && (
                    <button
                      onClick={() => onAward("user", user)}
                      className="w-full py-2 bg-gradient-to-r from-purple-400 to-pink-400 text-white rounded-lg font-medium hover:from-purple-500 hover:to-pink-500 transition-all flex items-center justify-center gap-2"
                    >
                      <Award size={16} /> Award User
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Awards List View Component
function AwardsListView({ awards, onToggleVisibility, onUpdateStatus, onDelete }) {
  if (awards.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        <Trophy size={48} className="mx-auto mb-4 opacity-50" />
        <p>No awards found</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
      <table className="w-full text-left">
        <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
          <tr>
            <th className="px-6 py-4">Type</th>
            <th className="px-6 py-4">Target</th>
            <th className="px-6 py-4">Message</th>
            <th className="px-6 py-4">Amount</th>
            <th className="px-6 py-4">Status</th>
            <th className="px-6 py-4">Visibility</th>
            <th className="px-6 py-4">Payment Method</th>
            <th className="px-6 py-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {awards.map((award) => (
            <tr key={award._id} className="hover:bg-slate-50 transition-colors">
              <td className="px-6 py-4">
                <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                  award.type === "post" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
                }`}>
                  {award.type === "post" ? "Post" : "User"}
                </span>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  {award.type === "post" ? (
                    <>
                      <div className="w-12 h-12 rounded-lg bg-slate-200 overflow-hidden">
                        {award.targetPost?.images?.[0] && (
                          <img 
                            src={getDocumentUrl(award.targetPost.images[0]?.low || award.targetPost.images[0]?.high || award.targetPost.images[0]?.url)} 
                            alt="" 
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-slate-700 line-clamp-1">{award.targetPost?.title || award.targetPost?.caption || "No title"}</p>
                        <p className="text-xs text-slate-400">by @{award.targetPost?.user?.username || award.targetUser?.username}</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden">
                        {award.targetUser?.profilePic ? (
                          <img src={getDocumentUrl(award.targetUser.profilePic)} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="flex items-center justify-center h-full text-sm font-bold text-slate-500">
                            {award.targetUser?.username?.[0]?.toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-700">{award.targetUser?.name || award.targetUser?.username}</p>
                        <p className="text-xs text-slate-400">@{award.targetUser?.username}</p>
                      </div>
                    </>
                  )}
                </div>
              </td>
              <td className="px-6 py-4">
                <p className="text-sm text-slate-600 max-w-xs truncate" title={award.message}>
                  {award.message || "-"}
                </p>
              </td>
              <td className="px-6 py-4">
                {award.amount ? (
                  <span className="text-sm font-medium text-green-600">₹{award.amount}</span>
                ) : (
                  <span className="text-slate-400">-</span>
                )}
              </td>
              <td className="px-6 py-4">
                <select
                  value={award.status}
                  onChange={(e) => onUpdateStatus(award._id, e.target.value)}
                  className={`text-xs font-medium px-2 py-1 rounded-full border-0 cursor-pointer ${
                    award.status === "paid" 
                      ? "bg-green-100 text-green-700" 
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                </select>
              </td>
              <td className="px-6 py-4">
                <button
                  onClick={() => onToggleVisibility(award._id, award.showInFeed)}
                  className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full transition-colors ${
                    award.showInFeed 
                      ? "bg-blue-100 text-blue-700 hover:bg-blue-200" 
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  }`}
                >
                  {award.showInFeed ? <Eye size={12} /> : <EyeOff size={12} />}
                  {award.showInFeed ? "Visible" : "Hidden"}
                </button>
              </td>
              <td className="px-6 py-4">
                {(() => {
                  const method =
                    award.paymentMethod ||
                    award.targetUser?.awardPaymentMethod ||
                    award.targetPost?.user?.awardPaymentMethod;

                  if (!method?.value) {
                    return (
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <AlertCircle size={12} /> Not set
                      </span>
                    );
                  }

                  return (
                    <div className="flex items-center gap-1 text-xs text-slate-600">
                      {method.type === "upi" ? <CreditCard size={12} /> : <Phone size={12} />}
                      <span>{method.value}</span>
                    </div>
                  );
                })()}
              </td>
              <td className="px-6 py-4 text-right">
                <button
                  onClick={() => onDelete(award._id)}
                  className="text-xs text-red-500 hover:text-red-700 font-medium"
                >
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Award Modal Component
function AwardModal({ target, form, setForm, predefinedMessages, onClose, onSubmit, submitting }) {
  const isPost = target.type === "post";
  const existingPayment = isPost
    ? target.data?.user?.awardPaymentMethod
    : target.data?.awardPaymentMethod;
  const hasExistingPayment = !!(existingPayment?.type && existingPayment?.value);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Trophy className="text-yellow-500" size={24} />
              Award {isPost ? "Post" : "User"}
            </h2>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Target Preview */}
        <div className="p-6 bg-slate-50 border-b border-slate-100">
          {isPost ? (
            <div className="flex items-start gap-4">
              <div className="w-20 h-20 rounded-lg bg-slate-200 overflow-hidden shrink-0">
                {target.data.images?.[0] && (
                  <img 
                    src={getDocumentUrl(target.data.images[0]?.low || target.data.images[0]?.high || target.data.images[0]?.url)} 
                    alt="" 
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div>
                <p className="text-sm text-slate-700 line-clamp-2">{target.data.title || "No title"}</p>
                <p className="text-xs text-slate-400 mt-1">by @{target.data.user?.username}</p>
                <div className="flex gap-3 mt-2 text-xs text-slate-500">
                  <span>Likes {target.data.likesCount || 0}</span>
                  <span>Comments {target.data.commentsCount || 0}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-slate-200 overflow-hidden">
                {target.data.profilePic ? (
                  <img src={getDocumentUrl(target.data.profilePic)} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="flex items-center justify-center h-full text-xl font-bold text-slate-500">
                    {target.data.username?.[0]?.toUpperCase()}
                  </span>
                )}
              </div>
              <div>
                <h3 className="font-semibold text-slate-700">{target.data.name || target.data.username}</h3>
                <p className="text-sm text-slate-400">@{target.data.username}</p>
                <p className="text-xs text-slate-500 mt-1">Score {target.data.engagementScore || target.data.couponScore || 0}</p>
              </div>
            </div>
          )}
        </div>

        {/* Form */}
        <div className="p-6 space-y-4">
          {/* Message Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <MessageSquare size={14} className="inline mr-1" />
              Award Message
            </label>
            <div className="space-y-2 mb-3">
              {predefinedMessages.map((msg, idx) => (
                <button
                  key={idx}
                  onClick={() => setForm({ ...form, message: msg })}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    form.message === msg 
                      ? "bg-yellow-100 text-yellow-800 border-2 border-yellow-400" 
                      : "bg-slate-50 text-slate-600 border border-slate-200 hover:border-slate-300"
                  }`}
                >
                  {msg}
                </button>
              ))}
            </div>
            <textarea
              placeholder="Or write a custom message..."
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <DollarSign size={14} className="inline mr-1" />
              Award Amount (Optional)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400">Rs</span>
              <input
                type="number"
                placeholder="Enter amount"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="w-full pl-8 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {form.paymentMethodType === "phone" ? <Phone size={14} className="inline mr-1" /> : <CreditCard size={14} className="inline mr-1" />}
              Payment Method
            </label>

            {hasExistingPayment && !form.editPaymentMethod ? (
              <div className="p-3 border border-slate-200 rounded-lg bg-slate-50">
                <p className="text-sm text-slate-700">
                  Current: <span className="font-medium">{existingPayment.type.toUpperCase()} - {existingPayment.value}</span>
                </p>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, editPaymentMethod: true })}
                  className="mt-2 text-xs font-medium text-blue-600 hover:text-blue-700"
                >
                  Edit payment method
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, paymentMethodType: "upi" })}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium border ${
                      form.paymentMethodType === "upi"
                        ? "bg-blue-50 border-blue-300 text-blue-700"
                        : "bg-white border-slate-200 text-slate-600"
                    }`}
                  >
                    UPI
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, paymentMethodType: "phone" })}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium border ${
                      form.paymentMethodType === "phone"
                        ? "bg-blue-50 border-blue-300 text-blue-700"
                        : "bg-white border-slate-200 text-slate-600"
                    }`}
                  >
                    Phone
                  </button>
                </div>

                <input
                  type="text"
                  value={form.paymentMethodValue}
                  onChange={(e) => setForm({ ...form, paymentMethodValue: e.target.value })}
                  placeholder={form.paymentMethodType === "upi" ? "example@oksbi" : "10-digit phone"}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />

                {hasExistingPayment && (
                  <button
                    type="button"
                    onClick={() =>
                      setForm({
                        ...form,
                        editPaymentMethod: false,
                        paymentMethodType: existingPayment.type,
                        paymentMethodValue: existingPayment.value,
                      })
                    }
                    className="text-xs font-medium text-slate-500 hover:text-slate-700"
                  >
                    Use existing payment method
                  </button>
                )}
              </div>
            )}
            <p className="text-xs text-slate-400 mt-2">If already set, you do not need to add it again.</p>
          </div>

          {/* Show in Feed Toggle */}
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-slate-700">Show in Feed</p>
              <p className="text-xs text-slate-400">Display this award publicly on the app</p>
            </div>
            <button
              onClick={() => setForm({ ...form, showInFeed: !form.showInFeed })}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                form.showInFeed ? "bg-yellow-400" : "bg-slate-300"
              }`}
            >
              <span 
                className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                  form.showInFeed ? "right-1" : "left-1"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-slate-100 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 border border-slate-200 text-slate-600 rounded-lg font-medium hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={submitting || !form.message.trim()}
            className="flex-1 py-2 bg-gradient-to-r from-yellow-400 to-orange-400 text-white rounded-lg font-medium hover:from-yellow-500 hover:to-orange-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Clock size={16} className="animate-spin" /> Awarding...
              </>
            ) : (
              <>
                <Check size={16} /> Confirm Award
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
