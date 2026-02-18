import { useEffect, useMemo, useState } from "react";
import { Award, Trophy, User, Image, Eye, EyeOff, Search, Filter, X, AlertCircle } from "lucide-react";
import { API_ENDPOINTS } from "../../config/api";

const messages = [
  "This post has exceptional engagement!",
  "Great content that our community loves",
  "Featured for outstanding quality",
];

const getPayment = (type, data) => (type === "post" ? data?.user?.awardPaymentMethod : data?.awardPaymentMethod);
const statusCls = (s) =>
  s === "paid" ? "bg-green-100 text-green-700" : s === "approved" ? "bg-blue-100 text-blue-700" : s === "rejected" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700";
const getMethodDisplay = (method) => {
  if (!method?.type || !method?.value) return "Not set";
  return method.type === "upi" ? `UPI: ${method.value}` : `Phone: ${method.value}`;
};

export default function Awards() {
  const [activeTab, setActiveTab] = useState("candidates");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [candidates, setCandidates] = useState({ topPosts: [], topUsers: [] });
  const [awards, setAwards] = useState([]);
  const [target, setTarget] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    message: messages[0],
    amount: "",
    showInFeed: true,
    paymentMethodType: "upi",
    paymentMethodValue: "",
    editPaymentMethod: false,
    requestPaymentFirst: false,
  });

  useEffect(() => {
    activeTab === "candidates" ? fetchCandidates() : fetchAwards();
  }, [activeTab, statusFilter]);

  const fetchCandidates = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(API_ENDPOINTS.ADMIN.AWARDS_CANDIDATES, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok) setCandidates({ topPosts: data.topPosts || data.candidates || [], topUsers: data.topUsers || [] });
    } finally {
      setLoading(false);
    }
  };

  const fetchAwards = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    try {
      const p = new URLSearchParams();
      if (activeTab !== "all") p.append("type", activeTab === "posts" ? "post" : "user");
      if (statusFilter !== "all") p.append("status", statusFilter);
      const res = await fetch(`${API_ENDPOINTS.ADMIN.AWARDS_ALL}?${p.toString()}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok) setAwards(data.awards || []);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (type, data) => {
    const payment = getPayment(type, data);
    setTarget({ type, data });
    setForm({
      message: type === "user" ? "This account has exceptional engagement!" : messages[0],
      amount: "",
      showInFeed: true,
      paymentMethodType: payment?.type || "upi",
      paymentMethodValue: payment?.value || "",
      editPaymentMethod: false,
      requestPaymentFirst: !(payment?.type && payment?.value),
    });
  };

  const submitAward = async () => {
    if (!target) return;
    setSubmitting(true);
    const token = localStorage.getItem("token");
    try {
      const requestFirst = !!form.requestPaymentFirst && !form.editPaymentMethod;
      const amount = form.amount === "" ? undefined : Number(form.amount);
      if (Number.isFinite(amount) && amount < 0) return alert("Amount must be 0 or greater.");
      if (form.editPaymentMethod && !form.paymentMethodValue.trim()) return alert("Please enter payment details or turn off payment edit.");
      const endpoint = target.type === "post" ? API_ENDPOINTS.ADMIN.AWARD_POST(target.data._id) : API_ENDPOINTS.ADMIN.AWARD_USER(target.data._id);
      const payload = { message: form.message, amount, showInFeed: form.showInFeed, requestPaymentFirst: requestFirst };
      if (form.editPaymentMethod && form.paymentMethodValue.trim()) {
        payload.paymentMethodType = form.paymentMethodType;
        payload.paymentMethodValue = form.paymentMethodValue.trim();
      }
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) return alert(data.message || "Failed to award");
      setTarget(null);
      activeTab === "candidates" ? fetchCandidates() : fetchAwards();
      if (requestFirst) alert("Award request sent. User has been asked to add/update payment details. You can mark it paid after they update.");
    } finally {
      setSubmitting(false);
    }
  };

  const updateAward = async (id, body) => {
    const token = localStorage.getItem("token");
    const res = await fetch(API_ENDPOINTS.ADMIN.UPDATE_AWARD(id), {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.message || "Failed to update award");
      return;
    }
    fetchAwards();
  };

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return awards;
    return awards.filter((a) => {
      const n = (a.targetPost?.title || a.targetUser?.name || "").toLowerCase();
      const u = (a.targetUser?.username || a.targetPost?.user?.username || "").toLowerCase();
      return n.includes(q) || u.includes(q);
    });
  }, [awards, searchTerm]);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><Trophy className="text-yellow-500" size={28} /> Awards Management</h1>
      <div className="flex gap-2 border-b border-slate-200 pb-2">
        {["candidates", "posts", "users", "all"].map((k) => (
          <button key={k} onClick={() => setActiveTab(k)} className={`px-4 py-2 rounded-t-lg font-medium ${activeTab === k ? "bg-slate-100 text-slate-800 border-b-2 border-slate-500" : "text-slate-500 hover:bg-slate-50"}`}>{k === "candidates" ? "Top Candidates" : k === "posts" ? "Awarded Posts" : k === "users" ? "Awarded Users" : "All Awards"}</button>
        ))}
      </div>
      {activeTab !== "candidates" && (
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md"><Search className="absolute left-3 top-2.5 text-slate-400" size={18} /><input className="w-full pl-10 pr-4 py-2 border rounded-lg" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
          <div className="flex items-center gap-2"><Filter size={16} className="text-slate-400" /><select className="px-3 py-2 border rounded-lg" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option value="all">All</option><option value="pending">Pending</option><option value="approved">Approved</option><option value="paid">Paid</option><option value="rejected">Rejected</option></select></div>
        </div>
      )}
      {loading ? <div className="text-center py-10 text-slate-500">Loading...</div> : activeTab === "candidates" ? (
        <Candidates candidates={candidates} onAward={openModal} />
      ) : (
        <AwardsTable awards={filtered} onStatus={(id, status) => updateAward(id, { status })} onVisibility={(id, showInFeed) => updateAward(id, { showInFeed: !showInFeed })} />
      )}
      {target && <AwardModal target={target} form={form} setForm={setForm} onClose={() => setTarget(null)} onSubmit={submitAward} submitting={submitting} />}
    </div>
  );
}

function Candidates({ candidates, onAward }) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-slate-700 flex items-center gap-2"><Image size={18} /> Top Posts</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{(candidates.topPosts || []).map((p) => <button key={p._id} onClick={() => onAward("post", p)} className="text-left p-4 border rounded-xl hover:bg-slate-50"><p className="font-medium line-clamp-2">{p.title || "Post"}</p><p className="text-xs text-slate-500 mt-1">@{p.user?.username}</p></button>)}</div>
      <h2 className="text-lg font-semibold text-slate-700 flex items-center gap-2"><User size={18} /> Top Users</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">{(candidates.topUsers || []).map((u) => <button key={u._id} onClick={() => onAward("user", u)} className="text-left p-4 border rounded-xl hover:bg-slate-50"><p className="font-medium">{u.name || u.username}</p><p className="text-xs text-slate-500 mt-1">@{u.username}</p></button>)}</div>
    </div>
  );
}

function AwardsTable({ awards, onStatus, onVisibility }) {
  if (!awards.length) return <div className="text-center py-12 text-slate-400">No awards found</div>;
  return (
    <div className="bg-white rounded-xl border overflow-hidden">
      <table className="w-full text-left">
        <thead className="bg-slate-50 text-slate-500 text-xs uppercase"><tr><th className="px-4 py-3">Target</th><th className="px-4 py-3">Amount</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Search Visibility</th><th className="px-4 py-3">Payment</th></tr></thead>
        <tbody className="divide-y">{awards.map((a) => { const fallback = a.targetUser?.awardPaymentMethod || a.targetPost?.user?.awardPaymentMethod; const m = a.paymentMethod || (a.status === "pending" ? null : fallback); return <tr key={a._id}><td className="px-4 py-3 text-sm">{a.type === "post" ? a.targetPost?.title || "Post" : a.targetUser?.name || a.targetUser?.username}</td><td className="px-4 py-3 text-sm">{a.amount > 0 ? `Rs ${a.amount}` : "-"}</td><td className="px-4 py-3"><select value={a.status} onChange={(e) => onStatus(a._id, e.target.value)} className={`text-xs px-2 py-1 rounded-full ${statusCls(a.status)}`}><option value="pending">Pending</option><option value="approved">Approved</option><option value="paid">Paid</option><option value="rejected">Rejected</option></select></td><td className="px-4 py-3"><button onClick={() => onVisibility(a._id, a.showInFeed)} className={`text-xs px-2 py-1 rounded-full ${a.showInFeed ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500"}`}>{a.showInFeed ? <Eye size={12} className="inline mr-1" /> : <EyeOff size={12} className="inline mr-1" />}{a.showInFeed ? "Visible" : "Hidden"}</button></td><td className="px-4 py-3 text-xs">{m?.value ? getMethodDisplay(m) : <span className="text-slate-400"><AlertCircle size={12} className="inline mr-1" />Waiting for user update</span>}</td></tr>; })}</tbody>
      </table>
    </div>
  );
}

function AwardModal({ target, form, setForm, onClose, onSubmit, submitting }) {
  const payment = getPayment(target.type, target.data);
  const hasPayment = !!(payment?.type && payment?.value);
  const requestFirst = !!form.requestPaymentFirst && !form.editPaymentMethod;
  const requestPaymentLabel = hasPayment
    ? "Request user to update payment method first"
    : "Request user to add payment method first";
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
        <div className="p-4 border-b flex items-center justify-between"><h3 className="font-semibold">Award {target.type === "post" ? "Post" : "User"}</h3><button onClick={onClose}><X size={20} /></button></div>
        <div className="p-4 space-y-3">
          <select className="w-full border rounded-lg p-2" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })}>{messages.map((m) => <option key={m} value={m}>{m}</option>)}</select>
          <label className="text-sm flex items-center gap-2"><input type="checkbox" checked={form.requestPaymentFirst} onChange={(e) => setForm({ ...form, requestPaymentFirst: e.target.checked, editPaymentMethod: e.target.checked ? false : form.editPaymentMethod })} /> {requestPaymentLabel}</label>
          <input type="number" className="w-full border rounded-lg p-2" placeholder="Award amount" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          {hasPayment && !form.editPaymentMethod && <button className="text-xs text-blue-600" onClick={() => setForm({ ...form, editPaymentMethod: true, requestPaymentFirst: false })}>Update payment method ({getMethodDisplay(payment)})</button>}
          {form.editPaymentMethod && <div className="space-y-2"><select className="w-full border rounded-lg p-2" value={form.paymentMethodType} onChange={(e) => setForm({ ...form, paymentMethodType: e.target.value })}><option value="upi">UPI</option><option value="phone">Phone</option></select><input className="w-full border rounded-lg p-2" placeholder={form.paymentMethodType === "upi" ? "example@oksbi" : "10-digit phone"} value={form.paymentMethodValue} onChange={(e) => setForm({ ...form, paymentMethodValue: e.target.value })} /><button className="text-xs text-slate-500" onClick={() => setForm({ ...form, editPaymentMethod: false })}>Turn off payment edit</button></div>}
          <label className="text-sm flex items-center gap-2"><input type="checkbox" checked={form.showInFeed} onChange={(e) => setForm({ ...form, showInFeed: e.target.checked })} /> Show in search/discovery feed</label>
        </div>
        <div className="p-4 border-t flex gap-2"><button onClick={onClose} className="flex-1 py-2 border rounded-lg">Cancel</button><button disabled={submitting} onClick={onSubmit} className="flex-1 py-2 bg-yellow-500 text-white rounded-lg">{submitting ? "Submitting..." : requestFirst ? "Send Award Request" : "Confirm Award"}</button></div>
      </div>
    </div>
  );
}
