import { useMemo } from "react";
import { Box, Grid, Paper, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";

import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import GroupIcon from "@mui/icons-material/Group";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import StorefrontIcon from "@mui/icons-material/Storefront";
import BuildIcon from "@mui/icons-material/Build";
import PersonIcon from "@mui/icons-material/Person";

import useAuthStore from "../../store/useAuthStore.js";
import { useRepairOrders } from "../../hooks/useRepairOrders.js";
import "../../styles/dashboard.css";

export default function Dashboard() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  const roles = useMemo(
    () => user?.roles?.map((r) => r.name) || [],
    [user]
  );

  const isAdmin =
    roles.includes("SuperAdmin") || roles.includes("Admin");
  const isBranchUser =
    roles.includes("BranchManager") ||
    roles.includes("BranchAccountant");
  const isRepresentative = roles.includes("Representative");
  const isOperator = roles.includes("OperatorManager");

  const { data: orders = [] } = useRepairOrders(
    {},
    {
      enabled: isAdmin || isBranchUser,
    }
  );

  const todayKey = new Date().toLocaleDateString("en-CA");
  const todayOrders = orders.filter(
    (order) =>
      order.createdAt &&
      new Date(order.createdAt).toLocaleDateString("en-CA") === todayKey
  );

  const completed = (list) =>
    list.filter((order) => Number(order.status) >= 5).length;

  const metrics = [
    { title: "تصاليح اليوم", value: todayOrders.length },
    {
      title: "إنجاز اليوم",
      value: `${
        todayOrders.length
          ? Math.round(
              (completed(todayOrders) / todayOrders.length) * 100
            )
          : 0
      }%`,
      progress: todayOrders.length
        ? (completed(todayOrders) / todayOrders.length) * 100
        : 0,
    },
    { title: "مجموع التصاليح", value: orders.length },
    {
      title: "الإنجاز الكلي",
      value: `${
        orders.length
          ? Math.round((completed(orders) / orders.length) * 100)
          : 0
      }%`,
      progress: orders.length
        ? (completed(orders) / orders.length) * 100
        : 0,
    },
  ];

  const allCards = [
    {
      title: "إدارة الحسابات",
      icon: <ManageAccountsIcon sx={{ fontSize: 30 }} />,
      path: "/accounts",
      show: isAdmin,
    },
    {
      title: "إدارة الفروع",
      icon: <StorefrontIcon sx={{ fontSize: 30 }} />,
      path: "/branches",
      show: isAdmin,
    },
    {
      title: "إدارة الورش",
      icon: <BuildIcon sx={{ fontSize: 30 }} />,
      path: "/workshops",
      show: isAdmin,
    },
    {
      title: "كشف التصاليح",
      icon: <ReceiptLongIcon sx={{ fontSize: 30 }} />,
      path: "/repairs/list",
      show: isAdmin || isBranchUser,
    },
    {
      title: "مسح الباركود",
      icon: <QrCodeScannerIcon sx={{ fontSize: 30 }} />,
      path: "/repairs/scan",
      show:
        isAdmin || isBranchUser || isOperator || isRepresentative,
    },
    {
      title: "تصليحة جديدة",
      icon: <AddCircleIcon sx={{ fontSize: 30 }} />,
      path: "/repairs/create",
      show: isBranchUser,
    },
    {
      title: "الاستلام والتسليم",
      icon: <SwapHorizIcon sx={{ fontSize: 30 }} />,
      path: "/repairs/pickup-delivery",
      show: isBranchUser,
    },
    {
      title: "ملخص المندوبين",
      icon: <GroupIcon sx={{ fontSize: 30 }} />,
      path: "/repairs/representatives-summary",
      show: isAdmin,
    },
    {
      title: "لوحة المندوب",
      icon: <LocalShippingIcon sx={{ fontSize: 30 }} />,
      path: "/repairs/representative",
      show: isRepresentative,
    },
    {
      title: "لوحة المشغّل",
      icon: <BuildIcon sx={{ fontSize: 30 }} />,
      path: "/repairs/operator",
      show: isOperator || isAdmin,
    },
    {
      title: "حسابي",
      icon: <PersonIcon sx={{ fontSize: 30 }} />,
      path: "/profile",
      show: true,
    },
  ];

  const cards = allCards.filter((c) => c.show);

  return (
    <div className="dashboard-container">
      <div className="dashboard-welcome">
        <Typography className="dashboard-welcome-sub">
          مرحباً بك في
        </Typography>
        <Typography className="dashboard-welcome-title">
          مجموعة عايد دعنا
        </Typography>

        <Typography
          sx={{
            fontFamily: "'Cairo', sans-serif",
            fontSize: "0.9rem",
            color: "var(--text-secondary)",
            mt: 1,
          }}
        >
          أهلاً {user?.fullName || "بك"}
        </Typography>
      </div>

      {(isAdmin || isBranchUser) && (
        <Grid container spacing={2} sx={{ mb: 4 }}>
          {metrics.map((metric) => (
            <Grid item xs={6} md={3} key={metric.title}>
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 2, md: 2.5 },
                  borderRadius: 3,
                  minHeight: 132,
                  border: "1px solid var(--border-gold-strong)",
                  backgroundColor: "var(--bg-paper)",
                }}
              >
                <Typography
                  color="text.secondary"
                  sx={{ fontSize: { xs: ".75rem", sm: ".9rem" } }}
                >
                  {metric.title}
                </Typography>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 800,
                    color: "var(--gold-primary)",
                    my: 1,
                  }}
                >
                  {metric.value}
                </Typography>
                {metric.progress !== undefined && (
                  <Box
                    sx={{
                      height: 7,
                      bgcolor: "var(--border-gold-strong)",
                      borderRadius: 2,
                      overflow: "hidden",
                    }}
                  >
                    <Box
                      sx={{
                        width: `${metric.progress}%`,
                        height: "100%",
                        bgcolor: "var(--gold-primary)",
                      }}
                    />
                  </Box>
                )}
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}

      <Grid
        container
        spacing={{ xs: 2, sm: 3 }}
        className="dashboard-grid"
      >
        {cards.map((card) => (
          <Grid item xs={12} sm={6} md={4} key={card.title}>
            <Paper
              elevation={0}
              onClick={() => navigate(card.path)}
              className="dashboard-card"
            >
              <div className="dashboard-card-circle">{card.icon}</div>
              <Typography className="dashboard-card-title">
                {card.title}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </div>
  );
}