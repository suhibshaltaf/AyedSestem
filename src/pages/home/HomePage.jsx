
import { useState } from "react";

import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  CircularProgress,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from "@mui/material";

import { useNavigate } from "react-router-dom";

import SearchIcon from "@mui/icons-material/Search";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import StorefrontIcon from "@mui/icons-material/Storefront";
import LoginIcon from "@mui/icons-material/Login";
import DashboardIcon from "@mui/icons-material/Dashboard";
import RefreshIcon from "@mui/icons-material/Refresh";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import PhoneIcon from "@mui/icons-material/Phone";

import {
  useTrackRepairOrder,
  useTrackRepairOrdersByPhone,
} from "../../hooks/usePublicTracking.js";

import useAuthStore from "../../store/useAuthStore.js";
import "../../styles/home.css";

// ======================================
// التحقق من نوع الرقم
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
// الصفحة الرئيسية
// ======================================

export default function HomePage() {
  const navigate = useNavigate();

  const token = useAuthStore((state) => state.token);

  const [searchValue, setSearchValue] = useState("");
  const [searchType, setSearchType] = useState("");
  const [searchTriggered, setSearchTriggered] = useState(false);
  const [formError, setFormError] = useState("");

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
    searchType === "barcode" ? searchValue : "",
    searchTriggered && searchType === "barcode"
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
    searchType === "phone" ? searchValue : "",
    searchTriggered && searchType === "phone"
  );

  const loadingOrder = barcodeLoading || phoneLoading;

  const isError =
    searchType === "barcode"
      ? barcodeIsError
      : searchType === "phone"
      ? phoneIsError
      : false;

  const error =
    searchType === "barcode"
      ? barcodeError
      : phoneError;

  // ======================================
  // تجهيز النتائج وإخفاء المستلمة
  // ======================================

  const orders = (
    searchType === "barcode"
      ? barcodeOrder
        ? [barcodeOrder]
        : []
      : searchType === "phone"
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

  const handleSearch = () => {
    const value = searchValue.trim();

    if (!value) {
      setFormError("الرجاء إدخال رقم الهاتف أو رقم الباركود");
      return;
    }

    let type = "";

    if (isBarcode(value)) {
      type = "barcode";
    } else if (isValidPhone(value)) {
      type = "phone";
    } else {
      setFormError(
        "أدخل رقم باركود صحيح أو رقم هاتف مكوّن من 7 إلى 20 رقمًا"
      );
      return;
    }

    setFormError("");

    if (
      searchTriggered &&
      searchType === type &&
      searchValue === value
    ) {
      if (type === "barcode") {
        refetchBarcode();
      } else {
        refetchPhone();
      }

      return;
    }

    setSearchValue(value);
    setSearchType(type);
    setSearchTriggered(true);
  };

  // ======================================
  // تحديث النتائج
  // ======================================

  const handleRefresh = () => {
    if (searchType === "barcode") {
      refetchBarcode();
    } else if (searchType === "phone") {
      refetchPhone();
    }
  };

  // ======================================
  // بحث جديد
  // ======================================

  const handleReset = () => {
    setSearchValue("");
    setSearchType("");
    setSearchTriggered(false);
    setFormError("");
  };

  // ======================================
  // واجهة الصفحة
  // ======================================

  return (
    <Box className="home-container" dir="rtl">
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

        <Typography className="home-title">
          مجموعة عايد دعنا
        </Typography>

        <Typography className="home-subtitle">
          أهلاً بكم — تتبع قطع الصيانة بسهولة
        </Typography>

        <div className="home-title-decor">
          <span className="home-title-line" />

          <Typography className="home-title-decor-text">
            تتبع التصليحة
          </Typography>

          <span className="home-title-line" />
        </div>
      </div>

      {/* Search Form */}

      <Paper elevation={0} className="home-form-card">
        <Typography className="home-form-title">
          أدخل رقم الهاتف أو رقم الباركود للبحث
        </Typography>

        <div className="home-form-grid-single">
          <TextField
            fullWidth
            label="رقم الهاتف أو رقم الباركود"
            placeholder="0791234567 أو BN-2026-000001"
            value={searchValue}
            onChange={(event) => {
              setSearchValue(event.target.value);

              if (formError) {
                setFormError("");
              }
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                handleSearch();
              }
            }}
            error={!!formError}
            helperText={formError}
            className="home-field"
            inputProps={{
              dir: "ltr",
              "aria-label": "رقم الهاتف أو رقم الباركود",
            }}
            slotProps={{
              input: {
                startAdornment: (
                  <SearchIcon
                    sx={{
                      color: "#c9a44c",
                      fontSize: 22,
                      ml: 1,
                    }}
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
                <CircularProgress
                  size={18}
                  sx={{ color: "#fff" }}
                />
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
              disabled={loadingOrder}
              className="home-reset-btn"
            >
              بحث جديد
            </Button>
          )}
        </div>
      </Paper>

      {/* Error */}

      {isError && searchTriggered && !loadingOrder && (
        <Paper
          elevation={0}
          className="home-result-card home-error"
          role="alert"
        >
          <Typography className="home-error-text">
            {error?.response?.data?.message ||
              "تعذر إتمام البحث. يرجى التحقق من الرقم والمحاولة مرة أخرى."}
          </Typography>
        </Paper>
      )}

      {/* Results */}

      {searchTriggered && !loadingOrder && !isError && (
        <>
          {orders.length > 0 ? (
            <Paper
              elevation={0}
              className="home-result-card home-tracking-results"
            >
              <Box className="home-results-header">
                <Box>
                  <Typography variant="h6" fontWeight={800}>
                    قطع الصيانة غير المستلمة
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 0.5 }}
                  >
                    {searchType === "phone"
                      ? "القطع المرتبطة برقم الهاتف"
                      : "نتيجة البحث باستخدام الباركود"}
                  </Typography>
                </Box>

                <Box className="home-results-count">
                  {orders.length} قطعة
                </Box>
              </Box>

              <TableContainer className="home-tracking-table">
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
                          {/* الباركود */}

                          <TableCell
                            align="center"
                            dir="ltr"
                            className="home-tracking-barcode"
                          >
                            {order.barcode || "—"}
                          </TableCell>

                          {/* الهاتف */}

                          <TableCell align="center">
                            <Box className="home-tracking-cell">
                              <PhoneIcon />

                              <Typography dir="ltr">
                                {order.customerPhone || "—"}
                              </Typography>
                            </Box>
                          </TableCell>

                          {/* السعر */}

                          <TableCell
                            align="center"
                            className="home-tracking-price"
                          >
                            <Box className="home-tracking-cell">
                              <AttachMoneyIcon />

                              <Typography>
                                {formatPrice(order.price)}
                              </Typography>
                            </Box>
                          </TableCell>

                          {/* فرع الاستلام */}

                          <TableCell align="center">
                            <Box className="home-tracking-cell">
                              <StorefrontIcon />

                              <Typography>
                                {order.deliveryBranchName || "—"}
                              </Typography>
                            </Box>
                          </TableCell>

                          {/* الحالة */}

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

              {/* Refresh */}

              <div className="home-result-actions">
                <Tooltip title="تحديث النتائج">
                  <span>
                    <IconButton
                      onClick={handleRefresh}
                      className="home-refresh-btn"
                      disabled={loadingOrder}
                    >
                      <RefreshIcon />
                    </IconButton>
                  </span>
                </Tooltip>
              </div>
            </Paper>
          ) : (
            <Paper
              elevation={0}
              className="home-result-card home-empty-result"
            >
              <ReceiptLongIcon sx={{ fontSize: 45 }} />

              <Typography variant="h6" fontWeight={800}>
                لا توجد قطع صيانة غير مستلمة
              </Typography>

              <Typography>
                لا توجد قطع مرتبطة بالرقم المدخل أو أن جميع القطع تم تسليمها.
              </Typography>
            </Paper>
          )}
        </>
      )}

      {/* Footer */}

      <Typography className="home-footer">
        © 2026 مجموعة عايد دعنا — جميع الحقوق محفوظة
      </Typography>
    </Box>
  );
}
