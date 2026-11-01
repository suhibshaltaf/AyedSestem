
import { useState, useEffect } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  ListItemIcon,
  ListItemText,
} from "@mui/material";

import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import MenuIcon from "@mui/icons-material/Menu";
import PersonIcon from "@mui/icons-material/Person";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import LockResetIcon from "@mui/icons-material/LockReset";
import LogoutIcon from "@mui/icons-material/Logout";

import useAuthStore from "../../store/useAuthStore.js";
import useThemeStore from "../../store/useThemeStore.js";
import "../../styles/header.css";

export default function Header({ onMenuClick }) {
  const navigate = useNavigate();

  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const mode = useThemeStore((state) => state.mode);
  const setMode = useThemeStore((state) => state.setMode);

  const [time, setTime] = useState(new Date());
  const [anchorEl, setAnchorEl] = useState(null);

  const openMenu = Boolean(anchorEl);

  // تحديث الوقت كل ثانية
  useEffect(() => {
    const t = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(t);
  }, []);

  // تنسيق التاريخ: يوم عربي + تاريخ إنجليزي
  const formatDate = (d) => {
    const day = new Intl.DateTimeFormat("ar-JO", {
      timeZone: "Asia/Amman",
      weekday: "long",
    }).format(d);

    const date = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Amman",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(d);

    return `${day} ${date}`;
  };

  // تنسيق الوقت بالإنجليزي ونظام 24 ساعة
  const formatTime = (d) => {
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Amman",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(d);
  };

  // فتح القائمة
  const handleOpenMenu = (e) => {
    setAnchorEl(e.currentTarget);
  };

  // إغلاق القائمة
  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  // تغيير كلمة المرور
  const handleChangePassword = () => {
    handleCloseMenu();
    navigate("/change-password");
  };

  // تسجيل الخروج
  const handleLogout = () => {
    handleCloseMenu();
    logout();
    toast.success("تم تسجيل الخروج بنجاح");
    navigate("/login", { replace: true });
  };

  return (
    <AppBar position="sticky" elevation={0} className="app-header">
      <Toolbar className="app-toolbar">

        {/* FIRST: User */}
        <Box
          className="header-user"
          onClick={handleOpenMenu}
          role="button"
          tabIndex={0}
        >
          <Box className="header-avatar">
            <PersonIcon sx={{ fontSize: 22 }} />
          </Box>

          <Typography className="header-username">
            {user?.fullName || user?.userName || "المستخدم"}
          </Typography>

          <KeyboardArrowDownIcon
            className={`header-arrow ${openMenu ? "open" : ""}`}
          />
        </Box>

        {/* SECOND: Time + Date */}
        <Box className="header-center">
          <Typography className="header-time">
            {formatTime(time)}
          </Typography>

          <div className="header-divider" />

          <Typography className="header-date">
            {formatDate(time)}
          </Typography>
        </Box>

        {/* THIRD: Theme + Mobile Menu */}
        <Box className="header-theme">

          {/* Mobile menu */}
          <IconButton
            edge="start"
            onClick={onMenuClick}
            className="menu-btn"
            sx={{ display: { xs: "inline-flex", md: "none" } }}
          >
            <MenuIcon />
          </IconButton>

          {/* Light Mode */}
          <button
            className={`theme-btn-sun ${mode === "light" ? "active" : ""}`}
            onClick={() => setMode("light")}
            aria-label="الوضع النهاري"
          >
            <LightModeIcon sx={{ fontSize: 18 }} />
          </button>

          {/* Dark Mode */}
          <button
            className={`theme-btn-moon ${mode === "dark" ? "active" : ""}`}
            onClick={() => setMode("dark")}
            aria-label="الوضع الليلي"
          >
            <DarkModeIcon sx={{ fontSize: 16 }} />
          </button>

        </Box>

        {/* Dropdown Menu */}
        <Menu
          anchorEl={anchorEl}
          open={openMenu}
          onClose={handleCloseMenu}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "right",
          }}
          transformOrigin={{
            vertical: "top",
            horizontal: "right",
          }}
          className="header-menu"
          MenuListProps={{
            className: "header-menu-list",
          }}
        >

          {/* Change Password */}
          <MenuItem
            onClick={handleChangePassword}
            className="header-menu-item"
          >
            <ListItemIcon className="header-menu-icon">
              <LockResetIcon fontSize="small" />
            </ListItemIcon>

            <ListItemText
              primary="تغيير كلمة المرور"
              primaryTypographyProps={{
                fontSize: "0.85rem",
                fontFamily: "'Cairo', sans-serif",
              }}
            />
          </MenuItem>

          <Divider className="header-menu-divider" />

          {/* Logout */}
          <MenuItem
            onClick={handleLogout}
            className="header-menu-item logout"
          >
            <ListItemIcon className="header-menu-icon logout">
              <LogoutIcon fontSize="small" />
            </ListItemIcon>

            <ListItemText
              primary="تسجيل الخروج"
              primaryTypographyProps={{
                fontSize: "0.85rem",
                fontFamily: "'Cairo', sans-serif",
              }}
            />
          </MenuItem>

        </Menu>
      </Toolbar>
    </AppBar>
  );
}
