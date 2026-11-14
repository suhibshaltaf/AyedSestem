import { useMemo, useState, useEffect } from "react";

import {
  Box,
  Typography,
  Paper,
  Chip,
  CircularProgress,
  Button,
  Divider,
  Dialog,
  DialogContent,
  IconButton,
} from "@mui/material";

import { formatJordanDateTime } from "../../utils/dateUtils";
import { useParams, useNavigate, useLocation } from "react-router-dom";
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
import ImageIcon from "@mui/icons-material/Image";
import CloseIcon from "@mui/icons-material/Close";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import PersonOutlineIcon from "@mui/icons-material/PersonOutlineOutlined";
import AccessTimeIcon from "@mui/icons-material/AccessTime";

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

import style from "../../styles/Repairs/RepairOrderDetails.module.css";

const PHONE_VISIBLE_ROLES = ["Admin", "SuperAdmin", "BranchManager"];

const SOURCE_LABELS = {
  Branch: "الفرع",
  Operator: "المشغل",
  BranchManager: "مدير الفرع",
  OperatorManager: "مدير المشغل",
};

const safeFormatDate = (value) => {
  if (!value) return "—";

  try {
    return formatJordanDateTime(value) || "—";
  } catch {
    return "—";
  }
};

export default function RepairOrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const currentUser = useAuthStore((state) => state.user);

  const roles = useMemo(
    () => currentUser?.roles?.map((r) => r.name) || [],
    [currentUser]
  );

  const canViewPhone = useMemo(
    () => roles.some((role) => PHONE_VISIBLE_ROLES.includes(role)),
    [roles]
  );

  const { data: order, isLoading } = useRepairOrderById(id);

  const { data: organization } = useQuery({
    queryKey: ["organization-settings"],
    queryFn: organizationService.getSettings,
  });

  const showBarcode = organization?.showBarcode !== false;
  const showQr = organization?.showQrCode !== false;

  const [images, setImages] = useState({
    barcode: null,
    qr: null,
  });

  const [selectedImage, setSelectedImage] = useState(null);

  // ===============================
  // Barcode + QR
  // ===============================

  useEffect(() => {
    if (!order?.barcode) {
      setImages({ barcode: null, qr: null });
      return undefined;
    }

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

  // ===============================
  // Permissions
  // ===============================

  const canEdit =
    roles.includes("OperatorManager") &&
    canEditRepair(roles, order?.status, order?.movements || []);

  const canDelete = canDeleteRepair(
    roles,
    order?.status,
    order?.movements || []
  );

  // ===============================
  // Delete
  // ===============================

  const handleDelete = async () => {
    if (!window.confirm("هل أنت متأكد من حذف التصليحة؟")) return;

    try {
      await deleteMutation.mutateAsync(order.id);
      navigate("/repairs/list");
    } catch {
      // الـ hook يعرض رسالة الخطأ
    }
  };

  // ===============================
  // Print Barcode
  // ===============================

  const handlePrintBarcode = () => {
    if (!images.barcode || !order?.barcode) return;

    const printWindow = window.open("", "_blank", "width=600,height=400");

    if (!printWindow) {
      alert("الرجاء السماح بالنوافذ المنبثقة للطباعة");
      return;
    }

    const printableBarcode = String(order.barcode).replace(
      /[^A-Za-z0-9_-]/g,
      ""
    );

    printWindow.document.write(`
<!DOCTYPE html>
<html dir="ltr">
<head>
<meta charset="UTF-8" />
<title>طباعة الباركود - ${printableBarcode}</title>
<style>
* { box-sizing: border-box; }

@page { size: 118mm 15mm; margin: 0; }

html, body {
  width: 118mm;
  height: 15mm;
  margin: 0 !important;
  padding: 0 !important;
  background: #fff;
  overflow: hidden !important;
}

body {
  position: relative;
  font-family: Arial, sans-serif;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

.barcode-label {
  position: relative;
  width: 118mm;
  height: 15mm;
  margin: 0;
  padding: 0;
  background: #fff;
  overflow: hidden;
}

.barcode-content {
  position: absolute;
  top: 2.3mm;
  left: 3mm;
  width: 58mm;
  height: 10mm;
  overflow: visible;
}

.barcode-img {
  position: absolute;
  top: 0;
  left: 0;
  display: block;
  width: 58mm;
  height: 5.7mm;
  border: 0;
  object-fit: fill;
}

.barcode-text {
  position: absolute;
  top: 5.9mm;
  left: 0;
  width: 58mm;
  height: 2.8mm;
  font-family: "Courier New", Courier, monospace;
  font-size: 7pt;
  line-height: 2.8mm;
  font-weight: 700;
  letter-spacing: 0.08mm;
  color: #000;
  direction: ltr;
  text-align: center;
  white-space: nowrap;
}

@media print {
  html, body {
    width: 118mm !important;
    height: 15mm !important;
    margin: 0 !important;
    padding: 0 !important;
    overflow: hidden !important;
  }

  .barcode-label {
    width: 118mm !important;
    height: 15mm !important;
    page-break-inside: avoid !important;
    break-inside: avoid-page !important;
  }
}

</style>
</head>

<body>
<div class="barcode-label">
  <div class="barcode-content">
    <img id="barcodeImage" class="barcode-img"
      src="${images.barcode}" alt="Barcode" />
    <div class="barcode-text">${printableBarcode}</div>
  </div>
</div>

<script>
window.onload = function () {
  const img = document.getElementById("barcodeImage");
  let printed = false;

  function printLabel() {
    if (printed) return;
    printed = true;

    setTimeout(function () {
      window.focus();
      window.print();
    }, 700);
  }

  if (img.complete && img.naturalWidth > 0) {
    printLabel();
  } else {
    img.onload = printLabel;
    img.onerror = printLabel;
  }
};
</script>
</body>
</html>
    `);

    printWindow.document.close();
  };

  // ===============================
  // Loading
  // ===============================

  if (isLoading) {
    return (
      <Box className={style["repairs-details-loading"]}>
        <CircularProgress sx={{ color: "#b8860b" }} />
      </Box>
    );
  }

  // ===============================
  // Not Found
  // ===============================

  if (!order) {
    return (
      <div className={style["repairs-details-container"]}>
        <Paper elevation={0} className={style["repairs-details-card"]}>
          <Box className={style["repairs-details-empty"]}>
            <Typography>التصليحة غير موجودة</Typography>

            <Button
              variant="contained"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate(-1)}
              className={style["repairs-details-back-btn"]}
            >
              العودة
            </Button>
          </Box>
        </Paper>
      </div>
    );
  }

  // ===============================
  // Details
  // ===============================

  const details = [
    {
      label: "اسم العميل",
      value: order.customerName || "—",
      icon: <PersonIcon />,
    },

    ...(canViewPhone
      ? [
          {
            label: "رقم الهاتف",
            value: order.customerPhone || "—",
            icon: <PhoneIcon />,
            ltr: true,
          },
        ]
      : []),

    {
      label: "الوصف",
      value: order.description || "—",
      icon: <NotesIcon />,
    },

    {
      label: "الوزن",
      value:
        order.weight !== null && order.weight !== undefined
          ? `${order.weight} غ`
          : "—",
      icon: <ScaleIcon />,
    },

    {
      label: "العيار",
      value: order.karat || "—",
      icon: <DiamondIcon />,
    },

    {
      label: "العدد",
      value:
        order.quantity !== null && order.quantity !== undefined
          ? order.quantity
          : "—",
      icon: <NumbersIcon />,
    },

    {
      label: "العمل المطلوب",
      value: order.requiredWork || "—",
      icon: <BuildIcon />,
    },

    {
      label: "السعر",
      value:
        order.price !== null &&
        order.price !== undefined &&
        order.price !== ""
          ? order.price
          : "—",
      icon: <AttachMoneyIcon />,
    },

    ...(order.notes?.trim()
      ? [
          {
            label: "ملاحظات عامة",
            value: order.notes,
            icon: <NotesIcon />,
            fullWidth: true,
          },
        ]
      : []),

    ...(order.operatorNotes?.trim()
      ? [
          {
            label: "ملاحظات المشغل",
            value: order.operatorNotes,
            icon: <NotesIcon />,
            fullWidth: true,
          },
        ]
      : []),

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
    <div className={style["repairs-details-container"]}>
      {/* Header */}

      <div className={style["repairs-details-header"]}>
        <div className={style["repairs-details-header-icon"]}>
          <ReceiptLongIcon />
        </div>

        <Typography className={style["repairs-details-title"]}>
          تفاصيل التصليحة
        </Typography>

        <div className={style["repairs-details-title-decor"]}>
          <span className={style["repairs-details-title-line"]} />

          <Chip
            label={order.barcode || "—"}
            className={style["repairs-details-barcode-chip"]}
          />

          <span className={style["repairs-details-title-line"]} />
        </div>
      </div>

      {/* Actions */}

      <div className={style["repairs-details-actions"]}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() =>
            navigate(
              location.state?.from ||
                (roles.includes("OperatorManager")
                  ? "/repairs/operator"
                  : "/repairs/list"),
              { replace: true }
            )
          }
          className={style["repairs-details-back-btn-outline"]}
        >
          العودة
        </Button>

        {canEdit && (
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={() => navigate(`/repairs/${order.id}/edit`)}
            className={style["repairs-details-back-btn-outline"]}
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
            className={style["repairs-details-delete-btn"]}
          >
            {deleteMutation.isPending ? "جاري الحذف..." : "حذف"}
          </Button>
        )}

        {images.barcode && (
          <Button
            variant="contained"
            startIcon={<PrintIcon />}
            onClick={handlePrintBarcode}
            className={style["repairs-details-print-btn"]}
          >
            طباعة الباركود
          </Button>
        )}
      </div>

      {/* Barcode and QR */}

      {(images.barcode || images.qr) && (
        <Paper elevation={0} className={style["repairs-details-card"]}>
          <Typography className={style["repairs-details-section-title"]}>
            <ReceiptLongIcon />
            الباركود و QR Code
          </Typography>

          <Divider className={style["repairs-details-divider"]} />

          <div className={style["repairs-barcode-display"]}>
            {images.barcode && (
              <img
                src={images.barcode}
                alt={`Barcode ${order.barcode}`}
                className={style["repairs-barcode-image"]}
              />
            )}

            <Typography className={style["repairs-barcode-text"]}>
              {order.barcode}
            </Typography>

            {images.qr && (
              <img
                src={images.qr}
                alt="QR Code"
                className={style["repairs-qrcode-image"]}
              />
            )}
          </div>
        </Paper>
      )}

      {/* Status + Details */}

      <Paper elevation={0} className={style["repairs-details-card"]}>
        {/* الحالة بجانب اسمها مباشرة */}

        <div className={style["repairs-details-status-row"]}>
          <div className={style["repairs-details-status-label"]}>
            <span className={style["repairs-details-status-icon"]}>
              <AccessTimeIcon />
            </span>

            <Typography>الحالة الحالية:</Typography>
          </div>

          <Chip
            label={order.statusName || getStatusName(order.status)}
            className={`${style["repairs-details-status-chip"]} repairs-status-${getStatusColor(
              order.status
            )}`}
          />
        </div>

        <Divider className={style["repairs-details-divider"]} />

        {/* Details */}

        <div className={style["repairs-details-grid"]}>
          {details.map((item) => (
            <div
              key={item.label}
              className={`${style["repairs-details-row"]} ${
                item.fullWidth ? style["repairs-details-row-full"] : ""
              }`}
            >
              <div className={style["repairs-details-label"]}>
                {item.icon && (
                  <span className={style["repairs-details-label-icon"]}>
                    {item.icon}
                  </span>
                )}

                <span className={style["repairs-details-label-text"]}>
                  {item.label}
                </span>
              </div>

              <Typography
                component="div"
                className={`${style["repairs-details-value"]} ${
                  item.ltr ? style["repairs-details-value-ltr"] : ""
                }`}
              >
                {item.value}
              </Typography>
            </div>
          ))}
        </div>
      </Paper>

      {/* Repair Images */}

      {order.images?.length > 0 && (
        <Paper elevation={0} className={style["repairs-details-card"]}>
          <Typography className={style["repairs-details-section-title"]}>
            <ImageIcon />
            صور التصليح ({order.images.length})
          </Typography>

          <Divider className={style["repairs-details-divider"]} />

          <Box className={style["repairs-images-grid-details"]}>
            {order.images.map((img) => (
              <Box
                key={img.id}
                className={style["repairs-image-card"]}
                onClick={() => setSelectedImage(img)}
              >
                <Box className={style["repairs-image-card-img-wrapper"]}>
                  <img
                    src={repairOrderService.getRepairImageUrl(img.fileName)}
                    alt={img.fileName}
                    className={style["repairs-image-card-img"]}
                    loading="lazy"
                  />

                  <Box className={style["repairs-image-card-overlay"]}>
                    <ZoomInIcon />
                  </Box>
                </Box>

                <Box className={style["repairs-image-card-info"]}>
                  {img.uploadedByUserName && (
                    <Typography className={style["repairs-image-card-meta"]}>
                      <PersonOutlineIcon />
                      {img.uploadedByUserName}
                    </Typography>
                  )}

                  {img.source && (
                    <Chip
                      label={SOURCE_LABELS[img.source] || img.source}
                      size="small"
                      className={style["repairs-image-card-source"]}
                    />
                  )}

                  {img.createdAt && (
                    <Typography className={style["repairs-image-card-meta"]}>
                      <AccessTimeIcon />
                      {safeFormatDate(img.createdAt)}
                    </Typography>
                  )}
                </Box>
              </Box>
            ))}
          </Box>
        </Paper>
      )}

      {/* Current Responsibility */}

      <Paper elevation={0} className={style["repairs-details-card"]}>
        <Typography className={style["repairs-details-section-title"]}>
          <PersonIcon />
          المسؤولية الحالية
        </Typography>

        <Divider className={style["repairs-details-divider"]} />

        <div className={style["repairs-details-grid"]}>
          <div className={style["repairs-details-row"]}>
            <div className={style["repairs-details-label"]}>
              <span className={style["repairs-details-label-icon"]}>
                <PersonIcon />
              </span>

              <span className={style["repairs-details-label-text"]}>
                المسؤول الحالي
              </span>
            </div>

            <Typography
              component="div"
              className={style["repairs-details-value"]}
            >
              {order.currentResponsibleUserName || "—"}
            </Typography>
          </div>

          <div className={style["repairs-details-row"]}>
            <div className={style["repairs-details-label"]}>
              <span className={style["repairs-details-label-icon"]}>
                <StorefrontIcon />
              </span>

              <span className={style["repairs-details-label-text"]}>
                الموقع الحالي
              </span>
            </div>

            <Typography
              component="div"
              className={style["repairs-details-value"]}
            >
              {getStatusLocation(order.status) || "—"}
            </Typography>
          </div>

          {order.responsibilitySince && (
            <div className={style["repairs-details-row"]}>
              <div className={style["repairs-details-label"]}>
                <span className={style["repairs-details-label-icon"]}>
                  <AccessTimeIcon />
                </span>

                <span className={style["repairs-details-label-text"]}>
                  المسؤولية منذ
                </span>
              </div>

              <Typography
                component="div"
                className={`${style["repairs-details-value"]} ${style["repairs-details-value-ltr"]}`}
              >
                {safeFormatDate(order.responsibilitySince)}
              </Typography>
            </div>
          )}

          {order.isPendingConfirmation && (
            <div className={style["repairs-details-row"]}>
              <div className={style["repairs-details-label"]}>
                <span className={style["repairs-details-label-icon"]}>
                  <AccessTimeIcon />
                </span>

                <span className={style["repairs-details-label-text"]}>
                  حالة التأكيد
                </span>
              </div>

              <div className={style["repairs-details-value-chip"]}>
                <Chip
                  label="بانتظار التأكيد"
                  color="warning"
                  size="small"
                />
              </div>
            </div>
          )}
        </div>
      </Paper>

      {/* Movement History */}

      <Paper elevation={0} className={style["repairs-details-card"]}>
        <Typography className={style["repairs-details-section-title"]}>
          <HistoryIcon />
          سجل الحركات
        </Typography>

        <Divider className={style["repairs-details-divider"]} />

        {!order.movements || order.movements.length === 0 ? (
          <Box className={style["repairs-details-no-movements"]}>
            <HistoryIcon />
            <Typography>لا توجد حركات بعد</Typography>
          </Box>
        ) : (
          <div className={style["repairs-timeline-table"]}>
            {order.movements.map((movement, index) => (
              <div
                key={movement.id}
                className={style["repairs-timeline-row"]}
              >
                <div className={style["repairs-timeline-indicator"]}>
                  <span className={style["repairs-timeline-dot"]}>
                    {index + 1}
                  </span>

                  {index !== order.movements.length - 1 && (
                    <span className={style["repairs-timeline-line"]} />
                  )}
                </div>

                <div className={style["repairs-timeline-content"]}>
                  <div className={style["repairs-timeline-row-header"]}>
                    <Typography className={style["repairs-timeline-text"]}>
                      {movement.movementName || "—"}
                    </Typography>

                    <Typography
                      className={style["repairs-timeline-date-text"]}
                    >
                      {safeFormatDate(movement.createdAt)}
                    </Typography>
                  </div>

                  <Typography className={style["repairs-timeline-detail"]}>
                    من: <strong>{movement.previousStatusName || "—"}</strong>
                    {" ← "}
                    إلى: <strong>{movement.newStatusName || "—"}</strong>
                  </Typography>

                  <Typography className={style["repairs-timeline-detail"]}>
                    نفّذها: <strong>{movement.performedByName || "—"}</strong>

                    {movement.branchName && (
                      <>
                        {" — الفرع: "}
                        <strong>{movement.branchName}</strong>
                      </>
                    )}

                    {movement.workshopName && (
                      <>
                        {" — المشغل: "}
                        <strong>{movement.workshopName}</strong>
                      </>
                    )}
                  </Typography>

                  {movement.newResponsibleUserName && (
                    <Typography className={style["repairs-timeline-detail"]}>
                      المسؤول الجديد:{" "}
                      <strong>{movement.newResponsibleUserName}</strong>
                    </Typography>
                  )}

                  {movement.notes?.trim() && (
                    <Typography className={style["repairs-timeline-notes"]}>
                      <NotesIcon />
                      {movement.notes}
                    </Typography>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Paper>

      {/* Image Dialog */}

      <Dialog
        open={!!selectedImage}
        onClose={() => setSelectedImage(null)}
        maxWidth="lg"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              backgroundColor: "rgba(0, 0, 0, 0.9)",
              boxShadow: "none",
            },
          },
        }}
      >
        <DialogContent sx={{ p: 0, position: "relative" }}>
          <IconButton
            onClick={() => setSelectedImage(null)}
            sx={{
              position: "absolute",
              top: 8,
              right: 8,
              color: "#fff",
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              "&:hover": {
                backgroundColor: "rgba(0, 0, 0, 0.7)",
              },
              zIndex: 1,
            }}
          >
            <CloseIcon />
          </IconButton>

          {selectedImage && (
            <Box className={style["repairs-image-dialog-content"]}>
              <img
                src={repairOrderService.getRepairImageUrl(
                  selectedImage.fileName
                )}
                alt={selectedImage.fileName}
                className={style["repairs-image-dialog-img"]}
              />

              <Box className={style["repairs-image-dialog-meta"]}>
                {selectedImage.uploadedByUserName && (
                  <Typography
                    className={style["repairs-image-dialog-meta-text"]}
                  >
                    <PersonOutlineIcon />
                    {selectedImage.uploadedByUserName}
                  </Typography>
                )}

                {selectedImage.source && (
                  <Chip
                    label={
                      SOURCE_LABELS[selectedImage.source] ||
                      selectedImage.source
                    }
                    size="small"
                    sx={{
                      backgroundColor: "#c9a44c",
                      color: "#fff",
                    }}
                  />
                )}

                {selectedImage.createdAt && (
                  <Typography
                    className={style["repairs-image-dialog-meta-text"]}
                  >
                    <AccessTimeIcon />
                    {safeFormatDate(selectedImage.createdAt)}
                  </Typography>
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}