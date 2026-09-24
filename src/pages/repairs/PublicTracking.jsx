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
import { useTrackRepairOrder } from "../../hooks/usePublicTracking.js";
import "../../styles/public-tracking.css";

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

  return (
    <Box
      className="tracking-container"
      dir="rtl"
      sx={{ minHeight: "100vh", py: { xs: 5, md: 9 }, px: 2 }}
    >
      <Box sx={{ maxWidth: 640, mx: "auto" }}>
        <Box className="tracking-header" sx={{ textAlign: "center" }}>
          <ReceiptLongIcon
            sx={{ fontSize: 42, color: "var(--gold-primary)", mb: 1 }}
          />
          <Typography variant="h4" className="tracking-title">
            تتبع التصليحة
          </Typography>
          <Typography className="tracking-subtitle">
            أدخل رقم الباركود الموجود على إيصال التصليحة
          </Typography>
        </Box>

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

        {isLoading && (
          <Box sx={{ textAlign: "center", my: 5 }}>
            <CircularProgress />
          </Box>
        )}

        {isError && (
          <Paper role="alert" sx={{ p: 3, mt: 3, textAlign: "center" }}>
            {error?.response?.data?.message ||
              "تعذر العثور على التصليحة. تحقق من رقم الباركود وحاول مرة أخرى."}
          </Paper>
        )}

        {order && !isLoading && (
          <Paper
            className="tracking-result-card"
            elevation={0}
            sx={{ p: { xs: 3, sm: 4 }, mt: 3 }}
          >
            <Chip
              color={
                order.isDeliveredToCustomer || order.isReadyForPickup
                  ? "success"
                  : "primary"
              }
              label={order.statusName || order.status || "قيد التنفيذ"}
              sx={{ mb: 3, fontWeight: 700 }}
            />

            <Typography sx={{ mb: 2 }}>
              رقم الباركود:{" "}
              <strong dir="ltr">{order.barcode}</strong>
            </Typography>

            <Typography sx={{ mb: 2 }}>
              فرع الاستلام:{" "}
              <strong>{order.pickupBranchName || "—"}</strong>
            </Typography>

            <Typography sx={{ mb: 2 }}>
              فرع التسليم:{" "}
              <strong>{order.deliveryBranchName || "—"}</strong>
            </Typography>

            {order.currentResponsibleUserName && (
              <Typography sx={{ mb: 2 }}>
                المسؤول الحالي:{" "}
                <strong>{order.currentResponsibleUserName}</strong>
              </Typography>
            )}

            <Typography>
              تاريخ التسجيل:{" "}
              <strong>
                {order.createdAt
                  ? new Date(order.createdAt).toLocaleDateString("ar-JO")
                  : "—"}
              </strong>
            </Typography>
          </Paper>
        )}

        <Button
          component={Link}
          to="/"
          startIcon={<ArrowBackIcon />}
          sx={{ mt: 3 }}
        >
          العودة للرئيسية
        </Button>
      </Box>
    </Box>
  );
}