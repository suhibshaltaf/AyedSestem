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
import StorefrontIcon from "@mui/icons-material/Storefront";
import BuildIcon from "@mui/icons-material/Build";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import SettingsIcon from "@mui/icons-material/Settings";

import useAuthStore from "../../store/useAuthStore.js";
import companyLogo from "../../assets/Logo.svg";
import "../../styles/sidebar.css";

const SIDEBAR_WIDTH = 240;

function SidebarContent({ onClose }) {
  const navigate = useNavigate();
  const location = useLocation();

  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const roles = user?.roles?.map((r) => r.name) || [];

  // ✅ هل المستخدم Admin أو SuperAdmin؟
  const isAdmin = roles.includes("SuperAdmin") || roles.includes("Admin");

  const handleLogout = () => {
    logout();
    toast.success("تم تسجيل الخروج بنجاح");
    navigate("/login", { replace: true });
  };

  const handleNavigate = (path) => {
    navigate(path);
    if (onClose) onClose();
  };

  const isActive = (path) =>
    location.pathname === path || location.pathname.startsWith(path + "/");

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
      // ✅ النص يتغير حسب الدور
      label: isAdmin ? "إدارة الفروع" : "الفرع",
      icon: <StorefrontIcon fontSize="small" />,
      path: "/branches",
      roles: ["SuperAdmin", "Admin", "BranchManager"],
    },
    {
      label: "إدارة الورش",
      icon: <BuildIcon fontSize="small" />,
      path: "/workshops",
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

  const visibleItems = menuItems.filter((item) => {
    if (!item.roles || item.roles.length === 0) return true;
    if (roles.length === 0) return false;
    return item.roles.some((r) => roles.includes(r));
  });

  return (
    <div className="sidebar-content">
      <div className="sidebar-header">
        <img
          src={companyLogo}
          alt="مجموعة عايد دعنا"
          className="sidebar-logo"
        />

        <Typography className="sidebar-title">
          مجموعة عايد دعنا
        </Typography>
      </div>

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
    </div>
  );
}

export default function Sidebar({ mobileOpen, onClose }) {
  return (
    <>
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