import { useEffect, useMemo, useState } from "react";
import { API_ENDPOINTS } from "../../config/api";
import { Package, AlertTriangle, Archive, Trash2, PencilLine } from "lucide-react";

const LOW_STOCK_LIMIT = 3;

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

  const token = localStorage.getItem("token");

  const loadPosts = async () => {
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
  };

  useEffect(() => {
    loadPosts();
  }, []);

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

  const openEdit = (post) => {
    setSelectedPost(post);
    setForm({
      title: post.title || "",
      description: post.description || "",
      price: post.price !== undefined && post.price !== null ? String(post.price) : "",
      quantityAvailable:
        typeof post.quantityAvailable === "number" ? String(post.quantityAvailable) : "",
    });
    setShowEditor(true);
  };

  const updatePost = async () => {
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
  };

  const toggleArchive = async (post) => {
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
  };

  const deletePost = async (postId) => {
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
  };

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
          {posts.map((post) => {
            const outOfStock =
              post.isOutOfStock ||
              (typeof post.quantityAvailable === "number" && post.quantityAvailable <= 0);
            const lowStock =
              !outOfStock &&
              typeof post.quantityAvailable === "number" &&
              post.quantityAvailable <= LOW_STOCK_LIMIT;

            return (
              <div
                key={post._id}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex gap-3">
                  <img
                    src={post.images?.[0]?.low || post.images?.[0]?.high}
                    alt={post.title}
                    className="h-24 w-24 rounded-lg object-cover bg-slate-100"
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

                <div className="mt-4 grid grid-cols-3 gap-2">
                  <button
                    onClick={() => openEdit(post)}
                    className="px-3 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm font-semibold flex items-center justify-center gap-1"
                  >
                    <PencilLine size={14} />
                    Edit
                  </button>
                  <button
                    onClick={() => toggleArchive(post)}
                    className="px-3 py-2 rounded-lg border border-amber-300 text-amber-700 text-sm font-semibold flex items-center justify-center gap-1"
                  >
                    <Archive size={14} />
                    {post.isArchived ? "Unarchive" : "Archive"}
                  </button>
                  <button
                    onClick={() => deletePost(post._id)}
                    className="px-3 py-2 rounded-lg border border-red-300 text-red-700 text-sm font-semibold flex items-center justify-center gap-1"
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
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
                onClick={() => {
                  setShowEditor(false);
                  setSelectedPost(null);
                }}
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

function StatCard({ label, value, tone }) {
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
}
