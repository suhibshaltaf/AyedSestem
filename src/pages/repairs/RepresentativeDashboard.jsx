import { useMemo } from "react";
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Grid,
  Chip,
  Divider,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import BuildIcon from "@mui/icons-material/Build";
import VisibilityIcon from "@mui/icons-material/Visibility";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";

import {
  useRepresentativeDashboard,
  useRepresentativeOrders,
} from "../../hooks/useRepresentative.js";
import {
  getStatusName,
  getStatusColor,
} from "../../utils/repairConstants.js";
import "../../styles/repairs.css";

export default function RepresentativeDashboard() {
  const navigate = useNavigate();

  const { data: dashboard, isLoading: loadingDashboard } =
    useRepresentativeDashboard();
  const { data: orders = [], isLoading: loadingOrders } =
    useRepresentativeOrders();

  // إحصائيات
  const stats = useMemo(() => {
    return {
      total: dashboard?.totalOrders || orders.length || 0,
      withRepresentative:
        dashboard?.withRepresentative ||
        orders.filter((o) => o.status === 2 || o.status === 6).length,
      atWorkshop:
        dashboard?.atWorkshop ||
        orders.filter((o) => o.status === 3 || o.status === 4).length,
      ready:
        dashboard?.readyForPickup ||
        orders.filter((o) => o.status === 5).length,
    };
  }, [dashboard, orders]);

  if (loadingDashboard || loadingOrders) {
    return (
      <Box className="repairs-details-loading">
        <CircularProgress sx={{ color: "#b8860b" }} />
      </Box>
    );
  }

  const cards = [
    {
      label: "إجمالي التصاليح",
      value: stats.total,
      icon: <ReceiptLongIcon sx={{ fontSize: 28 }} />,
      color: "gold",
    },
    {
      label: "مع المندوب",
      value: stats.withRepresentative,
      icon: <LocalShippingIcon sx={{ fontSize: 28 }} />,
      color: "blue",
    },
    {
      label: "في الورشة",
      value: stats.atWorkshop,
      icon: <BuildIcon sx={{ fontSize: 28 }} />,
      color: "orange",
    },
    {
      label: "جاهزة للاستلام",
      value: stats.ready,
      icon: <CheckCircleIcon sx={{ fontSize: 28 }} />,
      color: "green",
    },
  ];

  return (
    <div className="repairs-list-container">
      {/* Header */}
      <div className="repairs-list-header">
        <div className="repairs-list-header-icon">
          <LocalShippingIcon sx={{ fontSize: 34 }} />
        </div>

        <Typography className="repairs-list-title">لوحة المندوب</Typography>

        <Typography className="repairs-list-subtitle">
          ملخص التصاليح الخاصة بك
        </Typography>
      </div>

      {/* Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {cards.map((card) => (
          <Grid item xs={6} sm={3} key={card.label}>
            <Paper
              elevation={0}
              className={`repairs-stat-card repairs-stat-${card.color}`}
            >
              <div className="repairs-stat-icon">{card.icon}</div>
              <Typography className="repairs-stat-value">
                {card.value}
              </Typography>
              <Typography className="repairs-stat-label">
                {card.label}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Orders */}
      <Paper elevation={0} className="repairs-table-paper">
        <div className="repairs-section-header">
          <Typography className="repairs-section-header-title">
            التصاليح الحالية
          </Typography>
        </div>

        <Divider />

        {orders.length === 0 ? (
          <Box className="repairs-empty">
            <Typography>لا توجد تصاليح حالياً</Typography>
          </Box>
        ) : (
          <div className="repairs-orders-list">
            {orders.map((order) => (
              <div key={order.id} className="repairs-order-item">
                <div className="repairs-order-item-info">
                  <Chip
                    label={order.barcode || "—"}
                    size="small"
                    className="repairs-barcode-chip"
                  />

                  <Typography className="repairs-order-item-name">
                    {order.customerName || "—"}
                  </Typography>

                  <Typography className="repairs-order-item-desc">
                    {order.description || "—"}
                  </Typography>

                  <Chip
                    label={getStatusName(order.status)}
                    size="small"
                    className={`repairs-status-chip repairs-status-${getStatusColor(
                      order.status
                    )}`}
                  />
                </div>

                <Tooltip title="عرض التفاصيل">
                  <IconButton
                    onClick={() => navigate(`/repairs/${order.id}`)}
                    className="repairs-view-btn"
                  >
                    <VisibilityIcon />
                  </IconButton>
                </Tooltip>
              </div>
            ))}
          </div>
        )}
      </Paper>
    </div>
  );
}