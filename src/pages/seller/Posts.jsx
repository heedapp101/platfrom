import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, ResponsiveContainer, Tooltip } from "recharts";
import { Eye, Heart, BarChart2 } from "lucide-react";
import { API_ENDPOINTS } from "../../config/api";

export default function Posts() {
  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. Fetch Posts from Backend
  useEffect(() => {
    const fetchPosts = async () => {
      const token = localStorage.getItem("token");
      try {
        const res = await fetch(API_ENDPOINTS.SELLER.POSTS, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) setPosts(data);
      } catch (error) {
        console.error("Failed to fetch posts:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  // Mock hourly data (Backend implementation for hourly analytics would require a separate collection)
  const mockHourlyViews = [
    { hour: '9am', v: 12 }, { hour: '12pm', v: 45 }, { hour: '3pm', v: 30 }, { hour: '6pm', v: 80 }
  ];

  if (loading) return <div className="p-6 text-slate-500">Loading gallery...</div>;

  return (
    <div className="p-6 animate-fade-in">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">My Gallery</h1>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold shadow-md hover:bg-blue-700 transition-colors">
          + New Post
        </button>
      </div>

      {/* POSTS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post) => (
          <div key={post._id} className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden group hover:shadow-md transition-all">
            {/* Image Thumbnail */}
            <div className="aspect-video bg-slate-100 relative">
              <img 
                src={post.images[0]?.low} 
                className="w-full h-full object-cover" 
                alt={post.title} 
              />
              {/* Hover Overlay */}
              <button 
                onClick={() => setSelectedPost(post)}
                className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white gap-2 transition-all font-bold backdrop-blur-sm"
              >
                <BarChart2 size={20} /> View Analytics
              </button>
            </div>

            {/* Card Content */}
            <div className="p-4">
              <h3 className="font-bold text-slate-800 truncate">{post.title}</h3>
              <div className="flex items-center gap-4 mt-3 text-slate-400 text-sm font-medium">
                {/* Likes */}
                <span className="flex items-center gap-1 hover:text-pink-500 transition-colors">
                  <Heart size={14} /> {post.likes}
                </span>
                {/* ✅ REAL VIEWS from Backend */}
                <span className="flex items-center gap-1 hover:text-blue-500 transition-colors">
                  <Eye size={14} /> {post.views || 0}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {posts.length === 0 && !loading && (
        <div className="text-center py-20 text-slate-400 italic">
          You haven't posted anything yet.
        </div>
      )}

      {/* ANALYTICS MODAL */}
      {selectedPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            
            {/* Modal Header */}
            <div className="p-6 border-b flex justify-between items-center bg-slate-50/50">
              <h2 className="text-xl font-bold text-slate-800">Post Analytics</h2>
              <button 
                onClick={() => setSelectedPost(null)} 
                className="text-slate-400 hover:text-slate-600 text-2xl leading-none"
              >
                &times;
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Post Info */}
              <div className="flex gap-4 items-center">
                <img 
                  src={selectedPost.images[0]?.low} 
                  className="w-20 h-20 rounded-lg object-cover border border-slate-100 shadow-sm" 
                  alt="" 
                />
                <div>
                  <h3 className="font-bold text-lg text-slate-800">{selectedPost.title}</h3>
                  <p className="text-sm text-slate-500">
                    Published on {new Date(selectedPost.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-pink-50 p-4 rounded-xl text-center border border-pink-100">
                  <p className="text-xs font-bold text-pink-400 uppercase tracking-wide">Total Likes</p>
                  <p className="text-2xl font-bold text-slate-800">{selectedPost.likes}</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-xl text-center border border-blue-100">
                  <p className="text-xs font-bold text-blue-400 uppercase tracking-wide">Total Views</p>
                  {/* ✅ REAL VIEWS in Modal */}
                  <p className="text-2xl font-bold text-slate-800">{selectedPost.views || 0}</p>
                </div>
                <div className="bg-amber-50 p-4 rounded-xl text-center border border-amber-100">
                  <p className="text-xs font-bold text-amber-400 uppercase tracking-wide">Conversion</p>
                  {/* Calculated Metric (Example) */}
                  <p className="text-2xl font-bold text-slate-800">
                    {selectedPost.views > 0 
                      ? ((selectedPost.likes / selectedPost.views) * 100).toFixed(1) 
                      : 0}%
                  </p>
                </div>
              </div>

              {/* Chart Section */}
              <div className="h-48 pt-2" style={{ minHeight: 192 }}>
                <p className="text-sm font-bold text-slate-700 mb-3">Hourly Engagement (Mock Data)</p>
                {mockHourlyViews && mockHourlyViews.length > 0 ? (
                  <ResponsiveContainer width="100%" height="85%">
                    <BarChart data={mockHourlyViews}>
                      <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                      <Tooltip 
                        cursor={{fill: '#f1f5f9'}} 
                        contentStyle={{borderRadius: '8px', border:'none', boxShadow:'0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                      />
                      <Bar dataKey="v" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400">
                    No engagement data
                  </div>
                )}
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 text-right border-t border-slate-100">
              <button className="px-6 py-2 bg-slate-900 text-white rounded-lg font-bold text-sm hover:bg-slate-800 transition-colors">
                Download Full Report
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}