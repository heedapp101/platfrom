import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Crown, Zap, Star, Check, Rocket, AlertCircle, RefreshCw } from "lucide-react";
import API_ENDPOINTS from "../../config/api";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Plan definitions (mirror backend PLAN_CONFIG)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const PLANS = [
  {
    id: "basic",
    name: "Basic",
    price: 149,
    boostsLimit: 4,
    maxActiveBoosts: 1,
    color: "from-emerald-500 to-teal-600",
    icon: Zap,
    recommended: false,
  },
  {
    id: "growth",
    name: "Growth",
    price: 299,
    boostsLimit: 10,
    maxActiveBoosts: 2,
    color: "from-blue-500 to-indigo-600",
    icon: Rocket,
    recommended: true,
  },
  {
    id: "pro",
    name: "Pro",
    price: 499,
    boostsLimit: 25,
    maxActiveBoosts: 4,
    color: "from-purple-500 to-violet-600",
    icon: Crown,
    recommended: false,
  },
];

const PLAN_ORDER = { basic: 0, growth: 1, pro: 2 };

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function daysRemaining(endDate) {
  if (!endDate) return 0;
  return Math.max(0, Math.ceil((new Date(endDate) - new Date()) / (1000 * 60 * 60 * 24)));
}

export default function SellerSubscription() {
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(null); // plan id being subscribed
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const token = useMemo(() => localStorage.getItem("token"), []);

  // ── Fetch current subscription ──────────────────────────
  const fetchSubscription = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(API_ENDPOINTS.SELLER.SUBSCRIPTION_ME, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setSubscription(data.subscription); // null if no subscription
      } else {
        setError(data.message || "Failed to load subscription");
      }
    } catch {
      setError("Failed to load subscription. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  // ── Subscribe / Upgrade ─────────────────────────────────
  const handleSubscribe = useCallback(
    async (planId) => {
      if (!planId || subscribing) return;
      setSubscribing(planId);
      setError(null);
      setSuccessMsg(null);
      try {
        const res = await fetch(API_ENDPOINTS.SELLER.SUBSCRIPTION_SAVE, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ plan: planId }),
        });
        const data = await res.json();
        if (res.ok) {
          setSuccessMsg(data.message || "Subscription activated!");
          await fetchSubscription();
        } else {
          setError(data.message || "Failed to update subscription");
        }
      } catch {
        setError("Request failed. Please try again.");
      } finally {
        setSubscribing(null);
      }
    },
    [token, subscribing, fetchSubscription]
  );

  // ── Helpers ─────────────────────────────────────────────
  const currentPlanOrder = subscription
    ? PLAN_ORDER[subscription.plan] ?? -1
    : -1;

  const getButtonLabel = (plan) => {
    if (!subscription) return "Subscribe";
    if (subscription.plan === plan.id) return "Current Plan";
    if (PLAN_ORDER[plan.id] < currentPlanOrder) return "Downgrade";
    return "Upgrade";
  };

  const isButtonDisabled = (plan) => {
    if (subscribing) return true;
    if (!subscription) return false;
    if (subscription.plan === plan.id) return true;
    if (PLAN_ORDER[plan.id] < currentPlanOrder) return true; // no downgrade
    return false;
  };

  if (loading) {
    return (
      <div className="p-6 text-slate-500 flex items-center gap-2">
        <RefreshCw size={16} className="animate-spin" /> Loading subscription...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Subscription Plans</h1>
        <p className="text-slate-500 text-sm mt-1">
          Manage your boost subscription. All payments via website only.
        </p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl p-4">
          <AlertCircle size={18} className="shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}
      {successMsg && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 text-green-700 rounded-xl p-4">
          <Check size={18} className="shrink-0" />
          <span className="text-sm">{successMsg}</span>
        </div>
      )}

      {/* Current Subscription Banner */}
      {subscription && (
        <div className="bg-slate-900 text-white rounded-2xl p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-slate-400 text-xs uppercase font-semibold tracking-wider mb-1">
                Active Plan
              </p>
              <p className="text-2xl font-bold capitalize">{subscription.plan}</p>
              <p className="text-slate-400 text-sm mt-1">
                Renews {formatDate(subscription.endDate)} ·{" "}
                {daysRemaining(subscription.endDate)} days left
              </p>
            </div>
            <div className="flex gap-6 text-center">
              <div>
                <p className="text-3xl font-bold">
                  {subscription.boostsUsed}
                  <span className="text-slate-400 text-lg">/{subscription.boostsLimit}</span>
                </p>
                <p className="text-slate-400 text-xs mt-1">Boosts Used</p>
              </div>
              <div>
                <p className="text-3xl font-bold">
                  {subscription.activeBoosts}
                  <span className="text-slate-400 text-lg">/{subscription.maxActiveBoosts}</span>
                </p>
                <p className="text-slate-400 text-xs mt-1">Active Boosts</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PLANS.map((plan) => {
          const Icon = plan.icon;
          const isCurrent = subscription?.plan === plan.id;
          const disabled = isButtonDisabled(plan);
          const btnLabel = getButtonLabel(plan);
          const isLoading = subscribing === plan.id;

          return (
            <div
              key={plan.id}
              className={`relative bg-white rounded-2xl border-2 shadow-sm overflow-hidden flex flex-col ${
                isCurrent
                  ? "border-blue-500"
                  : plan.recommended
                  ? "border-blue-200"
                  : "border-slate-100"
              }`}
            >
              {/* Recommended badge */}
              {plan.recommended && (
                <div className="absolute top-0 left-0 right-0 bg-blue-600 text-white text-center text-xs py-1 font-semibold">
                  ⭐ Recommended
                </div>
              )}

              {/* Card header */}
              <div
                className={`bg-gradient-to-br ${plan.color} p-6 text-white ${
                  plan.recommended ? "pt-8" : ""
                }`}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Icon size={22} />
                  <span className="font-bold text-lg">{plan.name}</span>
                  {isCurrent && (
                    <span className="ml-auto text-xs bg-white/20 px-2 py-0.5 rounded-full">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-4xl font-bold">
                  ₹{plan.price}
                  <span className="text-base font-normal text-white/80">/month</span>
                </p>
              </div>

              {/* Features */}
              <div className="p-6 flex-1 space-y-3">
                <div className="flex items-center gap-2 text-sm text-slate-700">
                  <Check size={16} className="text-emerald-500 shrink-0" />
                  <span>
                    <strong>{plan.boostsLimit}</strong> boosts per month
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-700">
                  <Check size={16} className="text-emerald-500 shrink-0" />
                  <span>
                    <strong>{plan.maxActiveBoosts}</strong> active boost
                    {plan.maxActiveBoosts > 1 ? "s" : ""} at a time
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-700">
                  <Check size={16} className="text-emerald-500 shrink-0" />
                  <span>Each boost lasts <strong>7 days</strong></span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-700">
                  <Check size={16} className="text-emerald-500 shrink-0" />
                  <span>Priority placement in home feed</span>
                </div>
              </div>

              {/* Action button */}
              <div className="px-6 pb-6">
                <button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={disabled}
                  className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                    isCurrent
                      ? "bg-blue-50 text-blue-600 border-2 border-blue-200 cursor-default"
                      : disabled
                      ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                      : "bg-slate-900 text-white hover:bg-slate-700"
                  }`}
                >
                  {isLoading ? (
                    <RefreshCw size={15} className="animate-spin" />
                  ) : (
                    <Star size={15} />
                  )}
                  {isLoading ? "Processing..." : btnLabel}
                </button>
                {PLAN_ORDER[plan.id] < currentPlanOrder && (
                  <p className="text-center text-xs text-slate-400 mt-2">
                    Downgrades not supported
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Info note */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-800 text-sm flex items-start gap-2">
        <AlertCircle size={16} className="shrink-0 mt-0.5" />
        <span>
          <strong>Note:</strong> Clicking Subscribe will activate the plan immediately (no payment
          for now). Upgrades preserve your current billing cycle and boost usage count.
        </span>
      </div>

      {/* Back to Boost & Ads */}
      <button
        onClick={() => navigate("/seller/ads")}
        className="text-sm text-blue-600 hover:underline flex items-center gap-1"
      >
        ← Back to Boost &amp; Ads
      </button>
    </div>
  );
}
