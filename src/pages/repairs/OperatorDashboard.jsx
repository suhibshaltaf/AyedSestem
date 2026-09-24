import { useMemo } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Button,
  Chip,
  Tooltip,
  CircularProgress,
  Grid,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

import BuildIcon from "@mui/icons-material/Build";
import RefreshIcon from "@mui/icons-material/Refresh";
import VisibilityIcon from "@mui/icons-material/Visibility";
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import StorefrontIcon from "@mui/icons-material/Storefront";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";

import {
  useOperatorDashboard,
  useOperatorOrders,
} from "../../hooks/useRepairOrders.js";
import {
  getStatusName,
  getStatusColor,
} from "../../utils/repairConstants.js";
import "../../styles/repairs.css";

export default function OperatorDashboard() {
  const navigate = useNavigate();

  const {
    data: dashboard,
    isLoading: loadingStats,
    refetch: refetchStats,
  } = useOperatorDashboard();

  const {
    data: orders = [],
    isLoading: loadingOrders,
    refetch: refetchOrders,
  } = useOperatorOrders();

  const stats = useMemo(
    () => [
      {
        title: "إجمالي القطع المستلمة",
        value: dashboard?.totalReceived ?? 0,
        icon: <Inventory2Icon sx={{ fontSize: 30 }} />,
        color: "#b8860b",
      },
      {
        title: "القطع الحالية في المشغل",
        value: dashboard?.currentlyAtWorkshop ?? 0,
        icon: <BuildIcon sx={{ fontSize: 30 }} />,
        color: "#d97706",
      },
      {
        title: "جاهزة للإرجاع",
        value: dashboard?.currentlyCompleted ?? 0,
        icon: <CheckCircleIcon sx={{ fontSize: 30 }} />,
        color: "#16a34a",
      },
      {
        title: "خرجت من المشغل",
        value: dashboard?.leftWorkshop ?? 0,
        icon: <LocalShippingIcon sx={{ fontSize: 30 }} />,
        color: "#2563eb",
      },
    ],
    [dashboard]
  );

  const handleRefresh = () => {
    refetchStats();
    refetchOrders();
  };

  const loading = loadingStats || loadingOrders;

  return (
    <div className="repairs-list-container">
      {/* Header */}
      <div className="repairs-list-header">
        <div className="repairs-list-header-icon">
          <BuildIcon sx={{ fontSize: 34 }} />
        </div>

        <Typography className="repairs-list-title">لوحة المشغّل</Typography>

        <Typography className="repairs-list-subtitle">
          القطع الموجودة حالياً في المشغل
        </Typography>
      </div>

      {/* زر المسح */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          mb: 3,
          gap: 2,
          flexWrap: "wrap",
        }}
      >
        <Button
          variant="contained"
          size="large"
          startIcon={<QrCodeScannerIcon />}
          onClick={() => navigate("/repairs/scan")}
          sx={{
            fontFamily: "'Cairo', sans-serif",
            textTransform: "none",
            fontWeight: 700,
            background: "linear-gradient(90deg, #c79a4b, #a67c2e)",
            px: 4,
            py: 1.4,
            borderRadius: 2,
            "&:hover": {
              background: "linear-gradient(90deg, #b8860b, #8b6914)",
            },
          }}
        >
          مسح قطعة
        </Button>

        <Tooltip title="تحديث">
          <IconButton
            onClick={handleRefresh}
            className="repairs-refresh-btn"
            sx={{ width: 52, height: 52 }}
          >
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* الإحصائيات */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {stats.map((stat) => (
          <Grid item xs={6} md={3} key={stat.title}>
            <Paper
              elevation={0}
              sx={{
                p: { xs: 2, md: 2.5 },
                borderRadius: 3,
                minHeight: 130,
                border: "1px solid var(--border-gold-strong)",
                backgroundColor: "var(--bg-paper)",
                textAlign: "center",
              }}
            >
              <Box sx={{ color: stat.color, mb: 1 }}>{stat.icon}</Box>
              <Typography
                variant="h4"
                sx={{ fontWeight: 800, color: stat.color, mb: 0.5 }}
              >
                {stat.value}
              </Typography>
              <Typography
                sx={{
                  fontFamily: "'Cairo', sans-serif",
                  fontSize: "0.82rem",
                  color: "var(--text-secondary)",
                }}
              >
                {stat.title}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* الجدول */}
      <Paper elevation={0} className="repairs-table-paper">
        {loading ? (
          <Box className="repairs-loading">
            <CircularProgress sx={{ color: "#b8860b" }} />
          </Box>
        ) : orders.length === 0 ? (
          <Box className="repairs-empty">
            <Typography>لا توجد قطع حالياً في المشغل</Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow className="repairs-table-head-row">
                  <TableCell className="repairs-th">#</TableCell>
                  <TableCell className="repairs-th">الباركود</TableCell>
                  <TableCell className="repairs-th">العميل</TableCell>
                  <TableCell className="repairs-th">الوصف</TableCell>
                  <TableCell className="repairs-th">الفرع الداخل</TableCell>
                  <TableCell className="repairs-th">الحالة</TableCell>
                  <TableCell className="repairs-th">آخر تحديث</TableCell>
                  <TableCell className="repairs-th" align="center">
                    الإجراءات
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {orders.map((order, index) => (
                  <TableRow key={order.id} className="repairs-table-row">
                    <TableCell className="repairs-td">{index + 1}</TableCell>

                    <TableCell className="repairs-td">
                      <Chip
                        label={order.barcode || "—"}
                        size="small"
                        className="repairs-barcode-chip"
                      />
                    </TableCell>

                    <TableCell className="repairs-td repairs-td-name">
                      {order.customerName || "—"}
                    </TableCell>

                    <TableCell className="repairs-td">
                      {order.description || "—"}
                    </TableCell>

                    <TableCell className="repairs-td">
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 0.5,
                        }}
                      >
                        <StorefrontIcon
                          sx={{ fontSize: 16, color: "var(--gold-primary)" }}
                        />
                        <span>{order.pickupBranchName || "—"}</span>
                      </Box>
                    </TableCell>

                    <TableCell className="repairs-td">
                      <Chip
                        label={order.statusName || getStatusName(order.status)}
                        size="small"
                        className={`repairs-status-chip repairs-status-${getStatusColor(
                          order.status
                        )}`}
                      />
                    </TableCell>

                    <TableCell className="repairs-td repairs-td-date">
                      {order.updatedAt
                        ? new Date(order.updatedAt).toLocaleString("ar-JO", {
                            month: "2-digit",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "—"}
                    </TableCell>

                    <TableCell className="repairs-td" align="center">
                      <Tooltip title="عرض التفاصيل">
                        <IconButton
                          size="small"
                          className="repairs-action-btn repairs-view-btn"
                          onClick={() => navigate(`/repairs/${order.id}`)}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </div>
  );
}