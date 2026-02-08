import { useEffect, useState } from "react";
import { Rocket, Eye, TrendingUp, Clock, Calendar, User, RefreshCw, Search, Filter } from "lucide-react";
import { API_BASE_URL } from "../../config/api";

export default function BoostControl() {
  const [boostedPosts, setBoostedPosts] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0 });
  const [loading, setLoading] = useState(true);
  const [includeExpired, setIncludeExpired] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchBoostedPosts();
  }, [includeExpired]);

  const fetchBoostedPosts = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(
        `${API_BASE_URL}/images/boost/all?includeExpired=${includeExpired}`, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (res.ok) {
        setBoostedPosts(data.posts || []);
        setStats({ total: data.total, active: data.active });
      }
    } catch (err) {
      console.error("Failed to fetch boosted posts:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredPosts = boostedPosts.filter(post => 
    post.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.user?.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.user?.companyName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalBoostViews = boostedPosts.reduce((sum, p) => sum + (p.boostViews || 0), 0);
  const totalViews = boostedPosts.reduce((sum, p) => sum + (p.views || 0), 0);

  if (loading) return <div className="p-8 text-slate-500">Loading Boost Data...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Boost Control</h1>
          <p className="text-slate-500 text-sm">Monitor all boosted posts and their performance</p>
        </div>
        <button 
          onClick={fetchBoostedPosts}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
        >
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Boosted" 
          value={stats.total} 
          icon={<Rocket size={20} />} 
          color="bg-blue-50 text-blue-600" 
        />
        <StatCard 
          title="Currently Active" 
          value={stats.active} 
          icon={<TrendingUp size={20} />} 
          color="bg-green-50 text-green-600" 
        />
        <StatCard 
          title="Boost Views" 
          value={totalBoostViews.toLocaleString()} 
          subtitle="Views while boosted"
          icon={<Eye size={20} />} 
          color="bg-purple-50 text-purple-600" 
        />
        <StatCard 
          title="Total Views" 
          value={totalViews.toLocaleString()} 
          subtitle="All time views"
          icon={<Eye size={20} />} 
          color="bg-amber-50 text-amber-600" 
        />
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by title, username, or company..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={includeExpired}
              onChange={(e) => setIncludeExpired(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-slate-600">Include expired boosts</span>
          </label>
        </div>
      </div>

      {/* Posts Table */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Post</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Seller</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Status</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 uppercase">Views</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 uppercase">Boost Views</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Boost Period</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 uppercase">Days Left</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPosts.map((post) => (
                <tr key={post._id} className="hover:bg-slate-50 transition-colors">
                  {/* Post Info */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
                        {post.images?.[0]?.low && (
                          <img 
                            src={post.images[0].low} 
                            alt={post.title}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-slate-800 line-clamp-1">{post.title}</p>
                        <p className="text-xs text-slate-400">
                          Created {new Date(post.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Seller Info */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {post.user?.profilePic ? (
                        <img 
                          src={post.user.profilePic} 
                          alt={post.user.username}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                          <User size={14} className="text-slate-500" />
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-slate-700">{post.user?.username}</p>
                        {post.user?.companyName && (
                          <p className="text-xs text-slate-400">{post.user.companyName}</p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      post.isActive 
                        ? "bg-green-100 text-green-700" 
                        : "bg-slate-100 text-slate-600"
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        post.isActive ? "bg-green-500" : "bg-slate-400"
                      }`}></span>
                      {post.isActive ? "Active" : "Expired"}
                    </span>
                  </td>

                  {/* Views */}
                  <td className="px-4 py-3 text-center">
                    <span className="font-bold text-slate-700">{post.views?.toLocaleString() || 0}</span>
                  </td>

                  {/* Boost Views */}
                  <td className="px-4 py-3 text-center">
                    <span className="font-bold text-purple-600">{post.boostViews?.toLocaleString() || 0}</span>
                  </td>

                  {/* Boost Period */}
                  <td className="px-4 py-3">
                    <div className="text-xs text-slate-600">
                      <div className="flex items-center gap-1">
                        <Calendar size={12} className="text-slate-400" />
                        {post.boostedAt ? new Date(post.boostedAt).toLocaleDateString() : "-"}
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Clock size={12} className="text-slate-400" />
                        {post.boostExpiresAt ? new Date(post.boostExpiresAt).toLocaleDateString() : "-"}
                      </div>
                    </div>
                  </td>

                  {/* Days Left */}
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${
                      post.daysRemaining > 3 
                        ? "bg-green-100 text-green-700"
                        : post.daysRemaining > 0 
                        ? "bg-amber-100 text-amber-700"
                        : "bg-red-100 text-red-700"
                    }`}>
                      {post.daysRemaining > 0 ? `${post.daysRemaining} days` : "Expired"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredPosts.length === 0 && (
          <div className="text-center py-12">
            <Rocket size={48} className="mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-bold text-slate-600">No boosted posts found</h3>
            <p className="text-slate-400 text-sm">
              {searchQuery 
                ? "Try a different search term" 
                : includeExpired 
                  ? "No posts have been boosted yet" 
                  : "No active boosts at the moment"
              }
            </p>
          </div>
        )}
      </div>

      {/* Performance Insights */}
      {filteredPosts.length > 0 && (
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white">
          <h3 className="text-lg font-bold mb-4">📊 Boost Performance Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-white/70 text-sm">Avg. Boost Views per Post</p>
              <p className="text-2xl font-bold">
                {stats.total > 0 ? Math.round(totalBoostViews / stats.total).toLocaleString() : 0}
              </p>
            </div>
            <div>
              <p className="text-white/70 text-sm">Boost View Ratio</p>
              <p className="text-2xl font-bold">
                {totalViews > 0 ? ((totalBoostViews / totalViews) * 100).toFixed(1) : 0}%
              </p>
              <p className="text-xs text-white/60">of total views came during boost</p>
            </div>
            <div>
              <p className="text-white/70 text-sm">Active Boost Rate</p>
              <p className="text-2xl font-bold">
                {stats.total > 0 ? ((stats.active / stats.total) * 100).toFixed(0) : 0}%
              </p>
              <p className="text-xs text-white/60">{stats.active} of {stats.total} boosts active</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Stats Card Component
function StatCard({ title, value, subtitle, icon, color }) {
  return (
    <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-slate-400 font-bold uppercase">{title}</p>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
        {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
      </div>
    </div>
  );
}
