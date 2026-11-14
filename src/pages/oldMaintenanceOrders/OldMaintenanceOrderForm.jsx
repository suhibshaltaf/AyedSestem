
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  MenuItem,
  CircularProgress,
  Divider,
  Grid,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
} from "@mui/material";

import { toast } from "react-toastify";

import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import SaveIcon from "@mui/icons-material/Save";
import CloseIcon from "@mui/icons-material/Close";
import PersonIcon from "@mui/icons-material/Person";
import PhoneIcon from "@mui/icons-material/Phone";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import ScaleIcon from "@mui/icons-material/Scale";
import DiamondIcon from "@mui/icons-material/Diamond";
import NumbersIcon from "@mui/icons-material/Numbers";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import StorefrontIcon from "@mui/icons-material/Storefront";
import BuildIcon from "@mui/icons-material/Build";
import NotesIcon from "@mui/icons-material/Notes";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

import useAuthStore from "../../store/useAuthStore.js";
import { useBranches } from "../../hooks/useBranches.js";

import {
  useCreateOldMaintenanceOrder,
  useOldMaintenanceOrderById,
  useUpdateOldMaintenanceOrder,
} from "../../hooks/useOldMaintenanceOrders.js";

import styles from "../../styles/OldMaintenanceOrders/old-maintenance-order-form.module.css";

/* =====================================================
   Options
   ===================================================== */

const KARAT_OPTIONS = [
  "عيار 24",
  "عيار 22",
  "عيار 21",
  "عيار 18",
  "عيار 14",
  "عيار 9",
  "فضة",
  "أخرى",
];

const PERSISTENT_TOAST = {
  containerId: "persistent",
  position: "top-center",
  autoClose: false,
  closeOnClick: true,
  closeButton: true,
  pauseOnHover: true,
  draggable: false,
};

/* =====================================================
   Empty Form
   ===================================================== */

const initialForm = {
  receiptNumber: "",
  customerName: "",
  customerPhone: "",
  receiptDate: "",
  itemType: "",
  weight: "",
  karat: "",
  fees: "",
  status: 1,
  notes: "",
  branchId: "",
};

/* =====================================================
   Helpers
   ===================================================== */

const read = (object, name) =>
  object?.[name.charAt(0).toLowerCase() + name.slice(1)] ??
  object?.[name];

const unwrap = (response) => {
  let result = response;

  for (let i = 0; i < 3; i++) {
    if (!result || typeof result !== "object") break;

    if (result.data && typeof result.data === "object") {
      result = result.data;
      continue;
    }

    break;
  }

  return result;
};

const toDateInput = (value) => {
  if (!value) return "";

  const stringValue = String(value);

  if (/^\d{4}-\d{2}-\d{2}/.test(stringValue)) {
    return stringValue.substring(0, 10);
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return stringValue.substring(0, 10);
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

/* =====================================================
   Reusable Field Label
   ===================================================== */

const FieldLabel = ({ children, required = false }) => (
  <Typography className={styles.fieldLabel}>
    {children}
    {required && <span className={styles.required}> *</span>}
  </Typography>
);

/* =====================================================
   Component
   ===================================================== */

const OldMaintenanceOrderForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const isEdit = Boolean(id);

  const currentUser = useAuthStore((state) => state.user);

  const roles = useMemo(
    () =>
      currentUser?.roles?.map((role) =>
        typeof role === "string" ? role : role?.name
      ) || [],
    [currentUser]
  );

  const isAdmin =
    roles.includes("Admin") || roles.includes("SuperAdmin");

  const {
    data: branchesResponse = [],
    isLoading: branchesLoading,
  } = useBranches();

  const branchesData = unwrap(branchesResponse);

  const branches = Array.isArray(branchesData)
    ? branchesData
    : branchesData?.items || branchesData?.Items || [];

  const availableBranches = useMemo(
    () =>
      branches.filter(
        (branch) =>
          (branch.isActive ?? branch.IsActive) !== false
      ),
    [branches]
  );

  const {
    data: orderResponse,
    isLoading: orderLoading,
    isError: orderError,
  } = useOldMaintenanceOrderById(id);

  const createMutation = useCreateOldMaintenanceOrder();
  const updateMutation = useUpdateOldMaintenanceOrder();

  const [form, setForm] = useState(initialForm);
  const [formError, setFormError] = useState("");

  // نافذة تأكيد تسليم القطعة
  const [deliveryDialogOpen, setDeliveryDialogOpen] = useState(false);

  const isSaving =
    createMutation.isPending || updateMutation.isPending;

  /* ---------- Hydrate Edit ---------- */

  useEffect(() => {
    if (!isEdit || !orderResponse) return;

    const order = unwrap(orderResponse);

    setForm({
      receiptNumber: read(order, "ReceiptNumber") || "",
      customerName: read(order, "CustomerName") || "",
      customerPhone: read(order, "CustomerPhone") || "",
      receiptDate: toDateInput(read(order, "ReceiptDate")),
      itemType: read(order, "ItemType") || "",
      weight: read(order, "Weight") ?? "",
      karat: read(order, "Karat") || "",
      fees: read(order, "Fees") ?? "",
      status: Number(read(order, "Status") ?? 1),
      notes: read(order, "Notes") || "",
      branchId: read(order, "BranchId") ?? "",
    });
  }, [isEdit, orderResponse]);

  /* ---------- Change Handler ---------- */

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setFormError("");
  };

  /* ---------- Status Change Handler ---------- */

  const handleStatusChange = (event) => {
    const selectedStatus = Number(event.target.value);

    // إذا اختار المستخدم حالة التسليم، نطلب التأكيد أولاً
    if (selectedStatus === 2 && Number(form.status) !== 2) {
      setDeliveryDialogOpen(true);
      return;
    }

    setForm((previous) => ({
      ...previous,
      status: selectedStatus,
    }));

    setFormError("");
  };

  /* ---------- Confirm Delivery ---------- */

  const handleConfirmDelivery = () => {
    setForm((previous) => ({
      ...previous,
      status: 2,
    }));

    setFormError("");
    setDeliveryDialogOpen(false);
  };

  /* ---------- Cancel Delivery ---------- */

  const handleCancelDelivery = () => {
    setDeliveryDialogOpen(false);
  };

  /* ---------- Submit ---------- */

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");

    if (!form.receiptNumber.trim()) {
      setFormError("يرجى إدخال رقم الوصل القديم");
      return;
    }

    if (!form.customerName.trim()) {
      setFormError("يرجى إدخال اسم الزبون");
      return;
    }

    if (!form.receiptDate) {
      setFormError("يرجى إدخال تاريخ الوصل");
      return;
    }

    if (isAdmin && !form.branchId) {
      setFormError("يرجى اختيار الفرع");
      return;
    }

    if (form.weight !== "" && Number(form.weight) < 0) {
      setFormError("الوزن لا يمكن أن يكون سالباً");
      return;
    }

    if (form.fees !== "" && Number(form.fees) < 0) {
      setFormError("أجور التصليح لا يمكن أن تكون سالبة");
      return;
    }

    const payload = {
      receiptNumber: form.receiptNumber.trim(),
      customerName: form.customerName.trim(),
      customerPhone: form.customerPhone.trim() || null,
      receiptDate: `${form.receiptDate}T00:00:00`,
      itemType: form.itemType.trim() || null,
      weight: form.weight === "" ? null : Number(form.weight),
      karat: form.karat.trim() || null,
      fees: form.fees === "" ? null : Number(form.fees),
      status: Number(form.status),
      notes: form.notes.trim() || null,
      branchId: isAdmin ? Number(form.branchId) : null,
    };

    try {
      if (isEdit) {
        await updateMutation.mutateAsync({
          id: Number(id),
          data: payload,
        });

        navigate(`/old-maintenance-orders/${id}`);
      } else {
        await createMutation.mutateAsync(payload);

        navigate("/old-maintenance-orders");
      }
    } catch (error) {
      console.error("Old Maintenance Order Submit Error:", error);

      const message =
        error?.response?.data?.message ||
        error?.response?.data?.Message ||
        error?.message ||
        "حدث خطأ أثناء حفظ البيانات";

      toast.error(message, PERSISTENT_TOAST);
    }
  };

  /* ---------- Loading ---------- */

  if (isEdit && orderLoading) {
    return (
      <Box className={styles.loading}>
        <CircularProgress sx={{ color: "#b8860b" }} />

        <Typography>
          جاري تحميل بيانات التصليح القديم...
        </Typography>
      </Box>
    );
  }

  if (isEdit && orderError) {
    return (
      <Box className={styles.loading}>
        <Typography>
          تعذر تحميل بيانات التصليح القديم.
        </Typography>

        <Button
          variant="outlined"
          onClick={() => navigate("/old-maintenance-orders")}
        >
          العودة للأرشيف
        </Button>
      </Box>
    );
  }

  /* ---------- Render ---------- */

  return (
    <Box className={styles.page}>
      {/* Header */}

      <Box className={styles.header}>
        <Box className={styles.headerIcon}>
          <ReceiptLongIcon sx={{ fontSize: 34 }} />
        </Box>

        <Typography className={styles.title}>
          {isEdit ? "تعديل تصليح قديم" : "إضافة تصليح قديم"}
        </Typography>

        <Typography className={styles.subtitle}>
          {isEdit
            ? "تعديل بيانات الوصل الورقي القديم"
            : "تسجيل بيانات التصليح كما هي موجودة في السجلات الورقية"}
        </Typography>
      </Box>

      {/* Main Card */}

      <Paper elevation={0} className={styles.card}>
        <Box component="form" onSubmit={handleSubmit} noValidate>
          {formError && (
            <Box className={styles.errorMessage}>
              {formError}
            </Box>
          )}

          {/* Receipt Information */}

          <Typography className={styles.sectionTitle}>
            بيانات الوصل القديم
          </Typography>

          <Divider className={styles.sectionDivider} />

          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box className={styles.fieldGroup}>
                <FieldLabel required>رقم الوصل القديم</FieldLabel>

                <TextField
                  fullWidth
                  name="receiptNumber"
                  value={form.receiptNumber}
                  onChange={handleChange}
                  placeholder="أدخل رقم الوصل القديم"
                  className={styles.formField}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <NumbersIcon />
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              </Box>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <Box className={styles.fieldGroup}>
                <FieldLabel required>تاريخ الوصل</FieldLabel>

                <TextField
                  fullWidth
                  type="date"
                  name="receiptDate"
                  value={form.receiptDate}
                  onChange={handleChange}
                  className={styles.formField}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <CalendarMonthIcon />
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              </Box>
            </Grid>
          </Grid>

          {/* Customer Information */}

          <Typography className={styles.sectionTitle}>
            معلومات العميل
          </Typography>

          <Divider className={styles.sectionDivider} />

          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box className={styles.fieldGroup}>
                <FieldLabel required>اسم الزبون</FieldLabel>

                <TextField
                  fullWidth
                  name="customerName"
                  value={form.customerName}
                  onChange={handleChange}
                  placeholder="أدخل اسم الزبون"
                  className={styles.formField}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonIcon />
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              </Box>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <Box className={styles.fieldGroup}>
                <FieldLabel>رقم الهاتف</FieldLabel>

                <TextField
                  fullWidth
                  name="customerPhone"
                  value={form.customerPhone}
                  onChange={(event) => {
                    const digits = event.target.value.replace(/\D/g, "");

                    setForm((previous) => ({
                      ...previous,
                      customerPhone: digits,
                    }));

                    setFormError("");
                  }}
                  placeholder="أدخل رقم الهاتف"
                  className={styles.formField}
                  slotProps={{
                    htmlInput: {
                      inputMode: "numeric",
                      maxLength: 15,
                    },
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <PhoneIcon />
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              </Box>
            </Grid>
          </Grid>

          {/* Item Information */}

          <Typography className={styles.sectionTitle}>
            معلومات القطعة
          </Typography>

          <Divider className={styles.sectionDivider} />

          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box className={styles.fieldGroup}>
                <FieldLabel>نوع القطعة</FieldLabel>

                <TextField
                  fullWidth
                  name="itemType"
                  value={form.itemType}
                  onChange={handleChange}
                  placeholder="مثال: خاتم، سوار، سلسلة"
                  className={styles.formField}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <BuildIcon />
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              </Box>
            </Grid>

            <Grid size={{ xs: 12, sm: 3 }}>
              <Box className={styles.fieldGroup}>
                <FieldLabel>الوزن (غرام)</FieldLabel>

                <TextField
                  fullWidth
                  type="number"
                  name="weight"
                  value={form.weight}
                  onChange={handleChange}
                  placeholder="0.000"
                  className={styles.formField}
                  slotProps={{
                    htmlInput: {
                      min: 0,
                      step: "0.001",
                    },
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <ScaleIcon />
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              </Box>
            </Grid>

            <Grid size={{ xs: 12, sm: 3 }}>
              <Box className={styles.fieldGroup}>
                <FieldLabel>العيار</FieldLabel>

                <TextField
                  select
                  fullWidth
                  name="karat"
                  value={form.karat}
                  onChange={handleChange}
                  className={`${styles.formField} ${styles.formFieldSelect}`}
                  slotProps={{
                    select: {
                      displayEmpty: true,
                    },
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <DiamondIcon />
                        </InputAdornment>
                      ),
                    },
                  }}
                >
                  <MenuItem value="">
                    <em>— بدون تحديد —</em>
                  </MenuItem>

                  {KARAT_OPTIONS.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>
            </Grid>
          </Grid>

          {/* Repair Information */}

          <Typography className={styles.sectionTitle}>
            معلومات التصليح
          </Typography>

          <Divider className={styles.sectionDivider} />

          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box className={styles.fieldGroup}>
                <FieldLabel>أجور التصليح</FieldLabel>

                <TextField
                  fullWidth
                  type="number"
                  name="fees"
                  value={form.fees}
                  onChange={handleChange}
                  placeholder="0.00"
                  className={styles.formField}
                  slotProps={{
                    htmlInput: {
                      min: 0,
                      step: "0.01",
                    },
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <AttachMoneyIcon />
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              </Box>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <Box className={styles.fieldGroup}>
                <FieldLabel>حالة القطعة</FieldLabel>

                <TextField
                  select
                  fullWidth
                  name="status"
                  value={form.status}
                  onChange={handleStatusChange}
                  className={`${styles.formField} ${styles.formFieldSelect}`}
                >
                  <MenuItem value={1}>
                    جاهز لتسليم الزبون
                  </MenuItem>

                  <MenuItem value={2}>
                    تم تسليم الزبون
                  </MenuItem>
                </TextField>
              </Box>
            </Grid>
          </Grid>

          {/* Branch */}

          {isAdmin && (
            <>
              <Typography className={styles.sectionTitle}>
                معلومات الفرع
              </Typography>

              <Divider className={styles.sectionDivider} />

              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Box className={styles.fieldGroup}>
                    <FieldLabel required>الفرع</FieldLabel>

                    <TextField
                      select
                      fullWidth
                      name="branchId"
                      value={form.branchId}
                      onChange={handleChange}
                      disabled={branchesLoading}
                      className={`${styles.formField} ${styles.formFieldSelect}`}
                      slotProps={{
                        select: {
                          displayEmpty: true,
                        },
                        input: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <StorefrontIcon />
                            </InputAdornment>
                          ),
                        },
                      }}
                    >
                      <MenuItem value="">
                        <em>— اختر الفرع —</em>
                      </MenuItem>

                      {availableBranches.map((branch) => {
                        const branchId = branch.id ?? branch.Id;
                        const branchName = branch.name ?? branch.Name;
                        const branchCode = branch.code ?? branch.Code;

                        return (
                          <MenuItem key={branchId} value={branchId}>
                            {branchName}
                            {branchCode ? ` (${branchCode})` : ""}
                          </MenuItem>
                        );
                      })}

                      {availableBranches.length === 0 && (
                        <MenuItem value="__none__" disabled>
                          لا توجد فروع نشطة
                        </MenuItem>
                      )}
                    </TextField>
                  </Box>
                </Grid>
              </Grid>
            </>
          )}

          {/* Notes */}

          <Typography className={styles.sectionTitle}>
            ملاحظات عامة
          </Typography>

          <Divider className={styles.sectionDivider} />

          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid size={{ xs: 12 }}>
              <Box className={styles.fieldGroup}>
                <FieldLabel>ملاحظات</FieldLabel>

                <TextField
                  fullWidth
                  multiline
                  minRows={2}
                  maxRows={10}
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  placeholder="أدخل أي ملاحظات إضافية..."
                  className={`${styles.formField} ${styles.formFieldTextarea}`}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment
                          position="start"
                          sx={{ mt: 1.5 }}
                        >
                          <NotesIcon />
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              </Box>
            </Grid>
          </Grid>

          {/* Actions */}

          <Box className={styles.actions}>
            <Button
              variant="outlined"
              onClick={() =>
                navigate(
                  isEdit
                    ? `/old-maintenance-orders/${id}`
                    : "/old-maintenance-orders"
                )
              }
              disabled={isSaving}
              className={styles.cancelButton}
              startIcon={<CloseIcon />}
            >
              إلغاء
            </Button>

            <Button
              type="submit"
              variant="contained"
              disabled={isSaving || (isAdmin && branchesLoading)}
              className={styles.saveButton}
              startIcon={
                isSaving ? (
                  <CircularProgress size={17} sx={{ color: "#fff" }} />
                ) : (
                  <SaveIcon />
                )
              }
            >
              {isSaving
                ? "جاري الحفظ..."
                : isEdit
                  ? "حفظ التعديلات"
                  : "إضافة السجل"}
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Delivery Confirmation Dialog */}

      <Dialog
        open={deliveryDialogOpen}
        onClose={handleCancelDelivery}
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
            pt: 3,
          }}
        >
          تأكيد تسليم القطعة
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
                width: 76,
                height: 76,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#b8860b",
                backgroundColor: "rgba(184, 134, 11, 0.10)",
              }}
            >
              <LocalShippingIcon sx={{ fontSize: 42 }} />
            </Box>
          </Box>

          <DialogContentText
            sx={{
              textAlign: "center",
              fontFamily: "Cairo",
              fontSize: "0.95rem",
              lineHeight: 2,
              color: "text.primary",
            }}
          >
            هل أنت متأكد من تسليم القطعة للزبون؟
          </DialogContentText>

          <Box
            sx={{
              mt: 2,
              p: 1.5,
              borderRadius: 2,
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
                lineHeight: 1.8,
              }}
            >
              سيتم تسجيل حالة القطعة على أنها تم تسليمها للزبون.
              تأكد من إتمام عملية التسليم فعلياً قبل المتابعة.
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
            onClick={handleCancelDelivery}
            sx={{
              fontFamily: "Cairo",
              borderRadius: 2,
              minHeight: 43,
            }}
          >
            إلغاء
          </Button>

          <Button
            fullWidth
            variant="contained"
            onClick={handleConfirmDelivery}
            startIcon={<LocalShippingIcon />}
            sx={{
              fontFamily: "Cairo",
              fontWeight: 700,
              borderRadius: 2,
              minHeight: 43,
              backgroundColor: "#b8860b",
              "&:hover": {
                backgroundColor: "#8b6914",
              },
            }}
          >
            تأكيد التسليم
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OldMaintenanceOrderForm;
