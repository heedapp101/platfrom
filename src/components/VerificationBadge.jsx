import { Check } from "lucide-react";
import { getUserBadgeType } from "../utils/userBadges";

const SIZE_STYLES = {
  sm: { wrapper: "h-4 w-4 border", icon: 10 },
  md: { wrapper: "h-5 w-5 border-2", icon: 12 },
  lg: { wrapper: "h-6 w-6 border-2", icon: 14 },
};

export default function VerificationBadge({ user, size = "md" }) {
  const badgeType = getUserBadgeType(user);
  if (badgeType === "none") return null;

  const sizeStyle = SIZE_STYLES[size] || SIZE_STYLES.md;
  const tone =
    badgeType === "business"
      ? "bg-emerald-500 border-emerald-100"
      : "bg-blue-600 border-blue-100";

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full shadow-sm ${sizeStyle.wrapper} ${tone}`}
      title={badgeType === "business" ? "Business badge" : "Verified badge"}
    >
      <Check size={sizeStyle.icon} strokeWidth={3} className="text-white" />
    </span>
  );
}
