
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

import "../../styles/public-tracking.css";

// ======================================
// تحديد نوع البحث
// ======================================

const isBarcode = (value) =>
  /^[A-Za-z0-9]{2,10}-\d{4}-\d{6}$/.test(value);

const isValidPhone = (value) =>
  /^[0-9]{7,20}$/.test(value);

// ======================================
// تنسيق السعر
// ======================================

const formatPrice = (price) => {
  if (price === null || price === undefined) return "—";

  return `${Number(price).toFixed(2)} دينار`;
};

// ======================================
// تحديد حالة التصليحة
// ======================================

const getOrderStatus = (status) => {
  const normalizedStatus = String(status ?? "").toLowerCase();

  if (normalizedStatus === "readyforpickup") {
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

// ======================================
// الصفحة
// ======================================

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

  // ======================================
  // البحث بالباركود
  // ======================================

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

  // ======================================
  // البحث برقم الهاتف
  // ======================================

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

  // ======================================
  // تجهيز النتائج وإخفاء المستلمة
  // ======================================

  const orders = (
    queryType === "barcode"
      ? barcodeOrder
        ? [barcodeOrder]
        : []
      : queryType === "phone"
      ? phoneOrders
      : []
  ).filter(
    (order) =>
      String(order.status ?? "").toLowerCase() !==
      "deliveredtocustomer"
  );

  // ======================================
  // البحث
  // ======================================

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

    setParams({
      type,
      value,
    });
  };

  // ======================================
  // واجهة الصفحة
  // ======================================

  return (
    <Box
      className="tracking-container"
      dir="rtl"
      sx={{
        minHeight: "100vh",
        py: { xs: 4, md: 8 },
        px: 2,
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: 1100,
          mx: "auto",
        }}
      >
        {/* Header */}

        <Box className="tracking-header">
          <Box className="tracking-header-icon">
            <ReceiptLongIcon sx={{ fontSize: 38 }} />
          </Box>

          <Typography variant="h4" className="tracking-title">
            تتبع قطع الصيانة
          </Typography>

          <Typography className="tracking-subtitle">
            أدخل رقم الهاتف أو رقم الباركود للاستعلام عن قطعك
          </Typography>
        </Box>

        {/* Search Form */}

        <Paper
          component="form"
          onSubmit={submit}
          elevation={0}
          className="tracking-form-card"
          sx={{
            display: "flex",
            flexDirection: {
              xs: "column",
              sm: "row",
            },
            gap: 2,
            alignItems: "stretch",
          }}
        >
          <TextField
            fullWidth
            label="رقم الهاتف أو رقم الباركود"
            placeholder="0791234567 أو BN-2026-000001"
            value={searchValue}
            onChange={(event) =>
              setSearchValue(event.target.value)
            }
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
            className="tracking-search-btn"
            sx={{
              minWidth: {
                xs: "100%",
                sm: 130,
              },
            }}
          >
            بحث
          </Button>
        </Paper>

        {/* Loading */}

        {isLoading && (
          <Box className="tracking-loading">
            <CircularProgress />
          </Box>
        )}

        {/* Error */}

        {isError && !isLoading && (
          <Paper
            elevation={0}
            className="tracking-result-card tracking-error"
            role="alert"
          >
            <Typography className="tracking-error-text">
              {error?.response?.data?.message ||
                "تعذر إتمام البحث. يرجى التحقق من الرقم والمحاولة مرة أخرى."}
            </Typography>
          </Paper>
        )}

        {/* Results */}

        {queryValue &&
          queryType &&
          !isLoading &&
          !isError && (
            <>
              {orders.length > 0 ? (
                <>
                  <Box className="tracking-results-header">
                    <Box>
                      <Typography
                        variant="h6"
                        fontWeight={800}
                      >
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

                    <Box className="tracking-count">
                      {orders.length} قطعة
                    </Box>
                  </Box>

                  <TableContainer
                    component={Paper}
                    elevation={0}
                    className="tracking-table-container"
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
                          const status = getOrderStatus(order.status);

                          return (
                            <TableRow key={order.barcode} hover>
                              <TableCell
                                align="center"
                                dir="ltr"
                                className="tracking-barcode"
                              >
                                {order.barcode || "—"}
                              </TableCell>

                              <TableCell align="center" dir="ltr">
                                <Box className="tracking-phone-cell">
                                  <PhoneIcon />
                                  {order.customerPhone || "—"}
                                </Box>
                              </TableCell>

                              <TableCell
                                align="center"
                                className="tracking-price"
                              >
                                {formatPrice(order.price)}
                              </TableCell>

                              <TableCell align="center">
                                <Box className="tracking-branch-cell">
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
                  className="tracking-result-card tracking-empty"
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

        <Box className="tracking-back">
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
