
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  Box,
  Typography,
  Paper,
  Chip,
  CircularProgress,
  Button,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
} from "@mui/material";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import PersonIcon from "@mui/icons-material/Person";
import PhoneIcon from "@mui/icons-material/Phone";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import BuildIcon from "@mui/icons-material/Build";
import ScaleIcon from "@mui/icons-material/Scale";
import DiamondIcon from "@mui/icons-material/Diamond";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import NotesIcon from "@mui/icons-material/Notes";
import StorefrontIcon from "@mui/icons-material/Storefront";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import EditIcon from "@mui/icons-material/Edit";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

import useAuthStore from "../../store/useAuthStore.js";

import {
  useOldMaintenanceOrderById,
  useUpdateOldMaintenanceOrder,
} from "../../hooks/useOldMaintenanceOrders.js";

import style from "../../styles/OldMaintenanceOrders/old-maintenance-order-details.module.css";

/* =====================================================
   Helpers
   ===================================================== */

const read = (obj, camel, pascal) =>
  obj?.[camel] ?? obj?.[pascal] ?? null;

const formatDate = (value) => {
  if (!value) return "—";

  const datePart = String(value).slice(0, 10);
  const parts = datePart.split("-");

  if (parts.length !== 3) return "—";

  return `${parts[2]}/${parts[1]}/${parts[0]}`;
};

const formatNumber = (value, suffix = "") => {
  if (value === null || value === undefined || value === "") return "—";

  return `${Number(value).toLocaleString("en-US")}${suffix}`;
};

const unwrap = (data) => {
  let result = data;

  for (let i = 0; i < 3; i++) {
    if (!result?.data || typeof result.data !== "object") break;
    result = result.data;
  }

  return result;
};

/* =====================================================
   Component
   ===================================================== */

export default function OldMaintenanceOrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const currentUser = useAuthStore((state) => state.user);

  const roles = useMemo(
    () =>
      currentUser?.roles?.map((role) =>
        typeof role === "string" ? role : role?.name
      ) || [],
    [currentUser]
  );

  const isAdmin = roles.some((role) =>
    ["SuperAdmin", "Admin"].includes(role)
  );

  const isBranchManager = roles.includes("BranchManager");

  const { data, isLoading } = useOldMaintenanceOrderById(id);

  const updateMutation = useUpdateOldMaintenanceOrder();

  // نافذة تأكيد استلام العميل
  const [deliveryDialogOpen, setDeliveryDialogOpen] = useState(false);

  const order = unwrap(data);

  const receiptNumber = read(order, "receiptNumber", "ReceiptNumber");
  const customerName = read(order, "customerName", "CustomerName");
  const customerPhone = read(order, "customerPhone", "CustomerPhone");
  const receiptDate = read(order, "receiptDate", "ReceiptDate");
  const itemType = read(order, "itemType", "ItemType");
  const weight = read(order, "weight", "Weight");
  const karat = read(order, "karat", "Karat");
  const fees = read(order, "fees", "Fees");
  const status = Number(read(order, "status", "Status") ?? 1);
  const notes = read(order, "notes", "Notes");
  const branchName = read(order, "branchName", "BranchName");

  const isDelivered = status === 2;

  /* =====================================================
     Confirm Delivery
     ===================================================== */

  const handleMarkDelivered = async () => {
    if (isDelivered || !order) return;

    const payload = {
      receiptNumber,
      customerName,
      customerPhone,
      receiptDate,
      itemType,
      weight,
      karat,
      fees,
      status: 2,
      notes,
      branchId: read(order, "branchId", "BranchId"),
    };

    try {
      await updateMutation.mutateAsync({
        id: Number(id),
        data: payload,
      });

      setDeliveryDialogOpen(false);
    } catch (error) {
      // الـ hook يعرض رسالة الخطأ
    }
  };

  /* =====================================================
     Loading
     ===================================================== */

  if (isLoading) {
    return (
      <Box className={style["archive-details-loading"]}>
        <CircularProgress sx={{ color: "#b8860b" }} />
      </Box>
    );
  }

  if (!order) {
    return (
      <div className={style["archive-details-container"]}>
        <Paper elevation={0} className={style["archive-details-card"]}>
          <Box className={style["archive-details-empty"]}>
            <Typography>الوصل غير موجود</Typography>

            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate(-1)}
            >
              العودة
            </Button>
          </Box>
        </Paper>
      </div>
    );
  }

  /* =====================================================
     Details
     ===================================================== */

  const details = [
    {
      label: "رقم الوصل القديم",
      value: receiptNumber || "—",
      icon: <ReceiptLongIcon />,
      ltr: true,
    },
    {
      label: "اسم العميل",
      value: customerName || "—",
      icon: <PersonIcon />,
    },
    {
      label: "رقم الهاتف",
      value: customerPhone || "—",
      icon: <PhoneIcon />,
      ltr: true,
    },
    {
      label: "تاريخ الوصل",
      value: formatDate(receiptDate),
      icon: <CalendarMonthIcon />,
      ltr: true,
    },
    {
      label: "نوع القطعة",
      value: itemType || "—",
      icon: <BuildIcon />,
    },
    {
      label: "الوزن",
      value: formatNumber(weight, " غ"),
      icon: <ScaleIcon />,
    },
    {
      label: "العيار",
      value: karat || "—",
      icon: <DiamondIcon />,
    },
    {
      label: "أجور التصليح",
      value: formatNumber(fees),
      icon: <AttachMoneyIcon />,
    },
    {
      label: "الفرع",
      value: branchName || "—",
      icon: <StorefrontIcon />,
    },
    ...(notes?.trim()
      ? [
          {
            label: "ملاحظات",
            value: notes,
            icon: <NotesIcon />,
            fullWidth: true,
          },
        ]
      : []),
  ];

  /* =====================================================
     Render
     ===================================================== */

  return (
    <>
      <div className={style["archive-details-container"]}>
        {/* Header */}

        <div className={style["archive-details-header"]}>
          <div className={style["archive-details-header-icon"]}>
            <ReceiptLongIcon />
          </div>

          <Typography className={style["archive-details-title"]}>
            تفاصيل الوصل القديم
          </Typography>

          <div className={style["archive-details-title-decor"]}>
            <span className={style["archive-details-title-line"]} />

            <Chip
              label={receiptNumber || "بدون رقم وصل"}
              className={style["archive-details-receipt-chip"]}
            />

            <span className={style["archive-details-title-line"]} />
          </div>
        </div>

        {/* Actions */}

        <div className={style["archive-details-actions"]}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate("/old-maintenance-orders")}
            className={style["archive-details-back-btn"]}
          >
            العودة للأرشيف
          </Button>

          {!isDelivered && (
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={() =>
                navigate(`/old-maintenance-orders/edit/${id}`)
              }
              className={style["archive-details-back-btn"]}
            >
              تعديل
            </Button>
          )}

          {!isDelivered && (isAdmin || isBranchManager) && (
            <Button
              variant="contained"
              startIcon={<CheckCircleIcon />}
              onClick={() => setDeliveryDialogOpen(true)}
              disabled={updateMutation.isPending}
              className={style["archive-details-delivered-btn"]}
            >
              تسجيل استلام العميل
            </Button>
          )}
        </div>

        {/* Main Details */}

        <Paper elevation={0} className={style["archive-details-card"]}>
          <div className={style["archive-details-status-row"]}>
            <div className={style["archive-details-status-label"]}>
              <span className={style["archive-details-status-icon"]}>
                <AccessTimeIcon />
              </span>

              <Typography>حالة الوصل:</Typography>
            </div>

            <Chip
              label={isDelivered ? "تم التسليم للعميل" : "جاهز للاستلام"}
              className={`${style["archive-details-status-chip"]} ${
                isDelivered
                  ? style["archive-details-status-delivered"]
                  : style["archive-details-status-ready"]
              }`}
            />
          </div>

          <Divider className={style["archive-details-divider"]} />

          <Typography className={style["archive-details-section-title"]}>
            <ReceiptLongIcon />
            معلومات الوصل والتصليحة
          </Typography>

          <Divider className={style["archive-details-divider"]} />

          <div className={style["archive-details-grid"]}>
            {details.map((item) => (
              <div
                key={item.label}
                className={`${style["archive-details-row"]} ${
                  item.fullWidth ? style["archive-details-row-full"] : ""
                }`}
              >
                <div className={style["archive-details-label"]}>
                  {item.icon && (
                    <span className={style["archive-details-label-icon"]}>
                      {item.icon}
                    </span>
                  )}

                  <span className={style["archive-details-label-text"]}>
                    {item.label}
                  </span>
                </div>

                <Typography
                  component="div"
                  className={`${style["archive-details-value"]} ${
                    item.ltr ? style["archive-details-value-ltr"] : ""
                  }`}
                >
                  {item.value}
                </Typography>
              </div>
            ))}
          </div>
        </Paper>
      </div>

      {/* Delivery Confirmation Dialog */}

      <Dialog
        open={deliveryDialogOpen}
        onClose={() => {
          if (!updateMutation.isPending) {
            setDeliveryDialogOpen(false);
          }
        }}
        fullWidth
        maxWidth="xs"
        PaperProps={{
          sx: {
            borderRadius: 3,
            direction: "rtl",
            p: 1,
            backgroundColor: "background.paper",
          },
        }}
      >
        <DialogTitle
          sx={{
            textAlign: "center",
            fontFamily: "Cairo",
            fontWeight: 700,
            fontSize: "1.2rem",
            pt: 3,
          }}
        >
          تأكيد استلام العميل
        </DialogTitle>

        <DialogContent>
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              mb: 2,
            }}
          >
            <Box
              sx={{
                width: 78,
                height: 78,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#2e7d32",
                backgroundColor: "rgba(46, 125, 50, 0.10)",
              }}
            >
              <CheckCircleIcon sx={{ fontSize: 46 }} />
            </Box>
          </Box>

          <DialogContentText
            sx={{
              textAlign: "center",
              fontFamily: "Cairo",
              fontSize: "0.95rem",
              fontWeight: 600,
              lineHeight: 2,
              color: "text.primary",
            }}
          >
            هل أنت متأكد من أن العميل استلم القطعة؟
          </DialogContentText>

          <Box
            sx={{
              mt: 2,
              p: 1.5,
              borderRadius: 2,
              border: "1px solid rgba(184, 134, 11, 0.20)",
              backgroundColor: "rgba(184, 134, 11, 0.07)",
              display: "flex",
              alignItems: "flex-start",
              gap: 1,
            }}
          >
            <WarningAmberIcon
              sx={{
                color: "#b8860b",
                mt: 0.3,
                flexShrink: 0,
              }}
            />

            <Typography
              sx={{
                fontFamily: "Cairo",
                fontSize: "0.8rem",
                color: "text.secondary",
                lineHeight: 1.9,
              }}
            >
              سيتم تغيير حالة الوصل إلى «تم التسليم للعميل».
              تأكد من أن العميل استلم القطعة فعلياً قبل تأكيد العملية.
            </Typography>
          </Box>

          <Box
            sx={{
              mt: 2,
              p: 1.5,
              borderRadius: 2,
              backgroundColor: "rgba(46, 125, 50, 0.06)",
              display: "flex",
              flexDirection: "column",
              gap: 0.5,
            }}
          >
            <Typography
              sx={{
                fontFamily: "Cairo",
                fontSize: "0.78rem",
                color: "text.secondary",
              }}
            >
              رقم الوصل
            </Typography>

            <Typography
              sx={{
                fontFamily: "Cairo",
                fontWeight: 700,
                color: "text.primary",
                direction: "ltr",
                textAlign: "right",
              }}
            >
              {receiptNumber || "—"}
            </Typography>

            <Divider sx={{ my: 0.5 }} />

            <Typography
              sx={{
                fontFamily: "Cairo",
                fontSize: "0.78rem",
                color: "text.secondary",
              }}
            >
              اسم العميل
            </Typography>

            <Typography
              sx={{
                fontFamily: "Cairo",
                fontWeight: 700,
                color: "text.primary",
              }}
            >
              {customerName || "—"}
            </Typography>
          </Box>
        </DialogContent>

        <DialogActions
          sx={{
            px: 2,
            pb: 2,
            gap: 1,
            justifyContent: "center",
          }}
        >
          <Button
            fullWidth
            variant="outlined"
            onClick={() => setDeliveryDialogOpen(false)}
            disabled={updateMutation.isPending}
            sx={{
              fontFamily: "Cairo",
              borderRadius: 2,
              minHeight: 44,
              fontWeight: 600,
            }}
          >
            إلغاء
          </Button>

          <Button
            fullWidth
            variant="contained"
            onClick={handleMarkDelivered}
            disabled={updateMutation.isPending}
            startIcon={
              updateMutation.isPending ? (
                <CircularProgress size={17} sx={{ color: "#fff" }} />
              ) : (
                <CheckCircleIcon />
              )
            }
            sx={{
              fontFamily: "Cairo",
              fontWeight: 700,
              borderRadius: 2,
              minHeight: 44,
              background: "linear-gradient(90deg, #43a047, #2e7d32)",
              "&:hover": {
                background: "linear-gradient(90deg, #388e3c, #1b5e20)",
              },
            }}
          >
            {updateMutation.isPending
              ? "جاري تسجيل الاستلام..."
              : "تأكيد الاستلام"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
