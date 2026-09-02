// frontend/src/App.tsx
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { SiteLayout } from "@/layouts/SiteLayout";
import { UserDashboardLayout } from "@/layouts/UserDashboardLayout";
import HomePage from "@/pages/HomePage";
import DestinationsPage from "@/pages/DestinationsPage";
import DestinationDetailPage from "@/pages/DestinationDetailPage";
import ChecklistPage from "@/pages/ChecklistPage";
import EmergencyPage from "@/pages/EmergencyPage";
import StoriesPage from "@/pages/StoriesPage";
import StoryDetailPage from "@/pages/StoryDetailPage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import AccountPage from "@/pages/AccountPage";
import TripsPage from "@/pages/TripsPage";
import TripCreatePage from "@/pages/TripCreatePage";
import TripDetailPage from "@/pages/TripDetailPage";
import DashboardPage from "@/pages/DashboardPage";
import NotFoundPage from "@/pages/NotFoundPage";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminRoute } from "@/components/AdminRoute";
import { AdminLayout } from "@/layouts/AdminLayout";
import AdminDashboardPage from "@/pages/admin/AdminDashboardPage";
import {
  AdminDestinationsPlaceholder,
  AdminStoriesPlaceholder,
  AdminSourcesPlaceholder,
} from "@/pages/admin/AdminPlaceholderPages";

// Route wrapper providing the left sidebar for user dashboard views
function DashboardLayoutWrapper() {
  return (
    <UserDashboardLayout>
      <Outlet />
    </UserDashboardLayout>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<SiteLayout />}>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/destinations" element={<DestinationsPage />} />
        <Route path="/destinations/:slug" element={<DestinationDetailPage />} />
        <Route path="/checklist" element={<ChecklistPage />} />
        <Route path="/emergency" element={<EmergencyPage />} />
        <Route path="/stories" element={<StoriesPage />} />
        <Route path="/stories/:id" element={<StoryDetailPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* User Dashboard Hub & Trip Management (All share the Left Sidebar) */}
        <Route
          element={
            <ProtectedRoute>
              <DashboardLayoutWrapper />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/userdashboard" element={<Navigate to="/dashboard" replace />} />
          <Route path="/account/trips" element={<TripsPage />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="/trip/create" element={<TripCreatePage />} />
          <Route path="/trip/:id" element={<TripDetailPage />} />
          <Route path="/trips/:id" element={<Navigate to="/trip/:id" replace />} />
        </Route>

        {/* 404 Catch-All */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      {/* Admin Console Routes */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }
      >
        <Route index element={<AdminDashboardPage />} />
        <Route path="destinations" element={<AdminDestinationsPlaceholder />} />
        <Route path="stories" element={<AdminStoriesPlaceholder />} />
        <Route path="sources" element={<AdminSourcesPlaceholder />} />
      </Route>
    </Routes>
  );
}