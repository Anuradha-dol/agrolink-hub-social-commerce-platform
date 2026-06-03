import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "/src/modules/platform/common/components/ProtectedRoute";
import RoleRoute from "/src/modules/platform/common/components/RoleRoute";
import AppShell from "/src/modules/platform/common/layouts/AppShell";
import LandingPage from "/src/modules/platform/auth/pages/LandingPage";
import LoginPage from "/src/modules/platform/auth/pages/LoginPage";
import SignupPage from "/src/modules/platform/auth/pages/SignupPage";
import VerifyOtpPage from "/src/modules/platform/auth/pages/VerifyOtpPage";
import ForgotPasswordPage from "/src/modules/platform/auth/pages/ForgotPasswordPage";
import OnboardingPage from "/src/modules/platform/auth/pages/OnboardingPage";
import FeedPage from "/src/modules/social/post/pages/FeedPage";
import ProfilePage from "/src/modules/platform/user/pages/ProfilePage";
import FriendsPage from "/src/modules/social/friend/pages/FriendsPage";
import NotificationsPage from "/src/modules/social/notification/pages/NotificationsPage";
import ChatPage from "/src/modules/social/chat/pages/ChatPage";
import MarketplacePage from "/src/modules/business/product/pages/MarketplacePage";
import OrdersPage from "/src/modules/business/order/pages/OrdersPage";
import BookmarksPage from "/src/modules/business/product/pages/BookmarksPage";
import AnalyticsPage from "/src/modules/business/analytics/pages/AnalyticsPage";
import CalendarPage from "/src/modules/platform/calendar/pages/CalendarPage";
import BusinessPage from "/src/modules/business/page/pages/BusinessPage";
import AdminDashboardPage from "/src/modules/business/admin/pages/AdminDashboardPage";
import SupportCenterPage from "/src/modules/platform/support/pages/SupportCenterPage";
import SettingsPage from "/src/modules/platform/user/legacy/pages/Settings";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/verify" element={<VerifyOtpPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route element={<AppShell />}>
          <Route path="/dashboard" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<FeedPage />} />
          <Route path="/post" element={<Navigate to="/home" replace />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/:userId" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/friends" element={<FriendsPage />} />
          <Route path="/friend" element={<Navigate to="/friends" replace />} />
          <Route path="/searchUsers" element={<Navigate to="/friends" replace />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/support" element={<SupportCenterPage />} />
          <Route path="/review" element={<SupportCenterPage />} />
          <Route path="/supportUser" element={<SupportCenterPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/marketplace" element={<MarketplacePage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/bookmarks" element={<BookmarksPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/calendar" element={<CalendarPage />} />

          <Route element={<RoleRoute allowedRoles={["ROLE_BUSINESS", "ROLE_FARMER"]} />}>
            <Route path="/business" element={<BusinessPage />} />
          </Route>

          <Route element={<RoleRoute allowedRoles={["ROLE_ADMIN"]} />}>
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/admin/users" element={<AdminDashboardPage />} />
            <Route path="/admin/business-users" element={<AdminDashboardPage />} />
            <Route path="/admin/farmers" element={<AdminDashboardPage />} />
            <Route path="/admin/creators" element={<AdminDashboardPage />} />
            <Route path="/admin/admins" element={<AdminDashboardPage />} />
            <Route path="/admin/moderation" element={<AdminDashboardPage />} />
            <Route path="/admin/support" element={<AdminDashboardPage />} />
            <Route path="/supportAdmin" element={<Navigate to="/admin" replace />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
}
