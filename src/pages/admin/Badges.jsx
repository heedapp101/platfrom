import { useCallback, useEffect, useMemo, useState } from "react";
import { Search, RefreshCw, CheckCircle2, XCircle, Sparkles } from "lucide-react";
import { API_ENDPOINTS, getDocumentUrl } from "../../config/api";
import VerificationBadge from "../../components/VerificationBadge";
import { getUserBadgeType } from "../../utils/userBadges";

function StatCard({ label, value, tone }) {
  const toneMap = {
    blue: "bg-blue-50 text-blue-700 border-blue-100",
    amber: "bg-amber-50 text-amber-700 border-amber-100",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
  };

  return (
    <div className={`rounded-2xl border p-4 ${toneMap[tone] || toneMap.blue}`}>
      <p className="text-xs font-bold uppercase tracking-wide">{label}</p>
      <p className="mt-2 text-3xl font-black">{value}</p>
    </div>
  );
}

function UserAvatar({ user }) {
  if (user?.profilePic) {
    return (
      <img
        src={getDocumentUrl(user.profilePic)}
        alt={user.name || user.username}
        className="h-12 w-12 rounded-full object-cover bg-slate-100"
        loading="lazy"
      />
    );
  }

  return (
    <div className="h-12 w-12 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-bold">
      {(user?.name || user?.username || "U").slice(0, 1).toUpperCase()}
    </div>
  );
}

function BadgeStatusPill({ user }) {
  const badgeType = getUserBadgeType(user);

  if (badgeType === "business") {
    return <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">Green Business</span>;
  }

  if (badgeType === "verified") {
    return <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">Blue Verified</span>;
  }

  if (user?.badgeRequestStatus === "pending") {
    return <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">Pending</span>;
  }

  if (user?.badgeRequestStatus === "rejected") {
    return <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-700 text-xs font-bold">Rejected</span>;
  }

  return <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold">No Badge</span>;
}

export default function AdminBadges() {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [summary, setSummary] = useState({
    pendingCount: 0,
    verifiedCount: 0,
    businessBadgeCount: 0,
  });
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");

  const token = useMemo(() => localStorage.getItem("token"), []);

  const fetchPending = useCallback(async () => {
    const res = await fetch(API_ENDPOINTS.ADMIN.BADGES("?status=pending"), {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || "Failed to load pending badge requests");
    setPendingUsers(Array.isArray(data?.users) ? data.users : []);
    setSummary(data?.summary || { pendingCount: 0, verifiedCount: 0, businessBadgeCount: 0 });
  }, [token]);

  const fetchCatalog = useCallback(async () => {
    const params = new URLSearchParams({ status: "all" });
    if (search.trim()) params.set("search", search.trim());

    const res = await fetch(API_ENDPOINTS.ADMIN.BADGES(`?${params.toString()}`), {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || "Failed to load users");
    setAllUsers(Array.isArray(data?.users) ? data.users : []);
    if (data?.summary) {
      setSummary(data.summary);
    }
  }, [search, token]);

  const loadPage = useCallback(async () => {
    try {
      setLoading(true);
      setCatalogLoading(true);
      await Promise.all([fetchPending(), fetchCatalog()]);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setCatalogLoading(false);
    }
  }, [fetchCatalog, fetchPending]);

  useEffect(() => {
    loadPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        setCatalogLoading(true);
        await fetchCatalog();
      } catch (error) {
        console.error(error);
      } finally {
        setCatalogLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [fetchCatalog]);

  const runBadgeAction = useCallback(
    async (userId, action) => {
      try {
        setActionLoading(`${userId}:${action}`);
        const res = await fetch(API_ENDPOINTS.ADMIN.UPDATE_BADGE(userId), {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ action }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || "Failed to update badge");
        await Promise.all([fetchPending(), fetchCatalog()]);
      } catch (error) {
        alert(error.message || "Failed to update badge");
      } finally {
        setActionLoading("");
      }
    },
    [fetchCatalog, fetchPending, token]
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Badge Center</h1>
          <p className="text-sm text-slate-500">
            Review blue badge requests, grant badges directly, and track green business badges.
          </p>
        </div>
        <button
          onClick={loadPage}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <StatCard label="Pending Requests" value={summary.pendingCount || 0} tone="amber" />
        <StatCard label="Blue Verified" value={summary.verifiedCount || 0} tone="blue" />
        <StatCard label="Green Business" value={summary.businessBadgeCount || 0} tone="emerald" />
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Pending Blue Badge Requests</h2>
            <p className="text-sm text-slate-500">Approve or reject user-submitted verified badge requests.</p>
          </div>
          <Sparkles size={18} className="text-amber-500" />
        </div>

        {loading ? (
          <div className="py-10 text-sm text-slate-500">Loading badge requests...</div>
        ) : pendingUsers.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
            No pending badge requests right now.
          </div>
        ) : (
          <div className="mt-4 grid gap-4 xl:grid-cols-2">
            {pendingUsers.map((user) => (
              <div key={user._id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex items-start gap-3">
                  <UserAvatar user={user} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-slate-900 truncate">{user.name || user.username}</p>
                      <VerificationBadge user={user} size="sm" />
                    </div>
                    <p className="text-xs text-slate-500 truncate">@{user.username}</p>
                    <p className="text-xs text-slate-400 truncate">{user.email}</p>
                    {user.badgeRequestedAt && (
                      <p className="mt-2 text-xs text-amber-700 font-medium">
                        Requested on {new Date(user.badgeRequestedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <BadgeStatusPill user={user} />
                </div>

                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => runBadgeAction(user._id, "approve")}
                    disabled={actionLoading === `${user._id}:approve`}
                    className="flex-1 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {actionLoading === `${user._id}:approve` ? "Approving..." : "Approve Blue Badge"}
                  </button>
                  <button
                    onClick={() => runBadgeAction(user._id, "reject")}
                    disabled={actionLoading === `${user._id}:reject`}
                    className="rounded-xl border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-700 disabled:opacity-60"
                  >
                    {actionLoading === `${user._id}:reject` ? "Rejecting..." : "Reject"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Grant Or Remove Blue Badge</h2>
            <p className="text-sm text-slate-500">
              Admin can give the blue badge without a user request. Business users keep the green badge automatically.
            </p>
          </div>
          <div className="relative w-full lg:w-80">
            <Search size={16} className="absolute left-3 top-3 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users..."
              className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-400"
            />
          </div>
        </div>

        {catalogLoading ? (
          <div className="py-10 text-sm text-slate-500">Loading users...</div>
        ) : (
          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-100">
            <div className="grid grid-cols-[minmax(0,1.4fr)_130px_220px] gap-3 bg-slate-50 px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-500">
              <span>User</span>
              <span>Status</span>
              <span className="text-right">Action</span>
            </div>
            <div className="divide-y divide-slate-100">
              {allUsers.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-slate-500">No users found.</div>
              ) : (
                allUsers.map((user) => {
                  const badgeType = getUserBadgeType(user);
                  const isGrantable = user.userType !== "business" && badgeType !== "verified";
                  return (
                    <div
                      key={user._id}
                      className="grid grid-cols-[minmax(0,1.4fr)_130px_220px] gap-3 px-4 py-3 items-center"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <UserAvatar user={user} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="truncate font-semibold text-slate-800">
                              {user.companyName || user.name || user.username}
                            </p>
                            <VerificationBadge user={user} size="sm" />
                          </div>
                          <p className="truncate text-xs text-slate-500">@{user.username}</p>
                        </div>
                      </div>

                      <div>
                        <BadgeStatusPill user={user} />
                      </div>

                      <div className="flex items-center justify-end gap-2">
                        {isGrantable ? (
                          <button
                            onClick={() => runBadgeAction(user._id, "grant")}
                            disabled={actionLoading === `${user._id}:grant`}
                            className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
                          >
                            <CheckCircle2 size={14} />
                            {actionLoading === `${user._id}:grant` ? "Granting..." : "Grant Blue"}
                          </button>
                        ) : badgeType === "business" ? (
                          <span className="text-xs font-semibold text-emerald-700">Auto green business badge</span>
                        ) : null}

                        {badgeType === "verified" && (
                          <button
                            onClick={() => runBadgeAction(user._id, "remove")}
                            disabled={actionLoading === `${user._id}:remove`}
                            className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 disabled:opacity-60"
                          >
                            <XCircle size={14} />
                            {actionLoading === `${user._id}:remove` ? "Removing..." : "Remove"}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
