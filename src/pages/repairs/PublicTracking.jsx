import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import {
  Box,
  Button,
  CircularProgress,
  Paper,
  TextField,
  Typography,
  Chip,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import StorefrontIcon from "@mui/icons-material/Storefront";
import { useTrackRepairOrder } from "../../hooks/usePublicTracking.js";
import "../../styles/public-tracking.css";

// ===============================
// ✅ خريطة الحالات
// ===============================
const STATUS_INFO = {
  1: { name: "جديدة", color: "default" },
  2: { name: "مع المندوب", color: "info" },
  3: { name: "في المشغل", color: "warning" },
  4: { name: "تم التصليح", color: "info" },
  5: { name: "مع المندوب بعد التصليح", color: "info" },
  6: { name: "جاهزة للاستلام", color: "success" },
  7: { name: "تم التسليم للعميل", color: "success" },
};

const getStatusInfo = (status) => {
  const num = Number(status);
  return (
    STATUS_INFO[num] || {
      name: "قيد التنفيذ",
      color: "default",
    }
  );
};

export default function PublicTracking() {
  const [params, setParams] = useSearchParams();
  const queryBarcode = params.get("barcode")?.trim() || "";
  const [barcode, setBarcode] = useState(queryBarcode);

  useEffect(() => setBarcode(queryBarcode), [queryBarcode]);

  const {
    data: order,
    isLoading,
    isError,
    error,
    refetch,
  } = useTrackRepairOrder(queryBarcode, !!queryBarcode);

  const submit = (event) => {
    event.preventDefault();
    const value = barcode.trim();
    if (value === queryBarcode) refetch();
    else if (value) setParams({ barcode: value });
  };

  // ✅ الحالة
  const statusNum = Number(order?.status);
  const isReady = statusNum === 6;
  const isDelivered = statusNum === 7;
  const isInProgress = statusNum >= 1 && statusNum <= 5;
  const statusInfo = getStatusInfo(statusNum);

  return (
    <Box
      className="tracking-container"
      dir="rtl"
      sx={{ minHeight: "100vh", py: { xs: 5, md: 9 }, px: 2 }}
    >
      <Box sx={{ maxWidth: 600, mx: "auto" }}>
        {/* Header */}
        <Box className="tracking-header" sx={{ textAlign: "center" }}>
          <ReceiptLongIcon
            sx={{ fontSize: 48, color: "var(--gold-primary)", mb: 1 }}
          />
          <Typography variant="h4" className="tracking-title">
            تتبع التصليحة
          </Typography>
          <Typography className="tracking-subtitle">
            أدخل رقم الباركود الموجود على إيصال التصليحة
          </Typography>
        </Box>

        {/* Form */}
        <Paper
          component="form"
          onSubmit={submit}
          elevation={0}
          className="tracking-form-card"
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            gap: 2,
            p: 3,
            mt: 3,
          }}
        >
          <TextField
            fullWidth
            label="رقم الباركود"
            value={barcode}
            onChange={(event) => setBarcode(event.target.value)}
            inputProps={{ dir: "ltr", "aria-label": "رقم الباركود" }}
          />
          <Button
            type="submit"
            variant="contained"
            startIcon={<SearchIcon />}
            disabled={!barcode.trim() || isLoading}
            sx={{ minWidth: 120 }}
          >
            بحث
          </Button>
        </Paper>

        {/* Loading */}
        {isLoading && (
          <Box sx={{ textAlign: "center", my: 5 }}>
            <CircularProgress />
          </Box>
        )}

        {/* Error */}
        {isError && (
          <Paper role="alert" sx={{ p: 3, mt: 3, textAlign: "center" }}>
            {error?.response?.data?.message ||
              "تعذر العثور على التصليحة. تحقق من رقم الباركود وحاول مرة أخرى."}
          </Paper>
        )}

        {/* ✅ النتيجة — 3 أشياء فقط */}
        {order && !isLoading && (
          <Paper
            elevation={0}
            sx={{
              p: 4,
              mt: 3,
              borderRadius: 3,
              borderTop: isReady
                ? "6px solid #2e7d32"
                : isDelivered
                ? "6px solid #1b5e20"
                : "6px solid #f57c00",
              boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
            }}
          >
            {/* ============================
                1) حالة الجاهزية — الأبرز
            ============================ */}
            <Box
              sx={{
                textAlign: "center",
                p: 3,
                mb: 4,
                borderRadius: 2,
                bgcolor: isReady
                  ? "#e8f5e9"
                  : isDelivered
                  ? "#e8f5e9"
                  : "#fff8e1",
                border: isReady
                  ? "2px solid #4caf50"
                  : isDelivered
                  ? "2px solid #4caf50"
                  : "2px solid #ffc107",
              }}
            >
              {isReady ? (
                <>
                  <CheckCircleIcon
                    sx={{ fontSize: 60, color: "#2e7d32", mb: 1 }}
                  />
                  <Typography
                    sx={{
                      color: "#1b5e20",
                      fontWeight: 800,
                      fontSize: "1.4rem",
                    }}
                  >
                    ✅ التصليحة جاهزة للاستلام
                  </Typography>
                  <Typography
                    sx={{
                      color: "#2e7d32",
                      fontSize: "0.95rem",
                      mt: 1,
                      fontWeight: 600,
                    }}
                  >
                    يرجى الحضور إلى فرع التسليم لاستلام قطعتك
                  </Typography>
                </>
              ) : isDelivered ? (
                <>
                  <CheckCircleIcon
                    sx={{ fontSize: 60, color: "#1b5e20", mb: 1 }}
                  />
                  <Typography
                    sx={{
                      color: "#1b5e20",
                      fontWeight: 800,
                      fontSize: "1.4rem",
                    }}
                  >
                    ✅ تم التسليم للعميل
                  </Typography>
                  <Typography
                    sx={{ color: "#2e7d32", fontSize: "0.95rem", mt: 1 }}
                  >
                    شكراً لثقتك بنا
                  </Typography>
                </>
              ) : (
                <>
                  <HourglassEmptyIcon
                    sx={{ fontSize: 60, color: "#f57c00", mb: 1 }}
                  />
                  <Typography
                    sx={{
                      color: "#e65100",
                      fontWeight: 800,
                      fontSize: "1.4rem",
                    }}
                  >
                    ⏳ التصليحة قيد التنفيذ
                  </Typography>
                  <Typography
                    sx={{ color: "#f57c00", fontSize: "0.9rem", mt: 1 }}
                  >
                    الحالة الحالية: {order.statusName || statusInfo.name}
                  </Typography>
                </>
              )}
            </Box>

            {/* ============================
                2) رقم الباركود
            ============================ */}
            <Box
              sx={{
                textAlign: "center",
                p: 2,
                mb: 3,
                bgcolor: "#faf6ee",
                borderRadius: 2,
                border: "1px solid #e0c88a",
              }}
            >
              <Typography
                sx={{
                  fontSize: "0.85rem",
                  color: "text.secondary",
                  fontWeight: 600,
                  mb: 1,
                }}
              >
                رقم الباركود
              </Typography>
              <Typography
                sx={{
                  fontFamily: "'Courier New', monospace",
                  fontSize: "1.5rem",
                  fontWeight: 800,
                  letterSpacing: 2,
                  color: "#b8860b",
                }}
                dir="ltr"
              >
                {order.barcode || "—"}
              </Typography>
            </Box>

            {/* ============================
                3) فرع التسليم
            ============================ */}
            <Box
              sx={{
                textAlign: "center",
                p: 3,
                bgcolor: isReady ? "#e8f5e9" : "#f5f5f5",
                borderRadius: 2,
                border: isReady
                  ? "2px solid #4caf50"
                  : "1px solid #e0e0e0",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 1,
                  mb: 1,
                }}
              >
                <StorefrontIcon
                  sx={{ color: isReady ? "#2e7d32" : "#b8860b", fontSize: 26 }}
                />
                <Typography
                  sx={{
                    fontSize: "0.9rem",
                    color: isReady ? "#1b5e20" : "text.secondary",
                    fontWeight: 700,
                  }}
                >
                  فرع التسليم
                </Typography>
              </Box>
              <Typography
                sx={{
                  fontSize: "1.3rem",
                  fontWeight: 800,
                  color: isReady ? "#1b5e20" : "#8b6914",
                }}
              >
                {order.deliveryBranchName || "—"}
              </Typography>
              {isReady && (
                <Typography
                  sx={{
                    fontSize: "0.85rem",
                    color: "#2e7d32",
                    mt: 1,
                    fontWeight: 600,
                  }}
                >
                  ← استلم قطعتك من هنا
                </Typography>
              )}
            </Box>
          </Paper>
        )}

        {/* Back */}
        <Box sx={{ mt: 3, textAlign: "center" }}>
          <Button component={Link} to="/" startIcon={<ArrowBackIcon />}>
            العودة للرئيسية
          </Button>
        </Box>
      </Box>
    </Box>
  );
}