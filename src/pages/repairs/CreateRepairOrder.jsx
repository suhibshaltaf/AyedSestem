import { useMemo, useEffect, useState, useRef } from "react";
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
  IconButton,
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
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import DeleteIcon from "@mui/icons-material/Delete";

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
  canEditRepair,
} from "../../utils/repairConstants.js";
import repairOrderService from "../../services/repairOrderService.js";
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
// ✅ خيارات التوست المهم
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
// ✅ Schema خاص بالمشغل
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
// ✅ حدود الصور
// ===============================================
const MAX_IMAGES = 5;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

// ===============================================
// ✅ بناء FormData للإنشاء
// ===============================================
const buildCreateFormData = (data, imageFiles) => {
  const formData = new FormData();

  formData.append("CustomerName", String(data.customerName || "").trim());
  formData.append("CustomerPhone", String(data.customerPhone || "").trim());
  formData.append("Description", String(data.description || "").trim());
  formData.append("Weight", String(data.weight ? Number(data.weight) : 0));
  formData.append("Karat", String(data.karat || ""));
  formData.append("Quantity", String(data.quantity ? Number(data.quantity) : 1));
  formData.append("RequiredWork", String(data.requiredWork || "").trim());
  formData.append("Price", "0");
  formData.append("Notes", String(data.notes || "").trim());
  formData.append("OperatorNotes", "");
  formData.append("DeliveryBranchId", String(Number(data.deliveryBranchId)));
  formData.append(
    "CustomerReceiverEmployeeId",
    String(Number(data.customerReceiverEmployeeId))
  );

  if (imageFiles && imageFiles.length > 0) {
    imageFiles.forEach((file) => {
      formData.append("Images", file);
    });
  }

  return formData;
};

// ===============================================
// ✅ بناء FormData للتعديل
// ===============================================
const buildUpdateFormData = (
  fullPayload,
  imageFiles,
  deletedImageIds = []
) => {
  const formData = new FormData();

  formData.append("CustomerName", String(fullPayload.customerName || "").trim());
  formData.append(
    "CustomerPhone",
    String(fullPayload.customerPhone || "").trim()
  );
  formData.append("Description", String(fullPayload.description || "").trim());
  formData.append("Weight", String(fullPayload.weight || 0));
  formData.append("Karat", String(fullPayload.karat || ""));
  formData.append("Quantity", String(fullPayload.quantity || 1));
  formData.append("RequiredWork", String(fullPayload.requiredWork || "").trim());
  formData.append("Price", String(fullPayload.price || 0));
  formData.append("Notes", String(fullPayload.notes || "").trim());
  formData.append(
    "OperatorNotes",
    String(fullPayload.operatorNotes || "").trim()
  );
  formData.append("DeliveryBranchId", String(fullPayload.deliveryBranchId));
  formData.append(
    "CustomerReceiverEmployeeId",
    String(fullPayload.customerReceiverEmployeeId)
  );

  if (imageFiles && imageFiles.length > 0) {
    imageFiles.forEach((file) => {
      formData.append("Images", file);
    });
  }

  if (deletedImageIds && deletedImageIds.length > 0) {
    deletedImageIds.forEach((imageId) => {
      formData.append("DeletedImageIds", String(imageId));
    });
  }

  return formData;
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

  const schema = isOperatorForm ? operatorEditSchema : repairOrderSchema;
  const defaultValues = isOperatorForm ? operatorEmptyForm : branchEmptyForm;

  // ✅ state للصور المتعددة
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [deletedImageIds, setDeletedImageIds] = useState([]);
  const fileInputRef = useRef(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    setValue,
    reset,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues,
    mode: "onSubmit",
    shouldUnregister: true,
  });

  // ===============================================
  // ✅ تعبئة الفورم بالبيانات عند وصول existingOrder
  // ===============================================
  useEffect(() => {
    if (!isEditMode || !existingOrder) return;

    if (isOperatorForm) {
      reset({
        price:
          existingOrder.price !== null && existingOrder.price !== undefined
            ? String(existingOrder.price)
            : "",
        operatorNotes: existingOrder.operatorNotes || "",
      });
    } else {
      reset({
        customerName: existingOrder.customerName || "",
        customerPhone: existingOrder.customerPhone || "",
        description: existingOrder.description || "",
        weight:
          existingOrder.weight !== null && existingOrder.weight !== undefined
            ? String(existingOrder.weight)
            : "",
        karat: existingOrder.karat || "",
        quantity:
          existingOrder.quantity !== null && existingOrder.quantity !== undefined
            ? String(existingOrder.quantity)
            : "1",
        requiredWork: existingOrder.requiredWork || "",
        price:
          existingOrder.price !== null && existingOrder.price !== undefined
            ? String(existingOrder.price)
            : "",
        notes: existingOrder.notes || "",
        operatorNotes: existingOrder.operatorNotes || "",
        deliveryBranchId:
          existingOrder.deliveryBranchId !== null &&
          existingOrder.deliveryBranchId !== undefined
            ? Number(existingOrder.deliveryBranchId)
            : "",
        customerReceiverEmployeeId:
          existingOrder.customerReceiverEmployeeId !== null &&
          existingOrder.customerReceiverEmployeeId !== undefined
            ? Number(existingOrder.customerReceiverEmployeeId)
            : "",
      });
    }
  }, [isEditMode, existingOrder, isOperatorForm, reset]);

  // ===============================================
  // ✅ تحميل الصور الحالية في وضع التعديل
  // ===============================================
  useEffect(() => {
    if (isEditMode && existingOrder?.images) {
      const previews = existingOrder.images.map((img) => ({
        id: img.id,
        url: repairOrderService.getRepairImageUrl(img.fileName),
        isExisting: true,
        fileName: img.fileName,
      }));
      setImagePreviews(previews);
      setDeletedImageIds([]);
    }
  }, [isEditMode, existingOrder?.images]);

  /* ==========================================
   * ✅ معالجة اختيار الصور
   * ========================================== */
  const handleImagesChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const existingCount = imagePreviews.filter((p) => p.isExisting).length;
    const currentCount = imageFiles.length + existingCount;

    if (currentCount + files.length > MAX_IMAGES) {
      toast.error(`لا يمكن رفع أكثر من ${MAX_IMAGES} صور`, PERSISTENT_TOAST);
      return;
    }

    const validFiles = [];
    const newPreviews = [];

    for (const file of files) {
      if (file.size > MAX_IMAGE_SIZE) {
        toast.error(
          `حجم الصورة "${file.name}" يجب ألا يتجاوز 5 ميجابايت`,
          PERSISTENT_TOAST
        );
        continue;
      }

      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        toast.error(
          `الصورة "${file.name}" يجب أن تكون بصيغة JPG أو PNG أو WEBP`,
          PERSISTENT_TOAST
        );
        continue;
      }

      validFiles.push(file);
      newPreviews.push({
        file,
        url: URL.createObjectURL(file),
        isExisting: false,
      });
    }

    if (validFiles.length > 0) {
      setImageFiles((prev) => [...prev, ...validFiles]);
      setImagePreviews((prev) => [...prev, ...newPreviews]);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  /* ==========================================
   * ✅ إزالة صورة
   * ========================================== */
  const handleRemoveImage = (index) => {
    const preview = imagePreviews[index];

    if (preview.isExisting) {
      setDeletedImageIds((prev) => [...prev, preview.id]);
      setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    } else {
      setImageFiles((prev) => prev.filter((f) => f !== preview.file));
      URL.revokeObjectURL(preview.url);
      setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    }
  };

  /* ==========================================
   * ✅ تنظيف URLs عند unmount
   * ========================================== */
  useEffect(() => {
    return () => {
      imagePreviews.forEach((preview) => {
        if (!preview.isExisting && preview.url) {
          URL.revokeObjectURL(preview.url);
        }
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ==========================================
   * ✅ Submit
   * ========================================== */
  const onSubmit = async (data) => {
    try {
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

        const formData = buildUpdateFormData(
          fullPayload,
          imageFiles,
          deletedImageIds
        );

        await updateMutation.mutateAsync({
          id: editId,
          payload: formData,
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

      const formData = buildCreateFormData(data, imageFiles);

      const result = await createMutation.mutateAsync(formData);
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

  const showOperatorSection = isOperatorForm;
  const showBranchSections = !isEditMode || isBranchEditor;

  // ✅ لا نرسم الفورم حتى تجهز الـ lookups
  // (هذا يمنع مشكلة عدم ظهور القيم في Select)
  const lookupsReady =
    availableBranches.length >= 0 && // دائماً جاهز
    (!isBranchEditor || employees.length >= 0);

  if (!lookupsReady) {
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

              <Typography className="repairs-section-title">
                صور التصليح
              </Typography>

              <Divider className="repairs-section-divider" />

              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12}>
                  <Box className="repairs-images-upload-container">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      multiple
                      onChange={handleImagesChange}
                      style={{ display: "none" }}
                      id="repair-images-input-operator"
                    />

                    {imagePreviews.length > 0 && (
                      <Box className="repairs-images-grid">
                        {imagePreviews.map((preview, index) => (
                          <Box
                            key={preview.id || preview.url}
                            className="repairs-image-preview-wrapper"
                          >
                            <img
                              src={preview.url}
                              alt={`صورة ${index + 1}`}
                              className="repairs-image-preview"
                            />
                            <IconButton
                              className="repairs-image-remove-btn"
                              onClick={() => handleRemoveImage(index)}
                              size="small"
                              title="إزالة الصورة"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        ))}
                      </Box>
                    )}

                    {imagePreviews.length < MAX_IMAGES && (
                      <label
                        htmlFor="repair-images-input-operator"
                        className="repairs-image-upload-label"
                      >
                        <AddPhotoAlternateIcon
                          sx={{ fontSize: 40, color: "#c9a44c" }}
                        />
                        <Typography className="repairs-image-upload-text">
                          إضافة صور ({imagePreviews.length}/{MAX_IMAGES})
                        </Typography>
                        <Typography className="repairs-image-upload-hint">
                          JPG, PNG, WEBP — بحد أقصى 5MB لكل صورة
                        </Typography>
                      </label>
                    )}
                  </Box>
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

                <Grid item xs={12} sm={4}>
                  <Controller
                    name="karat"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value)}
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
                صور التصليح
              </Typography>

              <Divider className="repairs-section-divider" />

              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12}>
                  <Box className="repairs-images-upload-container">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      multiple
                      onChange={handleImagesChange}
                      style={{ display: "none" }}
                      id="repair-images-input"
                    />

                    {imagePreviews.length > 0 && (
                      <Box className="repairs-images-grid">
                        {imagePreviews.map((preview, index) => (
                          <Box
                            key={preview.id || preview.url}
                            className="repairs-image-preview-wrapper"
                          >
                            <img
                              src={preview.url}
                              alt={`صورة ${index + 1}`}
                              className="repairs-image-preview"
                            />
                            <IconButton
                              className="repairs-image-remove-btn"
                              onClick={() => handleRemoveImage(index)}
                              size="small"
                              title="إزالة الصورة"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        ))}
                      </Box>
                    )}

                    {imagePreviews.length < MAX_IMAGES && (
                      <label
                        htmlFor="repair-images-input"
                        className="repairs-image-upload-label"
                      >
                        <AddPhotoAlternateIcon
                          sx={{ fontSize: 40, color: "#c9a44c" }}
                        />
                        <Typography className="repairs-image-upload-text">
                          إضافة صور ({imagePreviews.length}/{MAX_IMAGES})
                        </Typography>
                        <Typography className="repairs-image-upload-hint">
                          JPG, PNG, WEBP — بحد أقصى 5MB لكل صورة
                        </Typography>
                      </label>
                    )}
                  </Box>
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

              <Typography className="repairs-section-title">ملاحظات</Typography>

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
                        value={
                          field.value === undefined || field.value === null
                            ? ""
                            : field.value
                        }
                        onChange={(e) => field.onChange(e.target.value)}
                        fullWidth
                        select
                        label="فرع التسليم للعميل"
                        margin="dense"
                        error={!!errors.deliveryBranchId}
                        helperText={errors.deliveryBranchId?.message}
                        className="repairs-form-field"
                      >
                        <MenuItem value="" disabled>
                          — اختر فرعاً —
                        </MenuItem>
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
                        value={
                          field.value === undefined || field.value === null
                            ? ""
                            : field.value
                        }
                        onChange={(e) => field.onChange(e.target.value)}
                        fullWidth
                        select
                        label="الموظف المستلم من العميل"
                        margin="dense"
                        error={!!errors.customerReceiverEmployeeId}
                        helperText={errors.customerReceiverEmployeeId?.message}
                        className="repairs-form-field"
                      >
                        <MenuItem value="" disabled>
                          — اختر موظفاً —
                        </MenuItem>
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

  const { data: branches = [] } = useBranchLookup();

  const availableBranches = useMemo(() => {
    return branches.filter((b) => b.isActive !== false);
  }, [branches]);

  const createMutation = useCreateRepairOrder();
  const updateMutation = useUpdateRepairOrder();

  const { data: existingOrder, isLoading: loadingOrder } = useRepairOrderById(
    editId,
    { enabled: isEditMode }
  );

  const isBranchEditor = useMemo(
    () => canEditAsBranch(userRoles),
    [userRoles]
  );

  const isOperatorEditor = useMemo(
    () => canEditAsOperator(userRoles, existingOrder?.status),
    [userRoles, existingOrder?.status]
  );

  const isOperatorForm = isEditMode && isOperatorEditor;

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

  const { data: employees = [] } = useBranchEmployees(userBranchId, {
    enabled: !!userBranchId,
  });

  // ✅ لا نرسم الفورم حتى يصل existingOrder في وضع التعديل
  if (isEditMode && (loadingOrder || !existingOrder)) {
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

  // ✅ key ثابت = editId فقط (بدون isOperatorForm)
  return (
    <RepairFormInner
      key={editId || "new"}
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