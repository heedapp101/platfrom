import { useEffect, useMemo, useState, useCallback, memo } from "react";
import { API_ENDPOINTS, getDocumentUrl } from "../../config/api";
import {
  Package,
  AlertTriangle,
  Archive,
  Trash2,
  PencilLine,
  Heart,
  Users,
  SendHorizontal,
  CheckSquare,
  Square,
  X,
} from "lucide-react";
import VerificationBadge from "../../components/VerificationBadge";

const LOW_STOCK_LIMIT = 3;

// Memoized Stat Card
const StatCard = memo(function StatCard({ label, value, tone }) {
  const toneMap = {
    slate: "bg-slate-100 text-slate-800",
    amber: "bg-amber-100 text-amber-700",
    red: "bg-red-100 text-red-700",
    orange: "bg-orange-100 text-orange-700",
  };
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className={`inline-flex px-2 py-1 rounded-md text-xs font-bold ${toneMap[tone]}`}>
        {label}
      </div>
      <div className="mt-2 text-2xl font-extrabold text-slate-900">{value}</div>
    </div>
  );
});

// Memoized Post Card
const PostCard = memo(function PostCard({ post, onEdit, onToggleArchive, onDelete, onOpenOffers }) {
  const outOfStock = post.isOutOfStock ||
    (typeof post.quantityAvailable === "number" && post.quantityAvailable <= 0);
  const lowStock = !outOfStock &&
    typeof post.quantityAvailable === "number" &&
    post.quantityAvailable <= LOW_STOCK_LIMIT;

  const handleEdit = useCallback(() => onEdit(post), [post, onEdit]);
  const handleToggle = useCallback(() => onToggleArchive(post), [post, onToggleArchive]);
  const handleDelete = useCallback(() => onDelete(post._id), [post._id, onDelete]);
  const handleOpenOffers = useCallback(() => onOpenOffers(post), [post, onOpenOffers]);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex gap-3">
        <img
          src={post.images?.[0]?.low || post.images?.[0]?.high}
          alt={post.title}
          className="h-24 w-24 rounded-lg object-cover bg-slate-100"
          loading="lazy"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-slate-900 truncate">{post.title}</h3>
            {post.isArchived && (
              <span className="text-[10px] px-2 py-1 rounded-full bg-amber-100 text-amber-700 font-bold">
                Archived
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 line-clamp-2 mt-1">{post.description}</p>
          <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold">
            <span className="px-2 py-1 rounded-md bg-blue-50 text-blue-700">
              ₹{post.price ?? 0}
            </span>
            <span className="px-2 py-1 rounded-md bg-slate-100 text-slate-700">
              Qty:{" "}
              {typeof post.quantityAvailable === "number"
                ? post.quantityAvailable
                : "Unlimited"}
            </span>
            <span className="px-2 py-1 rounded-md bg-rose-50 text-rose-700 flex items-center gap-1">
              <Heart size={12} />
              {post.likes ?? post.likesCount ?? 0} likes
            </span>
            {outOfStock && (
              <span className="px-2 py-1 rounded-md bg-red-100 text-red-700 flex items-center gap-1">
                <Package size={12} />
                Out of stock
              </span>
            )}
            {lowStock && (
              <span className="px-2 py-1 rounded-md bg-orange-100 text-orange-700 flex items-center gap-1">
                <AlertTriangle size={12} />
                Low stock
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          onClick={handleEdit}
          className="px-3 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm font-semibold flex items-center justify-center gap-1"
        >
          <PencilLine size={14} />
          Edit
        </button>
        <button
          onClick={handleToggle}
          className="px-3 py-2 rounded-lg border border-amber-300 text-amber-700 text-sm font-semibold flex items-center justify-center gap-1"
        >
          <Archive size={14} />
          {post.isArchived ? "Unarchive" : "Archive"}
        </button>
        <button
          onClick={handleDelete}
          className="px-3 py-2 rounded-lg border border-red-300 text-red-700 text-sm font-semibold flex items-center justify-center gap-1"
        >
          <Trash2 size={14} />
          Delete
        </button>
        <button
          onClick={handleOpenOffers}
          className="px-3 py-2 rounded-lg border border-blue-300 text-blue-700 text-sm font-semibold flex items-center justify-center gap-1"
        >
          <SendHorizontal size={14} />
          Likes & Offer
        </button>
      </div>
    </div>
  );
});

export default function Posts() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    quantityAvailable: "",
  });
  const [error, setError] = useState("");
  const [offerModalOpen, setOfferModalOpen] = useState(false);
  const [offerPost, setOfferPost] = useState(null);
  const [likers, setLikers] = useState([]);
  const [likersLoading, setLikersLoading] = useState(false);
  const [selectedLikerIds, setSelectedLikerIds] = useState([]);
  const [offerSending, setOfferSending] = useState(false);
  const [offerForm, setOfferForm] = useState({
    offerPrice: "",
    message: "",
  });

  const token = useMemo(() => localStorage.getItem("token"), []);

  const loadPosts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(API_ENDPOINTS.SELLER.POSTS, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to load posts");
      setPosts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load posts");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const closeOfferModal = useCallback(() => {
    setOfferModalOpen(false);
    setOfferPost(null);
    setLikers([]);
    setSelectedLikerIds([]);
    setOfferForm({ offerPrice: "", message: "" });
  }, []);

  const openOfferModal = useCallback(
    async (post) => {
      setOfferPost(post);
      setOfferModalOpen(true);
      setLikersLoading(true);
      setSelectedLikerIds([]);
      setOfferForm({
        offerPrice: post?.price !== undefined && post?.price !== null ? String(post.price) : "",
        message: "",
      });

      try {
        const res = await fetch(API_ENDPOINTS.SELLER.POST_LIKERS(post._id), {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || "Failed to load liked users");
        const nextLikers = Array.isArray(data?.likers) ? data.likers : [];
        setLikers(nextLikers);
        setSelectedLikerIds(nextLikers.map((user) => user._id));
      } catch (err) {
        alert(err.message || "Failed to load liked users");
        setLikers([]);
      } finally {
        setLikersLoading(false);
      }
    },
    [token]
  );

  const toggleLikerSelection = useCallback((userId) => {
    setSelectedLikerIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  }, []);

  const selectAllLikers = useCallback(() => {
    setSelectedLikerIds(likers.map((user) => user._id));
  }, [likers]);

  const clearLikerSelection = useCallback(() => {
    setSelectedLikerIds([]);
  }, []);

  const sendOffer = useCallback(
    async (mode = "selected") => {
      if (!offerPost) return;

      const parsedOfferPrice = Number(offerForm.offerPrice);
      if (!Number.isFinite(parsedOfferPrice) || parsedOfferPrice <= 0) {
        alert("Enter a valid offer price.");
        return;
      }

      if (mode === "selected" && selectedLikerIds.length === 0) {
        alert("Select at least one liked user or send to all.");
        return;
      }

      try {
        setOfferSending(true);
        const payload = {
          offerPrice: parsedOfferPrice,
          message: offerForm.message.trim(),
          ...(mode === "selected" ? { recipientIds: selectedLikerIds } : {}),
        };

        const res = await fetch(API_ENDPOINTS.SELLER.SEND_POST_OFFER(offerPost._id), {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || "Failed to send offer");

        alert(
          `Offer sent to ${data?.sentCount || 0} user(s).` +
            (Array.isArray(data?.failed) && data.failed.length > 0
              ? ` ${data.failed.length} failed.`
              : "")
        );
        closeOfferModal();
      } catch (err) {
        alert(err.message || "Failed to send offer");
      } finally {
        setOfferSending(false);
      }
    },
    [closeOfferModal, offerForm.message, offerForm.offerPrice, offerPost, selectedLikerIds, token]
  );

  const stats = useMemo(() => {
    const total = posts.length;
    const archived = posts.filter((p) => p.isArchived).length;
    const outOfStock = posts.filter(
      (p) => p.isOutOfStock || (typeof p.quantityAvailable === "number" && p.quantityAvailable <= 0)
    ).length;
    const lowStock = posts.filter(
      (p) =>
        !p.isOutOfStock &&
        typeof p.quantityAvailable === "number" &&
        p.quantityAvailable > 0 &&
        p.quantityAvailable <= LOW_STOCK_LIMIT
    ).length;
    return { total, archived, outOfStock, lowStock };
  }, [posts]);

  const openEdit = useCallback((post) => {
    setSelectedPost(post);
    setForm({
      title: post.title || "",
      description: post.description || "",
      price: post.price !== undefined && post.price !== null ? String(post.price) : "",
      quantityAvailable:
        typeof post.quantityAvailable === "number" ? String(post.quantityAvailable) : "",
    });
    setShowEditor(true);
  }, []);

  const updatePost = useCallback(async () => {
    if (!selectedPost) return;
    if (!form.title.trim() || !form.description.trim()) {
      alert("Title and description are required.");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        price: form.price === "" ? null : Number(form.price),
        quantityAvailable: form.quantityAvailable === "" ? null : Number(form.quantityAvailable),
      };

      const res = await fetch(API_ENDPOINTS.SELLER.UPDATE_POST(selectedPost._id), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to update post");

      setPosts((prev) =>
        prev.map((p) => (p._id === selectedPost._id ? { ...p, ...data } : p))
      );
      setShowEditor(false);
      setSelectedPost(null);
    } catch (err) {
      alert(err.message || "Failed to update post");
    } finally {
      setSaving(false);
    }
  }, [selectedPost, form, token]);

  const toggleArchive = useCallback(async (post) => {
    try {
      const res = await fetch(API_ENDPOINTS.SELLER.ARCHIVE_POST(post._id), {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to update archive status");

      setPosts((prev) =>
        prev.map((p) =>
          p._id === post._id ? { ...p, isArchived: data.isArchived } : p
        )
      );
    } catch (err) {
      alert(err.message || "Failed to update archive status");
    }
  }, [token]);

  const deletePost = useCallback(async (postId) => {
    if (!window.confirm("Delete this post permanently?")) return;
    try {
      const res = await fetch(API_ENDPOINTS.SELLER.DELETE_POST(postId), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to delete post");

      setPosts((prev) => prev.filter((p) => p._id !== postId));
    } catch (err) {
      alert(err.message || "Failed to delete post");
    }
  }, [token]);

  const handleCloseEditor = useCallback(() => {
    setShowEditor(false);
    setSelectedPost(null);
  }, []);

  if (loading) return <div className="p-6 text-slate-500">Loading posts...</div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Post & Inventory Management</h1>
        <button
          onClick={loadPosts}
          className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total Posts" value={stats.total} tone="slate" />
        <StatCard label="Archived" value={stats.archived} tone="amber" />
        <StatCard label="Out Of Stock" value={stats.outOfStock} tone="red" />
        <StatCard label="Low Stock" value={stats.lowStock} tone="orange" />
      </div>

      {posts.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
          No posts found.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {posts.map((post) => (
            <PostCard
              key={post._id}
              post={post}
              onEdit={openEdit}
              onToggleArchive={toggleArchive}
              onDelete={deletePost}
              onOpenOffers={openOfferModal}
            />
          ))}
        </div>
      )}

      {offerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
          <div className="w-full max-w-4xl rounded-3xl bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Likes & Offer</h2>
                <p className="text-sm text-slate-500">
                  Send an in-app offer with Buy Now to everyone who liked this post or only selected users.
                </p>
              </div>
              <button
                onClick={closeOfferModal}
                className="rounded-full border border-slate-200 p-2 text-slate-500 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="border-b border-slate-200 p-5 lg:border-b-0 lg:border-r">
                <div className="flex items-start gap-4">
                  <img
                    src={offerPost?.images?.[0]?.low || offerPost?.images?.[0]?.high}
                    alt={offerPost?.title}
                    className="h-24 w-24 rounded-2xl object-cover bg-slate-100"
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-bold text-slate-900">{offerPost?.title}</h3>
                    <p className="mt-1 text-sm text-slate-500 line-clamp-2">{offerPost?.description}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700">
                        <Heart size={12} />
                        {likers.length} interested users
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                        <Users size={12} />
                        {selectedLikerIds.length} selected
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-2">
                  <button
                    onClick={selectAllLikers}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700"
                    disabled={likers.length === 0}
                  >
                    <CheckSquare size={14} />
                    Select All
                  </button>
                  <button
                    onClick={clearLikerSelection}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700"
                    disabled={selectedLikerIds.length === 0}
                  >
                    <Square size={14} />
                    Clear
                  </button>
                </div>

                <div className="mt-4 max-h-[420px] overflow-y-auto rounded-2xl border border-slate-100">
                  {likersLoading ? (
                    <div className="p-6 text-sm text-slate-500">Loading liked users...</div>
                  ) : likers.length === 0 ? (
                    <div className="p-6 text-sm text-slate-500">
                      Nobody has liked this post yet, so there is nobody to send an offer to.
                    </div>
                  ) : (
                    likers.map((likedUser) => {
                      const isSelected = selectedLikerIds.includes(likedUser._id);
                      return (
                        <button
                          key={likedUser._id}
                          onClick={() => toggleLikerSelection(likedUser._id)}
                          className={`flex w-full items-center gap-3 border-b border-slate-100 px-4 py-3 text-left transition-colors ${
                            isSelected ? "bg-blue-50/70" : "bg-white hover:bg-slate-50"
                          }`}
                        >
                          <div className="shrink-0">
                            {likedUser.profilePic ? (
                              <img
                                src={getDocumentUrl(likedUser.profilePic)}
                                alt={likedUser.name || likedUser.username}
                                className="h-11 w-11 rounded-full object-cover bg-slate-100"
                                loading="lazy"
                              />
                            ) : (
                              <div className="h-11 w-11 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-bold">
                                {(likedUser.name || likedUser.username || "U").slice(0, 1).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="truncate font-semibold text-slate-800">
                                {likedUser.companyName || likedUser.name || likedUser.username}
                              </p>
                              <VerificationBadge user={likedUser} size="sm" />
                            </div>
                            <p className="truncate text-xs text-slate-500">@{likedUser.username}</p>
                            <p className="text-[11px] text-slate-400">
                              Liked on {new Date(likedUser.likedAt).toLocaleString()}
                            </p>
                          </div>
                          <div className="shrink-0">
                            {isSelected ? (
                              <CheckSquare size={18} className="text-blue-600" />
                            ) : (
                              <Square size={18} className="text-slate-400" />
                            )}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="p-5">
                <h3 className="text-lg font-bold text-slate-900">Offer Composer</h3>
                <p className="mt-1 text-sm text-slate-500">
                  This sends a chat offer that opens with the app's Buy Now flow.
                </p>

                <div className="mt-4 space-y-4">
                  <div>
                    <label className="text-sm font-semibold text-slate-700">Offer Price</label>
                    <input
                      value={offerForm.offerPrice}
                      onChange={(e) =>
                        setOfferForm((prev) => ({
                          ...prev,
                          offerPrice: e.target.value.replace(/[^0-9.]/g, ""),
                        }))
                      }
                      placeholder="Enter special price"
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-slate-700">Message</label>
                    <textarea
                      value={offerForm.message}
                      onChange={(e) =>
                        setOfferForm((prev) => ({ ...prev, message: e.target.value }))
                      }
                      placeholder="Optional note to send after the offer card."
                      className="mt-1 min-h-[140px] w-full rounded-xl border border-slate-300 px-3 py-2"
                    />
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  <button
                    onClick={() => sendOffer("selected")}
                    disabled={offerSending || selectedLikerIds.length === 0}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    <SendHorizontal size={16} />
                    {offerSending ? "Sending..." : `Send To Selected (${selectedLikerIds.length})`}
                  </button>
                  <button
                    onClick={() => sendOffer("all")}
                    disabled={offerSending || likers.length === 0}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 disabled:opacity-60"
                  >
                    <Users size={16} />
                    Send To All Who Liked ({likers.length})
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showEditor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white p-5 shadow-2xl">
            <h2 className="text-xl font-bold text-slate-900 mb-4">
              Edit Post & Inventory
            </h2>

            <label className="text-sm font-semibold text-slate-700">Title</label>
            <input
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              className="mt-1 mb-3 w-full rounded-lg border border-slate-300 px-3 py-2"
            />

            <label className="text-sm font-semibold text-slate-700">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              className="mt-1 mb-3 w-full rounded-lg border border-slate-300 px-3 py-2 min-h-[90px]"
            />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-semibold text-slate-700">Price</label>
                <input
                  value={form.price}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      price: e.target.value.replace(/[^0-9.]/g, ""),
                    }))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700">Quantity</label>
                <input
                  value={form.quantityAvailable}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      quantityAvailable: e.target.value.replace(/[^0-9]/g, ""),
                    }))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                  placeholder="Empty = Unlimited"
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={handleCloseEditor}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={updatePost}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold disabled:opacity-60"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
