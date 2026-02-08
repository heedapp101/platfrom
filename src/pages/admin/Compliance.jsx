import { useState, useEffect } from "react";
import { API_BASE_URL } from "../../config/api";

const SEVERITY_CONFIG = {
  critical: { bg: "bg-red-100", text: "text-red-800", border: "border-red-300", icon: "🚨" },
  high: { bg: "bg-orange-100", text: "text-orange-800", border: "border-orange-300", icon: "⚠️" },
  medium: { bg: "bg-yellow-100", text: "text-yellow-800", border: "border-yellow-300", icon: "⚡" },
  low: { bg: "bg-blue-100", text: "text-blue-800", border: "border-blue-300", icon: "ℹ️" },
};

const SOURCE_CONFIG = {
  mongodb: { icon: "🍃", label: "MongoDB" },
  cloudflare: { icon: "☁️", label: "Cloudflare" },
  "google-vision": { icon: "👁️", label: "Google Vision" },
  auth: { icon: "🔐", label: "Auth" },
  payment: { icon: "💳", label: "Payment" },
  socket: { icon: "🔌", label: "Socket" },
  api: { icon: "🌐", label: "API" },
  system: { icon: "⚙️", label: "System" },
  unknown: { icon: "❓", label: "Unknown" },
};

export default function Compliance() {
  const [activeTab, setActiveTab] = useState("errors");
  const [errors, setErrors] = useState([]);
  const [stats, setStats] = useState(null);
  const [emailConfig, setEmailConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedError, setSelectedError] = useState(null);
  
  // Filters
  const [filters, setFilters] = useState({
    severity: "",
    source: "",
    resolved: "",
    search: "",
  });
  
  // Pagination
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  
  // New recipient form
  const [newRecipient, setNewRecipient] = useState({
    email: "",
    name: "",
    notifyOn: ["critical", "high"],
    sources: ["all"],
  });
  
  const token = localStorage.getItem("token");

  const fetchErrors = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: page.toString(), limit: "30" });
      if (filters.severity) params.append("severity", filters.severity);
      if (filters.source) params.append("source", filters.source);
      if (filters.resolved) params.append("resolved", filters.resolved);
      if (filters.search) params.append("search", filters.search);
      
      const res = await fetch(`${API_BASE_URL}/compliance/errors?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setErrors(data.errors || []);
      setStats(data.stats || null);
      setPagination(data.pagination || { page: 1, pages: 1, total: 0 });
    } catch (error) {
      console.error("Error fetching errors:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmailConfig = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/compliance/email-config`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setEmailConfig(data);
    } catch (error) {
      console.error("Error fetching email config:", error);
    }
  };

  useEffect(() => {
    fetchErrors();
    fetchEmailConfig();
  }, []);

  useEffect(() => {
    fetchErrors(1);
  }, [filters]);

  const handleResolve = async (errorId, resolved) => {
    try {
      await fetch(`${API_BASE_URL}/compliance/errors/${errorId}/resolve`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ resolved, notes: "Resolved via admin dashboard" }),
      });
      fetchErrors(pagination.page);
    } catch (error) {
      console.error("Error resolving:", error);
    }
  };

  const handleDeleteErrors = async (ids = null, deleteAll = false, deleteResolved = false) => {
    if (!confirm(deleteAll ? "Delete ALL error logs?" : deleteResolved ? "Delete all resolved errors?" : "Delete selected errors?")) return;
    
    try {
      await fetch(`${API_BASE_URL}/compliance/errors`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ids, deleteAll, deleteResolved }),
      });
      fetchErrors(1);
    } catch (error) {
      console.error("Error deleting:", error);
    }
  };

  const handleAddRecipient = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE_URL}/compliance/email-config/recipients`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newRecipient),
      });
      if (res.ok) {
        fetchEmailConfig();
        setNewRecipient({ email: "", name: "", notifyOn: ["critical", "high"], sources: ["all"] });
      }
    } catch (error) {
      console.error("Error adding recipient:", error);
    }
  };

  const handleRemoveRecipient = async (email) => {
    if (!confirm(`Remove ${email}?`)) return;
    try {
      await fetch(`${API_BASE_URL}/compliance/email-config/recipients/${encodeURIComponent(email)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchEmailConfig();
    } catch (error) {
      console.error("Error removing recipient:", error);
    }
  };

  const handleToggleRecipient = async (email, active) => {
    try {
      await fetch(`${API_BASE_URL}/compliance/email-config/recipients/${encodeURIComponent(email)}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ active }),
      });
      fetchEmailConfig();
    } catch (error) {
      console.error("Error toggling recipient:", error);
    }
  };

  const handleTestEmail = async (email) => {
    try {
      const res = await fetch(`${API_BASE_URL}/compliance/email-config/test`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      alert(data.message);
    } catch (error) {
      alert("Failed to send test email");
    }
  };

  const handleToggleEmailService = async () => {
    if (!emailConfig) return;
    try {
      await fetch(`${API_BASE_URL}/compliance/email-config`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ enabled: !emailConfig.enabled }),
      });
      fetchEmailConfig();
    } catch (error) {
      console.error("Error toggling email service:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Compliance & Error Monitoring</h1>
          <p className="text-slate-500">Track system errors and manage notifications</p>
        </div>
        
        {/* Quick Stats */}
        {stats && (
          <div className="flex gap-4">
            <div className="bg-red-50 px-4 py-2 rounded-lg">
              <p className="text-xs text-red-600">Critical</p>
              <p className="text-xl font-bold text-red-700">{stats.bySeverity?.critical || 0}</p>
            </div>
            <div className="bg-orange-50 px-4 py-2 rounded-lg">
              <p className="text-xs text-orange-600">High</p>
              <p className="text-xl font-bold text-orange-700">{stats.bySeverity?.high || 0}</p>
            </div>
            <div className="bg-yellow-50 px-4 py-2 rounded-lg">
              <p className="text-xs text-yellow-600">Unresolved</p>
              <p className="text-xl font-bold text-yellow-700">{stats.unresolved || 0}</p>
            </div>
            <div className="bg-green-50 px-4 py-2 rounded-lg">
              <p className="text-xs text-green-600">Last 24h</p>
              <p className="text-xl font-bold text-green-700">{stats.last24h || 0}</p>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex gap-4">
          {[
            { id: "errors", label: "📋 Error Logs", count: stats?.total },
            { id: "email", label: "📧 Email Settings" },
            { id: "recipients", label: "👥 Recipients", count: emailConfig?.recipients?.length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className="ml-2 bg-slate-200 px-2 py-0.5 rounded-full text-xs">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Error Logs Tab */}
      {activeTab === "errors" && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="bg-white rounded-xl p-4 shadow-sm flex flex-wrap gap-4 items-center">
            <input
              type="text"
              placeholder="Search errors..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="border rounded-lg px-3 py-2 w-64"
            />
            <select
              value={filters.severity}
              onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
              className="border rounded-lg px-3 py-2"
            >
              <option value="">All Severity</option>
              <option value="critical">🚨 Critical</option>
              <option value="high">⚠️ High</option>
              <option value="medium">⚡ Medium</option>
              <option value="low">ℹ️ Low</option>
            </select>
            <select
              value={filters.source}
              onChange={(e) => setFilters({ ...filters, source: e.target.value })}
              className="border rounded-lg px-3 py-2"
            >
              <option value="">All Sources</option>
              {Object.entries(SOURCE_CONFIG).map(([key, val]) => (
                <option key={key} value={key}>{val.icon} {val.label}</option>
              ))}
            </select>
            <select
              value={filters.resolved}
              onChange={(e) => setFilters({ ...filters, resolved: e.target.value })}
              className="border rounded-lg px-3 py-2"
            >
              <option value="">All Status</option>
              <option value="false">🔴 Unresolved</option>
              <option value="true">✅ Resolved</option>
            </select>
            
            <div className="flex-1" />
            
            <button
              onClick={() => handleDeleteErrors(null, false, true)}
              className="px-3 py-2 text-sm bg-slate-100 hover:bg-slate-200 rounded-lg"
            >
              🗑️ Clear Resolved
            </button>
            <button
              onClick={() => fetchErrors(pagination.page)}
              className="px-3 py-2 text-sm bg-blue-500 text-white hover:bg-blue-600 rounded-lg"
            >
              🔄 Refresh
            </button>
          </div>

          {/* Error List */}
          {loading ? (
            <div className="text-center py-12 text-slate-500">Loading...</div>
          ) : errors.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center">
              <p className="text-4xl mb-4">✨</p>
              <p className="text-slate-600">No errors found. System is healthy!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {errors.map((error) => {
                const sevConfig = SEVERITY_CONFIG[error.severity] || SEVERITY_CONFIG.medium;
                const srcConfig = SOURCE_CONFIG[error.source] || SOURCE_CONFIG.unknown;
                
                return (
                  <div
                    key={error._id}
                    className={`bg-white rounded-xl p-4 shadow-sm border-l-4 ${sevConfig.border} cursor-pointer hover:shadow-md transition-shadow`}
                    onClick={() => setSelectedError(error)}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`px-2 py-1 rounded-lg ${sevConfig.bg}`}>
                        <span className="text-lg">{sevConfig.icon}</span>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded ${sevConfig.bg} ${sevConfig.text}`}>
                            {error.severity.toUpperCase()}
                          </span>
                          <span className="text-xs bg-slate-100 px-2 py-0.5 rounded">
                            {srcConfig.icon} {srcConfig.label}
                          </span>
                          {error.resolved && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                              ✅ Resolved
                            </span>
                          )}
                          {error.emailSent && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                              📧 Notified
                            </span>
                          )}
                        </div>
                        
                        <p className="text-sm font-medium text-slate-800 truncate">
                          {error.message}
                        </p>
                        
                        <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                          <span>{error.method} {error.endpoint}</span>
                          <span>•</span>
                          <span>{new Date(error.occurredAt).toLocaleString()}</span>
                          <span>•</span>
                          <span>{error.errorCode}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleResolve(error._id, !error.resolved)}
                          className={`px-3 py-1.5 text-xs rounded-lg ${
                            error.resolved
                              ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                              : "bg-green-100 text-green-700 hover:bg-green-200"
                          }`}
                        >
                          {error.resolved ? "Reopen" : "Resolve"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex justify-center gap-2">
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).slice(0, 10).map((page) => (
                <button
                  key={page}
                  onClick={() => fetchErrors(page)}
                  className={`px-3 py-1 rounded ${
                    pagination.page === page ? "bg-blue-500 text-white" : "bg-slate-100 hover:bg-slate-200"
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Email Settings Tab */}
      {activeTab === "email" && emailConfig && (
        <div className="bg-white rounded-xl p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Email Notification Service</h2>
              <p className="text-sm text-slate-500">Configure error alert emails</p>
            </div>
            <button
              onClick={handleToggleEmailService}
              className={`px-4 py-2 rounded-lg font-medium ${
                emailConfig.enabled
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {emailConfig.enabled ? "✅ Enabled" : "🔴 Disabled"}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-medium text-slate-700">SMTP Configuration</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-slate-500">SMTP Host</label>
                  <input
                    type="text"
                    value={emailConfig.smtpHost}
                    disabled
                    className="w-full border rounded-lg px-3 py-2 bg-slate-50"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-500">SMTP User</label>
                  <input
                    type="text"
                    value={emailConfig.smtpUser}
                    disabled
                    className="w-full border rounded-lg px-3 py-2 bg-slate-50"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-500">From Email</label>
                  <input
                    type="text"
                    value={emailConfig.fromEmail}
                    disabled
                    className="w-full border rounded-lg px-3 py-2 bg-slate-50"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-medium text-slate-700">Rate Limiting</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                  <span className="text-sm text-slate-600">Max Emails/Hour</span>
                  <span className="font-medium">{emailConfig.maxEmailsPerHour}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                  <span className="text-sm text-slate-600">Sent This Hour</span>
                  <span className="font-medium">{emailConfig.emailsSentThisHour}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                  <span className="text-sm text-slate-600">Cooldown (min)</span>
                  <span className="font-medium">{emailConfig.cooldownMinutes}</span>
                </div>
              </div>
              
              {emailConfig.lastTestedAt && (
                <div className={`p-3 rounded-lg ${
                  emailConfig.lastTestStatus === "success" ? "bg-green-50" : "bg-red-50"
                }`}>
                  <p className="text-sm">
                    Last Test: {new Date(emailConfig.lastTestedAt).toLocaleString()}
                  </p>
                  <p className={`text-sm font-medium ${
                    emailConfig.lastTestStatus === "success" ? "text-green-700" : "text-red-700"
                  }`}>
                    Status: {emailConfig.lastTestStatus}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Recipients Tab */}
      {activeTab === "recipients" && emailConfig && (
        <div className="space-y-6">
          {/* Add Recipient Form */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Add Email Recipient</h2>
            <form onSubmit={handleAddRecipient} className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[200px]">
                <label className="text-sm text-slate-500">Email</label>
                <input
                  type="email"
                  required
                  value={newRecipient.email}
                  onChange={(e) => setNewRecipient({ ...newRecipient, email: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="admin@example.com"
                />
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="text-sm text-slate-500">Name</label>
                <input
                  type="text"
                  required
                  value={newRecipient.name}
                  onChange={(e) => setNewRecipient({ ...newRecipient, name: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="text-sm text-slate-500">Notify On</label>
                <div className="flex gap-2">
                  {["critical", "high", "medium", "low"].map((sev) => (
                    <label key={sev} className="flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={newRecipient.notifyOn.includes(sev)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewRecipient({ ...newRecipient, notifyOn: [...newRecipient.notifyOn, sev] });
                          } else {
                            setNewRecipient({ ...newRecipient, notifyOn: newRecipient.notifyOn.filter((s) => s !== sev) });
                          }
                        }}
                      />
                      <span className="text-xs capitalize">{sev}</span>
                    </label>
                  ))}
                </div>
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                ➕ Add Recipient
              </button>
            </form>
          </div>

          {/* Recipients List */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Current Recipients</h2>
            
            {emailConfig.recipients?.length === 0 ? (
              <p className="text-slate-500 text-center py-8">No recipients configured</p>
            ) : (
              <div className="space-y-3">
                {emailConfig.recipients?.map((recipient) => (
                  <div
                    key={recipient.email}
                    className={`flex items-center gap-4 p-4 rounded-lg border ${
                      recipient.active ? "bg-white" : "bg-slate-50"
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      recipient.active ? "bg-green-100" : "bg-slate-200"
                    }`}>
                      {recipient.active ? "✅" : "⏸️"}
                    </div>
                    
                    <div className="flex-1">
                      <p className="font-medium">{recipient.name}</p>
                      <p className="text-sm text-slate-500">{recipient.email}</p>
                      <div className="flex gap-2 mt-1">
                        {recipient.notifyOn?.map((sev) => (
                          <span key={sev} className={`text-xs px-2 py-0.5 rounded ${SEVERITY_CONFIG[sev]?.bg} ${SEVERITY_CONFIG[sev]?.text}`}>
                            {sev}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleTestEmail(recipient.email)}
                        className="px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
                      >
                        📧 Test
                      </button>
                      <button
                        onClick={() => handleToggleRecipient(recipient.email, !recipient.active)}
                        className={`px-3 py-1.5 text-sm rounded-lg ${
                          recipient.active
                            ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                            : "bg-green-100 text-green-700 hover:bg-green-200"
                        }`}
                      >
                        {recipient.active ? "Pause" : "Enable"}
                      </button>
                      <button
                        onClick={() => handleRemoveRecipient(recipient.email)}
                        className="px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error Detail Modal */}
      {selectedError && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedError(null)}>
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b sticky top-0 bg-white flex items-center justify-between">
              <h2 className="text-lg font-semibold">Error Details</h2>
              <button onClick={() => setSelectedError(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">Error Code</p>
                  <p className="font-mono text-sm">{selectedError.errorCode}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Severity</p>
                  <span className={`text-sm font-medium px-2 py-0.5 rounded ${SEVERITY_CONFIG[selectedError.severity]?.bg} ${SEVERITY_CONFIG[selectedError.severity]?.text}`}>
                    {selectedError.severity.toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Source</p>
                  <p>{SOURCE_CONFIG[selectedError.source]?.icon} {SOURCE_CONFIG[selectedError.source]?.label}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Endpoint</p>
                  <p className="font-mono text-sm">{selectedError.method} {selectedError.endpoint}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Status Code</p>
                  <p>{selectedError.statusCode || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Occurred At</p>
                  <p>{new Date(selectedError.occurredAt).toLocaleString()}</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-slate-500 mb-1">Message</p>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-800">{selectedError.message}</p>
                </div>
              </div>
              
              {selectedError.stack && (
                <div>
                  <p className="text-sm text-slate-500 mb-1">Stack Trace</p>
                  <pre className="bg-slate-900 text-slate-100 rounded-lg p-4 text-xs overflow-x-auto">
                    {selectedError.stack}
                  </pre>
                </div>
              )}
              
              {selectedError.userId && (
                <div>
                  <p className="text-sm text-slate-500 mb-1">User</p>
                  <p className="text-sm">{selectedError.userId.username || selectedError.userId} ({selectedError.userEmail})</p>
                </div>
              )}
              
              {selectedError.clientIp && (
                <div>
                  <p className="text-sm text-slate-500 mb-1">Client IP</p>
                  <p className="font-mono text-sm">{selectedError.clientIp}</p>
                </div>
              )}
              
              {selectedError.emailSent && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-blue-800">
                    📧 Email notification sent at {new Date(selectedError.emailSentAt).toLocaleString()}
                  </p>
                  <p className="text-xs text-blue-600">To: {selectedError.emailRecipients?.join(", ")}</p>
                </div>
              )}
            </div>
            
            <div className="p-4 border-t flex justify-end gap-2">
              <button
                onClick={() => {
                  handleResolve(selectedError._id, !selectedError.resolved);
                  setSelectedError(null);
                }}
                className={`px-4 py-2 rounded-lg ${
                  selectedError.resolved
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-green-500 text-white"
                }`}
              >
                {selectedError.resolved ? "Reopen Issue" : "Mark Resolved"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
