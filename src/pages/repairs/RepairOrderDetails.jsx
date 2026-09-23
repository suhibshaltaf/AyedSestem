import { useMemo, useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Chip,
  CircularProgress,
  Button,
  Divider,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import PrintIcon from "@mui/icons-material/Print";
import PersonIcon from "@mui/icons-material/Person";
import PhoneIcon from "@mui/icons-material/Phone";
import ScaleIcon from "@mui/icons-material/Scale";
import DiamondIcon from "@mui/icons-material/Diamond";
import NumbersIcon from "@mui/icons-material/Numbers";
import BuildIcon from "@mui/icons-material/Build";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import NotesIcon from "@mui/icons-material/Notes";
import StorefrontIcon from "@mui/icons-material/Storefront";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import CloseIcon from "@mui/icons-material/Close";
import HistoryIcon from "@mui/icons-material/History";

import {
  useRepairOrderById,
  useAddRepairMovement,
} from "../../hooks/useRepairOrders.js";
import { useWorkshops } from "../../hooks/useWorkshops.js";
import useAuthStore from "../../store/useAuthStore.js";
import repairOrderService from "../../services/repairOrderService.js";
import organizationService from "../../services/organizationService.js";
import {
  getStatusName,
  getStatusColor,
  getAvailableMovements,
  MOVEMENT_TYPES,
} from "../../utils/repairConstants.js";
import "../../styles/repairs.css";

export default function RepairOrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.user);

  const roles = useMemo(
    () => currentUser?.roles?.map((r) => r.name) || [],
    [currentUser]
  );

  // جلب التصليحة
  const { data: order, isLoading, refetch } = useRepairOrderById(id);
  const { data: organization } = useQuery({ queryKey: ["organization-settings"], queryFn: organizationService.getSettings });
  const showBarcode = organization?.showBarcode !== false;
  const showQr = organization?.showQrCode !== false;
  const [images, setImages] = useState({ barcode: null, qr: null });

  useEffect(() => {
    if (!order?.barcode) return undefined;
    let active = true;
    const urls = [];
    const load = async () => {
      const [barcodeResult, qrResult] = await Promise.allSettled([
        showBarcode ? repairOrderService.getBarcodeImage(order.barcode) : Promise.resolve(null),
        showQr ? repairOrderService.getQrImage(order.barcode) : Promise.resolve(null),
      ]);
      if (!active) return;
      const barcode = barcodeResult.status === "fulfilled" && barcodeResult.value
        ? URL.createObjectURL(barcodeResult.value) : null;
      const qr = qrResult.status === "fulfilled" && qrResult.value
        ? URL.createObjectURL(qrResult.value) : null;
      if (barcode) urls.push(barcode);
      if (qr) urls.push(qr);
      setImages({ barcode, qr });
    };
    load();
    return () => {
      active = false;
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [order?.barcode, showBarcode, showQr]);

  // إضافة حركة
  const addMovementMutation = useAddRepairMovement();
  const savingMovement = addMovementMutation.isPending;

  // الورش
  const { data: workshops = [] } = useWorkshops();

  // Dialog الحركة
  const [movementDialog, setMovementDialog] = useState({
    open: false,
    movementType: null,
    notes: "",
  });

  // الحركات المتاحة
  const availableMovements = useMemo(() => {
    if (!order) return [];
    return getAvailableMovements(order.status, roles, order.movements);
  }, [order, roles]);

  // حساب تواريخ الحركات
  const getMovementDate = useMemo(() => {
    return (movementType) => {
      if (!order?.movements) return null;
      const movement = order.movements.find(
        (m) => m.movementType === movementType
      );
      return movement?.createdAt || null;
    };
  }, [order]);

  // فتح Dialog الحركة
  const handleOpenMovement = (movementType) => {
    setMovementDialog({
      open: true,
      movementType,
      notes: "",
    });
  };

  // إغلاق Dialog
  const handleCloseMovement = () => {
    if (!savingMovement) {
      setMovementDialog({
        open: false,
        movementType: null,
        notes: "",
      });
    }
  };

  // حفظ الحركة
  const handleSaveMovement = async () => {
    if (!order?.barcode) return;

    const payload = {
      barcode: order.barcode,
      movementType: Number(movementDialog.movementType),
      notes: movementDialog.notes || "",
    };

    try {
      const result = await addMovementMutation.mutateAsync(payload);
      if (result?.data || result?.success) {
        setMovementDialog({ open: false, movementType: null, notes: "" });
        refetch();
      }
    } catch { /* The mutation displays the server error. */ }
  };

  // ✅ طباعة الباركود — عند الضغط على الزر فقط
  const handlePrintBarcode = () => {
    if (!images.barcode) {
      return;
    }

    const printWindow = window.open("", "_blank", "width=600,height=500");

    if (!printWindow) {
      alert("الرجاء السماح بالنوافذ المنبثقة للطباعة");
      return;
    }

    const printableBarcode = order.barcode.replace(/[^A-Za-z0-9_-]/g, "");
    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl">
        <head>
          <meta charset="UTF-8" />
          <title>طباعة الباركود - ${printableBarcode}</title>
          <style>
            * { box-sizing: border-box; }
            body {
              margin: 0;
              padding: 20px;
              font-family: 'Cairo', Arial, sans-serif;
              text-align: center;
              background: #fff;
            }
            h1 {
              font-size: 1.2rem;
              color: #8b6914;
              margin-bottom: 10px;
            }
            .barcode-img {
              max-width: 100%;
              height: auto;
              margin: 20px 0;
              display: block;
            }
            .qr-img {
              max-width: 180px;
              height: auto;
              margin: 10px auto;
              display: block;
            }
            .barcode-text {
              font-size: 1.1rem;
              font-weight: bold;
              letter-spacing: 2px;
              color: #333;
              margin-top: 10px;
              font-family: 'Courier New', monospace;
            }
            .label {
              font-size: 0.85rem;
              color: #666;
              margin-top: 4px;
            }
            @media print {
              @page { margin: 10mm; }
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          <h1>مجموعة عايد دعنا</h1>
          <div class="label">تصليحة رقم</div>
          <div class="barcode-text">${printableBarcode}</div>
          <img class="barcode-img" src="${images.barcode}" alt="Barcode" />
          ${
            images.qr
              ? `<img class="qr-img" src="${images.qr}" alt="QR Code" />`
              : ""
          }
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 300);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Loading
  if (isLoading) {
    return (
      <Box className="repairs-details-loading">
        <CircularProgress sx={{ color: "#b8860b" }} />
      </Box>
    );
  }

  if (!order) {
    return (
      <div className="repairs-details-container">
        <Paper elevation={0} className="repairs-details-card">
          <Box className="repairs-details-empty">
            <Typography>التصليحة غير موجودة</Typography>
            <Button
              variant="contained"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate("/repairs/list")}
              className="repairs-details-back-btn"
            >
              العودة
            </Button>
          </Box>
        </Paper>
      </div>
    );
  }

  // بيانات العرض
  const details = [
    { label: "العميل", value: order.customerName || "—", icon: <PersonIcon /> },
    {
      label: "الهاتف",
      value: order.customerPhone || "—",
      icon: <PhoneIcon />,
      ltr: true,
    },
    { label: "الوصف", value: order.description || "—" },
    {
      label: "الوزن",
      value: order.weight ? `${order.weight} غ` : "—",
      icon: <ScaleIcon />,
    },
    { label: "العيار", value: order.karat || "—", icon: <DiamondIcon /> },
    { label: "العدد", value: order.quantity || "—", icon: <NumbersIcon /> },
    {
      label: "العمل المطلوب",
      value: order.requiredWork || "—",
      icon: <BuildIcon />,
    },
    {
      label: "السعر",
      value: order.price ? `${order.price}` : "—",
      icon: <AttachMoneyIcon />,
    },
    { label: "ملاحظات", value: order.notes || "—", icon: <NotesIcon /> },
    {
      label: "ملاحظات المشغل",
      value: order.operatorNotes || "—",
      icon: <NotesIcon />,
    },
    {
      label: "فرع الاستلام",
      value: order.pickupBranchName || "—",
      icon: <StorefrontIcon />,
    },
    {
      label: "فرع التسليم",
      value: order.deliveryBranchName || "—",
      icon: <StorefrontIcon />,
    },
    {
      label: "الموظف المستلم",
      value: order.customerReceiverEmployeeName || "—",
      icon: <PersonIcon />,
    },
  ];

  // Timeline
  const timeline = [
    { type: 1, label: "تم التسليم للمندوب", date: getMovementDate(1) },
    { type: 2, label: "استلم المندوب من الفرع", date: getMovementDate(2) },
    { type: 3, label: "تم التسليم للورشة", date: getMovementDate(3) },
    { type: 4, label: "استلمت الورشة", date: getMovementDate(4) },
    { type: 5, label: "بدأ التصليح", date: getMovementDate(5) },
    { type: 6, label: "تم الانتهاء من التصليح", date: getMovementDate(6) },
    {
      type: 7,
      label: "تم التسليم للمندوب من الورشة",
      date: getMovementDate(7),
    },
    {
      type: 8,
      label: "استلم المندوب من الورشة",
      date: getMovementDate(8),
    },
    { type: 9, label: "تم التسليم للفرع", date: getMovementDate(9) },
    {
      type: 10,
      label: "استلم الفرع — جاهزة للاستلام",
      date: getMovementDate(10),
    },
    { type: 11, label: "تم التسليم للعميل", date: getMovementDate(11) },
  ];

  return (
    <div className="repairs-details-container">
      {/* Header */}
      <div className="repairs-details-header">
        <div className="repairs-details-header-icon">
          <ReceiptLongIcon sx={{ fontSize: 34 }} />
        </div>

        <Typography className="repairs-details-title">
          تفاصيل التصليحة
        </Typography>

        <div className="repairs-details-title-decor">
          <span className="repairs-details-title-line" />
          <Chip
            label={order.barcode || "—"}
            className="repairs-details-barcode-chip"
          />
          <span className="repairs-details-title-line" />
        </div>
      </div>

      {/* Actions */}
      <div className="repairs-details-actions">
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/repairs/list")}
          className="repairs-details-back-btn-outline"
        >
          العودة
        </Button>

        {images.barcode && (
          <Button
            variant="contained"
            startIcon={<PrintIcon />}
            onClick={handlePrintBarcode}
            className="repairs-details-print-btn"
          >
            طباعة الباركود
          </Button>
        )}
      </div>

      {/* Barcode Display */}
      {(images.barcode || images.qr) && (
        <Paper elevation={0} className="repairs-details-card">
          <Typography className="repairs-details-movements-history-title">
            الباركود و QR Code
          </Typography>

          <Divider className="repairs-details-divider" />

          <div className="repairs-barcode-display">
            {images.barcode && <img
              src={images.barcode}
              alt={`Barcode ${order.barcode}`}
              className="repairs-barcode-image"
            />}
            <Typography className="repairs-barcode-text">
              {order.barcode}
            </Typography>

            {images.qr && (
              <img
                src={images.qr}
                alt="QR Code"
                className="repairs-qrcode-image"
              />
            )}
          </div>
        </Paper>
      )}

      {/* Status + Movements */}
      <Paper elevation={0} className="repairs-details-card">
        <div className="repairs-details-status-row">
          <Typography className="repairs-details-status-label">
            الحالة الحالية:
          </Typography>
          <Chip
            label={getStatusName(order.status)}
            className={`repairs-details-status-chip repairs-status-${getStatusColor(
              order.status
            )}`}
          />
        </div>

        {availableMovements.length > 0 && (
          <>
            <Divider className="repairs-details-divider" />
            <div className="repairs-details-movements-section">
              <Typography className="repairs-details-movements-title">
                <PlayArrowIcon sx={{ fontSize: 20 }} /> الإجراءات المتاحة
              </Typography>

              <div className="repairs-details-movements-buttons">
                {availableMovements.map((movementType) => (
                  <Button
                    key={movementType}
                    variant="contained"
                    onClick={() => handleOpenMovement(movementType)}
                    className="repairs-movement-btn"
                  >
                    {MOVEMENT_TYPES[movementType].shortName}
                  </Button>
                ))}
              </div>
            </div>
          </>
        )}

        <Divider className="repairs-details-divider" />

        <Grid container spacing={2} sx={{ mt: 1 }}>
          {details.map((item) => (
            <Grid item xs={12} sm={6} key={item.label}>
              <div className="repairs-details-row">
                <Typography
                  className={`repairs-details-value ${
                    item.ltr ? "repairs-details-value-ltr" : ""
                  }`}
                >
                  {item.value}
                </Typography>

                <div className="repairs-details-label">
                  <span className="repairs-details-label-text">
                    {item.label}:
                  </span>
                  {item.icon && (
                    <span className="repairs-details-label-icon">
                      {item.icon}
                    </span>
                  )}
                </div>
              </div>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Timeline */}
      <Paper elevation={0} className="repairs-details-card">
        <Typography className="repairs-details-movements-history-title">
          <HistoryIcon sx={{ fontSize: 20 }} /> سجل الحالات والتواريخ
        </Typography>

        <Divider className="repairs-details-divider" />

        <div className="repairs-timeline-table">
          {timeline.map((item) => {
            const isDone = !!item.date;
            return (
              <div
                key={item.type}
                className={`repairs-timeline-row ${
                  isDone ? "repairs-timeline-done" : ""
                }`}
              >
                <div className="repairs-timeline-status">
                  {isDone ? (
                    <Chip
                      label="تم"
                      size="small"
                      className="repairs-timeline-chip-done"
                    />
                  ) : (
                    <Chip
                      label="بالانتظار"
                      size="small"
                      className="repairs-timeline-chip-pending"
                    />
                  )}
                </div>

                <div className="repairs-timeline-label">
                  <Typography className="repairs-timeline-text">
                    {item.label}
                  </Typography>
                </div>

                <div className="repairs-timeline-date">
                  <Typography className="repairs-timeline-date-text">
                    {item.date
                      ? new Date(item.date).toLocaleString("ar-JO", {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "—"}
                  </Typography>
                </div>
              </div>
            );
          })}
        </div>
      </Paper>

      {/* Movement Dialog */}
      <Dialog
        open={movementDialog.open}
        onClose={handleCloseMovement}
        PaperProps={{ className: "repairs-movement-dialog" }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle className="repairs-movement-dialog-title">
          {MOVEMENT_TYPES[movementDialog.movementType]?.name || "إضافة حركة"}
        </DialogTitle>

        <DialogContent className="repairs-movement-dialog-content">
          <TextField
            fullWidth
            label="ملاحظات (اختياري)"
            multiline
            rows={3}
            value={movementDialog.notes}
            onChange={(e) =>
              setMovementDialog((prev) => ({
                ...prev,
                notes: e.target.value,
              }))
            }
            margin="dense"
            className="repairs-form-field"
          />
        </DialogContent>

        <DialogActions className="repairs-movement-dialog-actions">
          <Button
            onClick={handleCloseMovement}
            disabled={savingMovement}
            className="repairs-movement-dialog-cancel"
            startIcon={<CloseIcon />}
          >
            إلغاء
          </Button>

          <Button
            onClick={handleSaveMovement}
            disabled={savingMovement}
            variant="contained"
            className="repairs-movement-dialog-confirm"
            startIcon={
              savingMovement ? (
                <CircularProgress size={16} sx={{ color: "#fff" }} />
              ) : (
                <PlayArrowIcon />
              )
            }
          >
            {savingMovement ? "جاري الحفظ..." : "تنفيذ الحركة"}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
