import { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  CircularProgress,
  Chip,
  Divider,
  IconButton,
  Tooltip,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

import SearchIcon from "@mui/icons-material/Search";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import StorefrontIcon from "@mui/icons-material/Storefront";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import LoginIcon from "@mui/icons-material/Login";
import DashboardIcon from "@mui/icons-material/Dashboard";
import RefreshIcon from "@mui/icons-material/Refresh";

import { useTrackRepairOrder } from "../../hooks/usePublicTracking.js";
import useAuthStore from "../../store/useAuthStore.js";
import "../../styles/home.css";

export default function HomePage() {
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);

  const [barcode, setBarcode] = useState("");
  const [searchTriggered, setSearchTriggered] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // ✅ التتبع - بدون pickupBranchId
  const {
    data: order,
    isLoading: loadingOrder,
    isError,
    error,
    refetch,
  } = useTrackRepairOrder(barcode, searchTriggered);

  const handleSearch = () => {
    const errors = {};
    if (!barcode.trim()) errors.barcode = "الرجاء إدخال رقم الباركود";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    setSearchTriggered(true);
  };

  const handleReset = () => {
    setBarcode("");
    setSearchTriggered(false);
    setFormErrors({});
  };

  const isReady = order?.isReadyForPickup === true;
  const isDelivered = order?.isDeliveredToCustomer === true;

  return (
    <Box className="home-container">
      {/* زر تسجيل الدخول / لوحة التحكم */}
      <Box className="home-login-btn-wrapper">
        {token ? (
          <Button
            variant="contained"
            onClick={() => navigate("/dashboard")}
            className="home-login-btn home-login-btn-dashboard"
            startIcon={<DashboardIcon />}
          >
            لوحة التحكم
          </Button>
        ) : (
          <Button
            variant="outlined"
            startIcon={<LoginIcon />}
            onClick={() => navigate("/login")}
            className="home-login-btn"
          >
            تسجيل الدخول
          </Button>
        )}
      </Box>

      {/* Header */}
      <div className="home-header">
        <div className="home-header-icon">
          <ReceiptLongIcon sx={{ fontSize: 40 }} />
        </div>

        <Typography className="home-title">مجموعة عايد دعنا</Typography>

        <Typography className="home-subtitle">
          أهلاً بكم — تتبع تصليحتك بسهولة
        </Typography>

        <div className="home-title-decor">
          <span className="home-title-line" />
          <Typography className="home-title-decor-text">
            تتبع التصليحة
          </Typography>
          <span className="home-title-line" />
        </div>
      </div>

      {/* Form */}
      <Paper elevation={0} className="home-form-card">
        <Typography className="home-form-title">
          أدخل رقم الباركود للبحث
        </Typography>

        <div className="home-form-grid-single">
          <TextField
            fullWidth
            label="رقم الباركود"
            value={barcode}
            onChange={(e) => {
              setBarcode(e.target.value);
              if (formErrors.barcode) {
                setFormErrors((prev) => ({ ...prev, barcode: "" }));
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearch();
            }}
            error={!!formErrors.barcode}
            helperText={formErrors.barcode}
            className="home-field"
            slotProps={{
              input: {
                startAdornment: (
                  <SearchIcon
                    sx={{ color: "#c9a44c", fontSize: 22, ml: 1 }}
                  />
                ),
              },
            }}
          />
        </div>

        <div className="home-form-actions">
          <Button
            variant="contained"
            startIcon={
              loadingOrder ? (
                <CircularProgress size={18} sx={{ color: "#fff" }} />
              ) : (
                <SearchIcon />
              )
            }
            onClick={handleSearch}
            disabled={loadingOrder}
            className="home-search-btn"
          >
            {loadingOrder ? "جاري البحث..." : "بحث"}
          </Button>

          {searchTriggered && (
            <Button
              variant="outlined"
              onClick={handleReset}
              className="home-reset-btn"
            >
              بحث جديد
            </Button>
          )}
        </div>
      </Paper>

      {/* Error */}
      {isError && searchTriggered && !loadingOrder && (
        <Paper elevation={0} className="home-result-card home-error">
          <Typography className="home-error-text">
            {error?.response?.data?.message ||
              "لم يتم العثور على التصليحة. تأكد من رقم الباركود."}
          </Typography>
        </Paper>
      )}

      {/* Result */}
      {order && !loadingOrder && !isError && (
        <Paper elevation={0} className="home-result-card">
          <div
            className={`home-status-highlight ${
              isReady || isDelivered ? "home-ready" : "home-not-ready"
            }`}
          >
            {isDelivered ? (
              <>
                <CheckCircleIcon sx={{ fontSize: 48 }} />
                <Typography className="home-status-text">
                  تم تسليم التصليحة
                </Typography>
                <Typography className="home-status-sub">
                  شكراً لتعاملكم معنا
                </Typography>
              </>
            ) : isReady ? (
              <>
                <CheckCircleIcon sx={{ fontSize: 48 }} />
                <Typography className="home-status-text">
                  التصليحة جاهزة للاستلام
                </Typography>
                <Typography className="home-status-sub">
                  يرجى الحضور إلى الفرع لاستلامها
                </Typography>
              </>
            ) : (
              <>
                <HourglassEmptyIcon sx={{ fontSize: 48 }} />
                <Typography className="home-status-text">
                  التصليحة غير جاهزة للاستلام
                </Typography>
                <Typography className="home-status-sub">
                  {order.status || "قيد التنفيذ"}
                </Typography>
              </>
            )}
          </div>

          <Divider className="home-divider" />

          <div className="home-details">
            <div className="home-row">
              <Typography className="home-value home-value-mono">
                {order.barcode}
              </Typography>
              <div className="home-label">
                <span>رقم الباركود:</span>
                <ReceiptLongIcon sx={{ fontSize: 18 }} />
              </div>
            </div>

            <Divider className="home-divider" />

            <div className="home-row">
              <Typography className="home-value">
                {order.pickupBranchName || "—"}
              </Typography>
              <div className="home-label">
                <span>فرع الاستلام:</span>
                <StorefrontIcon sx={{ fontSize: 18 }} />
              </div>
            </div>

            <Divider className="home-divider" />

            <div className="home-row">
              <Typography className="home-value">
                {order.deliveryBranchName || "—"}
              </Typography>
              <div className="home-label">
                <span>فرع التسليم:</span>
                <StorefrontIcon sx={{ fontSize: 18 }} />
              </div>
            </div>

            <Divider className="home-divider" />

            <div className="home-row">
              <Chip
                label={order.status || "—"}
                className="home-status-chip"
                size="small"
              />
              <div className="home-label">
                <span>الحالة:</span>
              </div>
            </div>

            <Divider className="home-divider" />

            <div className="home-row">
              <Typography className="home-value home-value-date">
                {order.createdAt
                  ? new Date(order.createdAt).toLocaleDateString("ar-JO")
                  : "—"}
              </Typography>
              <div className="home-label">
                <span>تاريخ الاستلام:</span>
                <CalendarTodayIcon sx={{ fontSize: 18 }} />
              </div>
            </div>
          </div>

          <div className="home-result-actions">
            <Tooltip title="تحديث">
              <IconButton
                onClick={() => refetch()}
                className="home-refresh-btn"
                disabled={loadingOrder}
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </div>
        </Paper>
      )}

      <Typography className="home-footer">
        © 2026 مجموعة عايد دعنا — جميع الحقوق محفوظة
      </Typography>
    </Box>
  );
}