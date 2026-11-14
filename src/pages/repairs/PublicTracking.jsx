
import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";

import {
  Box,
  Button,
  CircularProgress,
  Paper,
  TextField,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from "@mui/material";

import SearchIcon from "@mui/icons-material/Search";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import StorefrontIcon from "@mui/icons-material/Storefront";
import PhoneIcon from "@mui/icons-material/Phone";

import {
  useTrackRepairOrder,
  useTrackRepairOrdersByPhone,
} from "../../hooks/usePublicTracking.js";

import styles from "../../styles/Repairs/PublicTracking.module.css";

// ===============================
// Validation
// ===============================

const isBarcode = (value) =>
  /^[A-Za-z0-9]{2,10}-\d{4}-\d{6}$/.test(value);

const isValidPhone = (value) =>
  /^[0-9]{7,20}$/.test(value);

// ===============================
// Formatting
// ===============================

const formatPrice = (price) => {
  if (price === null || price === undefined || price === "") {
    return "—";
  }

  const numericPrice = Number(price);

  if (Number.isNaN(numericPrice)) {
    return "—";
  }

  return `${numericPrice.toFixed(2)} دينار`;
};

// ===============================
// Status
// ===============================

const getOrderStatus = (status, statusName) => {
  const isReadyForPickup =
    String(status ?? "").trim() === "6" ||
    String(statusName ?? "").trim() === "جاهزة للتسليم للزبون";

  if (isReadyForPickup) {
    return {
      label: "جاهزة للاستلام",
      color: "success",
    };
  }

  return {
    label: "قيد التصليح",
    color: "warning",
  };
};

// ===============================
// Component
// ===============================

export default function PublicTracking() {
  const [params, setParams] = useSearchParams();

  const queryValue =
    params.get("value")?.trim() ||
    params.get("barcode")?.trim() ||
    params.get("phone")?.trim() ||
    "";

  const queryType =
    params.get("type") ||
    (params.get("barcode")
      ? "barcode"
      : params.get("phone")
        ? "phone"
        : "");

  const [searchValue, setSearchValue] = useState(queryValue);

  useEffect(() => {
    setSearchValue(queryValue);
  }, [queryValue]);

  // ===============================
  // Barcode Search
  // ===============================

  const {
    data: barcodeOrder,
    isLoading: barcodeLoading,
    isError: barcodeIsError,
    error: barcodeError,
    refetch: refetchBarcode,
  } = useTrackRepairOrder(
    queryType === "barcode" ? queryValue : "",
    queryType === "barcode" && !!queryValue
  );

  // ===============================
  // Phone Search
  // ===============================

  const {
    data: phoneOrders = [],
    isLoading: phoneLoading,
    isError: phoneIsError,
    error: phoneError,
    refetch: refetchPhone,
  } = useTrackRepairOrdersByPhone(
    queryType === "phone" ? queryValue : "",
    queryType === "phone" && !!queryValue
  );

  const isLoading = barcodeLoading || phoneLoading;

  const isError =
    queryType === "barcode"
      ? barcodeIsError
      : queryType === "phone"
        ? phoneIsError
        : false;

  const error =
    queryType === "barcode"
      ? barcodeError
      : phoneError;

  // ===============================
  // Orders
  // ===============================

  const orders = (
    queryType === "barcode"
      ? barcodeOrder
        ? [barcodeOrder]
        : []
      : queryType === "phone"
        ? Array.isArray(phoneOrders)
          ? phoneOrders
          : []
        : []
  ).filter((order) => {
    const status = String(order.status ?? "").trim();
    const statusName = String(order.statusName ?? "").trim();

    // إخفاء القطع التي تم تسليمها للزبون
    return (
      status.toLowerCase() !== "deliveredtocustomer" &&
      status !== "7" &&
      statusName !== "تم التسليم للزبون" &&
      statusName !== "تم التسليم"
    );
  });

  // ===============================
  // Search
  // ===============================

  const submit = (event) => {
    event.preventDefault();

    const value = searchValue.trim();

    if (!value) return;

    let type;

    if (isBarcode(value)) {
      type = "barcode";
    } else if (isValidPhone(value)) {
      type = "phone";
    } else {
      return;
    }

    if (value === queryValue && type === queryType) {
      if (type === "barcode") {
        refetchBarcode();
      } else {
        refetchPhone();
      }

      return;
    }

    setParams({ type, value });
  };

  // ===============================
  // Render
  // ===============================

  return (
    <Box className={styles.trackingContainer} dir="rtl">
      <Box className={styles.trackingContent}>

        {/* Header */}

        <Box className={styles.trackingHeader}>
          <Box className={styles.trackingHeaderIcon}>
            <ReceiptLongIcon sx={{ fontSize: 38 }} />
          </Box>

          <Typography variant="h4" className={styles.trackingTitle}>
            تتبع قطع الصيانة
          </Typography>

          <Typography className={styles.trackingSubtitle}>
            أدخل رقم الهاتف أو رقم الباركود للاستعلام عن قطعك
          </Typography>
        </Box>

        {/* Search */}

        <Paper
          component="form"
          onSubmit={submit}
          elevation={0}
          className={styles.trackingFormCard}
        >
          <TextField
            fullWidth
            label="رقم الهاتف أو رقم الباركود"
            placeholder="0791234567 أو BN-2026-000001"
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            inputProps={{
              dir: "ltr",
              "aria-label": "رقم الهاتف أو رقم الباركود",
            }}
          />

          <Button
            type="submit"
            variant="contained"
            startIcon={<SearchIcon />}
            disabled={!searchValue.trim() || isLoading}
            className={styles.trackingSearchBtn}
          >
            بحث
          </Button>
        </Paper>

        {/* Loading */}

        {isLoading && (
          <Box className={styles.trackingLoading}>
            <CircularProgress />
          </Box>
        )}

        {/* Error */}

        {isError && !isLoading && (
          <Paper
            elevation={0}
            className={`${styles.trackingResultCard} ${styles.trackingError}`}
            role="alert"
          >
            <Typography className={styles.trackingErrorText}>
              {error?.response?.data?.message ||
                "تعذر إتمام البحث. يرجى التحقق من الرقم والمحاولة مرة أخرى."}
            </Typography>
          </Paper>
        )}

        {/* Results */}

        {queryValue && queryType && !isLoading && !isError && (
          <>
            {orders.length > 0 ? (
              <>
                {/* Results Header */}

                <Box className={styles.trackingResultsHeader}>
                  <Box>
                    <Typography variant="h6" fontWeight={800}>
                      قطع الصيانة غير المستلمة
                    </Typography>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 0.5 }}
                    >
                      {queryType === "phone"
                        ? "جميع القطع المرتبطة برقم الهاتف"
                        : "نتيجة البحث بالباركود"}
                    </Typography>
                  </Box>

                  <Box className={styles.trackingCount}>
                    {orders.length} قطعة
                  </Box>
                </Box>

                {/* Table */}

                <TableContainer
                  component={Paper}
                  elevation={0}
                  className={styles.trackingTableContainer}
                >
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell align="center">
                          رقم الباركود
                        </TableCell>

                        <TableCell align="center">
                          رقم الهاتف
                        </TableCell>

                        <TableCell align="center">
                          السعر
                        </TableCell>

                        <TableCell align="center">
                          فرع الاستلام
                        </TableCell>

                        <TableCell align="center">
                          الحالة
                        </TableCell>
                      </TableRow>
                    </TableHead>

                    <TableBody>
                      {orders.map((order) => {
                        const status = getOrderStatus(
                          order.status,
                          order.statusName
                        );

                        return (
                          <TableRow key={order.barcode} hover>
                            <TableCell
                              align="center"
                              dir="ltr"
                              className={styles.trackingBarcode}
                            >
                              {order.barcode || "—"}
                            </TableCell>

                            <TableCell align="center" dir="ltr">
                              <Box className={styles.trackingPhoneCell}>
                                <PhoneIcon />
                                {order.customerPhone || "—"}
                              </Box>
                            </TableCell>

                            <TableCell
                              align="center"
                              className={styles.trackingPrice}
                            >
                              {formatPrice(order.price)}
                            </TableCell>

                            <TableCell align="center">
                              <Box className={styles.trackingBranchCell}>
                                <StorefrontIcon />

                                <Typography>
                                  {order.deliveryBranchName || "—"}
                                </Typography>
                              </Box>
                            </TableCell>

                            <TableCell align="center">
                              <Chip
                                label={status.label}
                                color={status.color}
                                size="small"
                                sx={{
                                  fontFamily: "Cairo",
                                  fontWeight: 700,
                                  minWidth: 120,
                                }}
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            ) : (
              <Paper
                elevation={0}
                className={`${styles.trackingResultCard} ${styles.trackingEmpty}`}
              >
                <ReceiptLongIcon />

                <Typography variant="h6" fontWeight={800}>
                  لا توجد قطع صيانة غير مستلمة
                </Typography>

                <Typography color="text.secondary">
                  لا توجد قطع مرتبطة بالرقم المدخل أو أن جميع القطع تم تسليمها.
                </Typography>
              </Paper>
            )}
          </>
        )}

        {/* Back */}

        <Box className={styles.trackingBack}>
          <Button
            component={Link}
            to="/"
            startIcon={<ArrowBackIcon />}
          >
            العودة للرئيسية
          </Button>
        </Box>

      </Box>
    </Box>
  );
}
