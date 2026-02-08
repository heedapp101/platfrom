import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Filter, MessageSquare, ShieldCheck, MapPin, ArrowUpDown, Calendar, Trophy } from "lucide-react";
import { API_ENDPOINTS, getDocumentUrl } from "../../config/api";

export default function AdminUsers() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);

  // Filters & Sorting States
  const [roleFilter, setRoleFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("createdAt"); // 'createdAt' or 'couponScore'
  const [sortOrder, setSortOrder] = useState("desc"); // 'asc' or 'desc'

  // 1. Fetch Users (Triggers on any filter change)
  useEffect(() => {
    fetchUsers();
  }, [roleFilter, sortBy, sortOrder]); 

  const fetchUsers = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    try {
      // Build Query Params
      const params = new URLSearchParams({
        role: roleFilter,
        sortBy: sortBy,
        order: sortOrder,
        search: searchTerm // Optional: Pass search to backend if desired, or keep local
      });

      const res = await fetch(API_ENDPOINTS.ADMIN.USERS(`?${params.toString()}`), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      
      if (res.ok) {
        setUsers(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Local Search Handler (Debouncing is better, but this works for small lists)
  // If you want backend search, add 'searchTerm' to the useEffect dependency array
  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getScoreColor = (score) => {
    if (score > 80) return "text-green-600 bg-green-50 border-green-200";
    if (score > 40) return "text-blue-600 bg-blue-50 border-blue-200";
    return "text-slate-600 bg-slate-50 border-slate-200";
  };

  return (
    <div className="p-6">
      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">User Management</h1>
        <p className="text-slate-500 text-sm">Monitor activity, manage roles, and view scores.</p>
      </div>

      {/* CONTROLS BAR */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
        
        {/* Left: Search */}
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
          <input 
            type="text"
            placeholder="Search users..."
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Right: Filters & Sort */}
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          
          {/* Role Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <select 
              className="pl-9 pr-8 py-2 border border-slate-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="all">All Roles</option>
              <option value="general">General</option>
              <option value="business">Business</option>
            </select>
          </div>

          {/* Sort By Field */}
          <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white">
            <button
              onClick={() => setSortBy("createdAt")}
              className={`px-3 py-2 text-sm flex items-center gap-2 ${sortBy === "createdAt" ? "bg-slate-100 font-semibold text-slate-800" : "text-slate-500 hover:bg-slate-50"}`}
            >
              <Calendar size={16} /> Date
            </button>
            <div className="w-[1px] h-full bg-slate-200"></div>
            <button
              onClick={() => setSortBy("couponScore")}
              className={`px-3 py-2 text-sm flex items-center gap-2 ${sortBy === "couponScore" ? "bg-blue-50 font-semibold text-blue-600" : "text-slate-500 hover:bg-slate-50"}`}
            >
              <Trophy size={16} /> Points
            </button>
          </div>

          {/* Sort Order (Asc/Desc) */}
          <button
            onClick={() => setSortOrder(prev => prev === "asc" ? "desc" : "asc")}
            className="px-3 py-2 border border-slate-200 rounded-lg bg-white text-slate-600 hover:bg-slate-50 flex items-center gap-2 text-sm"
            title={sortOrder === "asc" ? "Oldest / Lowest First" : "Newest / Highest First"}
          >
            <ArrowUpDown size={16} />
            {sortOrder === "asc" ? "Asc" : "Desc"}
          </button>

        </div>
      </div>

      {/* USER LIST TABLE */}
      {loading ? (
        <div className="text-center py-12 text-slate-500">Loading users...</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
              <tr>
                <th className="px-6 py-4">User Details</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Joined</th>
                <th className="px-6 py-4">Engagement Score</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((user) => (
                <tr 
                  key={user._id} 
                  onClick={() => setSelectedUser(user)}
                  className="hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                         {user.profilePic ? (
                           <img src={getDocumentUrl(user.profilePic)} alt="" className="w-full h-full object-cover"/>
                         ) : (
                           <span className="font-bold text-slate-500">{user.username?.[0]?.toUpperCase()}</span>
                         )}
                      </div>
                      <div>
                        <p className="font-bold text-slate-700 text-sm">{user.name}</p>
                        <p className="text-xs text-slate-400">@{user.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      user.userType === 'business' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {user.userType.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getScoreColor(user.couponScore)}`}>
                       {user.couponScore} pts
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate('/admin/chat', { state: { selectedUser: user } });
                        }}
                        className="text-xs font-medium text-blue-600 hover:text-blue-800 border border-blue-200 hover:border-blue-400 px-3 py-1 rounded-full transition-colors flex items-center gap-1"
                        title="Message User"
                      >
                        <MessageSquare size={12} />
                        DM
                      </button>
                      <button className="text-xs font-medium text-slate-400 hover:text-blue-600 border border-slate-200 hover:border-blue-200 px-3 py-1 rounded-full transition-colors">
                        View Details
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredUsers.length === 0 && (
            <div className="p-8 text-center text-slate-500">No users found matching your criteria.</div>
          )}
        </div>
      )}

      {/* USER DETAILS MODAL */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden relative animate-fade-in">
            
            {/* Header Image/Banner */}
            <div className="h-24 bg-gradient-to-r from-slate-800 to-slate-900 relative">
               <button 
                  onClick={() => setSelectedUser(null)}
                  className="absolute top-4 right-4 text-white/80 hover:text-white text-2xl leading-none"
               >
                 &times;
               </button>
            </div>

            {/* Profile Content */}
            <div className="px-6 pb-6">
              {/* Avatar */}
              <div className="relative -mt-12 mb-4 flex justify-between items-end">
                <div className="w-24 h-24 rounded-full border-4 border-white bg-white overflow-hidden shadow-md">
                   {selectedUser.profilePic ? (
                     <img src={getDocumentUrl(selectedUser.profilePic)} className="w-full h-full object-cover" />
                   ) : (
                     <div className="w-full h-full bg-slate-100 flex items-center justify-center text-3xl">👤</div>
                   )}
                </div>
                
                {/* Coupon Score Badge */}
                <div className="text-center mb-1">
                  <span className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider">Engagement Score</span>
                  <span className={`text-2xl font-black ${getScoreColor(selectedUser.couponScore).split(' ')[0]}`}>
                    {selectedUser.couponScore}
                  </span>
                </div>
              </div>

              {/* User Info */}
              <div className="mb-6">
                 <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                   {selectedUser.name}
                   {selectedUser.isVerified && <ShieldCheck className="text-blue-500" size={20} />}
                 </h2>
                 <p className="text-slate-500 text-sm">@{selectedUser.username}</p>
                 <p className="text-slate-400 text-xs mt-1">{selectedUser.email}</p>
                 
                 {selectedUser.location && (
                   <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                     <MapPin size={12} /> {selectedUser.location}
                   </p>
                 )}
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Member Since</span>
                  <p className="font-semibold text-slate-700 text-sm">
                    {new Date(selectedUser.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Contributions</span>
                  <p className="font-semibold text-slate-700 text-sm">{selectedUser.postCount} Posts</p>
                </div>
              </div>

              {/* Interests Tags (Only visible here) */}
              <div className="mb-8">
                <h4 className="text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">Interests</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedUser.interests?.length > 0 ? (
                    selectedUser.interests.map((interest, i) => (
                      <span key={i} className="px-3 py-1 bg-blue-50 text-blue-600 border border-blue-100 rounded-full text-xs font-medium">
                        {typeof interest === 'string' ? interest : interest.tag}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-400 text-sm italic">No interests added.</span>
                  )}
                </div>
              </div>

              {/* Chat Button */}
              <button 
                onClick={() => {
                  setSelectedUser(null);
                  navigate('/admin/chat', { state: { selectedUser: selectedUser } });
                }}
                className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-900/20"
              >
                <MessageSquare size={18} />
                Message User
              </button>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}