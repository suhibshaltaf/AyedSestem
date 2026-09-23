import { useState, useMemo, useEffect } from "react";
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
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

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

import repairOrderSchema from "./repairOrderSchema.js";
import { useCreateRepairOrder } from "../../hooks/useRepairOrders.js";
import { useBranchLookup } from "../../hooks/useBranches.js";
import { useBranchEmployees } from "../../hooks/useBranchEmployees.js";
import useAuthStore from "../../store/useAuthStore.js";
import "../../styles/repairs.css";

const emptyForm = {
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

export default function CreateRepairOrder() {
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.user);

  const isAdmin = useMemo(() => {
    if (!currentUser?.roles) return false;
    const roleNames = currentUser.roles.map((r) => r.name);
    return roleNames.includes("SuperAdmin") || roleNames.includes("Admin");
  }, [currentUser]);

  const userBranchId = currentUser?.branchId;

  const { data: branches = [] } = useBranchLookup();

  const availableBranches = useMemo(() => {
    const activeBranches = branches.filter((b) => b.isActive !== false);
    return activeBranches;
  }, [branches]);

  const createMutation = useCreateRepairOrder();
  const saving = createMutation.isPending;

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    setValue,
  } = useForm({
    resolver: yupResolver(repairOrderSchema),
    defaultValues: emptyForm,
  });

  // موظفو الفرع الحالي (فرع الاستلام)
  const { data: employees = [] } = useBranchEmployees(userBranchId, {
    enabled: !!userBranchId,
  });

  // إذا المستخدم Branch — الفرع معبأ تلقائياً
  useEffect(() => {
    if (!isAdmin && userBranchId) {
      setValue("deliveryBranchId", userBranchId);
    }
  }, [isAdmin, userBranchId, setValue]);

  const onSubmit = async (data) => {
    const deliveryBranchId = Number(data.deliveryBranchId);
    const customerReceiverEmployeeId = Number(
      data.customerReceiverEmployeeId
    );

    if (!deliveryBranchId || deliveryBranchId === 0) {
      toast.error("الرجاء اختيار فرع التسليم");
      return;
    }

    if (
      !customerReceiverEmployeeId ||
      customerReceiverEmployeeId === 0
    ) {
      toast.error("الرجاء اختيار الموظف المستلم");
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
      price: data.price ? Number(data.price) : 0,
      notes: String(data.notes || "").trim(),
      operatorNotes: String(data.operatorNotes || "").trim(),
      deliveryBranchId: deliveryBranchId,
      customerReceiverEmployeeId: customerReceiverEmployeeId,
    };

    try {
      const result = await createMutation.mutateAsync(payload);

      // ✅ الـ API يرجّع { message, data }
      const orderId = result?.data?.id || result?.data?.Id;

      if (orderId) {
        navigate(`/repairs/${orderId}`);
      } else if (result?.data) {
        navigate("/repairs/list");
      } else {
        toast.error(result?.message || "فشل إنشاء التصليحة");
      }
    } catch (error) {
      console.error("Create Repair Error:", error);
    }
  };

  return (
    <div className="repairs-create-container">
      {/* Header */}
      <div className="repairs-create-header">
        <div className="repairs-create-header-icon">
          <ReceiptLongIcon sx={{ fontSize: 34 }} />
        </div>

        <Typography className="repairs-create-title">
          تصليحة جديدة
        </Typography>

        <Typography className="repairs-create-subtitle">
          إدخال بيانات القطعة والعميل
        </Typography>
      </div>

      <Paper elevation={0} className="repairs-create-card">
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          {/* معلومات العميل */}
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
                        <PersonIcon sx={{ color: "#c9a44c", fontSize: 20 }} />
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
                inputProps={{ inputMode: "numeric", maxLength: 15 }}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <PhoneIcon sx={{ color: "#c9a44c", fontSize: 20 }} />
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </Grid>
          </Grid>

          {/* معلومات القطعة */}
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
                        <ScaleIcon sx={{ color: "#c9a44c", fontSize: 20 }} />
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="العيار"
                margin="dense"
                {...register("karat")}
                error={!!errors.karat}
                helperText={errors.karat?.message}
                className="repairs-form-field"
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <DiamondIcon sx={{ color: "#c9a44c", fontSize: 20 }} />
                      </InputAdornment>
                    ),
                  },
                }}
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
                        <NumbersIcon sx={{ color: "#c9a44c", fontSize: 20 }} />
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </Grid>
          </Grid>

          {/* العمل المطلوب */}
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
                        <BuildIcon sx={{ color: "#c9a44c", fontSize: 20 }} />
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </Grid>

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
          </Grid>

          {/* ملاحظات */}
          <Typography className="repairs-section-title">ملاحظات</Typography>
          <Divider className="repairs-section-divider" />

          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="ملاحظات"
                margin="dense"
                multiline
                rows={2}
                {...register("notes")}
                className="repairs-form-field"
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
                className="repairs-form-field"
              />
            </Grid>
          </Grid>

          {/* التسليم */}
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
                    label="فرع التسليم"
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
                        لا يوجد موظفون في فرعك
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

          {/* Actions */}
          <div className="repairs-create-actions">
            <Button
              variant="outlined"
              onClick={() => navigate("/repairs/list")}
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
              {saving ? "جاري الحفظ..." : "إنشاء التصليحة"}
            </Button>
          </div>
        </form>
      </Paper>
    </div>
  );
}
