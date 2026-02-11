import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { API_BASE_URL } from "../config/api";
import { ArrowLeft, ExternalLink } from "lucide-react";

export default function PublicProfile() {
  const { userId } = useParams();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");

    Promise.all([
      fetch(`${API_BASE_URL}/users/profile/${userId}`).then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || "Failed to load profile");
        return data;
      }),
      fetch(`${API_BASE_URL}/images/user/${userId}`).then(async (res) => {
        const data = await res.json();
        if (!res.ok) return [];
        return Array.isArray(data) ? data : [];
      }),
    ])
      .then(([profileData, postsData]) => {
        if (!active) return;
        setProfile(profileData);
        setPosts(postsData);
      })
      .catch((err) => {
        if (!active) return;
        setError(err.message || "Profile not found");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [userId]);

  const user = profile?.user;
  const displayName = user?.companyName || user?.name || user?.username || "User";
  const handleName = user?.username ? `@${user.username}` : null;
  const banner = user?.bannerImg;
  const avatar = user?.profilePic;
  const postPreview = posts.slice(0, 6);

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
          <div className="mt-16 flex items-center justify-center text-slate-500">Loading profile...</div>
        ) : error ? (
          <div className="mt-16 rounded-2xl border border-slate-200 bg-white p-10 text-center">
            <p className="text-lg font-semibold text-slate-800">Profile not available</p>
            <p className="mt-2 text-sm text-slate-500">{error}</p>
            <Link
              to="/"
              className="mt-6 inline-flex items-center justify-center rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition"
            >
              Back to Heeszo
            </Link>
          </div>
        ) : (
          <>
            <div className="mt-8 overflow-hidden rounded-3xl bg-white shadow-lg ring-1 ring-slate-100">
              <div className="h-44 bg-slate-200">
                {banner ? (
                  <img src={banner} alt={displayName} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full bg-gradient-to-r from-indigo-200 via-purple-200 to-pink-200" />
                )}
              </div>
              <div className="relative px-8 pb-8">
                <div className="-mt-10 flex items-end gap-4">
                  {avatar ? (
                    <img
                      src={avatar}
                      alt={displayName}
                      className="h-20 w-20 rounded-2xl border-4 border-white object-cover shadow-md"
                    />
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-white bg-indigo-100 text-2xl font-semibold text-indigo-600 shadow-md">
                      {(displayName || "U")[0]}
                    </div>
                  )}
                  <div>
                    <h1 className="text-2xl font-bold text-slate-900">{displayName}</h1>
                    {handleName && <p className="text-sm text-slate-500">{handleName}</p>}
                  </div>
                </div>

                {user?.bio && (
                  <p className="mt-4 text-sm leading-6 text-slate-600 whitespace-pre-line">
                    {user.bio}
                  </p>
                )}

                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-center">
                    <p className="text-lg font-semibold text-slate-900">{posts.length}</p>
                    <p className="text-xs uppercase tracking-wide text-slate-500">Posts</p>
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-center">
                    <p className="text-lg font-semibold text-slate-900">{profile?.followersCount ?? 0}</p>
                    <p className="text-xs uppercase tracking-wide text-slate-500">Followers</p>
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-center">
                    <p className="text-lg font-semibold text-slate-900">{profile?.followingCount ?? 0}</p>
                    <p className="text-xs uppercase tracking-wide text-slate-500">Following</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-10">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">Recent posts</h2>
                <Link to="/" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">
                  View in app
                </Link>
              </div>

              {postPreview.length === 0 ? (
                <div className="mt-6 rounded-2xl border border-slate-100 bg-white p-6 text-sm text-slate-500">
                  No posts yet.
                </div>
              ) : (
                <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {postPreview.map((post) => (
                    <div
                      key={post._id}
                      className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm"
                    >
                      <div className="aspect-[4/5] bg-slate-100">
                        {post.images?.[0]?.low || post.images?.[0]?.high ? (
                          <img
                            src={post.images?.[0]?.low || post.images?.[0]?.high}
                            alt={post.title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full bg-slate-100" />
                        )}
                      </div>
                      <div className="p-4">
                        <p className="text-sm font-semibold text-slate-900 line-clamp-1">
                          {post.title}
                        </p>
                        {post.price ? (
                          <p className="mt-1 text-xs text-slate-500">₹{post.price}</p>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
