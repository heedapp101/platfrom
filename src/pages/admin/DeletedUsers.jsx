import { useEffect, useState } from "react";
import { Search, RefreshCw } from "lucide-react";
import { API_ENDPOINTS } from "../../config/api";

export default function DeletedUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [query, setQuery] = useState("");

  const fetchUsers = async () => {
    const token = localStorage.getItem("token");
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "20",
      });
      if (query) params.set("search", query);

      const res = await fetch(`${API_ENDPOINTS.ADMIN.DELETED_USERS}?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setUsers(data.users || []);
        setTotal(data.total || 0);
        setPages(data.pages || 1);
      }
    } catch (error) {
      console.error("Failed to fetch deleted users", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, query]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setQuery(searchTerm.trim());
  };

  const handleClear = () => {
    setSearchTerm("");
    setQuery("");
    setPage(1);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Deleted Users</h1>
          <p className="text-slate-500 text-sm">Track permanently deleted accounts</p>
        </div>
        <button
          onClick={fetchUsers}
          className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 flex items-center gap-2"
        >
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      <form onSubmit={handleSearch} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 md:items-center">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search deleted users..."
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-3">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Search
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50"
          >
            Clear
          </button>
        </div>
        <div className="md:ml-auto text-sm text-slate-500">
          Total deleted: <span className="font-semibold text-slate-700">{total}</span>
        </div>
      </form>

      {loading ? (
        <div className="text-center py-10 text-slate-500">Loading deleted users...</div>
      ) : users.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-8 text-center text-slate-500">
          No deleted users found.
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Deleted At</th>
                <th className="px-6 py-4">Deleted By</th>
                <th className="px-6 py-4">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((user) => (
                <tr key={user._id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-700 text-sm">{user.name || "Deleted User"}</div>
                    <div className="text-xs text-slate-400">@{user.username || "-"}</div>
                    <div className="text-xs text-slate-400">{user.email || "-"}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {user.userType ? user.userType.toUpperCase() : "-"}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {user.deletedAt ? new Date(user.deletedAt).toLocaleString() : "-"}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {user.deletedBy || "-"}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {user.deletedReason || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex items-center justify-between px-6 py-4 border-t">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 disabled:opacity-50"
            >
              Prev
            </button>
            <div className="text-sm text-slate-500">
              Page {page} of {pages}
            </div>
            <button
              onClick={() => setPage((p) => Math.min(pages, p + 1))}
              disabled={page >= pages}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
