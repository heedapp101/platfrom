import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, RefreshCcw, CheckCircle2, XCircle, Power, Pencil } from "lucide-react";
import { API_ENDPOINTS } from "../../config/api";

const buildDefaultForm = () => {
  const now = new Date();
  const start = now.toISOString().slice(0, 10);
  const endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const end = endDate.toISOString().slice(0, 10);
  return {
    title: "",
    subtitle: "",
    message: "",
    bannerImageUrl: "",
    brandLabel: "Heeszo",
    ctaLabel: "Participate",
    minPurchaseAmount: 1000,
    eligibilityMonth: now.getMonth() + 1,
    eligibilityYear: now.getFullYear(),
    startDate: start,
    endDate: end,
    priority: 999,
    isActive: true,
  };
};

const formatCurrency = (value) => `Rs ${Number(value || 0).toLocaleString("en-IN")}`;
const monthName = (month) => new Date(2000, Number(month || 1) - 1, 1).toLocaleString("en-IN", { month: "short" });

export default function AwardOffersPanel() {
  const [offers, setOffers] = useState([]);
  const [offersLoading, setOffersLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [savingOffer, setSavingOffer] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);
  const [form, setForm] = useState(buildDefaultForm);

  const [selectedOfferId, setSelectedOfferId] = useState("");
  const [applications, setApplications] = useState([]);
  const [applicationFilter, setApplicationFilter] = useState("all");
  const [applicationLoading, setApplicationLoading] = useState(false);
  const [eligibilityCache, setEligibilityCache] = useState({});
  const [reviewingId, setReviewingId] = useState("");

  const selectedOffer = useMemo(
    () => offers.find((offer) => offer._id === selectedOfferId) || null,
    [offers, selectedOfferId]
  );

  const fetchOffers = useCallback(async () => {
    setOffersLoading(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(API_ENDPOINTS.OFFERS.ADMIN_LIST, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        const list = data?.offers || [];
        setOffers(list);
        if (!selectedOfferId && list.length > 0) {
          setSelectedOfferId(list[0]._id);
        } else if (selectedOfferId && !list.some((offer) => offer._id === selectedOfferId)) {
          setSelectedOfferId(list[0]?._id || "");
        }
      }
    } catch (error) {
      console.error("Failed to fetch offers", error);
    } finally {
      setOffersLoading(false);
    }
  }, [selectedOfferId]);

  const fetchApplications = useCallback(
    async (offerId, status = "all") => {
      if (!offerId) return;
      setApplicationLoading(true);
      const token = localStorage.getItem("token");
      try {
        const params = status === "all" ? "" : `?status=${status}`;
        const res = await fetch(API_ENDPOINTS.OFFERS.ADMIN_APPLICATIONS(offerId, params), {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) {
          setApplications(data?.applications || []);
        } else {
          setApplications([]);
        }
      } catch (error) {
        console.error("Failed to fetch offer applications", error);
        setApplications([]);
      } finally {
        setApplicationLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchOffers();
  }, [fetchOffers]);

  useEffect(() => {
    if (!selectedOfferId) {
      setApplications([]);
      return;
    }
    fetchApplications(selectedOfferId, applicationFilter);
  }, [selectedOfferId, applicationFilter, fetchApplications]);

  const openCreate = () => {
    setEditingOffer(null);
    setForm(buildDefaultForm());
    setShowForm(true);
  };

  const openEdit = (offer) => {
    setEditingOffer(offer);
    setForm({
      title: offer.title || "",
      subtitle: offer.subtitle || "",
      message: offer.message || "",
      bannerImageUrl: offer.bannerImageUrl || "",
      brandLabel: offer.brandLabel || "Heeszo",
      ctaLabel: offer.ctaLabel || "Participate",
      minPurchaseAmount: Number(offer.minPurchaseAmount || 0),
      eligibilityMonth: Number(offer.eligibilityMonth || 1),
      eligibilityYear: Number(offer.eligibilityYear || new Date().getFullYear()),
      startDate: offer.startDate ? String(offer.startDate).slice(0, 10) : "",
      endDate: offer.endDate ? String(offer.endDate).slice(0, 10) : "",
      priority: Number(offer.priority || 999),
      isActive: Boolean(offer.isActive),
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingOffer(null);
  };

  const handleSaveOffer = async (e) => {
    e.preventDefault();
    setSavingOffer(true);
    const token = localStorage.getItem("token");
    try {
      const endpoint = editingOffer
        ? API_ENDPOINTS.OFFERS.ADMIN_UPDATE(editingOffer._id)
        : API_ENDPOINTS.OFFERS.ADMIN_CREATE;
      const method = editingOffer ? "PUT" : "POST";
      const payload = {
        ...form,
        minPurchaseAmount: Number(form.minPurchaseAmount || 0),
        eligibilityMonth: Number(form.eligibilityMonth || 1),
        eligibilityYear: Number(form.eligibilityYear || new Date().getFullYear()),
        priority: Number(form.priority || 999),
      };
      const res = await fetch(endpoint, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data?.message || "Failed to save offer");
        return;
      }
      closeForm();
      fetchOffers();
    } catch (error) {
      console.error("Save offer error", error);
      alert("Failed to save offer");
    } finally {
      setSavingOffer(false);
    }
  };

  const handleToggleOffer = async (offerId) => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(API_ENDPOINTS.OFFERS.ADMIN_TOGGLE(offerId), {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchOffers();
      }
    } catch (error) {
      console.error("Toggle offer error", error);
    }
  };

  const refreshApplicationEligibility = async (applicationId) => {
    if (!selectedOfferId || !applicationId) return;
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(
        API_ENDPOINTS.OFFERS.ADMIN_APPLICATION_ELIGIBILITY(selectedOfferId, applicationId),
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      if (!res.ok) {
        alert(data?.message || "Failed to refresh eligibility");
        return;
      }
      setEligibilityCache((prev) => ({
        ...prev,
        [applicationId]: data?.eligibility || null,
      }));
      fetchApplications(selectedOfferId, applicationFilter);
    } catch (error) {
      console.error("Refresh eligibility error", error);
    }
  };

  const reviewApplication = async (applicationId, status) => {
    if (!selectedOfferId || !applicationId) return;
    const token = localStorage.getItem("token");
    const message = window.prompt("Optional message to user", "") || "";
    setReviewingId(applicationId);
    try {
      const res = await fetch(
        API_ENDPOINTS.OFFERS.ADMIN_REVIEW_APPLICATION(selectedOfferId, applicationId),
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status, adminMessage: message.trim() }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        alert(data?.message || "Failed to review application");
        return;
      }
      fetchApplications(selectedOfferId, applicationFilter);
    } catch (error) {
      console.error("Review application error", error);
      alert("Failed to review application");
    } finally {
      setReviewingId("");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Offer Campaigns</h2>
          <p className="text-sm text-slate-500">
            Create purchase-based campaigns and review user participation.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold flex items-center gap-2"
        >
          <Plus size={14} />
          New Offer
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_1.5fr] gap-5">
        <div className="bg-white border border-slate-100 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-slate-700">Offers</h3>
            <button
              onClick={fetchOffers}
              className="text-xs px-2 py-1 border border-slate-200 rounded text-slate-600 hover:bg-slate-50"
            >
              Refresh
            </button>
          </div>
          {offersLoading ? (
            <div className="p-6 text-sm text-slate-500">Loading offers...</div>
          ) : offers.length === 0 ? (
            <div className="p-6 text-sm text-slate-500">No offers created yet.</div>
          ) : (
            <div className="max-h-[580px] overflow-y-auto divide-y divide-slate-100">
              {offers.map((offer) => (
                <button
                  key={offer._id}
                  onClick={() => setSelectedOfferId(offer._id)}
                  className={`w-full text-left px-4 py-3 transition-colors ${
                    selectedOfferId === offer._id ? "bg-blue-50" : "hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-slate-700 truncate">{offer.title}</p>
                      <p className="text-xs text-slate-500 truncate">
                        {monthName(Number(offer.eligibilityMonth))} {offer.eligibilityYear} • Min{" "}
                        {formatCurrency(offer.minPurchaseAmount)}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Apps: {offer.applicationCount || 0} • Pending: {offer.pendingApplications || 0}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openEdit(offer);
                        }}
                        className="p-1.5 text-slate-500 hover:text-blue-600"
                        title="Edit offer"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleOffer(offer._id);
                        }}
                        className={`p-1.5 ${offer.isActive ? "text-green-600" : "text-slate-400"}`}
                        title="Toggle active"
                      >
                        <Power size={14} />
                      </button>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border border-slate-100 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between gap-2">
            <h3 className="font-semibold text-slate-700">
              {selectedOffer ? `${selectedOffer.title} • Applications` : "Applications"}
            </h3>
            <div className="flex items-center gap-2">
              <select
                value={applicationFilter}
                onChange={(e) => setApplicationFilter(e.target.value)}
                className="text-xs border border-slate-200 rounded px-2 py-1"
              >
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
              <button
                onClick={() => selectedOfferId && fetchApplications(selectedOfferId, applicationFilter)}
                className="text-xs px-2 py-1 border border-slate-200 rounded text-slate-600 hover:bg-slate-50"
              >
                Refresh
              </button>
            </div>
          </div>

          {selectedOfferId === "" ? (
            <div className="p-6 text-sm text-slate-500">Select an offer to review applications.</div>
          ) : applicationLoading ? (
            <div className="p-6 text-sm text-slate-500">Loading applications...</div>
          ) : applications.length === 0 ? (
            <div className="p-6 text-sm text-slate-500">No applications yet.</div>
          ) : (
            <div className="max-h-[580px] overflow-y-auto divide-y divide-slate-100">
              {applications.map((application) => {
                const eligibility = eligibilityCache[application._id] || application.eligibilitySnapshot;
                const canApprove = Boolean(eligibility?.eligible);
                return (
                  <div key={application._id} className="px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-700 truncate">
                          {application.name || application?.user?.name || application?.user?.username}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          @{application?.user?.username || "-"} • {application?.user?.email || "-"}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          Spent {formatCurrency(eligibility?.totalSpent)} / Required{" "}
                          {formatCurrency(eligibility?.requiredAmount)} • Orders{" "}
                          {eligibility?.matchingOrders || 0}
                        </p>
                        <p
                          className={`text-xs mt-1 font-semibold ${
                            eligibility?.eligible ? "text-green-600" : "text-amber-600"
                          }`}
                        >
                          {eligibility?.eligible ? "Eligible" : "Not eligible"}
                        </p>
                        {application.note && (
                          <p className="text-xs text-slate-500 mt-1 line-clamp-2">{application.note}</p>
                        )}
                        <p className="text-[11px] text-slate-400 mt-1">
                          Status: {application.status} • Applied{" "}
                          {new Date(application.createdAt).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <button
                          onClick={() => refreshApplicationEligibility(application._id)}
                          className="text-xs px-2 py-1 border border-slate-200 rounded text-slate-600 hover:bg-slate-50 flex items-center gap-1"
                        >
                          <RefreshCcw size={12} />
                          Check
                        </button>
                        <div className="flex items-center gap-1">
                          <button
                            disabled={!canApprove || reviewingId === application._id}
                            onClick={() => reviewApplication(application._id, "approved")}
                            className="text-xs px-2 py-1 rounded border border-green-200 text-green-700 disabled:opacity-40 flex items-center gap-1"
                          >
                            <CheckCircle2 size={12} />
                            Approve
                          </button>
                          <button
                            disabled={reviewingId === application._id}
                            onClick={() => reviewApplication(application._id, "rejected")}
                            className="text-xs px-2 py-1 rounded border border-red-200 text-red-700 disabled:opacity-40 flex items-center gap-1"
                          >
                            <XCircle size={12} />
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 p-4 flex items-center justify-center">
          <div className="bg-white w-full max-w-2xl rounded-xl shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-semibold text-slate-800">{editingOffer ? "Edit Offer" : "Create Offer"}</h3>
              <button onClick={closeForm} className="text-sm text-slate-500">
                Close
              </button>
            </div>

            <form onSubmit={handleSaveOffer} className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input label="Offer Title" value={form.title} onChange={(value) => setForm((prev) => ({ ...prev, title: value }))} required />
                <Input label="Subtitle" value={form.subtitle} onChange={(value) => setForm((prev) => ({ ...prev, subtitle: value }))} />
              </div>

              <label className="block space-y-1">
                <span className="text-xs font-semibold uppercase text-slate-500">Offer Message</span>
                <textarea
                  value={form.message}
                  onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))}
                  rows={4}
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </label>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Input
                  label="Brand Label"
                  value={form.brandLabel}
                  onChange={(value) => setForm((prev) => ({ ...prev, brandLabel: value }))}
                />
                <Input
                  label="CTA Label"
                  value={form.ctaLabel}
                  onChange={(value) => setForm((prev) => ({ ...prev, ctaLabel: value }))}
                />
                <Input
                  label="Priority"
                  type="number"
                  min={1}
                  value={form.priority}
                  onChange={(value) => setForm((prev) => ({ ...prev, priority: value }))}
                />
              </div>

              <Input
                label="Banner Image URL (optional)"
                value={form.bannerImageUrl}
                onChange={(value) => setForm((prev) => ({ ...prev, bannerImageUrl: value }))}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Input
                  label="Minimum Purchase (Rs)"
                  type="number"
                  min={0}
                  value={form.minPurchaseAmount}
                  onChange={(value) => setForm((prev) => ({ ...prev, minPurchaseAmount: value }))}
                  required
                />
                <Input
                  label="Eligibility Month (1-12)"
                  type="number"
                  min={1}
                  max={12}
                  value={form.eligibilityMonth}
                  onChange={(value) => setForm((prev) => ({ ...prev, eligibilityMonth: value }))}
                  required
                />
                <Input
                  label="Eligibility Year"
                  type="number"
                  min={2020}
                  max={2100}
                  value={form.eligibilityYear}
                  onChange={(value) => setForm((prev) => ({ ...prev, eligibilityYear: value }))}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input
                  label="Start Date"
                  type="date"
                  value={form.startDate}
                  onChange={(value) => setForm((prev) => ({ ...prev, startDate: value }))}
                  required
                />
                <Input
                  label="End Date"
                  type="date"
                  value={form.endDate}
                  onChange={(value) => setForm((prev) => ({ ...prev, endDate: value }))}
                  required
                />
              </div>

              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                />
                Offer active
              </label>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeForm}
                  className="px-3 py-2 text-sm border border-slate-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingOffer}
                  className="px-4 py-2 text-sm bg-slate-900 text-white rounded-lg disabled:opacity-50"
                >
                  {savingOffer ? "Saving..." : editingOffer ? "Update Offer" : "Create Offer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Input({ label, onChange, ...props }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-semibold uppercase text-slate-500">{label}</span>
      <input
        {...props}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-slate-200 rounded-lg"
      />
    </label>
  );
}
