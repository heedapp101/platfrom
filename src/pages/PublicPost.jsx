import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { API_BASE_URL } from "../config/api";
import { ArrowLeft, ExternalLink } from "lucide-react";

const formatPrice = (value) => {
  if (typeof value !== "number" || Number.isNaN(value)) return null;
  try {
    return new Intl.NumberFormat("en-IN").format(value);
  } catch {
    return value.toString();
  }
};

export default function PublicPost() {
  const { postId } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");

    fetch(`${API_BASE_URL}/images/${postId}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.message || "Failed to load post");
        }
        if (active) setPost(data);
      })
      .catch((err) => {
        if (active) setError(err.message || "Post not found");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [postId]);

  const heroImage = post?.images?.[0]?.high || post?.images?.[0]?.low;
  const priceLabel = formatPrice(post?.discountedPrice ?? post?.price);
  const seller = post?.user || {};
  const sellerName = seller.companyName || seller.name || seller.username || "Seller";
  const sellerHandle = seller.username ? `@${seller.username}` : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-white">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <header className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 text-slate-900">
            <ArrowLeft size={18} />
            <span className="text-3xl font-heed text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
              Heeszo
            </span>
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition"
          >
            Open App <ExternalLink size={16} />
          </Link>
        </header>

        {loading ? (
          <div className="mt-16 flex items-center justify-center text-slate-500">Loading post...</div>
        ) : error ? (
          <div className="mt-16 rounded-2xl border border-slate-200 bg-white p-10 text-center">
            <p className="text-lg font-semibold text-slate-800">Post not available</p>
            <p className="mt-2 text-sm text-slate-500">{error}</p>
            <Link
              to="/"
              className="mt-6 inline-flex items-center justify-center rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition"
            >
              Back to Heeszo
            </Link>
          </div>
        ) : (
          <div className="mt-10 grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-3xl bg-white shadow-lg ring-1 ring-slate-100 overflow-hidden">
              {heroImage ? (
                <img
                  src={heroImage}
                  alt={post?.title || "Post"}
                  className="w-full aspect-[4/5] object-cover"
                />
              ) : (
                <div className="flex aspect-[4/5] items-center justify-center bg-slate-100 text-slate-400">
                  No image
                </div>
              )}
            </div>

            <div className="flex flex-col">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-500">
                Post
              </span>
              <h1 className="mt-3 text-3xl font-bold text-slate-900">{post?.title}</h1>

              {priceLabel && (
                <p className="mt-4 text-2xl font-semibold text-slate-900">₹{priceLabel}</p>
              )}

              <div className="mt-6 flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                {seller?.profilePic ? (
                  <img
                    src={seller.profilePic}
                    alt={sellerName}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 font-semibold">
                    {(sellerName || "S")[0]}
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold text-slate-900">{sellerName}</p>
                  {sellerHandle && <p className="text-xs text-slate-500">{sellerHandle}</p>}
                </div>
              </div>

              {post?.description && (
                <p className="mt-6 text-sm leading-6 text-slate-600 whitespace-pre-line">
                  {post.description}
                </p>
              )}

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to="/"
                  className="inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition"
                >
                  Open in App
                </Link>
                <button
                  type="button"
                  onClick={() => navigator.clipboard?.writeText(window.location.href)}
                  className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  Copy Link
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
