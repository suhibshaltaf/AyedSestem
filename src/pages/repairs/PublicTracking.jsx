import { useState, useMemo } from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  MenuItem,
  CircularProgress,
  Chip,
  Divider,
  Grid,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

import SearchIcon from "@mui/icons-material/Search";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import StorefrontIcon from "@mui/icons-material/Storefront";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

import {
  usePublicBranches,
  useTrackRepairOrder,
} from "../../hooks/usePublicTracking.js";
import "../../styles/public-tracking.css";

export default function PublicTracking() {
  const navigate = useNavigate();

  const [barcode, setBarcode] = useState("");
  const [pickupBranchId, setPickupBranchId] = useState("");
  const [searchTriggered, setSearchTriggered] = useState(false);

  // جلب الفروع العامة
  const { data: branches = [], isLoading: loadingBranches } =
    usePublicBranches();

  // جلب التصليحة
  const {
    data: order,
    isLoading: loadingOrder,
    isError,
    error,
  } = useTrackRepairOrder(barcode, pickupBranchId, searchTriggered);

  const [formErrors, setFormErrors] = useState({});

  const handleSearch = () => {
    const errors = {};
    if (!barcode.trim()) errors.barcode = "الرجاء إدخال رقم الباركود";
    if (!pickupBranchId) errors.pickupBranchId = "الرجاء اختيار الفرع";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    setSearchTriggered(true);
  };

  const handleReset = () => {
    setBarcode("");
    setPickupBranchId("");
    setSearchTriggered(false);
    setFormErrors({});
  };

  // ✅ جاهزة للاستلام
  const isReady = useMemo(() => order?.isReadyForPickup === true, [order]);

  return (
    <div className="tracking-container">
      {/* Header */}
      <div className="tracking-header">
        <div className="tracking-header-icon">
          <ReceiptLongIcon sx={{ fontSize: 36 }} />
        </div>

        <Typography className="tracking-title">
          تتبع التصليحة
        </Typography>

        <Typography className="tracking-subtitle">
          أدخل رقم الباركود واختر الفرع
        </Typography>
      </div>

      {/* Form */}
      <Paper elevation={0} className="tracking-form-card">
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
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
              error={!!formErrors.barcode}
              helperText={formErrors.barcode}
              className="tracking-field"
              slotProps={{
                input: {
                  startAdornment: (
                    <SearchIcon sx={{ color: "#c9a44c", fontSize: 20, ml: 1 }} />
                  ),
                },
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              select
              label="فرع الاستلام"
              value={pickupBranchId}
              onChange={(e) => {
                setPickupBranchId(e.target.value);
                if (formErrors.pickupBranchId) {
                  setFormErrors((prev) => ({ ...prev, pickupBranchId: "" }));
                }
              }}
              error={!!formErrors.pickupBranchId}
              helperText={formErrors.pickupBranchId}
              className="tracking-field"
              disabled={loadingBranches}
            >
              {branches.length === 0 ? (
                <MenuItem value="" disabled>
                  جاري التحميل...
                </MenuItem>
              ) : (
                branches.map((b) => (
                  <MenuItem key={b.id} value={b.id}>
                    {b.name} {b.code ? `(${b.code})` : ""}
                  </MenuItem>
                ))
              )}
            </TextField>
          </Grid>
        </Grid>

        <div className="tracking-form-actions">
          <Button
            variant="contained"
            startIcon={<SearchIcon />}
            onClick={handleSearch}
            disabled={loadingOrder}
            className="tracking-search-btn"
          >
            {loadingOrder ? "جاري البحث..." : "بحث"}
          </Button>

          {searchTriggered && (
            <Button
              variant="outlined"
              onClick={handleReset}
              className="tracking-reset-btn"
            >
              بحث جديد
            </Button>
          )}
        </div>
      </Paper>

      {/* Loading */}
      {loadingOrder && (
        <Box className="tracking-loading">
          <CircularProgress sx={{ color: "#b8860b" }} />
        </Box>
      )}

      {/* Error */}
      {isError && searchTriggered && !loadingOrder && (
        <Paper elevation={0} className="tracking-result-card tracking-error">
          <Typography className="tracking-error-text">
            {error?.response?.data?.message ||
              "لم يتم العثور على التصليحة، تأكد من رقم الباركود والفرع"}
          </Typography>
        </Paper>
      )}

      {/* Result */}
      {order && !loadingOrder && (
        <Paper elevation={0} className="tracking-result-card">
          {/* Status Highlight */}
          <div
            className={`tracking-status-highlight ${
              isReady ? "tracking-ready" : "tracking-not-ready"
            }`}
          >
            {isReady ? (
              <>
                <CheckCircleIcon sx={{ fontSize: 40 }} />
                <Typography className="tracking-status-text">
                  التصليحة جاهزة للاستلام
                </Typography>
              </>
            ) : (
              <>
                <HourglassEmptyIcon sx={{ fontSize: 40 }} />
                <Typography className="tracking-status-text">
                  التصليحة غير جاهزة للاستلام
                </Typography>
              </>
            )}
          </div>

          <Divider className="tracking-divider" />

          {/* Details */}
          <div className="tracking-details">
            <div className="tracking-row">
              <Typography className="tracking-value tracking-value-mono">
                {order.barcode}
              </Typography>
              <div className="tracking-label">
                <span>رقم الباركود:</span>
                <ReceiptLongIcon sx={{ fontSize: 18 }} />
              </div>
            </div>

            <Divider className="tracking-divider" />

            <div className="tracking-row">
              <Typography className="tracking-value">
                {order.pickupBranchName}
              </Typography>
              <div className="tracking-label">
                <span>فرع الاستلام:</span>
                <StorefrontIcon sx={{ fontSize: 18 }} />
              </div>
            </div>

            <Divider className="tracking-divider" />

            <div className="tracking-row">
              <Chip
                label={order.statusName}
                className="tracking-status-chip"
                size="small"
              />
              <div className="tracking-label">
                <span>الحالة:</span>
              </div>
            </div>

            <Divider className="tracking-divider" />

            <div className="tracking-row">
              <Typography className="tracking-value tracking-value-date">
                {order.createdAt
                  ? new Date(order.createdAt).toLocaleDateString("ar-JO")
                  : "—"}
              </Typography>
              <div className="tracking-label">
                <span>تاريخ الاستلام:</span>
                <CalendarTodayIcon sx={{ fontSize: 18 }} />
              </div>
            </div>
          </div>
        </Paper>
      )}
    </div>
  );
}