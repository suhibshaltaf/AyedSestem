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

import styles from "../../styles/Header/Header.module.css";

export default function Header({ onMenuClick }) {
  const navigate = useNavigate();

  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const mode = useThemeStore((state) => state.mode);
  const setMode = useThemeStore((state) => state.setMode);

  const [time, setTime] = useState(new Date());
  const [anchorEl, setAnchorEl] = useState(null);

  const openMenu = Boolean(anchorEl);
  const isDark = mode === "dark";

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // اليوم بالعربي والتاريخ بالإنجليزي
  const formatDate = (date) => {
    const day = new Intl.DateTimeFormat("ar-JO", {
      timeZone: "Asia/Amman",
      weekday: "long",
    }).format(date);

    const formattedDate = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Amman",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);

    return `${day} ${formattedDate}`;
  };

  // الوقت بنظام 24 ساعة
  const formatTime = (date) =>
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Amman",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(date);

  const handleOpenMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleChangePassword = () => {
    handleCloseMenu();
    navigate("/change-password");
  };

  const handleLogout = () => {
    handleCloseMenu();
    logout();
    toast.success("تم تسجيل الخروج بنجاح");
    navigate("/login", { replace: true });
  };

  return (
    <AppBar
      position="sticky"
      elevation={0}
      className={`${styles.appHeader} ${
        isDark ? styles.darkMode : styles.lightMode
      }`}
    >
      <Toolbar className={styles.appToolbar}>
        {/* User */}
        <Box
          className={styles.headerUser}
          onClick={handleOpenMenu}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              handleOpenMenu(event);
            }
          }}
        >
          <Box className={styles.headerAvatar}>
            <PersonIcon />
          </Box>

          <Typography className={styles.headerUsername}>
            {user?.fullName || user?.userName || "المستخدم"}
          </Typography>

          <KeyboardArrowDownIcon
            className={`${styles.headerArrow} ${
              openMenu ? styles.open : ""
            }`}
          />
        </Box>

        {/* Date and Time */}
        <Box className={styles.headerCenter}>
          <Typography className={styles.headerTime}>
            {formatTime(time)}
          </Typography>

          <div className={styles.headerDivider} />

          <Typography className={styles.headerDate}>
            {formatDate(time)}
          </Typography>
        </Box>

        {/* Theme and Mobile Menu */}
        <Box className={styles.headerTheme}>
          <IconButton
            edge="start"
            onClick={onMenuClick}
            className={styles.menuBtn}
            aria-label="فتح القائمة"
            sx={{ display: { xs: "inline-flex", md: "none" } }}
          >
            <MenuIcon />
          </IconButton>

          <div className={styles.themeSwitcher}>
            <button
              type="button"
              className={`${styles.themeButton} ${
                !isDark ? styles.activeTheme : ""
              }`}
              onClick={() => setMode("light")}
              aria-label="الوضع النهاري"
              aria-pressed={!isDark}
              title="الوضع النهاري"
            >
              <LightModeIcon />
            </button>

            <button
              type="button"
              className={`${styles.themeButton} ${
                isDark ? styles.activeTheme : ""
              }`}
              onClick={() => setMode("dark")}
              aria-label="الوضع الليلي"
              aria-pressed={isDark}
              title="الوضع الليلي"
            >
              <DarkModeIcon />
            </button>
          </div>
        </Box>

        {/* User Menu */}
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
          className={`${styles.headerMenu} ${
            isDark ? styles.darkMenu : styles.lightMenu
          }`}
          MenuListProps={{
            className: styles.headerMenuList,
          }}
        >
          <MenuItem
            onClick={handleChangePassword}
            className={styles.headerMenuItem}
          >
            <ListItemIcon className={styles.headerMenuIcon}>
              <LockResetIcon fontSize="small" />
            </ListItemIcon>

            <ListItemText
              primary="تغيير كلمة المرور"
              slotProps={{
                primary: {
                  className: styles.menuText,
                },
              }}
            />
          </MenuItem>

          <Divider className={styles.headerMenuDivider} />

          <MenuItem
            onClick={handleLogout}
            className={`${styles.headerMenuItem} ${styles.logout}`}
          >
            <ListItemIcon
              className={`${styles.headerMenuIcon} ${styles.logout}`}
            >
              <LogoutIcon fontSize="small" />
            </ListItemIcon>

            <ListItemText
              primary="تسجيل الخروج"
              slotProps={{
                primary: {
                  className: styles.menuText,
                },
              }}
            />
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}