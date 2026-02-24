import { Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense, memo } from "react";
import ProtectedRoute from "./ProtectedRoute";

// Lightweight loading component
const PageLoader = memo(() => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
  </div>
));
PageLoader.displayName = "PageLoader";

/* PUBLIC - Keep critical paths non-lazy */
import LandingPage from "./pages/LandingPage";
const PublicPost = lazy(() => import("./pages/PublicPost"));
const PublicProfile = lazy(() => import("./pages/PublicProfile"));

/* AUTH */
import Login from "./pages/auth/Login";

/* LAYOUTS */
import DashboardLayout from "./layouts/DashboardLayout";
import AdminLayout from "./layouts/AdminLayout";

/* SELLER - Lazy loaded */
const SellerDashboard = lazy(() => import("./pages/seller/Dashboard"));
const SellerPosts = lazy(() => import("./pages/seller/Posts"));
const SellerOrders = lazy(() => import("./pages/seller/Orders"));
const SellerAnalytics = lazy(() => import("./pages/seller/Analytics"));
const SellerAds = lazy(() => import("./pages/seller/Ads"));
const SellerChat = lazy(() => import("./pages/seller/Chat"));
const SellerSettings = lazy(() => import("./pages/seller/Settings"));

/* ADMIN - Lazy loaded */
const Overview = lazy(() => import("./pages/admin/Overview"));
const AdminUsers = lazy(() => import("./pages/admin/Users"));
const DeletedUsers = lazy(() => import("./pages/admin/DeletedUsers"));
const AdminApprovals = lazy(() => import("./pages/admin/Approvals"));
const Revenue = lazy(() => import("./pages/admin/Revenue"));
const AdminChat = lazy(() => import("./pages/admin/Chat"));
const AdminAds = lazy(() => import("./pages/admin/Ads"));
const BoostControl = lazy(() => import("./pages/admin/BoostControl"));
const Compliance = lazy(() => import("./pages/admin/Compliance"));
const ReportedPosts = lazy(() => import("./pages/admin/ReportedPosts"));
const Legal = lazy(() => import("./pages/admin/Legal"));
const Awards = lazy(() => import("./pages/admin/Awards"));
const AdminSettings = lazy(() => import("./pages/admin/Settings"));

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* PUBLIC */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/post/:postId" element={<PublicPost />} />
        <Route path="/profile/:userId" element={<PublicProfile />} />
        <Route path="/login" element={<Login />} />

        {/* SELLER */}
        <Route
          path="/seller"
          element={
            <ProtectedRoute role="seller">
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<SellerDashboard />} />
          <Route path="posts" element={<SellerPosts />} />
          <Route path="orders" element={<SellerOrders />} />
          <Route path="analytics" element={<SellerAnalytics />} />
          <Route path="ads" element={<SellerAds />} />
          <Route path="chat" element={<SellerChat />} />
          <Route path="settings" element={<SellerSettings />} />
        </Route>

        {/* ADMIN */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute role="admin">
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Overview />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="deleted-users" element={<DeletedUsers />} />
          <Route path="approvals" element={<AdminApprovals />} />
          <Route path="revenue" element={<Revenue />} />
          <Route path="chat" element={<AdminChat />} />
          <Route path="ads" element={<AdminAds />} />
          <Route path="boosts" element={<BoostControl />} />
          <Route path="compliance" element={<Compliance />} />
          <Route path="reports" element={<ReportedPosts />} />
          <Route path="legal" element={<Legal />} />
          <Route path="awards" element={<Awards />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>

        {/* FALLBACK */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Suspense>
  );
}
