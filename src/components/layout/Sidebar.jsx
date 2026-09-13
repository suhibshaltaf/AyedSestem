  import {
    Box,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Typography,
    Divider,
    Drawer,
  } from "@mui/material";
  import { useNavigate, useLocation } from "react-router-dom";
  import { toast } from "react-toastify";

  import HomeIcon from "@mui/icons-material/Home";
  import PersonIcon from "@mui/icons-material/Person";
  import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
  import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
  import SettingsIcon from "@mui/icons-material/Settings";
  import LogoutIcon from "@mui/icons-material/Logout";

  import useAuthStore from "../../store/useAuthStore.js";
  import "../../styles/sidebar.css";

  const SIDEBAR_WIDTH = 240;

  function SidebarContent({ onClose }) {
    const navigate = useNavigate();
    const location = useLocation();

    const user = useAuthStore((state) => state.user);
    const logout = useAuthStore((state) => state.logout);

    // ✅ قائمة الأدوار
    const roles = user?.roles?.map((r) => r.name) || [];

    // ===============================
    // Logout
    // ===============================
    const handleLogout = () => {
      logout();
      toast.success("تم تسجيل الخروج بنجاح");
      navigate("/login", { replace: true });
    };

    // ===============================
    // Navigate
    // ===============================
    const handleNavigate = (path) => {
      navigate(path);
      if (onClose) onClose();
    };

    // ===============================
    // Active
    // ===============================
    const isActive = (path) =>
      location.pathname === path || location.pathname.startsWith(path + "/");

    // ===============================
    // عناصر القائمة
    // ===============================
    const menuItems = [
      {
        label: "الصفحة الرئيسية",
        icon: <HomeIcon fontSize="small" />,
        path: "/dashboard",
      },
      {
        label: "حسابي",
        icon: <PersonIcon fontSize="small" />,
        path: "/profile",
      },
      {
        label: "إدارة الحسابات",
        icon: <ManageAccountsIcon fontSize="small" />,
        path: "/accounts",
        roles: ["SuperAdmin", "Admin"],
      },
      {
        label: "كشف التصاليح",
        icon: <ReceiptLongIcon fontSize="small" />,
        path: "/repairs/list",
      },
      {
        label: "الضبط",
        icon: <SettingsIcon fontSize="small" />,
        path: "/settings",
      },
    ];

    // ===============================
    // فلترة القائمة حسب الصلاحيات
    // ===============================
    const visibleItems = menuItems.filter((item) => {
      // إذا لم يُحدد أدوار → متاح للجميع
      if (!item.roles || item.roles.length === 0) return true;

      // إذا لم يكن للمستخدم أي دور → لا يظهر
      if (roles.length === 0) return false;

      // التحقق: هل أحد أدوار المستخدم موجود في item.roles؟
      return item.roles.some((r) => roles.includes(r));
    });

    return (
      <div className="sidebar-content">
        {/* ===============================
            Logo + Name
        =============================== */}
        <div className="sidebar-header">
          <svg
            viewBox="0 0 70 60"
            width="42"
            height="38"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient
                id="sidebarGoldGrad"
                x1="0%"
                y1="0%"
                x2="0%"
                y2="100%"
              >
                <stop offset="0%" stopColor="#d4af6a" />
                <stop offset="100%" stopColor="#a67c2e" />
              </linearGradient>
            </defs>
            <path
              d="M 10 52 L 22 12 L 34 52"
              stroke="url(#sidebarGoldGrad)"
              strokeWidth="3.5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <line
              x1="16"
              y1="38"
              x2="28"
              y2="38"
              stroke="url(#sidebarGoldGrad)"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            <path
              d="M 32 14 L 42 52 L 52 14"
              stroke="url(#sidebarGoldGrad)"
              strokeWidth="3.5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <line
              x1="22"
              y1="12"
              x2="42"
              y2="12"
              stroke="url(#sidebarGoldGrad)"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
          </svg>

          <Typography className="sidebar-title">
            مجموعة عايد وإخوانه
          </Typography>
        </div>

        {/* ===============================
            Menu
        =============================== */}
        <List className="sidebar-list">
          {visibleItems.map((item) => {
            const active = isActive(item.path);
            return (
              <ListItemButton
                key={item.path}
                onClick={() => handleNavigate(item.path)}
                className={`sidebar-item ${
                  active ? "sidebar-item-active" : ""
                }`}
              >
                <ListItemIcon
                  className={`sidebar-icon ${
                    active ? "sidebar-icon-active" : ""
                  }`}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontSize: "0.85rem",
                    fontWeight: active ? 700 : 500,
                  }}
                />
              </ListItemButton>
            );
          })}
        </List>

        <Divider className="sidebar-divider" />

        {/* ===============================
            Logout
        =============================== */}
      
      </div>
    );
  }

  export default function Sidebar({ mobileOpen, onClose }) {
    return (
      <>
        {/* Desktop */}
        <Box
          component="aside"
          className="sidebar-desktop"
          sx={{
            width: { md: SIDEBAR_WIDTH },
            display: { xs: "none", md: "block" },
          }}
        >
          <SidebarContent />
        </Box>

        {/* Mobile Drawer */}
        <Drawer
          anchor="right"
          open={mobileOpen}
          onClose={onClose}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: "block", md: "none" },
            "& .MuiDrawer-paper": {
              width: SIDEBAR_WIDTH,
              boxSizing: "border-box",
              backgroundColor: "var(--bg-sidebar)",
              borderLeft: "none",
            },
          }}
        >
          <SidebarContent onClose={onClose} />
        </Drawer>
      </>
    );
  }   