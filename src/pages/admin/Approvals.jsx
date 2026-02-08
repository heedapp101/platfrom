import { useEffect, useState } from "react";
import { API_ENDPOINTS, getDocumentUrl } from "../../config/api";

export default function Approvals() {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null); // Data for the modal

  // 1. Fetch Data
  const fetchApprovals = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(API_ENDPOINTS.ADMIN.APPROVALS, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setPendingUsers(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, []);

  // 2. Actions (Approve/Reject)
  const handleAction = async (id, action) => {
    const token = localStorage.getItem("token");
    const method = action === "approve" ? "PUT" : "DELETE";
    const url = action === "approve" 
      ? API_ENDPOINTS.ADMIN.APPROVE(id)
      : API_ENDPOINTS.ADMIN.REJECT(id);

    try {
      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (res.ok) {
        setPendingUsers((prev) => prev.filter((u) => u._id !== id));
        setSelectedUser(null);
      } else {
        alert("Action failed");
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="p-6 relative">
      <h1 className="text-2xl font-bold mb-6 text-slate-800">Pending Business Approvals</h1>

      {loading ? (
        <p className="text-slate-500">Loading requests...</p>
      ) : pendingUsers.length === 0 ? (
        <div className="text-slate-500 italic">No pending approvals found.</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {pendingUsers.map((user) => (
            <div 
              key={user._id} 
              onClick={() => setSelectedUser(user)}
              className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-slate-100 overflow-hidden flex-shrink-0">
                  {user.profilePic ? (
                    <img src={getDocumentUrl(user.profilePic)} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl font-bold text-slate-400">
                      {user.companyName?.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                    {user.companyName}
                  </h3>
                  <p className="text-xs text-slate-500">Owner: {user.name}</p>
                </div>
              </div>

              <div className="space-y-1 text-sm text-slate-600 mb-4">
                 <p><span className="font-semibold">Type:</span> {user.productType || "N/A"}</p>
                 <p><span className="font-semibold">Loc:</span> {user.location || user.country || "N/A"}</p>
              </div>

              <button 
                className="w-full py-2 bg-slate-50 text-slate-600 rounded font-medium text-sm group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors"
              >
                View Full Details
              </button>
            </div>
          ))}
        </div>
      )}

      {/* =======================
          DETAILS MODAL
      ======================= */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            
            <div className="p-6 border-b flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-bold text-slate-800">Business Application Details</h2>
              <button 
                onClick={() => setSelectedUser(null)}
                className="text-slate-400 hover:text-slate-600 text-2xl leading-none"
              >
                &times;
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              <div className="flex gap-6 mb-8">
                 <div className="w-24 h-24 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0 border">
                    {selectedUser.profilePic ? (
                      <img src={getDocumentUrl(selectedUser.profilePic)} className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex items-center justify-center h-full text-slate-300 text-4xl">🏢</div>
                    )}
                 </div>
                 <div>
                    <h3 className="text-2xl font-bold text-slate-800">{selectedUser.companyName}</h3>
                    <p className="text-slate-500">@{selectedUser.username}</p>
                    <div className="mt-2 flex gap-2">
                       <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded font-bold">
                         {selectedUser.productType || "Retail"}
                       </span>
                       {selectedUser.cashOnDeliveryAvailable && (
                         <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded font-bold">
                           COD Available
                         </span>
                       )}
                    </div>
                 </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-bold text-sm text-slate-400 uppercase tracking-wider border-b pb-1">Contact Info</h4>
                  <div className="grid grid-cols-[80px_1fr] gap-2 text-sm">
                    <span className="text-slate-500">Owner:</span>
                    <span className="font-medium">{selectedUser.name}</span>
                    <span className="text-slate-500">Email:</span>
                    <span className="font-medium truncate" title={selectedUser.email}>{selectedUser.email}</span>
                    <span className="text-slate-500">Phone:</span>
                    <span className="font-medium">{selectedUser.phone}</span>
                    <span className="text-slate-500">Address:</span>
                    <span className="font-medium">{selectedUser.address || "N/A"}</span>
                    <span className="text-slate-500">Country:</span>
                    <span className="font-medium">{selectedUser.country || "N/A"}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-bold text-sm text-slate-400 uppercase tracking-wider border-b pb-1">Legal Details</h4>
                  <div className="grid grid-cols-[80px_1fr] gap-2 text-sm">
                    <span className="text-slate-500">GST No:</span>
                    <span className="font-mono bg-slate-100 px-1 rounded">{selectedUser.gstNumber || "N/A"}</span>
                    <span className="text-slate-500">ID Type:</span>
                    <span className="font-medium">{selectedUser.idProofType || "N/A"}</span>
                  </div>

                  {/* ✅ MODIFIED: PDF / IMAGE HANDLING */}
                  <div className="mt-4">
                    <p className="text-slate-500 text-sm mb-2">Attached ID Proof:</p>
                    {selectedUser.idProofUrl ? (
                      selectedUser.idProofUrl.toLowerCase().includes(".pdf") ? (
                        // 📄 PDF VIEW
                        <a 
                          href={getDocumentUrl(selectedUser.idProofUrl)} 
                          target="_blank" 
                          rel="noreferrer"
                          className="flex flex-col items-center justify-center w-full h-32 bg-slate-100 rounded border hover:bg-slate-200 transition-colors gap-2 text-slate-600"
                        >
                           <span className="text-4xl">📄</span>
                           <span className="text-sm font-bold">Click to View PDF Document</span>
                           <span className="text-xs text-slate-400">(Secure Link Generated)</span>
                        </a>
                      ) : (
                        // 🖼️ IMAGE VIEW
                        <a 
                          href={getDocumentUrl(selectedUser.idProofUrl)} 
                          target="_blank" 
                          rel="noreferrer"
                          className="block w-full h-32 bg-slate-100 rounded border hover:opacity-90 transition-opacity overflow-hidden relative group"
                        >
                           <img 
                             src={getDocumentUrl(selectedUser.idProofUrl)} 
                             alt="ID Proof" 
                             className="w-full h-full object-cover" 
                           />
                           <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-bold">
                             Click to Enlarge
                           </div>
                        </a>
                      )
                    ) : (
                      <div className="w-full h-24 bg-red-50 text-red-500 border border-red-100 rounded flex items-center justify-center text-sm">
                        No ID Document Uploaded
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t bg-slate-50 flex justify-end gap-3">
              <button
                onClick={() => handleAction(selectedUser._id, "reject")}
                className="px-6 py-2 border border-red-200 text-red-600 font-semibold rounded-lg hover:bg-red-50 transition-colors"
              >
                Reject Application
              </button>
              <button
                onClick={() => handleAction(selectedUser._id, "approve")}
                className="px-6 py-2 bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20"
              >
                Approve Business
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}