import { useEffect, useState, useMemo, useCallback, memo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Filter, MessageSquare, ShieldCheck, MapPin, ArrowUpDown, Calendar, Trophy } from "lucide-react";
import { API_ENDPOINTS, getDocumentUrl } from "../../config/api";

// Debounce hook for search optimization
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

// Memoized User Row Component
const UserRow = memo(function UserRow({ user, onSelectUser, onMessageUser, getScoreColor }) {
  const formattedDate = useMemo(() => 
    new Date(user.createdAt).toLocaleDateString()
  , [user.createdAt]);
  
  const handleClick = useCallback(() => onSelectUser(user), [user, onSelectUser]);
  const handleMessage = useCallback((e) => {
    e.stopPropagation();
    onMessageUser(user);
  }, [user, onMessageUser]);

  return (
    <tr 
      onClick={handleClick}
      className="hover:bg-slate-50 transition-colors cursor-pointer"
    >
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden shrink-0">
             {user.profilePic ? (
               <img src={getDocumentUrl(user.profilePic)} alt="" className="w-full h-full object-cover" loading="lazy"/>
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
      <td className="px-6 py-4 text-sm text-slate-500">{formattedDate}</td>
      <td className="px-6 py-4">
        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getScoreColor(user.couponScore)}`}>
           {user.couponScore} pts
        </span>
      </td>
      <td className="px-6 py-4 text-right">
        <div className="flex items-center justify-end gap-2">
          <button 
            onClick={handleMessage}
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
  );
});

export default function AdminUsers() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);

  // Filters & Sorting States
  const [roleFilter, setRoleFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  
  // Debounce search for better performance
  const debouncedSearch = useDebounce(searchTerm, 300);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    try {
      const params = new URLSearchParams({
        role: roleFilter,
        sortBy: sortBy,
        order: sortOrder,
        search: debouncedSearch
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
  }, [roleFilter, sortBy, sortOrder, debouncedSearch]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Memoized filtered users for client-side search
  const filteredUsers = useMemo(() => 
    users.filter(user => 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
  , [users, searchTerm]);

  const getScoreColor = useCallback((score) => {
    if (score > 80) return "text-green-600 bg-green-50 border-green-200";
    if (score > 40) return "text-blue-600 bg-blue-50 border-blue-200";
    return "text-slate-600 bg-slate-50 border-slate-200";
  }, []);

  const handleSearchChange = useCallback((e) => {
    setSearchTerm(e.target.value);
  }, []);

  const handleRoleFilterChange = useCallback((e) => {
    setRoleFilter(e.target.value);
  }, []);

  const handleSortByDate = useCallback(() => {
    setSortBy("createdAt");
  }, []);

  const handleSortByScore = useCallback(() => {
    setSortBy("couponScore");
  }, []);

  const handleToggleSortOrder = useCallback(() => {
    setSortOrder(prev => prev === "asc" ? "desc" : "asc");
  }, []);

  const handleSelectUser = useCallback((user) => {
    setSelectedUser(user);
  }, []);

  const handleMessageUser = useCallback((user) => {
    navigate('/admin/chat', { state: { selectedUser: user } });
  }, [navigate]);

  const handleCloseModal = useCallback(() => {
    setSelectedUser(null);
  }, []);

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
            onChange={handleSearchChange}
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
              onChange={handleRoleFilterChange}
            >
              <option value="all">All Roles</option>
              <option value="general">General</option>
              <option value="business">Business</option>
            </select>
          </div>

          {/* Sort By Field */}
          <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white">
            <button
              onClick={handleSortByDate}
              className={`px-3 py-2 text-sm flex items-center gap-2 ${sortBy === "createdAt" ? "bg-slate-100 font-semibold text-slate-800" : "text-slate-500 hover:bg-slate-50"}`}
            >
              <Calendar size={16} /> Date
            </button>
            <div className="w-[1px] h-full bg-slate-200"></div>
            <button
              onClick={handleSortByScore}
              className={`px-3 py-2 text-sm flex items-center gap-2 ${sortBy === "couponScore" ? "bg-blue-50 font-semibold text-blue-600" : "text-slate-500 hover:bg-slate-50"}`}
            >
              <Trophy size={16} /> Points
            </button>
          </div>

          {/* Sort Order (Asc/Desc) */}
          <button
            onClick={handleToggleSortOrder}
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
                <UserRow
                  key={user._id}
                  user={user}
                  onSelectUser={handleSelectUser}
                  onMessageUser={handleMessageUser}
                  getScoreColor={getScoreColor}
                />
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
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden relative animate-fade-in max-h-[90vh] flex flex-col">
            
            {/* Header Image/Banner */}
            <div className="h-24 bg-gradient-to-r from-slate-800 to-slate-900 relative">
               <button 
                  onClick={handleCloseModal}
                  className="absolute top-4 right-4 text-white/80 hover:text-white text-2xl leading-none"
               >
                 &times;
               </button>
            </div>

            {/* Profile Content */}
            <div className="px-6 pb-6 overflow-y-auto">
              {/* Avatar */}
              <div className="relative -mt-12 mb-4 flex justify-between items-end">
                <div className="w-24 h-24 rounded-full border-4 border-white bg-white overflow-hidden shadow-md">
                   {selectedUser.profilePic ? (
                     <img src={getDocumentUrl(selectedUser.profilePic)} className="w-full h-full object-cover" loading="lazy" />
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

              {/* Interests Tags */}
              <div className="mb-6">
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

              {/* ===== BUSINESS USER DETAILS ===== */}
              {selectedUser.userType === 'business' && (
                <div className="mb-6 space-y-5">
                  {/* Company & Contact */}
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3 border-b border-slate-200 pb-1">Business Info</h4>
                    <div className="grid grid-cols-[100px_1fr] gap-2 text-sm">
                      {selectedUser.companyName && (
                        <><span className="text-slate-500">Company:</span><span className="font-medium">{selectedUser.companyName}</span></>
                      )}
                      {selectedUser.productType && (
                        <><span className="text-slate-500">Product:</span><span className="font-medium">{selectedUser.productType}</span></>
                      )}
                      {selectedUser.phone && (
                        <><span className="text-slate-500">Phone:</span><span className="font-medium">{selectedUser.phone}</span></>
                      )}
                      {selectedUser.address && (
                        <><span className="text-slate-500">Address:</span><span className="font-medium">{selectedUser.address}</span></>
                      )}
                      {selectedUser.country && (
                        <><span className="text-slate-500">Country:</span><span className="font-medium">{selectedUser.country}</span></>
                      )}
                      {selectedUser.bio && (
                        <><span className="text-slate-500">Bio:</span><span className="font-medium">{selectedUser.bio}</span></>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {selectedUser.cashOnDeliveryAvailable && <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded font-bold">COD Available</span>}
                      {selectedUser.allIndiaDelivery && <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded font-bold">All India Delivery</span>}
                      {selectedUser.freeShipping && <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded font-bold">Free Shipping</span>}
                      {selectedUser.requireChatBeforePurchase && <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded font-bold">Chat Before Purchase</span>}
                      {selectedUser.autoReplyEnabled && <span className="px-2 py-1 bg-teal-100 text-teal-700 text-xs rounded font-bold">Auto-Reply On</span>}
                    </div>
                    {selectedUser.returnPolicy && (
                      <div className="mt-3 text-sm"><span className="text-slate-500">Return Policy:</span><p className="font-medium mt-1 bg-white p-2 rounded border border-slate-100">{selectedUser.returnPolicy}</p></div>
                    )}
                  </div>

                  {/* Legal & ID */}
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3 border-b border-slate-200 pb-1">Legal & ID Details</h4>
                    <div className="grid grid-cols-[100px_1fr] gap-2 text-sm">
                      <span className="text-slate-500">GST No:</span>
                      <span className="font-mono bg-white px-1 rounded border border-slate-100">{selectedUser.gstNumber || 'N/A'}</span>
                      <span className="text-slate-500">ID Type:</span>
                      <span className="font-medium">{selectedUser.idProofType || 'N/A'}</span>
                      <span className="text-slate-500">ID Number:</span>
                      <span className="font-mono bg-white px-1 rounded border border-slate-100">{selectedUser.idProofNumber || 'N/A'}</span>
                    </div>
                    {/* ID Proof Document */}
                    <div className="mt-3">
                      <p className="text-slate-500 text-sm mb-2">Attached ID Proof:</p>
                      {selectedUser.idProofUrl ? (
                        selectedUser.idProofUrl.toLowerCase().includes('.pdf') ? (
                          <a href={getDocumentUrl(selectedUser.idProofUrl)} target="_blank" rel="noreferrer"
                            className="flex flex-col items-center justify-center w-full h-24 bg-white rounded border hover:bg-slate-100 transition-colors gap-1 text-slate-600">
                            <span className="text-3xl">📄</span>
                            <span className="text-xs font-bold">Click to View PDF</span>
                          </a>
                        ) : (
                          <a href={getDocumentUrl(selectedUser.idProofUrl)} target="_blank" rel="noreferrer"
                            className="block w-full h-24 bg-white rounded border hover:opacity-90 transition-opacity overflow-hidden relative group">
                            <img src={getDocumentUrl(selectedUser.idProofUrl)} alt="ID Proof" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-bold">Click to Enlarge</div>
                          </a>
                        )
                      ) : (
                        <div className="w-full h-16 bg-red-50 text-red-500 border border-red-100 rounded flex items-center justify-center text-sm">No ID Document Uploaded</div>
                      )}
                    </div>
                  </div>

                  {/* Payment Details */}
                  {selectedUser.paymentDetails && (selectedUser.paymentDetails.upiId || selectedUser.paymentDetails.accountNumber || selectedUser.paymentDetails.bankName) && (
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3 border-b border-slate-200 pb-1">Payment Details</h4>
                      <div className="grid grid-cols-[100px_1fr] gap-2 text-sm">
                        {selectedUser.paymentDetails.upiId && (
                          <><span className="text-slate-500">UPI ID:</span><span className="font-mono bg-white px-1 rounded border border-slate-100">{selectedUser.paymentDetails.upiId}</span></>
                        )}
                        {selectedUser.paymentDetails.bankName && (
                          <><span className="text-slate-500">Bank:</span><span className="font-medium">{selectedUser.paymentDetails.bankName}</span></>
                        )}
                        {selectedUser.paymentDetails.accountHolderName && (
                          <><span className="text-slate-500">Holder:</span><span className="font-medium">{selectedUser.paymentDetails.accountHolderName}</span></>
                        )}
                        {selectedUser.paymentDetails.accountNumber && (
                          <><span className="text-slate-500">Account:</span><span className="font-mono bg-white px-1 rounded border border-slate-100">{selectedUser.paymentDetails.accountNumber}</span></>
                        )}
                        {selectedUser.paymentDetails.ifsc && (
                          <><span className="text-slate-500">IFSC:</span><span className="font-mono bg-white px-1 rounded border border-slate-100">{selectedUser.paymentDetails.ifsc}</span></>
                        )}
                        {selectedUser.paymentDetails.phone && (
                          <><span className="text-slate-500">Phone:</span><span className="font-medium">{selectedUser.paymentDetails.phone}</span></>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

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