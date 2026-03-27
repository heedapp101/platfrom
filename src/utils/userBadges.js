export const getUserBadgeType = (user) => {
  if (!user || user.isDeleted) return "none";
  if (user.userType === "business" && user.isVerified) return "business";
  if (user.hasVerifiedBadge) return "verified";
  return "none";
};

export const hasVisibleBadge = (user) => getUserBadgeType(user) !== "none";
