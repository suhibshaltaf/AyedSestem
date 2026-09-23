import { Routes, Route, Navigate } from "react-router-dom";

import Login from "../pages/login/Login.jsx";
import HomePage from "../pages/home/HomePage.jsx";
import Dashboard from "../pages/dashboard/Dashboard.jsx";
import Profile from "../pages/profile/Profile.jsx";
import AccountsManagement from "../pages/accounts/AccountsManagement.jsx";
import BranchesManagement from "../pages/branches/BranchesManagement.jsx";
import BranchDetails from "../pages/branches/BranchDetails.jsx";
import WorkshopsManagement from "../pages/workshops/WorkshopsManagement.jsx";
import ChangePassword from "../pages/profile/ChangePassword.jsx";
import Unauthorized from "../pages/unauthorized/Unauthorized.jsx";
import PublicTracking from "../pages/repairs/PublicTracking.jsx";
import OrganizationSettings from "../pages/settings/OrganizationSettings.jsx";
import ScanRepair from "../pages/repairs/ScanRepair.jsx";

// Repairs
import RepairOrdersList from "../pages/repairs/RepairOrdersList.jsx";
import CreateRepairOrder from "../pages/repairs/CreateRepairOrder.jsx";
import RepairOrderDetails from "../pages/repairs/RepairOrderDetails.jsx";
import RepresentativeDashboard from "../pages/repairs/RepresentativeDashboard.jsx";
import PickupDelivery from "../pages/repairs/PickupDelivery.jsx";
import RepresentativesSummary from "../pages/repairs/RepresentativesSummary.jsx";

import ProtectedRoute from "../components/auth/ProtectedRoute.jsx";
import MainLayout from "../components/layout/MainLayout.jsx";

import useAuthStore from "../store/useAuthStore.js";

export default function AppRouter() {
  const token = useAuthStore((state) => state.token);

  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<HomePage />} />
      <Route path="/home" element={<HomePage />} />
      <Route path="/track" element={<PublicTracking />} />

      <Route
        path="/login"
        element={
          token ? <Navigate to="/dashboard" replace /> : <Login />
        }
      />

      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Protected */}
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/change-password" element={<ChangePassword />} />
          <Route path="/settings" element={<OrganizationSettings />} />

          {/* Admin Only */}
          <Route
            element={
              <ProtectedRoute allowedRoles={["SuperAdmin", "Admin"]} />
            }
          >
            <Route path="/accounts" element={<AccountsManagement />} />
            <Route path="/workshops" element={<WorkshopsManagement />} />
            <Route path="/branches" element={<BranchesManagement />} />
            <Route path="/branches/:id" element={<BranchDetails />} />
            <Route
              path="/repairs/representatives-summary"
              element={<RepresentativesSummary />}
            />
          </Route>

          {/* Branch roles */}
          <Route
            element={
              <ProtectedRoute
                allowedRoles={[
                  "SuperAdmin",
                  "Admin",
                  "BranchManager",
                  "BranchAccountant",
                ]}
              />
            }
          >
            <Route
              path="/repairs/pickup-delivery"
              element={<PickupDelivery />}
            />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={["BranchManager", "BranchAccountant"]} />}>
            <Route path="/repairs/create" element={<CreateRepairOrder />} />
          </Route>

          {/* All authenticated */}
          <Route
            element={
              <ProtectedRoute
                allowedRoles={[
                  "SuperAdmin",
                  "Admin",
                  "BranchManager",
                  "BranchAccountant",
                ]}
              />
            }
          >
            <Route path="/repairs/list" element={<RepairOrdersList />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={["SuperAdmin", "Admin", "BranchManager", "BranchAccountant", "OperatorManager"]} />}>
            <Route path="/repairs/scan" element={<ScanRepair />} />
            <Route path="/repairs/:id" element={<RepairOrderDetails />} />
          </Route>

          {/* Representative Only */}
          <Route
            element={<ProtectedRoute allowedRoles={["Representative"]} />}
          >
            <Route
              path="/repairs/representative"
              element={<RepresentativeDashboard />}
            />
          </Route>
        </Route>
      </Route>

      {/* Catch All */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
