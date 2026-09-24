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
import HistoryIcon from "@mui/icons-material/History";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

import {
  useRepairOrderById,
  useDeleteRepairOrder,
} from "../../hooks/useRepairOrders.js";
import useAuthStore from "../../store/useAuthStore.js";
import repairOrderService from "../../services/repairOrderService.js";
import organizationService from "../../services/organizationService.js";
import {
  getStatusName,
  getStatusColor,
  getStatusLocation,
  canEditRepair,
  canDeleteRepair,
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

  const { data: order, isLoading } = useRepairOrderById(id);

  const { data: organization } = useQuery({
    queryKey: ["organization-settings"],
    queryFn: organizationService.getSettings,
  });

  const showBarcode = organization?.showBarcode !== false;
  const showQr = organization?.showQrCode !== false;

  const [images, setImages] = useState({ barcode: null, qr: null });

  useEffect(() => {
    if (!order?.barcode) return undefined;
    let active = true;
    const urls = [];
    const load = async () => {
      const [barcodeResult, qrResult] = await Promise.allSettled([
        showBarcode
          ? repairOrderService.getBarcodeImage(order.barcode)
          : Promise.resolve(null),
        showQr
          ? repairOrderService.getQrImage(order.barcode)
          : Promise.resolve(null),
      ]);
      if (!active) return;
      const barcode =
        barcodeResult.status === "fulfilled" && barcodeResult.value
          ? URL.createObjectURL(barcodeResult.value)
          : null;
      const qr =
        qrResult.status === "fulfilled" && qrResult.value
          ? URL.createObjectURL(qrResult.value)
          : null;
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

  const deleteMutation = useDeleteRepairOrder();

  const canEdit = canEditRepair(roles, order?.status, order?.movements || []);
  const canDelete = canDeleteRepair(
    roles,
    order?.status,
    order?.movements || []
  );

  const handleDelete = async () => {
    if (!window.confirm("هل أنت متأكد من حذف التصليحة؟")) return;
    try {
      await deleteMutation.mutateAsync(order.id);
      navigate("/repairs/list");
    } catch {
      /* الـ hook يعرض الرسالة */
    }
  };

  const handlePrintBarcode = () => {
    if (!images.barcode) return;

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
            h1 { font-size: 1.2rem; color: #8b6914; margin-bottom: 10px; }
            .barcode-img { max-width: 100%; height: auto; margin: 20px 0; display: block; }
            .qr-img { max-width: 180px; height: auto; margin: 10px auto; display: block; }
            .barcode-text {
              font-size: 1.1rem; font-weight: bold; letter-spacing: 2px;
              color: #333; margin-top: 10px;
              font-family: 'Courier New', monospace;
            }
            .label { font-size: 0.85rem; color: #666; margin-top: 4px; }
            @media print { @page { margin: 10mm; } body { padding: 0; } }
          </style>
        </head>
        <body>
          <h1>مجموعة عايد دعنا</h1>
          <div class="label">تصليحة رقم</div>
          <div class="barcode-text">${printableBarcode}</div>
          <img class="barcode-img" src="${images.barcode}" alt="Barcode" />
          ${images.qr ? `<img class="qr-img" src="${images.qr}" alt="QR Code" />` : ""}
          <script>
            window.onload = function() {
              setTimeout(function() { window.print(); }, 300);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

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

        {canEdit && (
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={() => navigate(`/repairs/${order.id}/edit`)}
            className="repairs-details-back-btn-outline"
          >
            تعديل
          </Button>
        )}

        {canDelete && (
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? "جاري الحذف..." : "حذف"}
          </Button>
        )}

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
            {images.barcode && (
              <img
                src={images.barcode}
                alt={`Barcode ${order.barcode}`}
                className="repairs-barcode-image"
              />
            )}
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

      {/* Status */}
      <Paper elevation={0} className="repairs-details-card">
        <div className="repairs-details-status-row">
          <Typography className="repairs-details-status-label">
            الحالة الحالية:
          </Typography>
          <Chip
            label={order.statusName || getStatusName(order.status)}
            className={`repairs-details-status-chip repairs-status-${getStatusColor(
              order.status
            )}`}
          />
        </div>

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

      {/* Current Responsibility */}
      <Paper elevation={0} className="repairs-details-card">
        <Typography className="repairs-details-movements-history-title">
          المسؤولية الحالية
        </Typography>

        <Divider className="repairs-details-divider" />

        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}>
            <div className="repairs-details-row">
              <Typography className="repairs-details-value">
                {order.currentResponsibleUserName || "—"}
              </Typography>
              <div className="repairs-details-label">
                <span className="repairs-details-label-text">
                  المسؤول الحالي:
                </span>
                <span className="repairs-details-label-icon">
                  <PersonIcon />
                </span>
              </div>
            </div>
          </Grid>

          <Grid item xs={12} sm={6}>
            <div className="repairs-details-row">
              <Typography className="repairs-details-value">
                {getStatusLocation(order.status)}
              </Typography>
              <div className="repairs-details-label">
                <span className="repairs-details-label-text">
                  الموقع الحالي:
                </span>
                <span className="repairs-details-label-icon">
                  <StorefrontIcon />
                </span>
              </div>
            </div>
          </Grid>

          {order.responsibilitySince && (
            <Grid item xs={12} sm={6}>
              <div className="repairs-details-row">
                <Typography className="repairs-details-value">
                  {new Date(order.responsibilitySince).toLocaleString("ar-JO")}
                </Typography>
                <div className="repairs-details-label">
                  <span className="repairs-details-label-text">
                    المسؤولية منذ:
                  </span>
                </div>
              </div>
            </Grid>
          )}

          {order.isPendingConfirmation && (
            <Grid item xs={12} sm={6}>
              <div className="repairs-details-row">
                <Chip label="بانتظار التأكيد" color="warning" size="small" />
                <div className="repairs-details-label">
                  <span className="repairs-details-label-text">الحالة:</span>
                </div>
              </div>
            </Grid>
          )}
        </Grid>
      </Paper>

      {/* Movement History */}
      <Paper elevation={0} className="repairs-details-card">
        <Typography className="repairs-details-movements-history-title">
          <HistoryIcon sx={{ fontSize: 20 }} /> سجل الحركات
        </Typography>

        <Divider className="repairs-details-divider" />

        {!order.movements || order.movements.length === 0 ? (
          <Box sx={{ py: 3, textAlign: "center" }}>
            <Typography color="text.secondary">لا توجد حركات بعد</Typography>
          </Box>
        ) : (
          <div className="repairs-timeline-table">
            {order.movements.map((movement) => (
              <div
                key={movement.id}
                className="repairs-timeline-row repairs-timeline-done"
                style={{
                  flexDirection: "column",
                  alignItems: "stretch",
                  gap: 6,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 12,
                    flexWrap: "wrap",
                  }}
                >
                  <Typography
                    className="repairs-timeline-text"
                    sx={{ fontWeight: 700 }}
                  >
                    {movement.movementName || "—"}
                  </Typography>

                  <Typography className="repairs-timeline-date-text">
                    {movement.createdAt
                      ? new Date(movement.createdAt).toLocaleString("ar-JO", {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "—"}
                  </Typography>
                </div>

                <Typography
                  sx={{ fontSize: "0.85rem", color: "text.secondary" }}
                >
                  من: <strong>{movement.previousStatusName || "—"}</strong> →
                  إلى: <strong>{movement.newStatusName || "—"}</strong>
                </Typography>

                <Typography
                  sx={{ fontSize: "0.85rem", color: "text.secondary" }}
                >
                  نفّذها: <strong>{movement.performedByName || "—"}</strong>
                  {movement.branchName && (
                    <>
                      {" "}
                      — الفرع: <strong>{movement.branchName}</strong>
                    </>
                  )}
                  {movement.workshopName && (
                    <>
                      {" "}
                      — المشغل: <strong>{movement.workshopName}</strong>
                    </>
                  )}
                </Typography>

                {movement.newResponsibleUserName && (
                  <Typography
                    sx={{ fontSize: "0.85rem", color: "text.secondary" }}
                  >
                    المسؤول الجديد:{" "}
                    <strong>{movement.newResponsibleUserName}</strong>
                  </Typography>
                )}

                {movement.notes && (
                  <Typography
                    sx={{ fontSize: "0.85rem", color: "text.secondary" }}
                  >
                    ملاحظات: {movement.notes}
                  </Typography>
                )}
              </div>
            ))}
          </div>
        )}
      </Paper>
    </div>
  );
}