import { useEffect, useMemo, useState } from "react";
import { Send, Users, UserCheck, Search } from "lucide-react";
import { API_ENDPOINTS } from "../../config/api";

export default function PushNotifications() {
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState("");
  const [audience, setAudience] = useState("all");
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [result, setResult] = useState(null);
  const [form, setForm] = useState({
    title: "",
    message: "",
    screen: "",
  });

  useEffect(() => {
    const fetchUsers = async () => {
      setLoadingUsers(true);
      const token = localStorage.getItem("token");
      try {
        const res = await fetch(API_ENDPOINTS.ADMIN.USERS("?role=all&sortBy=createdAt&order=desc"), {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) {
          const sanitized = (data || []).filter((user) => user.userType !== "admin");
          setUsers(sanitized);
        }
      } catch (error) {
        console.error("Failed to fetch users for push notifications", error);
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return users;
    return users.filter((user) => {
      const name = String(user.name || "").toLowerCase();
      const username = String(user.username || "").toLowerCase();
      const email = String(user.email || "").toLowerCase();
      return name.includes(query) || username.includes(query) || email.includes(query);
    });
  }, [users, search]);

  const selectedCount = selectedUserIds.length;
  const canSend =
    form.title.trim().length > 0 &&
    form.message.trim().length > 0 &&
    (audience === "all" || selectedCount > 0);

  const toggleUser = (userId) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSend = async () => {
    if (!canSend) return;
    const token = localStorage.getItem("token");
    setSending(true);
    setResult(null);
    try {
      const payload = {
        title: form.title.trim(),
        message: form.message.trim(),
        audience,
        ...(audience === "selected" ? { userIds: selectedUserIds } : {}),
        ...(form.screen.trim()
          ? {
              data: {
                screen: form.screen.trim(),
              },
            }
          : {}),
      };

      const res = await fetch(API_ENDPOINTS.ADMIN.PUSH_SEND, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setResult({ ok: false, message: data?.message || "Failed to send push notification" });
        return;
      }
      setResult({
        ok: true,
        message: `Queued for ${data.sentCount || 0} users`,
      });
      if (audience === "selected") {
        setSelectedUserIds([]);
      }
      setForm((prev) => ({ ...prev, title: "", message: "" }));
    } catch (error) {
      console.error("Send push notification error", error);
      setResult({ ok: false, message: "Failed to send push notification" });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Push Notifications</h1>
          <p className="text-sm text-slate-500">
            Send app push notifications to all users or selected users.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_1.4fr] gap-6">
        <div className="bg-white border border-slate-100 rounded-xl p-5 space-y-4">
          <h2 className="font-semibold text-slate-800 flex items-center gap-2">
            <Send size={18} />
            Compose
          </h2>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase text-slate-500">Title</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Example: Monthly Offer Live"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase text-slate-500">Message</label>
            <textarea
              value={form.message}
              onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))}
              rows={5}
              placeholder="Write the push message users will receive."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase text-slate-500">Optional Screen Hint</label>
            <input
              type="text"
              value={form.screen}
              onChange={(e) => setForm((prev) => ({ ...prev, screen: e.target.value }))}
              placeholder="OfferParticipation / Notifications"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={() => setAudience("all")}
              className={`px-3 py-2 rounded-lg text-sm border ${
                audience === "all"
                  ? "bg-blue-50 text-blue-700 border-blue-200"
                  : "bg-white text-slate-500 border-slate-200"
              }`}
            >
              <Users size={14} className="inline mr-1" />
              All Users
            </button>
            <button
              onClick={() => setAudience("selected")}
              className={`px-3 py-2 rounded-lg text-sm border ${
                audience === "selected"
                  ? "bg-blue-50 text-blue-700 border-blue-200"
                  : "bg-white text-slate-500 border-slate-200"
              }`}
            >
              <UserCheck size={14} className="inline mr-1" />
              Selected ({selectedCount})
            </button>
          </div>

          {result && (
            <div
              className={`text-sm px-3 py-2 rounded-lg ${
                result.ok ? "bg-green-50 text-green-700 border border-green-100" : "bg-red-50 text-red-700 border border-red-100"
              }`}
            >
              {result.message}
            </div>
          )}

          <button
            disabled={!canSend || sending}
            onClick={handleSend}
            className="w-full py-3 rounded-lg bg-slate-900 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? "Sending..." : "Send Push Notification"}
          </button>
        </div>

        <div className="bg-white border border-slate-100 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-semibold text-slate-800">Recipient Selection</h2>
            <div className="relative w-full max-w-xs">
              <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search users..."
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {audience === "selected" && (
            <div className="text-xs text-slate-500 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
              Select at least one user to send targeted notifications.
            </div>
          )}

          {loadingUsers ? (
            <div className="text-sm text-slate-500 py-10 text-center">Loading users...</div>
          ) : (
            <div className="border border-slate-100 rounded-lg overflow-hidden">
              <div className="max-h-[520px] overflow-y-auto divide-y divide-slate-100">
                {filteredUsers.map((user) => {
                  const checked = selectedUserIds.includes(user._id);
                  return (
                    <label key={user._id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 cursor-pointer">
                      <input
                        type="checkbox"
                        disabled={audience !== "selected"}
                        checked={checked}
                        onChange={() => toggleUser(user._id)}
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-700 truncate">{user.name || user.username}</p>
                        <p className="text-xs text-slate-500 truncate">
                          @{user.username} • {user.email}
                        </p>
                      </div>
                    </label>
                  );
                })}
                {filteredUsers.length === 0 && (
                  <div className="px-4 py-8 text-sm text-center text-slate-500">No users found.</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
