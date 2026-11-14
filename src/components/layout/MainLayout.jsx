
import { useState, useEffect } from "react";
import { Box } from "@mui/material";
import { Outlet, useNavigate } from "react-router-dom";

import Sidebar from "./Sidebar.jsx";
import Header from "./Header.jsx";
import useAuthStore from "../../store/useAuthStore.js";

import styles from "../../styles/Layout/Layout.module.css";

export default function MainLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navigate = useNavigate();

  const syncFromStorage = useAuthStore(
    (state) => state.syncFromStorage
  );

  const handleDrawerToggle = () => {
    setMobileOpen((prev) => !prev);
  };

  const handleDrawerClose = () => {
    setMobileOpen(false);
  };

  // مراقبة localStorage للكشف عن حذف التوكن
  useEffect(() => {
    const interval = setInterval(() => {
      const hasToken = !!localStorage.getItem("AccessToken");
      const storeToken = useAuthStore.getState().token;

      if (!hasToken && storeToken) {
        useAuthStore.getState().logout();
        navigate("/login", { replace: true });
      } else if (hasToken !== !!storeToken) {
        syncFromStorage();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [navigate, syncFromStorage]);

  return (
    <div className={styles.mainLayout}>
      <Header onMenuClick={handleDrawerToggle} />

      <div className={styles.mainBody}>
        <Sidebar
          mobileOpen={mobileOpen}
          onClose={handleDrawerClose}
        />

        <Box
          component="main"
          className={styles.mainContent}
        >
          <Outlet />
        </Box>
      </div>
    </div>
  );
}
