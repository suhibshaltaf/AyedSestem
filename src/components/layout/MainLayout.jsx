import { useState, useEffect } from "react";
import { Box } from "@mui/material";
import { Outlet, useNavigate } from "react-router-dom";

import Sidebar from "./Sidebar.jsx";
import Header from "./Header.jsx";
import useAuthStore from "../../store/useAuthStore.js";
import "../../styles/layout.css";

export default function MainLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const syncFromStorage = useAuthStore((state) => state.syncFromStorage);

  const handleDrawerToggle = () => setMobileOpen((prev) => !prev);
  const handleDrawerClose = () => setMobileOpen(false);

  // ✅ مراقبة localStorage كل ثانية — للكشف عن الحذف اليدوي
  useEffect(() => {
    const interval = setInterval(() => {
      const hasToken = !!localStorage.getItem("AccessToken");
      const storeToken = useAuthStore.getState().token;

      if (!hasToken && storeToken) {
        // المستخدم حذف التوكن يدوياً
        useAuthStore.getState().logout();
        navigate("/login", { replace: true });
      } else if (hasToken !== !!storeToken) {
        // أي اختلاف → زامن
        syncFromStorage();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [navigate, syncFromStorage]);

  return (
    <div className="main-layout">
      <Header onMenuClick={handleDrawerToggle} />

      <div className="main-body">
        <Sidebar mobileOpen={mobileOpen} onClose={handleDrawerClose} />

        <Box component="main" className="main-content">
          <Outlet />
        </Box>
      </div>
    </div>
  );
}