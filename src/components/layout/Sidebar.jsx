
import { useMemo } from "react";

import {
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  Drawer,
  Tooltip,
} from "@mui/material";

import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";

import HomeIcon from "@mui/icons-material/Home";
import PersonIcon from "@mui/icons-material/Person";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import StorefrontIcon from "@mui/icons-material/Storefront";
import BuildIcon from "@mui/icons-material/Build";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";
import SettingsIcon from "@mui/icons-material/Settings";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import GroupIcon from "@mui/icons-material/Group";
import ArchiveIcon from "@mui/icons-material/Archive";

import useAuthStore from "../../store/useAuthStore.js";
import companyLogo from "../../assets/Logo.svg";
import styles from "../../styles/Sidebar/Sidebar.module.css";

const SIDEBAR_WIDTH = 240;

const READY_ITEMS = [
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
    label: "إدارة الفروع",
    icon: <StorefrontIcon fontSize="small" />,
    path: "/branches",
    roles: ["SuperAdmin", "Admin"],
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
    roles: [
      "SuperAdmin",
      "Admin",
      "BranchManager",
      "BranchAccountant",
    ],
  },

  // أرشيف التصاليح القديمة
  {
    label: "أرشيف التصاليح القديمة",
    icon: <ArchiveIcon fontSize="small" />,
    path: "/old-maintenance-orders",
    roles: ["SuperAdmin", "Admin", "BranchManager"],
  },

  {
    label: "الاستلام والتسليم",
    icon: <SwapHorizIcon fontSize="small" />,
    path: "/repairs/pickup-delivery",
    roles: [
      "SuperAdmin",
      "Admin",
      "BranchManager",
      "BranchAccountant",
    ],
  },
  {
    label: "ملخص المندوبين",
    icon: <GroupIcon fontSize="small" />,
    path: "/repairs/representatives-summary",
    roles: ["SuperAdmin", "Admin"],
  },
  {
    label: "لوحة المشغّل",
    icon: <BuildIcon fontSize="small" />,
    path: "/repairs/operator",
    roles: ["SuperAdmin", "Admin", "OperatorManager"],
  },
  {
    label: "مسح QR",
    icon: <QrCodeScannerIcon fontSize="small" />,
    path: "/repairs/scan",
    roles: [
      "SuperAdmin",
      "Admin",
      "BranchManager",
      "BranchAccountant",
      "OperatorManager",
      "Representative",
    ],
  },
  {
    label: "الضبط",
    icon: <SettingsIcon fontSize="small" />,
    path: "/settings",
  },
];

const DISABLED_ITEMS = [];

function SidebarContent({ onClose }) {
  const navigate = useNavigate();
  const location = useLocation();

  const user = useAuthStore((state) => state.user);

  const roles = useMemo(
    () => user?.roles?.map((r) => r.name) || [],
    [user]
  );

  const isBranchRole = useMemo(
    () =>
      roles.includes("BranchManager") ||
      roles.includes("BranchAccountant"),
    [roles]
  );

  const handleNavigate = (path) => {
    navigate(path);

    if (onClose) onClose();
  };

  const handleDisabledClick = () => {
    toast.info("سوف يتم تجهيز هذا القسم في الـ API قريباً", {
      position: "top-center",
      autoClose: 3000,
    });
  };

  const isActive = (path) =>
    location.pathname === path ||
    location.pathname.startsWith(path + "/");

  const visibleReadyItems = READY_ITEMS.filter((item) => {
    if (!item.roles || item.roles.length === 0) return true;

    if (roles.length === 0) return false;

    return item.roles.some((role) => roles.includes(role));
  });

  const visibleDisabledItems = DISABLED_ITEMS.filter((item) => {
    if (!item.roles || item.roles.length === 0) return true;

    if (roles.length === 0) return false;

    return item.roles.some((role) => roles.includes(role));
  });

  const branchPath = user?.branchId
    ? `/branches/${user.branchId}`
    : null;

  return (
    <div className={styles.sidebarContent}>
      <div className={styles.sidebarHeader}>
        <img
          src={companyLogo}
          alt="مجموعة عايد دعنا"
          className={styles.sidebarLogo}
        />

        <Typography className={styles.sidebarTitle}>
          مجموعة عايد دعنا
        </Typography>
      </div>

      <List className={styles.sidebarList}>
        {isBranchRole && branchPath && (
          <ListItemButton
            onClick={() => handleNavigate(branchPath)}
            className={`${styles.sidebarItem} ${
              isActive(branchPath)
                ? styles.sidebarItemActive
                : ""
            }`}
          >
            <ListItemIcon
              className={`${styles.sidebarIcon} ${
                isActive(branchPath)
                  ? styles.sidebarIconActive
                  : ""
              }`}
            >
              <StorefrontIcon fontSize="small" />
            </ListItemIcon>

            <ListItemText
              primary="فرعي"
              primaryTypographyProps={{
                fontSize: "0.85rem",
                fontWeight: isActive(branchPath) ? 700 : 600,
              }}
            />
          </ListItemButton>
        )}

        {visibleReadyItems.map((item) => {
          const active = isActive(item.path);

          return (
            <ListItemButton
              key={item.path}
              onClick={() => handleNavigate(item.path)}
              className={`${styles.sidebarItem} ${
                active ? styles.sidebarItemActive : ""
              }`}
            >
              <ListItemIcon
                className={`${styles.sidebarIcon} ${
                  active ? styles.sidebarIconActive : ""
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

      {visibleDisabledItems.length > 0 && (
        <>
          <Divider className={styles.sidebarDivider} />

          <Typography className={styles.sidebarSectionTitle}>
            قيد التطوير
          </Typography>

          <List className={styles.sidebarList}>
            {visibleDisabledItems.map((item) => (
              <Tooltip
                key={item.label}
                title="سوف يتم تجهيزه في الـ API قريباً"
                placement="left"
                arrow
              >
                <span>
                  <ListItemButton
                    disabled
                    onClick={handleDisabledClick}
                    className={`${styles.sidebarItem} ${styles.sidebarItemDisabled}`}
                  >
                    <ListItemIcon
                      className={`${styles.sidebarIcon} ${styles.sidebarIconDisabled}`}
                    >
                      {item.icon}
                    </ListItemIcon>

                    <ListItemText
                      primary={item.label}
                      primaryTypographyProps={{
                        fontSize: "0.85rem",
                        fontWeight: 500,
                      }}
                    />
                  </ListItemButton>
                </span>
              </Tooltip>
            ))}
          </List>
        </>
      )}
    </div>
  );
}

export default function Sidebar({ mobileOpen, onClose }) {
  return (
    <>
      <Box
        component="aside"
        className={styles.sidebarDesktop}
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
