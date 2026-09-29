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

  DialogContent,

  IconButton,

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

import "../../styles/repairs.css";



// ===============================

// ✅ الأدوار المسموح لها برؤية رقم الهاتف

// ===============================

const PHONE_VISIBLE_ROLES = [

  "Admin",

  "SuperAdmin",

  "BranchManager",

];



// ===============================

// ✅ أسماء المصادر بالعربي

// ===============================

const SOURCE_LABELS = {

  Branch: "الفرع",

  Operator: "المشغل",

  BranchManager: "مدير الفرع",

  OperatorManager: "مدير المشغل",

};



export default function RepairOrderDetails() {

  const { id } = useParams();

  const navigate = useNavigate();

  const currentUser = useAuthStore((state) => state.user);



  const roles = useMemo(

    () => currentUser?.roles?.map((r) => r.name) || [],

    [currentUser]

  );



  // ✅ هل يسمح له برؤية رقم الهاتف؟

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



  const [images, setImages] = useState({ barcode: null, qr: null });



  // ✅ حالة عرض الصورة المكبرة

  const [selectedImage, setSelectedImage] = useState(null);



  /* ==========================================

   * ✅ Barcode + QR

   * ========================================== */

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

  const printWindow = window.open(
    "",
    "_blank",
    "width=600,height=400"
  );

  if (!printWindow) {
    alert("الرجاء السماح بالنوافذ المنبثقة للطباعة");
    return;
  }

  const printableBarcode = order.barcode.replace(
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

    * {
      box-sizing: border-box;
    }

    /* =========================================
       حجم الورقة الحقيقي
       ========================================= */

    @page {
      size: 118mm 15mm;
      margin: 0;
    }

    html,
    body {
      width: 118mm;
      height: 15mm;

      margin: 0 !important;
      padding: 0 !important;

      background: #ffffff;

      overflow: hidden !important;
    }

    body {
      position: relative;

      font-family: Arial, sans-serif;

      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }


    /* =========================================
       الليبل كامل
       ========================================= */

    .barcode-label {
      position: relative;

      width: 118mm;
      height: 15mm;

      margin: 0;
      padding: 0;

      background: #ffffff;

      overflow: hidden;
    }


    /* =========================================
       منطقة الطباعة

       الهدف:
       باركود قريب من الصورة المرجعية
       كبير وواضح لكن بدون تمديد زائد
       ========================================= */

    .barcode-content {
      position: absolute;

      /*
        نزول الباركود داخل الليبل
      */
      top: 2.3mm;

      /*
        بداية الطباعة من اليسار
      */
      left: 3mm;

      /*
        العرض مهم جداً للقارئ.
        لا نصغره أكثر من اللازم.
      */
      width: 58mm;

      /*
        مساحة الباركود + الرقم
      */
      height: 10mm;

      margin: 0;
      padding: 0;

      overflow: visible;
    }


    /* =========================================
       صورة الباركود
       ========================================= */

    .barcode-img {
      position: absolute;

      top: 0;
      left: 0;

      display: block;

      /*
        نحافظ على العرض الذي أثبت أنه يُقرأ
      */
      width: 58mm;

      /*
        ارتفاع مناسب مثل المرجع،
        وليس عالي جداً
      */
      height: 5.7mm;

      margin: 0;
      padding: 0;

      border: 0;

      object-fit: fill;
      object-position: left top;
    }


    /* =========================================
       رقم الباركود
       ========================================= */

    .barcode-text {
      position: absolute;

      /*
        مباشرة تحت الباركود
      */
      top: 5.9mm;

      left: 0;

      width: 58mm;
      height: 2.8mm;

      margin: 0;
      padding: 0;

      font-family: "Courier New", Courier, monospace;

      font-size: 7pt;
      line-height: 2.8mm;

      font-weight: 700;

      letter-spacing: 0.08mm;

      color: #000000;

      direction: ltr;

      text-align: center;

      white-space: nowrap;

      overflow: visible;
    }


    /* =========================================
       إعدادات الطباعة
       ========================================= */

    @media print {

      html,
      body {
        width: 118mm !important;
        height: 15mm !important;

        margin: 0 !important;
        padding: 0 !important;

        background: #ffffff !important;

        overflow: hidden !important;
      }


      body {
        position: relative !important;

        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }


      .barcode-label {
        position: relative !important;

        width: 118mm !important;
        height: 15mm !important;

        margin: 0 !important;
        padding: 0 !important;

        background: #ffffff !important;

        overflow: hidden !important;

        page-break-before: avoid !important;
        page-break-after: avoid !important;
        page-break-inside: avoid !important;

        break-before: avoid-page !important;
        break-after: avoid-page !important;
        break-inside: avoid-page !important;
      }


      .barcode-content {
        position: absolute !important;

        top: 2.3mm !important;
        left: 3mm !important;

        width: 58mm !important;
        height: 10mm !important;

        margin: 0 !important;
        padding: 0 !important;

        overflow: visible !important;
      }


      .barcode-img {
        position: absolute !important;

        top: 0 !important;
        left: 0 !important;

        display: block !important;

        width: 58mm !important;
        height: 5.7mm !important;

        margin: 0 !important;
        padding: 0 !important;

        border: 0 !important;

        object-fit: fill !important;
        object-position: left top !important;
      }


      .barcode-text {
        position: absolute !important;

        top: 5.9mm !important;
        left: 0 !important;

        width: 58mm !important;
        height: 2.8mm !important;

        margin: 0 !important;
        padding: 0 !important;

        font-family: "Courier New", Courier, monospace !important;

        font-size: 7pt !important;
        line-height: 2.8mm !important;

        font-weight: 700 !important;

        letter-spacing: 0.08mm !important;

        color: #000000 !important;

        direction: ltr !important;

        text-align: center !important;

        white-space: nowrap !important;

        overflow: visible !important;
      }
    }

  </style>
</head>

<body>

  <div class="barcode-label">

    <div class="barcode-content">

      <img
        id="barcodeImage"
        class="barcode-img"
        src="${images.barcode}"
        alt="Barcode"
      />

      <div class="barcode-text">${printableBarcode}</div>

    </div>

  </div>


  <script>

    window.onload = function () {

      const img = document.getElementById("barcodeImage");

      let printed = false;


      function printLabel() {

        if (printed) {
          return;
        }

        printed = true;


        /*
          نعطي الصورة وقت حتى يتم تحميلها
          بالكامل قبل إرسالها للطابعة
        */

        setTimeout(function () {

          window.focus();

          window.print();

        }, 700);

      }


      /*
        إذا كانت الصورة محملة أصلاً
      */

      if (
        img.complete &&
        img.naturalWidth > 0
      ) {

        printLabel();

      } else {

        /*
          انتظر تحميل صورة الباركود
        */

        img.onload = function () {
          printLabel();
        };


        /*
          حتى لا تبقى النافذة معلقة
          في حالة خطأ تحميل الصورة
        */

        img.onerror = function () {
          printLabel();
        };

      }

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



  // ✅ بناء قائمة التفاصيل (مع إخفاء الهاتف إذا لزم)

  const details = [

    { label: "العميل", value: order.customerName || "—", icon: <PersonIcon /> },

    // ✅ عرض الهاتف فقط للمصرّح لهم

    ...(canViewPhone

      ? [

          {

            label: "الهاتف",

            value: order.customerPhone || "—",

            icon: <PhoneIcon />,

            ltr: true,

          },

        ]

      : []),

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



      {/* ✅ قسم الصور المتعددة */}

      {order.images && order.images.length > 0 && (

        <Paper elevation={0} className="repairs-details-card">

          <Typography className="repairs-details-movements-history-title">

            <ImageIcon sx={{ fontSize: 20 }} /> صور التصليح ({order.images.length})

          </Typography>



          <Divider className="repairs-details-divider" />



          <Box className="repairs-images-grid-details">

            {order.images.map((img) => (

              <Box

                key={img.id}

                className="repairs-image-card"

                onClick={() => setSelectedImage(img)}

              >

                <Box className="repairs-image-card-img-wrapper">

                  <img

                    src={repairOrderService.getRepairImageUrl(img.fileName)}

                    alt={img.fileName}

                    className="repairs-image-card-img"

                    loading="lazy"

                  />

                  <Box className="repairs-image-card-overlay">

                    <ZoomInIcon sx={{ color: "#fff", fontSize: 28 }} />

                  </Box>

                </Box>



                <Box className="repairs-image-card-info">

                  {img.uploadedByUserName && (

                    <Typography className="repairs-image-card-meta">

                      <PersonOutlineIcon sx={{ fontSize: 14 }} />

                      {img.uploadedByUserName}

                    </Typography>

                  )}



                  {img.source && (

                    <Chip

                      label={SOURCE_LABELS[img.source] || img.source}

                      size="small"

                      className="repairs-image-card-source"

                    />

                  )}



                  {img.createdAt && (

                    <Typography className="repairs-image-card-meta">

                      <AccessTimeIcon sx={{ fontSize: 14 }} />

                      {new Date(img.createdAt).toLocaleString("ar-JO", {

                        year: "numeric",

                        month: "2-digit",

                        day: "2-digit",

                        hour: "2-digit",

                        minute: "2-digit",

                      })}

                    </Typography>

                  )}

                </Box>

              </Box>

            ))}

          </Box>

        </Paper>

      )}



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



      {/* ✅ Dialog لعرض الصورة المكبرة */}

      <Dialog

        open={!!selectedImage}

        onClose={() => setSelectedImage(null)}

        maxWidth="lg"

        fullWidth

        PaperProps={{

          sx: {

            backgroundColor: "rgba(0, 0, 0, 0.9)",

            boxShadow: "none",

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

              "&:hover": { backgroundColor: "rgba(0, 0, 0, 0.7)" },

              zIndex: 1,

            }}

          >

            <CloseIcon />

          </IconButton>



          {selectedImage && (

            <Box

              sx={{

                display: "flex",

                flexDirection: "column",

                alignItems: "center",

                justifyContent: "center",

                minHeight: "50vh",

                p: 2,

              }}

            >

              <img

                src={repairOrderService.getRepairImageUrl(

                  selectedImage.fileName

                )}

                alt={selectedImage.fileName}

                style={{

                  maxWidth: "100%",

                  maxHeight: "80vh",

                  objectFit: "contain",

                  borderRadius: 8,

                }}

              />



              <Box

                sx={{

                  mt: 2,

                  display: "flex",

                  gap: 2,

                  alignItems: "center",

                  flexWrap: "wrap",

                  justifyContent: "center",

                }}

              >

                {selectedImage.uploadedByUserName && (

                  <Typography sx={{ color: "#fff", fontSize: "0.9rem" }}>

                    <PersonOutlineIcon

                      sx={{ fontSize: 16, verticalAlign: "middle", ml: 0.5 }}

                    />

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

                    sx={{ backgroundColor: "#c9a44c", color: "#fff" }}

                  />

                )}



                {selectedImage.createdAt && (

                  <Typography sx={{ color: "#fff", fontSize: "0.9rem" }}>

                    <AccessTimeIcon

                      sx={{ fontSize: 16, verticalAlign: "middle", ml: 0.5 }}

                    />

                    {new Date(selectedImage.createdAt).toLocaleString("ar-JO")}

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