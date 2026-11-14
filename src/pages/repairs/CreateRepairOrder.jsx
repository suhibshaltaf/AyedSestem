
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
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import DeleteIcon from "@mui/icons-material/Delete";
import StorefrontIcon from "@mui/icons-material/Storefront";

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

import style from "../../styles/Repairs/CreateRepairOrder.module.css";

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
   Schemas
   ===================================================== */

const operatorEditSchema = yup.object({
  price: yup
    .number()
    .typeError("السعر يجب أن يكون رقماً")
    .min(0, "السعر لا يمكن أن يكون سالباً")
    .required("السعر مطلوب"),

  operatorNotes: yup
    .string()
    .trim()
    .max(1000, "ملاحظات المشغل يجب ألا تتجاوز 1000 حرف")
    .notRequired(),
});

const repairOrderEditSchema = yup.object({
  customerName: yup.string().trim().required("اسم العميل مطلوب"),
  customerPhone: yup.string().trim().required("رقم الهاتف مطلوب"),
  description: yup.string().trim().required("وصف القطعة مطلوب"),

  weight: yup
    .number()
    .typeError("الوزن يجب أن يكون رقماً")
    .min(0, "الوزن لا يمكن أن يكون سالباً")
    .required("الوزن مطلوب"),

  karat: yup.string().nullable().notRequired(),

  quantity: yup
    .number()
    .typeError("العدد يجب أن يكون رقماً")
    .min(1, "العدد يجب أن يكون 1 على الأقل")
    .required("العدد مطلوب"),

  requiredWork: yup.string().trim().required("العمل المطلوب مطلوب"),

  price: yup
    .number()
    .typeError("السعر يجب أن يكون رقماً")
    .min(0, "السعر لا يمكن أن يكون سالباً")
    .required("السعر مطلوب"),

  notes: yup.string().trim().notRequired(),

  operatorNotes: yup
    .string()
    .trim()
    .max(1000, "ملاحظات المشغل يجب ألا تتجاوز 1000 حرف")
    .notRequired(),

  deliveryBranchId: yup.mixed().nullable().notRequired(),
  customerReceiverEmployeeId: yup.mixed().nullable().notRequired(),
});

/* =====================================================
   Empty forms
   ===================================================== */

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

/* =====================================================
   Images
   ===================================================== */

const MAX_IMAGES = 5;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

/* =====================================================
   FormData builders
   ===================================================== */

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

  formData.append(
    "DeliveryBranchId",
    String(Number(data.deliveryBranchId))
  );

  formData.append(
    "CustomerReceiverEmployeeId",
    String(Number(data.customerReceiverEmployeeId))
  );

  if (imageFiles && imageFiles.length > 0) {
    imageFiles.forEach((file) => formData.append("Images", file));
  }

  return formData;
};

const buildUpdateFormData = (
  fullPayload,
  imageFiles,
  deletedImageIds = []
) => {
  const formData = new FormData();

  formData.append("CustomerName", String(fullPayload.customerName || "").trim());
  formData.append("CustomerPhone", String(fullPayload.customerPhone || "").trim());
  formData.append("Description", String(fullPayload.description || "").trim());
  formData.append("Weight", String(fullPayload.weight ?? 0));
  formData.append("Karat", String(fullPayload.karat ?? "").trim());
  formData.append("Quantity", String(fullPayload.quantity ?? 1));
  formData.append("RequiredWork", String(fullPayload.requiredWork || "").trim());
  formData.append("Price", String(fullPayload.price ?? 0));
  formData.append("Notes", String(fullPayload.notes || "").trim());
  formData.append("OperatorNotes", String(fullPayload.operatorNotes || "").trim());

  if (
    fullPayload.deliveryBranchId !== null &&
    fullPayload.deliveryBranchId !== undefined &&
    fullPayload.deliveryBranchId !== ""
  ) {
    formData.append(
      "DeliveryBranchId",
      String(fullPayload.deliveryBranchId)
    );
  }

  if (
    fullPayload.customerReceiverEmployeeId !== null &&
    fullPayload.customerReceiverEmployeeId !== undefined &&
    fullPayload.customerReceiverEmployeeId !== ""
  ) {
    formData.append(
      "CustomerReceiverEmployeeId",
      String(fullPayload.customerReceiverEmployeeId)
    );
  }

  if (imageFiles && imageFiles.length > 0) {
    imageFiles.forEach((file) => formData.append("Images", file));
  }

  if (deletedImageIds && deletedImageIds.length > 0) {
    deletedImageIds.forEach((imageId) =>
      formData.append("DeletedImageIds", String(imageId))
    );
  }

  return formData;
};

/* =====================================================
   Inner Form
   ===================================================== */

function RepairFormInner({
  isEditMode,
  editId,
  existingOrder,
  isOperatorForm,
  isBranchEditor,
  employeeBranchId,
  availableBranches,
  employees,
  employeesLoading,
  createMutation,
  updateMutation,
  navigate,
}) {
  const saving = createMutation.isPending || updateMutation.isPending;

  const schema = isOperatorForm
    ? operatorEditSchema
    : isEditMode
      ? repairOrderEditSchema
      : repairOrderSchema;

  const defaultValues = isOperatorForm
    ? operatorEmptyForm
    : {
        ...branchEmptyForm,
        deliveryBranchId: employeeBranchId
          ? Number(employeeBranchId)
          : "",
      };

  /* ---------- images ---------- */

  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [deletedImageIds, setDeletedImageIds] = useState([]);

  const fileInputRef = useRef(null);
  const previewsRef = useRef(imagePreviews);

  useEffect(() => {
    previewsRef.current = imagePreviews;
  }, [imagePreviews]);

  /* ---------- RHF ---------- */

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
  });

  /* ---------- default delivery branch ---------- */

  useEffect(() => {
    if (isEditMode || isOperatorForm || !employeeBranchId) return;

    setValue("deliveryBranchId", Number(employeeBranchId), {
      shouldValidate: false,
      shouldDirty: false,
    });
  }, [isEditMode, isOperatorForm, employeeBranchId, setValue]);

  /* ---------- hydrate on edit ---------- */

  useEffect(() => {
    if (!isEditMode || !existingOrder) return;

    if (isOperatorForm) {
      reset({
        price:
          existingOrder.price !== null &&
          existingOrder.price !== undefined
            ? String(existingOrder.price)
            : "",

        operatorNotes: existingOrder.operatorNotes || "",
      });

      return;
    }

    reset({
      customerName: existingOrder.customerName || "",
      customerPhone: existingOrder.customerPhone || "",
      description: existingOrder.description || "",

      weight:
        existingOrder.weight !== null &&
        existingOrder.weight !== undefined
          ? String(existingOrder.weight)
          : "",

      karat:
        existingOrder.karat !== null &&
        existingOrder.karat !== undefined
          ? String(existingOrder.karat)
          : "",

      quantity:
        existingOrder.quantity !== null &&
        existingOrder.quantity !== undefined
          ? String(existingOrder.quantity)
          : "1",

      requiredWork: existingOrder.requiredWork || "",

      price:
        existingOrder.price !== null &&
        existingOrder.price !== undefined
          ? String(existingOrder.price)
          : "",

      notes: existingOrder.notes || "",
      operatorNotes: existingOrder.operatorNotes || "",

      deliveryBranchId:
        existingOrder.deliveryBranchId !== null &&
        existingOrder.deliveryBranchId !== undefined
          ? Number(existingOrder.deliveryBranchId)
          : employeeBranchId
            ? Number(employeeBranchId)
            : "",

      customerReceiverEmployeeId:
        existingOrder.customerReceiverEmployeeId !== null &&
        existingOrder.customerReceiverEmployeeId !== undefined
          ? Number(existingOrder.customerReceiverEmployeeId)
          : "",
    });
  }, [
    isEditMode,
    existingOrder,
    isOperatorForm,
    employeeBranchId,
    reset,
  ]);

  /* ---------- hydrate existing images ---------- */

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

  /* ---------- cleanup on unmount ---------- */

  useEffect(() => {
    return () => {
      previewsRef.current.forEach((preview) => {
        if (!preview.isExisting && preview.url) {
          URL.revokeObjectURL(preview.url);
        }
      });
    };
  }, []);

  /* ---------- image handlers ---------- */

  const handleImagesChange = (e) => {
    const files = Array.from(e.target.files || []);

    if (files.length === 0) return;

    const existingCount = imagePreviews.filter(
      (p) => p.isExisting
    ).length;

    const currentCount = imageFiles.length + existingCount;

    if (currentCount + files.length > MAX_IMAGES) {
      toast.error(
        `لا يمكن رفع أكثر من ${MAX_IMAGES} صور`,
        PERSISTENT_TOAST
      );

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

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

  const handleRemoveImage = (index) => {
    const preview = imagePreviews[index];

    if (!preview) return;

    if (preview.isExisting) {
      setDeletedImageIds((prev) => [...prev, preview.id]);
    } else {
      setImageFiles((prev) =>
        prev.filter((f) => f !== preview.file)
      );

      URL.revokeObjectURL(preview.url);
    }

    setImagePreviews((prev) =>
      prev.filter((_, i) => i !== index)
    );
  };

  /* ---------- submit ---------- */

  const onSubmit = async (data) => {
    try {
      /* ========== EDIT ========== */

      if (isEditMode) {
        const fullPayload = {
          customerName: existingOrder?.customerName || "",
          customerPhone: existingOrder?.customerPhone || "",
          description: existingOrder?.description || "",
          weight: existingOrder?.weight ?? 0,
          karat: existingOrder?.karat ?? "",
          quantity: existingOrder?.quantity ?? 1,
          requiredWork: existingOrder?.requiredWork || "",
          price: existingOrder?.price ?? 0,
          notes: existingOrder?.notes || "",
          operatorNotes: existingOrder?.operatorNotes || "",
          deliveryBranchId: existingOrder?.deliveryBranchId ?? "",
          customerReceiverEmployeeId:
            existingOrder?.customerReceiverEmployeeId ?? "",
        };

        if (isOperatorForm) {
          fullPayload.price =
            data.price !== undefined &&
            data.price !== null &&
            data.price !== ""
              ? Number(data.price)
              : existingOrder?.price ?? 0;

          fullPayload.operatorNotes = String(
            data.operatorNotes || ""
          ).trim();
        } else {
          if (data.customerName !== undefined) {
            fullPayload.customerName = String(
              data.customerName || ""
            ).trim();
          }

          if (data.customerPhone !== undefined) {
            fullPayload.customerPhone = String(
              data.customerPhone || ""
            ).trim();
          }

          if (data.description !== undefined) {
            fullPayload.description = String(
              data.description || ""
            ).trim();
          }

          if (
            data.weight !== undefined &&
            data.weight !== null &&
            data.weight !== ""
          ) {
            fullPayload.weight = Number(data.weight);
          }

          if (
            data.karat !== undefined &&
            data.karat !== null &&
            data.karat !== ""
          ) {
            fullPayload.karat = String(data.karat).trim();
          }

          if (
            data.quantity !== undefined &&
            data.quantity !== null &&
            data.quantity !== ""
          ) {
            fullPayload.quantity = Number(data.quantity);
          }

          if (data.requiredWork !== undefined) {
            fullPayload.requiredWork = String(
              data.requiredWork || ""
            ).trim();
          }

          if (data.notes !== undefined) {
            fullPayload.notes = String(data.notes || "").trim();
          }

          if (
            data.deliveryBranchId !== undefined &&
            data.deliveryBranchId !== null &&
            data.deliveryBranchId !== ""
          ) {
            fullPayload.deliveryBranchId = Number(
              data.deliveryBranchId
            );
          }

          if (
            data.customerReceiverEmployeeId !== undefined &&
            data.customerReceiverEmployeeId !== null &&
            data.customerReceiverEmployeeId !== ""
          ) {
            fullPayload.customerReceiverEmployeeId = Number(
              data.customerReceiverEmployeeId
            );
          }
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

      /* ========== CREATE ========== */

      const deliveryBranchId = Number(data.deliveryBranchId);
      const customerReceiverEmployeeId = Number(
        data.customerReceiverEmployeeId
      );

      if (!deliveryBranchId || deliveryBranchId === 0) {
        toast.error("الرجاء اختيار فرع التسليم", PERSISTENT_TOAST);
        return;
      }

      if (
        !customerReceiverEmployeeId ||
        customerReceiverEmployeeId === 0
      ) {
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
        toast.error(
          result?.message || "فشل إنشاء التصليحة",
          PERSISTENT_TOAST
        );
      }
    } catch (error) {
      console.error("Repair Order Submit Error:", error);

      const message =
        error?.response?.data?.message ||
        error?.response?.data?.Message ||
        error?.message;

      if (message) {
        toast.error(message, PERSISTENT_TOAST);
      }
    }
  };

  /* ---------- render helpers ---------- */

  const showOperatorSection = isOperatorForm;
  const showBranchSections = !isEditMode || isBranchEditor;

  const imagesSectionId = isOperatorForm
    ? "repair-images-input-operator"
    : "repair-images-input";

  const renderImagesSection = () => (
    <>
      <Typography className={style.repairsSectionTitle}>
        صور التصليح
      </Typography>

      <Divider className={style.repairsSectionDivider} />

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12 }}>
          <Box className={style.repairsImagesUploadContainer}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              multiple
              onChange={handleImagesChange}
              style={{ display: "none" }}
              id={imagesSectionId}
            />

            <Box className={style.repairsImagesGrid}>
              {imagePreviews.map((preview, index) => (
                <Box
                  key={preview.id || preview.url}
                  className={style.repairsImagePreviewWrapper}
                >
                  <img
                    src={preview.url}
                    alt={`صورة ${index + 1}`}
                    className={style.repairsImagePreview}
                  />

                  <IconButton
                    className={style.repairsImageRemoveBtn}
                    onClick={() => handleRemoveImage(index)}
                    size="small"
                    title="إزالة الصورة"
                    aria-label="إزالة الصورة"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              ))}

              {imagePreviews.length < MAX_IMAGES && (
                <label
                  htmlFor={imagesSectionId}
                  className={style.repairsImageUploadLabel}
                >
                  <AddPhotoAlternateIcon
                    sx={{ fontSize: 40, color: "#c9a44c" }}
                  />

                  <Typography className={style.repairsImageUploadText}>
                    إضافة صور ({imagePreviews.length}/{MAX_IMAGES})
                  </Typography>

                  <Typography className={style.repairsImageUploadHint}>
                    JPG, PNG, WEBP — بحد أقصى 5MB لكل صورة
                  </Typography>
                </label>
              )}
            </Box>
          </Box>
        </Grid>
      </Grid>
    </>
  );

  return (
    <Box className={style.repairsCreateContainer}>
      {/* Header */}

      <Box className={style.repairsCreateHeader}>
        <Box className={style.repairsCreateHeaderIcon}>
          <ReceiptLongIcon sx={{ fontSize: 34 }} />
        </Box>

        <Typography className={style.repairsCreateTitle}>
          {isEditMode
            ? isOperatorForm
              ? "تعديل بيانات المشغل"
              : "تعديل التصليحة"
            : "تصليحة جديدة"}
        </Typography>

        <Typography className={style.repairsCreateSubtitle}>
          {isEditMode
            ? isOperatorForm
              ? "إدخال السعر وملاحظات المشغل"
              : "تعديل بيانات القطعة والعميل"
            : "إدخال بيانات القطعة والعميل"}
        </Typography>
      </Box>

      <Paper elevation={0} className={style.repairsCreateCard}>
        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
          {/* ============ OPERATOR ============ */}
{/* ============ OPERATOR ============ */}

{showOperatorSection && (
  <>
    <Typography className={style.repairsSectionTitle}>
      بيانات المشغل
    </Typography>

    <Divider className={style.repairsSectionDivider} />

    <Grid container spacing={2} sx={{ mb: 3 }}>
      {/* Price */}

      <Grid size={{ xs: 12, sm: 6 }}>
        <Typography className={style.repairsSectionTitle}>
          السعر
        </Typography>

        <Divider className={style.repairsSectionDivider} />

        <TextField
          fullWidth
          label="السعر"
          margin="dense"
          type="number"
          {...register("price")}
          error={!!errors.price}
          helperText={errors.price?.message}
          className={style.repairsFormField}
          slotProps={{
            htmlInput: { step: "0.01", min: 0 },
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

      {/* Operator Notes */}

      <Grid size={{ xs: 12 }}>
        <Typography className={style.repairsSectionTitle}>
          ملاحظات المشغل
        </Typography>

        <Divider className={style.repairsSectionDivider} />

        <Controller
          name="operatorNotes"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              value={field.value ?? ""}
              fullWidth
              label="ملاحظات المشغل"
              margin="dense"
              multiline
              minRows={2}
              maxRows={10}
              error={!!errors.operatorNotes}
              helperText={errors.operatorNotes?.message}
              className={`${style.repairsFormField} ${style.repairsFormFieldTextarea}`}
            />
          )}
        />
      </Grid>
    </Grid>

    {renderImagesSection()}
  </>
)}

          {/* ============ BRANCH ============ */}

          {showBranchSections && (
            <>
              {/* Customer */}

              <Typography className={style.repairsSectionTitle}>
                معلومات العميل
              </Typography>

              <Divider className={style.repairsSectionDivider} />

              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="اسم العميل"
                    margin="dense"
                    {...register("customerName")}
                    error={!!errors.customerName}
                    helperText={errors.customerName?.message}
                    className={style.repairsFormField}
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

                <Grid size={{ xs: 12, sm: 6 }}>
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
                    className={style.repairsFormField}
                    slotProps={{
                      htmlInput: {
                        inputMode: "numeric",
                        maxLength: 15,
                      },
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

              {/* Piece */}

              <Typography className={style.repairsSectionTitle}>
                معلومات القطعة
              </Typography>

              <Divider className={style.repairsSectionDivider} />

              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={{ xs: 12 }}>
                  <Controller
                    name="description"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        value={field.value ?? ""}
                        fullWidth
                        label="وصف القطعة"
                        margin="dense"
                        multiline
                        minRows={2}
                        maxRows={12}
                        error={!!errors.description}
                        helperText={errors.description?.message}
                        className={`${style.repairsFormField} ${style.repairsFormFieldTextarea}`}
                      />
                    )}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    label="الوزن (غرام)"
                    margin="dense"
                    type="number"
                    {...register("weight")}
                    error={!!errors.weight}
                    helperText={errors.weight?.message}
                    className={style.repairsFormField}
                    slotProps={{
                      htmlInput: { step: "0.001", min: 0 },
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

                <Grid size={{ xs: 12, sm: 4 }}>
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
                        className={`${style.repairsFormField} ${style.repairsFormFieldSelect}`}
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
                          select: {
                            displayEmpty: true,
                            renderValue: (selected) => {
                              if (
                                selected === "" ||
                                selected === undefined ||
                                selected === null
                              ) {
                                return (
                                  <span className={style.repairsSelectPlaceholder}>
                                    — بدون تحديد —
                                  </span>
                                );
                              }

                              return selected;
                            },
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
                    )}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    label="العدد"
                    margin="dense"
                    type="number"
                    {...register("quantity")}
                    error={!!errors.quantity}
                    helperText={errors.quantity?.message}
                    className={style.repairsFormField}
                    slotProps={{
                      htmlInput: { min: 1 },
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

              {renderImagesSection()}

              {/* Required work */}

              <Typography className={style.repairsSectionTitle}>
                العمل المطلوب
              </Typography>

              <Divider className={style.repairsSectionDivider} />

              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={{ xs: 12 }}>
                  <Controller
                    name="requiredWork"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        value={field.value ?? ""}
                        fullWidth
                        label="العمل المطلوب"
                        margin="dense"
                        multiline
                        minRows={2}
                        maxRows={12}
                        error={!!errors.requiredWork}
                        helperText={errors.requiredWork?.message}
                        className={`${style.repairsFormField} ${style.repairsFormFieldTextarea}`}
                      />
                    )}
                  />
                </Grid>
              </Grid>

              {/* Notes */}

              <Typography className={style.repairsSectionTitle}>
                ملاحظات
              </Typography>

              <Divider className={style.repairsSectionDivider} />

              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={{ xs: 12 }}>
                  <Controller
                    name="notes"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        value={field.value ?? ""}
                        fullWidth
                        label="ملاحظات عامة"
                        margin="dense"
                        multiline
                        minRows={2}
                        maxRows={10}
                        error={!!errors.notes}
                        helperText={errors.notes?.message}
                        className={`${style.repairsFormField} ${style.repairsFormFieldTextarea}`}
                      />
                    )}
                  />
                </Grid>
              </Grid>

              {/* Receive / deliver */}

              <Typography className={style.repairsSectionTitle}>
                الاستلام والتسليم
              </Typography>

              <Divider className={style.repairsSectionDivider} />

              <Grid
                container
                spacing={3}
                className={style.repairsReceiveGrid}
                sx={{ mt: 2, mb: 1 }}
              >
                {/* Delivery branch */}

                <Grid size={{ xs: 12, md: 6 }}>
                  <Controller
                    name="deliveryBranchId"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          field.onChange(value === "" ? "" : Number(value));
                        }}
                        fullWidth
                        select
                        label="فرع التسليم للعميل"
                        margin="none"
                        error={!!errors.deliveryBranchId}
                        helperText={errors.deliveryBranchId?.message}
                        className={`${style.repairsFormField} ${style.repairsFormFieldSelect}`}
                        slotProps={{
                          inputLabel: {
                            shrink: true,
                          },
                          input: {
                            startAdornment: (
                              <InputAdornment position="start">
                                <StorefrontIcon
                                  sx={{ color: "#c9a44c", fontSize: 22 }}
                                />
                              </InputAdornment>
                            ),
                          },
                          select: {
                            displayEmpty: true,
                            renderValue: (selected) => {
                              if (
                                selected === "" ||
                                selected === undefined ||
                                selected === null
                              ) {
                                return (
                                  <span className={style.repairsSelectPlaceholder}>
                                    — اختر فرع التسليم —
                                  </span>
                                );
                              }

                              const branch = availableBranches.find(
                                (b) => Number(b.id) === Number(selected)
                              );

                              if (!branch) {
                                return (
                                  <span className={style.repairsSelectPlaceholder}>
                                    جاري تحميل بيانات الفرع...
                                  </span>
                                );
                              }

                              return `${branch.name}${
                                branch.code ? ` (${branch.code})` : ""
                              }`;
                            },
                          },
                        }}
                      >
                        <MenuItem value="">
                          <em>— اختر فرع التسليم —</em>
                        </MenuItem>

                        {availableBranches.length === 0 ? (
                          <MenuItem value="__none__" disabled>
                            لا توجد فروع نشطة متاحة
                          </MenuItem>
                        ) : (
                          availableBranches.map((b) => (
                            <MenuItem
                              key={b.id}
                              value={Number(b.id)}
                            >
                              {b.name} {b.code ? `(${b.code})` : ""}
                            </MenuItem>
                          ))
                        )}
                      </TextField>
                    )}
                  />
                </Grid>

                {/* Employee from original repair branch */}

                <Grid size={{ xs: 12, md: 6 }}>
                  <Controller
                    name="customerReceiverEmployeeId"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          field.onChange(value === "" ? "" : Number(value));
                        }}
                        fullWidth
                        select
                        label="الموظف المستلم للتصليحة"
                        margin="none"
                        disabled={!employeeBranchId || employeesLoading}
                        error={!!errors.customerReceiverEmployeeId}
                        helperText={
                          errors.customerReceiverEmployeeId?.message ||
                          (employeeBranchId
                            ? "الموظفون التابعون لفرع التصليحة الأصلي"
                            : "فرع التصليحة غير محدد")
                        }
                        className={`${style.repairsFormField} ${style.repairsFormFieldSelect} ${style.repairsEmployeeSelect}`}
                        slotProps={{
                          inputLabel: {
                            shrink: true,
                          },
                          input: {
                            startAdornment: (
                              <InputAdornment position="start">
                                <PersonIcon
                                  sx={{ color: "#c9a44c", fontSize: 22 }}
                                />
                              </InputAdornment>
                            ),
                          },
                          select: {
                            displayEmpty: true,
                            renderValue: (selected) => {
                              if (
                                selected === "" ||
                                selected === undefined ||
                                selected === null
                              ) {
                                return (
                                  <span className={style.repairsSelectPlaceholder}>
                                    — اختر الموظف المستلم —
                                  </span>
                                );
                              }

                              const emp = employees.find(
                                (e) => Number(e.id) === Number(selected)
                              );

                              if (!emp) {
                                return (
                                  <span className={style.repairsSelectPlaceholder}>
                                    جاري تحميل بيانات الموظف...
                                  </span>
                                );
                              }

                              return emp.fullName;
                            },
                          },
                        }}
                      >
                        <MenuItem value="">
                          <em>— اختر الموظف المستلم —</em>
                        </MenuItem>

                        {!employeeBranchId ? (
                          <MenuItem value="__none__" disabled>
                            فرع التصليحة غير محدد
                          </MenuItem>
                        ) : employeesLoading ? (
                          <MenuItem value="__loading__" disabled>
                            جاري تحميل الموظفين...
                          </MenuItem>
                        ) : employees.length === 0 ? (
                          <MenuItem value="__none__" disabled>
                            لا يوجد موظفون نشطون في فرع التصليحة
                          </MenuItem>
                        ) : (
                          employees.map((emp) => (
                            <MenuItem
                              key={emp.id}
                              value={Number(emp.id)}
                            >
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

          <Box className={style.repairsCreateActions}>
            <Button
              variant="outlined"
              onClick={() =>
                navigate(isEditMode ? `/repairs/${editId}` : "/repairs/list")
              }
              disabled={saving}
              className={style.repairsCreateCancel}
              startIcon={<CloseIcon />}
            >
              إلغاء
            </Button>

            <Button
              type="submit"
              variant="contained"
              disabled={saving}
              className={style.repairsCreateSave}
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

/* =====================================================
   Wrapper
   ===================================================== */

export default function CreateRepairOrder() {
  const navigate = useNavigate();
  const params = useParams();

  const editId =
    params.id ?? params.repairId ?? params.orderId ?? null;

  const isEditMode = !!editId;

  const currentUser = useAuthStore((state) => state.user);

  const userRoles = useMemo(
    () => currentUser?.roles?.map((r) => r.name) || [],
    [currentUser]
  );

  const userBranchId = currentUser?.branchId;

  const { data: branches = [] } = useBranchLookup();

  const availableBranches = useMemo(
    () => branches.filter((b) => b.isActive !== false),
    [branches]
  );

  const createMutation = useCreateRepairOrder();
  const updateMutation = useUpdateRepairOrder();

  const {
    data: existingOrder,
    isLoading: loadingOrder,
  } = useRepairOrderById(editId, {
    enabled: isEditMode,
  });

  const isBranchEditor = useMemo(
    () => canEditAsBranch(userRoles),
    [userRoles]
  );

  const isOperatorEditor = useMemo(
    () => canEditAsOperator(userRoles, existingOrder?.status),
    [userRoles, existingOrder?.status]
  );

  const isOperatorForm = isEditMode && isOperatorEditor;

  const employeeBranchId = isEditMode
    ? existingOrder?.pickupBranchId
    : userBranchId;

  const {
    data: employees = [],
    isLoading: employeesLoading,
  } = useBranchEmployees(employeeBranchId, {
    enabled: !!employeeBranchId && (!isEditMode || !!existingOrder),
  });

  useEffect(() => {
    if (!isEditMode || !existingOrder) return;

    const allowed = canEditRepair(
      userRoles,
      existingOrder.status,
      existingOrder.movements || []
    );

    if (!allowed) {
      toast.error(
        "لا تملك صلاحية تعديل هذه التصليحة في حالتها الحالية",
        {
          ...PERSISTENT_TOAST,
          toastId: "edit-not-allowed",
        }
      );

      navigate(`/repairs/${editId}`, { replace: true });
    }
  }, [
    isEditMode,
    existingOrder,
    userRoles,
    navigate,
    editId,
  ]);

  if (isEditMode && (loadingOrder || !existingOrder)) {
    return (
      <Box className={style.repairsCreateLoading}>
        <CircularProgress sx={{ color: "#b8860b" }} />
      </Box>
    );
  }

  return (
    <RepairFormInner
      key={editId || "new"}
      isEditMode={isEditMode}
      editId={editId}
      existingOrder={existingOrder}
      isOperatorForm={isOperatorForm}
      isBranchEditor={isBranchEditor}
      employeeBranchId={employeeBranchId}
      availableBranches={availableBranches}
      employees={employees}
      employeesLoading={employeesLoading}
      createMutation={createMutation}
      updateMutation={updateMutation}
      navigate={navigate}
    />
  );
}
