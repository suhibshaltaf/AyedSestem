import { useMemo, useEffect } from "react";
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
} from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import * as yup from "yup";

import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import SaveIcon from "@mui/icons-material/Save";
import CloseIcon from "@mui/icons-material/Close";
import PersonIcon from "@mui/icons-material/Person";
import PhoneIcon from "@mui/icons-material/Phone";
import ScaleIcon from "@mui/icons-material/Scale";
import DiamondIcon from "@mui/icons-material/Diamond";
import NumbersIcon from "@mui/icons-material/Numbers";
import BuildIcon from "@mui/icons-material/Build";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import NotesIcon from "@mui/icons-material/Notes";

import repairOrderSchema from "./repairOrderSchema.js";
import {
  useCreateRepairOrder,
  useUpdateRepairOrder,
  useRepairOrderById,
} from "../../hooks/useRepairOrders.js";
import { useBranchLookup } from "../../hooks/useBranches.js";
import { useBranchEmployees } from "../../hooks/useBranchEmployees.js";
import useAuthStore from "../../store/useAuthStore.js";
import {
  canEditAsBranch,
  canEditAsOperator,
  getEditableFields,
  canEditRepair,
} from "../../utils/repairConstants.js";
import "../../styles/repairs.css";

// ===============================================
// ✅ خيارات العيار
// ===============================================
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

// ===============================================
// ✅ خيارات التوست المهم (تبقى حتى يسكّرها المستخدم)
// ===============================================
const PERSISTENT_TOAST = {
  containerId: "persistent",
  position: "top-center",
  autoClose: false,
  closeOnClick: true,
  closeButton: true,
  pauseOnHover: true,
  draggable: false,
};

// ===============================================
// ✅ Schema خاص بالمشغل — فقط price و operatorNotes
// ===============================================
const operatorEditSchema = yup.object({
  price: yup
    .number()
    .typeError("السعر يجب أن يكون رقماً")
    .min(0, "السعر لا يمكن أن يكون سالباً")
    .required("السعر مطلوب"),
  operatorNotes: yup
    .string()
    .trim()
    .max(1000, "ملاحظات المشغل يجب ألا تتجاوز 1000 حرف"),
});

// ===============================================
// ✅ defaultValues
// ===============================================
const branchEmptyForm = {
  customerName: "",
  customerPhone: "",
  description: "",
  weight: "",
  karat: "",
  quantity: "1",
  requiredWork: "",
  price: "",
  notes: "",
  operatorNotes: "",
  deliveryBranchId: "",
  customerReceiverEmployeeId: "",
};

const operatorEmptyForm = {
  price: "",
  operatorNotes: "",
};

// ===============================================
// ✅ كومبوننت فرعي للفورم
// ===============================================
function RepairFormInner({
  isEditMode,
  editId,
  existingOrder,
  isOperatorForm,
  isBranchEditor,
  userBranchId,
  availableBranches,
  employees,
  createMutation,
  updateMutation,
  navigate,
}) {
  const saving = createMutation.isPending || updateMutation.isPending;

  // ✅ Schema و defaultValues حسب الدور
  const schema = isOperatorForm ? operatorEditSchema : repairOrderSchema;
  const defaultValues = isOperatorForm ? operatorEmptyForm : branchEmptyForm;

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    setValue,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues,
    mode: "onSubmit",
    shouldUnregister: true,
  });

  /* ==========================================
   * ✅ Submit
   * ========================================== */
  const onSubmit = async (data) => {
    try {
      // ✅ وضع التعديل
      if (isEditMode) {
        const fullPayload = {
          customerName: existingOrder?.customerName || "",
          customerPhone: existingOrder?.customerPhone || "",
          description: existingOrder?.description || "",
          weight: existingOrder?.weight || 0,
          karat: existingOrder?.karat || "",
          quantity: existingOrder?.quantity || 1,
          requiredWork: existingOrder?.requiredWork || "",
          price: existingOrder?.price || 0,
          notes: existingOrder?.notes || "",
          operatorNotes: existingOrder?.operatorNotes || "",
          deliveryBranchId: existingOrder?.deliveryBranchId,
          customerReceiverEmployeeId:
            existingOrder?.customerReceiverEmployeeId,
        };

        // ✅ طبّق التعديلات الجديدة (حسب الدور)
        if (isOperatorForm) {
          fullPayload.price = data.price ? Number(data.price) : 0;
          fullPayload.operatorNotes = String(data.operatorNotes || "").trim();
        } else {
          fullPayload.customerName = String(data.customerName || "").trim();
          fullPayload.customerPhone = String(data.customerPhone || "").trim();
          fullPayload.description = String(data.description || "").trim();
          fullPayload.weight = data.weight ? Number(data.weight) : 0;
          fullPayload.karat = String(data.karat || "").trim();
          fullPayload.quantity = data.quantity ? Number(data.quantity) : 1;
          fullPayload.requiredWork = String(data.requiredWork || "").trim();
          fullPayload.notes = String(data.notes || "").trim();
          fullPayload.deliveryBranchId = Number(data.deliveryBranchId);
          fullPayload.customerReceiverEmployeeId = Number(
            data.customerReceiverEmployeeId
          );
        }

        await updateMutation.mutateAsync({
          id: editId,
          payload: fullPayload,
        });
        navigate(`/repairs/${editId}`);
        return;
      }

      // ✅ وضع الإنشاء
      const deliveryBranchId = Number(data.deliveryBranchId);
      const customerReceiverEmployeeId = Number(
        data.customerReceiverEmployeeId
      );

      if (!deliveryBranchId || deliveryBranchId === 0) {
        toast.error("الرجاء اختيار فرع التسليم", PERSISTENT_TOAST);
        return;
      }

      if (!customerReceiverEmployeeId || customerReceiverEmployeeId === 0) {
        toast.error("الرجاء اختيار الموظف المستلم", PERSISTENT_TOAST);
        return;
      }

      const payload = {
        customerName: String(data.customerName || "").trim(),
        customerPhone: String(data.customerPhone || "").trim(),
        description: String(data.description || "").trim(),
        weight: data.weight ? Number(data.weight) : 0,
        karat: String(data.karat || ""),
        quantity: data.quantity ? Number(data.quantity) : 1,
        requiredWork: String(data.requiredWork || "").trim(),
        price: 0,
        notes: String(data.notes || "").trim(),
        operatorNotes: "",
        deliveryBranchId,
        customerReceiverEmployeeId,
      };

      const result = await createMutation.mutateAsync(payload);
      const orderId = result?.data?.id || result?.data?.Id;

      if (orderId) {
        navigate(`/repairs/${orderId}`);
      } else if (result?.data) {
        navigate("/repairs/list");
      } else {
        toast.error(result?.message || "فشل إنشاء التصليحة", PERSISTENT_TOAST);
      }
    } catch (error) {
      console.error("Repair Order Submit Error:", error);
    }
  };

  /* ==========================================
   * ✅ الأقسام
   * ========================================== */
  const showOperatorSection = isOperatorForm;
  const showBranchSections = !isEditMode || isBranchEditor;

  return (
    <Box className="repairs-create-container">
      {/* Header */}
      <Box className="repairs-create-header">
        <Box className="repairs-create-header-icon">
          <ReceiptLongIcon sx={{ fontSize: 34 }} />
        </Box>

        <Typography className="repairs-create-title">
          {isEditMode
            ? isOperatorForm
              ? "تعديل بيانات المشغل"
              : "تعديل التصليحة"
            : "تصليحة جديدة"}
        </Typography>

        <Typography className="repairs-create-subtitle">
          {isEditMode
            ? isOperatorForm
              ? "إدخال السعر وملاحظات المشغل"
              : "تعديل بيانات القطعة والعميل"
            : "إدخال بيانات القطعة والعميل"}
        </Typography>
      </Box>

      {/* Form Card */}
      <Paper elevation={0} className="repairs-create-card">
        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
          {/* قسم المشغل */}
          {showOperatorSection && (
            <>
              <Typography className="repairs-section-title">
                بيانات المشغل
              </Typography>

              <Divider className="repairs-section-divider" />

              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="السعر"
                    margin="dense"
                    type="number"
                    {...register("price")}
                    error={!!errors.price}
                    helperText={errors.price?.message}
                    className="repairs-form-field"
                    inputProps={{ step: "0.01", min: 0 }}
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <AttachMoneyIcon
                              sx={{ color: "#c9a44c", fontSize: 20 }}
                            />
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="ملاحظات المشغل"
                    margin="dense"
                    multiline
                    rows={2}
                    {...register("operatorNotes")}
                    error={!!errors.operatorNotes}
                    helperText={errors.operatorNotes?.message}
                    className="repairs-form-field"
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment
                            position="start"
                            sx={{ alignSelf: "flex-start", mt: 1.5 }}
                          >
                            <NotesIcon
                              sx={{ color: "#c9a44c", fontSize: 20 }}
                            />
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                </Grid>
              </Grid>
            </>
          )}

          {/* معلومات العميل والقطعة والعمل */}
          {showBranchSections && (
            <>
              <Typography className="repairs-section-title">
                معلومات العميل
              </Typography>

              <Divider className="repairs-section-divider" />

              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="اسم العميل"
                    margin="dense"
                    {...register("customerName")}
                    error={!!errors.customerName}
                    helperText={errors.customerName?.message}
                    className="repairs-form-field"
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <PersonIcon
                              sx={{ color: "#c9a44c", fontSize: 20 }}
                            />
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="رقم الهاتف"
                    margin="dense"
                    {...register("customerPhone", {
                      onChange: (e) => {
                        const digits = e.target.value.replace(/\D/g, "");
                        setValue("customerPhone", digits, {
                          shouldValidate: false,
                          shouldDirty: true,
                        });
                      },
                    })}
                    error={!!errors.customerPhone}
                    helperText={errors.customerPhone?.message}
                    className="repairs-form-field"
                    inputProps={{
                      inputMode: "numeric",
                      maxLength: 15,
                    }}
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <PhoneIcon
                              sx={{ color: "#c9a44c", fontSize: 20 }}
                            />
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                </Grid>
              </Grid>

              <Typography className="repairs-section-title">
                معلومات القطعة
              </Typography>

              <Divider className="repairs-section-divider" />

              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="وصف القطعة"
                    margin="dense"
                    multiline
                    rows={2}
                    {...register("description")}
                    error={!!errors.description}
                    helperText={errors.description?.message}
                    className="repairs-form-field"
                  />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="الوزن (غرام)"
                    margin="dense"
                    type="number"
                    {...register("weight")}
                    error={!!errors.weight}
                    helperText={errors.weight?.message}
                    className="repairs-form-field"
                    inputProps={{ step: "0.001", min: 0 }}
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <ScaleIcon
                              sx={{ color: "#c9a44c", fontSize: 20 }}
                            />
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                </Grid>

                {/* ✅ العيار — قائمة منسدلة */}
                <Grid item xs={12} sm={4}>
                  <Controller
                    name="karat"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        select
                        label="العيار"
                        margin="dense"
                        error={!!errors.karat}
                        helperText={errors.karat?.message}
                        className="repairs-form-field"
                        slotProps={{
                          input: {
                            startAdornment: (
                              <InputAdornment position="start">
                                <DiamondIcon
                                  sx={{ color: "#c9a44c", fontSize: 20 }}
                                />
                              </InputAdornment>
                            ),
                          },
                        }}
                      >
                        {KARAT_OPTIONS.map((option) => (
                          <MenuItem key={option} value={option}>
                            {option}
                          </MenuItem>
                        ))}
                      </TextField>
                    )}
                  />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="العدد"
                    margin="dense"
                    type="number"
                    {...register("quantity")}
                    error={!!errors.quantity}
                    helperText={errors.quantity?.message}
                    className="repairs-form-field"
                    inputProps={{ min: 1 }}
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <NumbersIcon
                              sx={{ color: "#c9a44c", fontSize: 20 }}
                            />
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                </Grid>
              </Grid>

              <Typography className="repairs-section-title">
                العمل المطلوب
              </Typography>

              <Divider className="repairs-section-divider" />

              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="العمل المطلوب"
                    margin="dense"
                    multiline
                    rows={2}
                    {...register("requiredWork")}
                    error={!!errors.requiredWork}
                    helperText={errors.requiredWork?.message}
                    className="repairs-form-field"
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment
                            position="start"
                            sx={{ alignSelf: "flex-start", mt: 1.5 }}
                          >
                            <BuildIcon
                              sx={{ color: "#c9a44c", fontSize: 20 }}
                            />
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                </Grid>
              </Grid>

              <Typography className="repairs-section-title">
                ملاحظات
              </Typography>

              <Divider className="repairs-section-divider" />

              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="ملاحظات عامة"
                    margin="dense"
                    multiline
                    rows={2}
                    {...register("notes")}
                    error={!!errors.notes}
                    helperText={errors.notes?.message}
                    className="repairs-form-field"
                  />
                </Grid>
              </Grid>

              <Typography className="repairs-section-title">
                الاستلام والتسليم
              </Typography>

              <Divider className="repairs-section-divider" />

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Controller
                    name="deliveryBranchId"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        select
                        label="فرع التسليم للعميل"
                        margin="dense"
                        error={!!errors.deliveryBranchId}
                        helperText={errors.deliveryBranchId?.message}
                        className="repairs-form-field"
                      >
                        {availableBranches.length === 0 ? (
                          <MenuItem value="" disabled>
                            لا توجد فروع نشطة متاحة
                          </MenuItem>
                        ) : (
                          availableBranches.map((b) => (
                            <MenuItem key={b.id} value={b.id}>
                              {b.name} {b.code ? `(${b.code})` : ""}
                            </MenuItem>
                          ))
                        )}
                      </TextField>
                    )}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Controller
                    name="customerReceiverEmployeeId"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        select
                        label="الموظف المستلم من العميل"
                        margin="dense"
                        error={!!errors.customerReceiverEmployeeId}
                        helperText={errors.customerReceiverEmployeeId?.message}
                        className="repairs-form-field"
                      >
                        {!userBranchId ? (
                          <MenuItem value="" disabled>
                            أنت غير مرتبط بفرع
                          </MenuItem>
                        ) : employees.length === 0 ? (
                          <MenuItem value="" disabled>
                            لا يوجد موظفون نشطون في فرعك
                          </MenuItem>
                        ) : (
                          employees.map((emp) => (
                            <MenuItem key={emp.id} value={emp.id}>
                              {emp.fullName}
                            </MenuItem>
                          ))
                        )}
                      </TextField>
                    )}
                  />
                </Grid>
              </Grid>
            </>
          )}

          {/* Actions */}
          <Box className="repairs-create-actions">
            <Button
              variant="outlined"
              onClick={() =>
                navigate(isEditMode ? `/repairs/${editId}` : "/repairs/list")
              }
              disabled={saving}
              className="repairs-create-cancel"
              startIcon={<CloseIcon />}
            >
              إلغاء
            </Button>

            <Button
              type="submit"
              variant="contained"
              disabled={saving}
              className="repairs-create-save"
              startIcon={
                saving ? (
                  <CircularProgress size={16} sx={{ color: "#fff" }} />
                ) : (
                  <SaveIcon />
                )
              }
            >
              {saving
                ? "جاري الحفظ..."
                : isEditMode
                ? "حفظ التعديلات"
                : "إنشاء التصليحة"}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}

// ===============================================
// ✅ الكومبوننت الرئيسي
// ===============================================
export default function CreateRepairOrder() {
  const navigate = useNavigate();
  const { id: editId } = useParams();
  const isEditMode = !!editId;

  const currentUser = useAuthStore((state) => state.user);

  const userRoles = useMemo(
    () => currentUser?.roles?.map((r) => r.name) || [],
    [currentUser]
  );

  const userBranchId = currentUser?.branchId;

  /* ==========================================
   * الفروع
   * ========================================== */
  const { data: branches = [] } = useBranchLookup();

  const availableBranches = useMemo(() => {
    return branches.filter((b) => b.isActive !== false);
  }, [branches]);

  /* ==========================================
   * الميوتيشن
   * ========================================== */
  const createMutation = useCreateRepairOrder();
  const updateMutation = useUpdateRepairOrder();

  /* ==========================================
   * جلب بيانات التصليحة
   * ========================================== */
  const { data: existingOrder, isLoading: loadingOrder } = useRepairOrderById(
    editId,
    { enabled: isEditMode }
  );

  /* ==========================================
   * ✅ الأدوار والصلاحيات
   * ========================================== */
  const isBranchEditor = useMemo(
    () => canEditAsBranch(userRoles),
    [userRoles]
  );

  const isOperatorEditor = useMemo(
    () => canEditAsOperator(userRoles, existingOrder?.status),
    [userRoles, existingOrder?.status]
  );

  const isOperatorForm = isEditMode && isOperatorEditor;

  /* ==========================================
   * ✅ التحقق من الصلاحية
   * ========================================== */
  useEffect(() => {
    if (!isEditMode || !existingOrder) return;

    const allowed = canEditRepair(
      userRoles,
      existingOrder.status,
      existingOrder.movements || []
    );

    if (!allowed) {
      toast.error("لا تملك صلاحية تعديل هذه التصليحة في حالتها الحالية", {
        ...PERSISTENT_TOAST,
        toastId: "edit-not-allowed",
      });
      navigate(`/repairs/${editId}`, { replace: true });
    }
  }, [isEditMode, existingOrder, userRoles, navigate, editId]);

  /* ==========================================
   * موظفو الفرع
   * ========================================== */
  const { data: employees = [] } = useBranchEmployees(userBranchId, {
    enabled: !!userBranchId,
  });

  /* ==========================================
   * شاشة التحميل
   * ========================================== */
  if (isEditMode && loadingOrder) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "60vh",
        }}
      >
        <CircularProgress sx={{ color: "#b8860b" }} />
      </Box>
    );
  }

  /* ==========================================
   * ✅ الحل: key ديناميكي
   * ========================================== */
  return (
    <RepairFormInner
      key={isOperatorForm ? `operator-${editId}` : `branch-${editId || "new"}`}
      isEditMode={isEditMode}
      editId={editId}
      existingOrder={existingOrder}
      isOperatorForm={isOperatorForm}
      isBranchEditor={isBranchEditor}
      userBranchId={userBranchId}
      availableBranches={availableBranches}
      employees={employees}
      createMutation={createMutation}
      updateMutation={updateMutation}
      navigate={navigate}
    />
  );
}