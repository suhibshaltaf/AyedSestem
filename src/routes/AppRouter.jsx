import { Routes, Route, Navigate } from "react-router-dom";

import Login from "../pages/login/Login.jsx";
import Dashboard from "../pages/dashboard/Dashboard.jsx";
import Profile from "../pages/profile/Profile.jsx";
import AccountsManagement from "../pages/accounts/AccountsManagement.jsx";
import BranchesManagement from "../pages/branches/BranchesManagement.jsx";
import WorkshopsManagement from "../pages/workshops/WorkshopsManagement.jsx";
import ChangePassword from "../pages/profile/ChangePassword.jsx";
import Unauthorized from "../pages/unauthorized/Unauthorized.jsx";

import ProtectedRoute from "../components/auth/ProtectedRoute.jsx";
import MainLayout from "../components/layout/MainLayout.jsx";

import useAuthStore from "../store/useAuthStore.js";

export default function AppRouter() {
  const token = useAuthStore((state) => state.token);

  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={
          token ? <Navigate to="/dashboard" replace /> : <Login />
        }
      />

      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/change-password" element={<ChangePassword />} />

          {/* Admin Only */}
          <Route
            element={
              <ProtectedRoute allowedRoles={["SuperAdmin", "Admin"]} />
            }
          >
            <Route path="/accounts" element={<AccountsManagement />} />
            <Route path="/branches" element={<BranchesManagement />} />
            <Route path="/workshops" element={<WorkshopsManagement />} />
          </Route>
        </Route>
      </Route>

      {/* Default */}
      <Route
        path="/"
        element={
          <Navigate to={token ? "/dashboard" : "/login"} replace />
        }
      />

      {/* Catch All */}
      <Route
        path="*"
        element={
          <Navigate to={token ? "/dashboard" : "/login"} replace />
        }
      />
    </Routes>
  );
}