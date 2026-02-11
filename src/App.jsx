import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";

/* PUBLIC */
import LandingPage from "./pages/LandingPage";
import PublicPost from "./pages/PublicPost";
import PublicProfile from "./pages/PublicProfile";

/* AUTH */
import Login from "./pages/auth/Login";

/* LAYOUTS */
import DashboardLayout from "./layouts/DashboardLayout";
import AdminLayout from "./layouts/AdminLayout";

/* SELLER */
import SellerDashboard from "./pages/seller/Dashboard";
import SellerPosts from "./pages/seller/Posts";
import SellerOrders from "./pages/seller/Orders";
import SellerAnalytics from "./pages/seller/Analytics";
import SellerAds from "./pages/seller/Ads";
import SellerSettings from "./pages/seller/Settings";

/* ADMIN */
import Overview from "./pages/admin/Overview";
import AdminUsers from "./pages/admin/Users";
import DeletedUsers from "./pages/admin/DeletedUsers";
import AdminApprovals from "./pages/admin/Approvals";
import Revenue from "./pages/admin/Revenue";
import AdminChat from "./pages/admin/Chat";
import AdminAds from "./pages/admin/Ads";
import BoostControl from "./pages/admin/BoostControl";
import Compliance from "./pages/admin/Compliance";
import ReportedPosts from "./pages/admin/ReportedPosts";
import Legal from "./pages/admin/Legal";

export default function App() {
  return (
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
      </Route>

      {/* FALLBACK */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
