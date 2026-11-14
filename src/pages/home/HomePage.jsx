
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
import styles from "../../styles/Home/Home.module.css";

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
  if (price === null || price === undefined || price === "") {
    return "—";
  }

  const numericPrice = Number(price);

  if (Number.isNaN(numericPrice)) {
    return "—";
  }

  return `${numericPrice.toFixed(2)} دينار`;
};

// ======================================
// تحديد حالة التصليحة
// ======================================

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
        ? Array.isArray(phoneOrders)
          ? phoneOrders
          : []
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
    <Box className={styles.homeContainer} dir="rtl">
      {/* زر تسجيل الدخول / لوحة التحكم */}

      <Box className={styles.homeLoginBtnWrapper}>
        {token ? (
          <Button
            variant="contained"
            onClick={() => navigate("/dashboard")}
            className={`${styles.homeLoginBtn} ${styles.homeLoginBtnDashboard}`}
            startIcon={<DashboardIcon />}
          >
            لوحة التحكم
          </Button>
        ) : (
          <Button
            variant="outlined"
            startIcon={<LoginIcon />}
            onClick={() => navigate("/login")}
            className={styles.homeLoginBtn}
          >
            تسجيل الدخول
          </Button>
        )}
      </Box>

      {/* Header */}

      <div className={styles.homeHeader}>
        <div className={styles.homeHeaderIcon}>
          <ReceiptLongIcon sx={{ fontSize: 40 }} />
        </div>

        <Typography className={styles.homeTitle}>
          مجموعة عايد دعنا
        </Typography>

        <Typography className={styles.homeSubtitle}>
          أهلاً بكم — تتبع قطع الصيانة بسهولة
        </Typography>

        <div className={styles.homeTitleDecor}>
          <span className={styles.homeTitleLine} />

          <Typography className={styles.homeTitleDecorText}>
            تتبع التصليحة
          </Typography>

          <span className={styles.homeTitleLine} />
        </div>
      </div>

      {/* Search Form */}

      <Paper elevation={0} className={styles.homeFormCard}>
        <Typography className={styles.homeFormTitle}>
          أدخل رقم الهاتف أو رقم الباركود للبحث
        </Typography>

        <div className={styles.homeFormGridSingle}>
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
            className={styles.homeField}
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

        <div className={styles.homeFormActions}>
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
            className={styles.homeSearchBtn}
          >
            {loadingOrder ? "جاري البحث..." : "بحث"}
          </Button>

          {searchTriggered && (
            <Button
              variant="outlined"
              onClick={handleReset}
              disabled={loadingOrder}
              className={styles.homeResetBtn}
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
          className={`${styles.homeResultCard} ${styles.homeError}`}
          role="alert"
        >
          <Typography className={styles.homeErrorText}>
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
              className={`${styles.homeResultCard} ${styles.homeTrackingResults}`}
            >
              <Box className={styles.homeResultsHeader}>
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

                <Box className={styles.homeResultsCount}>
                  {orders.length} قطعة
                </Box>
              </Box>

              <TableContainer className={styles.homeTrackingTable}>
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
                          {/* الباركود */}

                          <TableCell
                            align="center"
                            dir="ltr"
                            className={styles.homeTrackingBarcode}
                          >
                            {order.barcode || "—"}
                          </TableCell>

                          {/* الهاتف */}

                          <TableCell align="center">
                            <Box className={styles.homeTrackingCell}>
                              <PhoneIcon />

                              <Typography dir="ltr">
                                {order.customerPhone || "—"}
                              </Typography>
                            </Box>
                          </TableCell>

                          {/* السعر */}

                          <TableCell
                            align="center"
                            className={styles.homeTrackingPrice}
                          >
                            <Box className={styles.homeTrackingCell}>
                              <AttachMoneyIcon />

                              <Typography>
                                {formatPrice(order.price)}
                              </Typography>
                            </Box>
                          </TableCell>

                          {/* فرع الاستلام */}

                          <TableCell align="center">
                            <Box className={styles.homeTrackingCell}>
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

              <div className={styles.homeResultActions}>
                <Tooltip title="تحديث النتائج">
                  <span>
                    <IconButton
                      onClick={handleRefresh}
                      className={styles.homeRefreshBtn}
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
              className={`${styles.homeResultCard} ${styles.homeEmptyResult}`}
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

      <Typography className={styles.homeFooter}>
        © 2026 مجموعة عايد دعنا — جميع الحقوق محفوظة
      </Typography>
    </Box>
  );
}
