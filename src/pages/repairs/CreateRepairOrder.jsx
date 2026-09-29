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

// =====================================================
// خيارات العيار
// =====================================================

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

// =====================================================
// Toast
// =====================================================

const PERSISTENT_TOAST = {
  containerId: "persistent",
  position: "top-center",
  autoClose: false,
  closeOnClick: true,
  closeButton: true,
  pauseOnHover: true,
  draggable: false,
};

// =====================================================
// Schema خاص بالمشغل
// =====================================================

const operatorEditSchema = yup.object({
  price: yup
    .number()
    .typeError("السعر يجب أن يكون رقماً")
    .min(0, "السعر لا يمكن أن يكون سالباً")
    .required("السعر مطلوب"),

  operatorNotes: yup
    .string()
    .trim()
    .max(
      1000,
      "ملاحظات المشغل يجب ألا تتجاوز 1000 حرف"
    )
    .notRequired(),
});

// =====================================================
// Schema خاص بالتعديل
//
// مهم:
// لا يوجد أي Validation على:
// - karat
// - deliveryBranchId
// - customerReceiverEmployeeId
//
// لأن هذه القيم يتم أخذها من existingOrder
// والمحافظة عليها أثناء التعديل.
// =====================================================

const repairOrderEditSchema = yup.object({
  customerName: yup
    .string()
    .trim()
    .required("اسم العميل مطلوب"),

  customerPhone: yup
    .string()
    .trim()
    .required("رقم الهاتف مطلوب"),

  description: yup
    .string()
    .trim()
    .required("وصف القطعة مطلوب"),

  weight: yup
    .number()
    .typeError("الوزن يجب أن يكون رقماً")
    .min(0, "الوزن لا يمكن أن يكون سالباً")
    .required("الوزن مطلوب"),

  // لا يوجد required
  karat: yup
    .string()
    .nullable()
    .notRequired(),

  quantity: yup
    .number()
    .typeError("العدد يجب أن يكون رقماً")
    .min(1, "العدد يجب أن يكون 1 على الأقل")
    .required("العدد مطلوب"),

  requiredWork: yup
    .string()
    .trim()
    .required("العمل المطلوب مطلوب"),

  price: yup
    .number()
    .typeError("السعر يجب أن يكون رقماً")
    .min(0, "السعر لا يمكن أن يكون سالباً")
    .required("السعر مطلوب"),

  notes: yup
    .string()
    .trim()
    .notRequired(),

  operatorNotes: yup
    .string()
    .trim()
    .max(
      1000,
      "ملاحظات المشغل يجب ألا تتجاوز 1000 حرف"
    )
    .notRequired(),

  // لا يوجد Validation
  deliveryBranchId: yup
    .mixed()
    .nullable()
    .notRequired(),

  // لا يوجد Validation
  customerReceiverEmployeeId: yup
    .mixed()
    .nullable()
    .notRequired(),
});

// =====================================================
// القيم الافتراضية
// =====================================================

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

// =====================================================
// الصور
// =====================================================

const MAX_IMAGES = 5;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

// =====================================================
// FormData للإنشاء
// =====================================================

const buildCreateFormData = (
  data,
  imageFiles
) => {
  const formData = new FormData();

  formData.append(
    "CustomerName",
    String(data.customerName || "").trim()
  );

  formData.append(
    "CustomerPhone",
    String(data.customerPhone || "").trim()
  );

  formData.append(
    "Description",
    String(data.description || "").trim()
  );

  formData.append(
    "Weight",
    String(
      data.weight
        ? Number(data.weight)
        : 0
    )
  );

  formData.append(
    "Karat",
    String(data.karat || "")
  );

  formData.append(
    "Quantity",
    String(
      data.quantity
        ? Number(data.quantity)
        : 1
    )
  );

  formData.append(
    "RequiredWork",
    String(data.requiredWork || "").trim()
  );

  // عند الإنشاء السعر يبدأ من صفر
  formData.append("Price", "0");

  formData.append(
    "Notes",
    String(data.notes || "").trim()
  );

  formData.append(
    "OperatorNotes",
    ""
  );

  formData.append(
    "DeliveryBranchId",
    String(
      Number(data.deliveryBranchId)
    )
  );

  formData.append(
    "CustomerReceiverEmployeeId",
    String(
      Number(
        data.customerReceiverEmployeeId
      )
    )
  );

  if (
    imageFiles &&
    imageFiles.length > 0
  ) {
    imageFiles.forEach((file) => {
      formData.append(
        "Images",
        file
      );
    });
  }

  return formData;
};

// =====================================================
// FormData للتعديل
// =====================================================

const buildUpdateFormData = (
  fullPayload,
  imageFiles,
  deletedImageIds = []
) => {
  const formData = new FormData();

  formData.append(
    "CustomerName",
    String(
      fullPayload.customerName || ""
    ).trim()
  );

  formData.append(
    "CustomerPhone",
    String(
      fullPayload.customerPhone || ""
    ).trim()
  );

  formData.append(
    "Description",
    String(
      fullPayload.description || ""
    ).trim()
  );

  formData.append(
    "Weight",
    String(
      fullPayload.weight ?? 0
    )
  );

  // ===================================================
  // العيار
  // نحافظ على القيمة القديمة أو الجديدة
  // ===================================================

  formData.append(
    "Karat",
    String(
      fullPayload.karat ?? ""
    ).trim()
  );

  formData.append(
    "Quantity",
    String(
      fullPayload.quantity ?? 1
    )
  );

  formData.append(
    "RequiredWork",
    String(
      fullPayload.requiredWork || ""
    ).trim()
  );

  formData.append(
    "Price",
    String(
      fullPayload.price ?? 0
    )
  );

  formData.append(
    "Notes",
    String(
      fullPayload.notes || ""
    ).trim()
  );

  formData.append(
    "OperatorNotes",
    String(
      fullPayload.operatorNotes || ""
    ).trim()
  );

  // ===================================================
  // فرع التسليم
  //
  // إذا كان موجوداً نرسله.
  // إذا لم يكن موجوداً لا نضع Validation عليه.
  // ===================================================

  if (
    fullPayload.deliveryBranchId !== null &&
    fullPayload.deliveryBranchId !== undefined &&
    fullPayload.deliveryBranchId !== ""
  ) {
    formData.append(
      "DeliveryBranchId",
      String(
        fullPayload.deliveryBranchId
      )
    );
  }

  // ===================================================
  // الموظف المستلم
  //
  // إذا كان موجوداً نرسله.
  // إذا لم يكن موجوداً لا نضع Validation عليه.
  // ===================================================

  if (
    fullPayload.customerReceiverEmployeeId !== null &&
    fullPayload.customerReceiverEmployeeId !== undefined &&
    fullPayload.customerReceiverEmployeeId !== ""
  ) {
    formData.append(
      "CustomerReceiverEmployeeId",
      String(
        fullPayload.customerReceiverEmployeeId
      )
    );
  }

  // ===================================================
  // الصور الجديدة
  // ===================================================

  if (
    imageFiles &&
    imageFiles.length > 0
  ) {
    imageFiles.forEach((file) => {
      formData.append(
        "Images",
        file
      );
    });
  }

  // ===================================================
  // الصور المحذوفة
  // ===================================================

  if (
    deletedImageIds &&
    deletedImageIds.length > 0
  ) {
    deletedImageIds.forEach(
      (imageId) => {
        formData.append(
          "DeletedImageIds",
          String(imageId)
        );
      }
    );
  }

  return formData;
};

// =====================================================
// Form Component
// =====================================================

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
  const saving =
    createMutation.isPending ||
    updateMutation.isPending;

  // ===================================================
  // اختيار Schema
  // ===================================================

  const schema = isOperatorForm
    ? operatorEditSchema
    : isEditMode
      ? repairOrderEditSchema
      : repairOrderSchema;

  const defaultValues = isOperatorForm
    ? operatorEmptyForm
    : branchEmptyForm;

  // ===================================================
  // الصور
  // ===================================================

  const [imageFiles, setImageFiles] =
    useState([]);

  const [imagePreviews, setImagePreviews] =
    useState([]);

  const [deletedImageIds, setDeletedImageIds] =
    useState([]);

  const fileInputRef =
    useRef(null);

  // ===================================================
  // React Hook Form
  // ===================================================

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

  // ===================================================
  // تعبئة البيانات عند التعديل
  // ===================================================

  useEffect(() => {
    if (
      !isEditMode ||
      !existingOrder
    ) {
      return;
    }

    // =================================================
    // تعديل المشغل
    // =================================================

    if (isOperatorForm) {
      reset({
        price:
          existingOrder.price !== null &&
          existingOrder.price !== undefined
            ? String(
                existingOrder.price
              )
            : "",

        operatorNotes:
          existingOrder.operatorNotes ||
          "",
      });

      return;
    }

    // =================================================
    // تعديل بيانات التصليحة
    // =================================================

    reset({
      customerName:
        existingOrder.customerName ||
        "",

      customerPhone:
        existingOrder.customerPhone ||
        "",

      description:
        existingOrder.description ||
        "",

      weight:
        existingOrder.weight !== null &&
        existingOrder.weight !== undefined
          ? String(
              existingOrder.weight
            )
          : "",

      // العيار اختياري
      karat:
        existingOrder.karat !== null &&
        existingOrder.karat !== undefined
          ? String(
              existingOrder.karat
            )
          : "",

      quantity:
        existingOrder.quantity !== null &&
        existingOrder.quantity !== undefined
          ? String(
              existingOrder.quantity
            )
          : "1",

      requiredWork:
        existingOrder.requiredWork ||
        "",

      price:
        existingOrder.price !== null &&
        existingOrder.price !== undefined
          ? String(
              existingOrder.price
            )
          : "",

      notes:
        existingOrder.notes ||
        "",

      operatorNotes:
        existingOrder.operatorNotes ||
        "",

      // نضع القيمة القديمة إن وجدت
      deliveryBranchId:
        existingOrder.deliveryBranchId !== null &&
        existingOrder.deliveryBranchId !== undefined
          ? Number(
              existingOrder.deliveryBranchId
            )
          : "",

      // نضع القيمة القديمة إن وجدت
      customerReceiverEmployeeId:
        existingOrder.customerReceiverEmployeeId !== null &&
        existingOrder.customerReceiverEmployeeId !== undefined
          ? Number(
              existingOrder.customerReceiverEmployeeId
            )
          : "",
    });
  }, [
    isEditMode,
    existingOrder,
    isOperatorForm,
    reset,
  ]);

  // ===================================================
  // تحميل الصور الموجودة
  // ===================================================

  useEffect(() => {
    if (
      isEditMode &&
      existingOrder?.images
    ) {
      const previews =
        existingOrder.images.map(
          (img) => ({
            id: img.id,

            url:
              repairOrderService.getRepairImageUrl(
                img.fileName
              ),

            isExisting: true,

            fileName:
              img.fileName,
          })
        );

      setImagePreviews(
        previews
      );

      setDeletedImageIds([]);
    }
  }, [
    isEditMode,
    existingOrder?.images,
  ]);

  // ===================================================
  // اختيار الصور
  // ===================================================

  const handleImagesChange = (
    e
  ) => {
    const files = Array.from(
      e.target.files || []
    );

    if (
      files.length === 0
    ) {
      return;
    }

    const existingCount =
      imagePreviews.filter(
        (p) =>
          p.isExisting
      ).length;

    const currentCount =
      imageFiles.length +
      existingCount;

    if (
      currentCount +
        files.length >
      MAX_IMAGES
    ) {
      toast.error(
        `لا يمكن رفع أكثر من ${MAX_IMAGES} صور`,
        PERSISTENT_TOAST
      );

      return;
    }

    const validFiles = [];
    const newPreviews = [];

    for (const file of files) {
      if (
        file.size >
        MAX_IMAGE_SIZE
      ) {
        toast.error(
          `حجم الصورة "${file.name}" يجب ألا يتجاوز 5 ميجابايت`,
          PERSISTENT_TOAST
        );

        continue;
      }

      if (
        !ALLOWED_IMAGE_TYPES.includes(
          file.type
        )
      ) {
        toast.error(
          `الصورة "${file.name}" يجب أن تكون بصيغة JPG أو PNG أو WEBP`,
          PERSISTENT_TOAST
        );

        continue;
      }

      validFiles.push(file);

      newPreviews.push({
        file,

        url:
          URL.createObjectURL(
            file
          ),

        isExisting: false,
      });
    }

    if (
      validFiles.length > 0
    ) {
      setImageFiles(
        (prev) => [
          ...prev,
          ...validFiles,
        ]
      );

      setImagePreviews(
        (prev) => [
          ...prev,
          ...newPreviews,
        ]
      );
    }

    if (
      fileInputRef.current
    ) {
      fileInputRef.current.value =
        "";
    }
  };

  // ===================================================
  // حذف صورة
  // ===================================================

  const handleRemoveImage = (
    index
  ) => {
    const preview =
      imagePreviews[index];

    if (!preview) {
      return;
    }

    if (
      preview.isExisting
    ) {
      setDeletedImageIds(
        (prev) => [
          ...prev,
          preview.id,
        ]
      );

      setImagePreviews(
        (prev) =>
          prev.filter(
            (_, i) =>
              i !== index
          )
      );
    } else {
      setImageFiles(
        (prev) =>
          prev.filter(
            (f) =>
              f !==
              preview.file
          )
      );

      URL.revokeObjectURL(
        preview.url
      );

      setImagePreviews(
        (prev) =>
          prev.filter(
            (_, i) =>
              i !== index
          )
      );
    }
  };

  // ===================================================
  // تنظيف الصور
  // ===================================================

  useEffect(() => {
    return () => {
      imagePreviews.forEach(
        (preview) => {
          if (
            !preview.isExisting &&
            preview.url
          ) {
            URL.revokeObjectURL(
              preview.url
            );
          }
        }
      );
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ===================================================
  // Submit
  // ===================================================

  const onSubmit = async (
    data
  ) => {
    try {
      // =================================================
      // التعديل
      // =================================================

      if (isEditMode) {
        // -----------------------------------------------
        // نبدأ دائماً من البيانات القديمة
        // -----------------------------------------------

        const fullPayload = {
          customerName:
            existingOrder?.customerName ||
            "",

          customerPhone:
            existingOrder?.customerPhone ||
            "",

          description:
            existingOrder?.description ||
            "",

          weight:
            existingOrder?.weight ??
            0,

          // المحافظة على العيار القديم
          karat:
            existingOrder?.karat ??
            "",

          quantity:
            existingOrder?.quantity ??
            1,

          requiredWork:
            existingOrder?.requiredWork ||
            "",

          price:
            existingOrder?.price ??
            0,

          notes:
            existingOrder?.notes ||
            "",

          operatorNotes:
            existingOrder?.operatorNotes ||
            "",

          // المحافظة على فرع التسليم القديم
          deliveryBranchId:
            existingOrder?.deliveryBranchId ??
            "",

          // المحافظة على الموظف القديم
          customerReceiverEmployeeId:
            existingOrder?.customerReceiverEmployeeId ??
            "",
        };

        // =================================================
        // تعديل المشغل
        // =================================================

        if (
          isOperatorForm
        ) {
          fullPayload.price =
            data.price !==
              undefined &&
            data.price !==
              null &&
            data.price !== ""
              ? Number(
                  data.price
                )
              : existingOrder?.price ??
                0;

          fullPayload.operatorNotes =
            String(
              data.operatorNotes ||
                ""
            ).trim();
        }

        // =================================================
        // تعديل بيانات الفرع
        // =================================================

        else {
          // -----------------------------------------------
          // العميل
          // -----------------------------------------------

          if (
            data.customerName !==
              undefined
          ) {
            fullPayload.customerName =
              String(
                data.customerName ||
                  ""
              ).trim();
          }

          if (
            data.customerPhone !==
              undefined
          ) {
            fullPayload.customerPhone =
              String(
                data.customerPhone ||
                  ""
              ).trim();
          }

          // -----------------------------------------------
          // وصف القطعة
          // -----------------------------------------------

          if (
            data.description !==
              undefined
          ) {
            fullPayload.description =
              String(
                data.description ||
                  ""
              ).trim();
          }

          // -----------------------------------------------
          // الوزن
          // -----------------------------------------------

          if (
            data.weight !==
              undefined &&
            data.weight !==
              null &&
            data.weight !==
              ""
          ) {
            fullPayload.weight =
              Number(
                data.weight
              );
          }

          // -----------------------------------------------
          // العيار
          //
          // إذا اختار قيمة جديدة يتم استخدامها.
          // إذا تركه فارغاً نحافظ على القديم.
          // -----------------------------------------------

          if (
            data.karat !==
              undefined &&
            data.karat !==
              null &&
            data.karat !== ""
          ) {
            fullPayload.karat =
              String(
                data.karat
              ).trim();
          }

          // -----------------------------------------------
          // العدد
          // -----------------------------------------------

          if (
            data.quantity !==
              undefined &&
            data.quantity !==
              null &&
            data.quantity !==
              ""
          ) {
            fullPayload.quantity =
              Number(
                data.quantity
              );
          }

          // -----------------------------------------------
          // العمل المطلوب
          // -----------------------------------------------

          if (
            data.requiredWork !==
              undefined
          ) {
            fullPayload.requiredWork =
              String(
                data.requiredWork ||
                  ""
              ).trim();
          }

          // -----------------------------------------------
          // السعر
          //
          // نحافظ على السعر القديم أثناء تعديل الفرع.
          // -----------------------------------------------

          fullPayload.price =
            existingOrder?.price ??
            0;

          // -----------------------------------------------
          // الملاحظات
          // -----------------------------------------------

          if (
            data.notes !==
              undefined
          ) {
            fullPayload.notes =
              String(
                data.notes || ""
              ).trim();
          }

          // -----------------------------------------------
          // ملاحظات المشغل
          // -----------------------------------------------

          fullPayload.operatorNotes =
            existingOrder?.operatorNotes ||
            "";

          // -----------------------------------------------
          // فرع التسليم
          //
          // لا يوجد Validation.
          // إذا اختار جديداً نستخدمه.
          // إذا لم يختار نحافظ على القديم.
          // -----------------------------------------------

          if (
            data.deliveryBranchId !==
              undefined &&
            data.deliveryBranchId !==
              null &&
            data.deliveryBranchId !==
              ""
          ) {
            fullPayload.deliveryBranchId =
              Number(
                data.deliveryBranchId
              );
          }

          // -----------------------------------------------
          // الموظف المستلم
          //
          // لا يوجد Validation.
          // إذا اختار جديداً نستخدمه.
          // إذا لم يختار نحافظ على القديم.
          // -----------------------------------------------

          if (
            data.customerReceiverEmployeeId !==
              undefined &&
            data.customerReceiverEmployeeId !==
              null &&
            data.customerReceiverEmployeeId !==
              ""
          ) {
            fullPayload.customerReceiverEmployeeId =
              Number(
                data.customerReceiverEmployeeId
              );
          }
        }

        // =================================================
        // بناء FormData
        // =================================================

        const formData =
          buildUpdateFormData(
            fullPayload,
            imageFiles,
            deletedImageIds
          );

        // =================================================
        // إرسال التعديل
        // =================================================

        await updateMutation.mutateAsync(
          {
            id: editId,
            payload: formData,
          }
        );

        navigate(
          `/repairs/${editId}`
        );

        return;
      }

      // =================================================
      // الإنشاء
      // =================================================

      const deliveryBranchId =
        Number(
          data.deliveryBranchId
        );

      const customerReceiverEmployeeId =
        Number(
          data.customerReceiverEmployeeId
        );

      // =================================================
      // فرع التسليم مطلوب عند الإنشاء فقط
      // =================================================

      if (
        !deliveryBranchId ||
        deliveryBranchId === 0
      ) {
        toast.error(
          "الرجاء اختيار فرع التسليم",
          PERSISTENT_TOAST
        );

        return;
      }

      // =================================================
      // الموظف المستلم مطلوب عند الإنشاء فقط
      // =================================================

      if (
        !customerReceiverEmployeeId ||
        customerReceiverEmployeeId ===
          0
      ) {
        toast.error(
          "الرجاء اختيار الموظف المستلم",
          PERSISTENT_TOAST
        );

        return;
      }

      // =================================================
      // إنشاء FormData
      // =================================================

      const formData =
        buildCreateFormData(
          data,
          imageFiles
        );

      // =================================================
      // إنشاء التصليحة
      // =================================================

      const result =
        await createMutation.mutateAsync(
          formData
        );

      const orderId =
        result?.data?.id ||
        result?.data?.Id;

      if (orderId) {
        navigate(
          `/repairs/${orderId}`
        );
      } else if (
        result?.data
      ) {
        navigate(
          "/repairs/list"
        );
      } else {
        toast.error(
          result?.message ||
            "فشل إنشاء التصليحة",
          PERSISTENT_TOAST
        );
      }
    } catch (error) {
      console.error(
        "Repair Order Submit Error:",
        error
      );

      const message =
        error?.response?.data?.message ||
        error?.response?.data?.Message ||
        error?.message;

      if (message) {
        toast.error(
          message,
          PERSISTENT_TOAST
        );
      }
    }
  };

  // ===================================================
  // إظهار الأقسام
  // ===================================================

  const showOperatorSection =
    isOperatorForm;

  const showBranchSections =
    !isEditMode ||
    isBranchEditor;

  // ===================================================
  // Render
  // ===================================================

  return (
    <Box className="repairs-create-container">

      {/* Header */}

      <Box className="repairs-create-header">
        <Box className="repairs-create-header-icon">
          <ReceiptLongIcon
            sx={{
              fontSize: 34,
            }}
          />
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

      <Paper
        elevation={0}
        className="repairs-create-card"
      >
        <Box
          component="form"
          onSubmit={handleSubmit(
            onSubmit
          )}
          noValidate
        >

          {/* =================================================
              قسم المشغل
          ================================================= */}

          {showOperatorSection && (
            <>
              <Typography className="repairs-section-title">
                بيانات المشغل
              </Typography>

              <Divider className="repairs-section-divider" />

              <Grid
                container
                spacing={2}
                sx={{
                  mb: 3,
                }}
              >
                <Grid
                  item
                  xs={12}
                  sm={6}
                >
                  <TextField
                    fullWidth
                    label="السعر"
                    margin="dense"
                    type="number"
                    {...register(
                      "price"
                    )}
                    error={
                      !!errors.price
                    }
                    helperText={
                      errors.price
                        ?.message
                    }
                    className="repairs-form-field"
                    inputProps={{
                      step: "0.01",
                      min: 0,
                    }}
                    slotProps={{
                      input: {
                        startAdornment:
                          (
                            <InputAdornment position="start">
                              <AttachMoneyIcon
                                sx={{
                                  color:
                                    "#c9a44c",
                                  fontSize: 20,
                                }}
                              />
                            </InputAdornment>
                          ),
                      },
                    }}
                  />
                </Grid>

                <Grid
                  item
                  xs={12}
                  sm={6}
                >
                  <TextField
                    fullWidth
                    label="ملاحظات المشغل"
                    margin="dense"
                    multiline
                    rows={2}
                    {...register(
                      "operatorNotes"
                    )}
                    error={
                      !!errors.operatorNotes
                    }
                    helperText={
                      errors
                        .operatorNotes
                        ?.message
                    }
                    className="repairs-form-field"
                    slotProps={{
                      input: {
                        startAdornment:
                          (
                            <InputAdornment
                              position="start"
                              sx={{
                                alignSelf:
                                  "flex-start",
                                mt: 1.5,
                              }}
                            >
                              <NotesIcon
                                sx={{
                                  color:
                                    "#c9a44c",
                                  fontSize: 20,
                                }}
                              />
                            </InputAdornment>
                          ),
                      },
                    }}
                  />
                </Grid>
              </Grid>

              {/* صور المشغل */}

              <Typography className="repairs-section-title">
                صور التصليح
              </Typography>

              <Divider className="repairs-section-divider" />

              <Grid
                container
                spacing={2}
                sx={{
                  mb: 3,
                }}
              >
                <Grid
                  item
                  xs={12}
                >
                  <Box className="repairs-images-upload-container">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      multiple
                      onChange={
                        handleImagesChange
                      }
                      style={{
                        display: "none",
                      }}
                      id="repair-images-input-operator"
                    />

                    {imagePreviews.length >
                      0 && (
                      <Box className="repairs-images-grid">
                        {imagePreviews.map(
                          (
                            preview,
                            index
                          ) => (
                            <Box
                              key={
                                preview.id ||
                                preview.url
                              }
                              className="repairs-image-preview-wrapper"
                            >
                              <img
                                src={
                                  preview.url
                                }
                                alt={`صورة ${
                                  index +
                                  1
                                }`}
                                className="repairs-image-preview"
                              />

                              <IconButton
                                className="repairs-image-remove-btn"
                                onClick={() =>
                                  handleRemoveImage(
                                    index
                                  )
                                }
                                size="small"
                                title="إزالة الصورة"
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          )
                        )}
                      </Box>
                    )}

                    {imagePreviews.length <
                      MAX_IMAGES && (
                      <label
                        htmlFor="repair-images-input-operator"
                        className="repairs-image-upload-label"
                      >
                        <AddPhotoAlternateIcon
                          sx={{
                            fontSize: 40,
                            color:
                              "#c9a44c",
                          }}
                        />

                        <Typography className="repairs-image-upload-text">
                          إضافة صور (
                          {
                            imagePreviews.length
                          }
                          /
                          {MAX_IMAGES})
                        </Typography>

                        <Typography className="repairs-image-upload-hint">
                          JPG, PNG, WEBP
                          — بحد أقصى
                          5MB لكل صورة
                        </Typography>
                      </label>
                    )}
                  </Box>
                </Grid>
              </Grid>
            </>
          )}

          {/* =================================================
              بيانات الفرع
          ================================================= */}

          {showBranchSections && (
            <>

              {/* معلومات العميل */}

              <Typography className="repairs-section-title">
                معلومات العميل
              </Typography>

              <Divider className="repairs-section-divider" />

              <Grid
                container
                spacing={2}
                sx={{
                  mb: 3,
                }}
              >
                <Grid
                  item
                  xs={12}
                  sm={6}
                >
                  <TextField
                    fullWidth
                    label="اسم العميل"
                    margin="dense"
                    {...register(
                      "customerName"
                    )}
                    error={
                      !!errors.customerName
                    }
                    helperText={
                      errors.customerName
                        ?.message
                    }
                    className="repairs-form-field"
                    slotProps={{
                      input: {
                        startAdornment:
                          (
                            <InputAdornment position="start">
                              <PersonIcon
                                sx={{
                                  color:
                                    "#c9a44c",
                                  fontSize: 20,
                                }}
                              />
                            </InputAdornment>
                          ),
                      },
                    }}
                  />
                </Grid>

                <Grid
                  item
                  xs={12}
                  sm={6}
                >
                  <TextField
                    fullWidth
                    label="رقم الهاتف"
                    margin="dense"
                    {...register(
                      "customerPhone",
                      {
                        onChange: (
                          e
                        ) => {
                          const digits =
                            e.target.value.replace(
                              /\D/g,
                              ""
                            );

                          setValue(
                            "customerPhone",
                            digits,
                            {
                              shouldValidate:
                                false,
                              shouldDirty:
                                true,
                            }
                          );
                        },
                      }
                    )}
                    error={
                      !!errors.customerPhone
                    }
                    helperText={
                      errors.customerPhone
                        ?.message
                    }
                    className="repairs-form-field"
                    inputProps={{
                      inputMode:
                        "numeric",
                      maxLength: 15,
                    }}
                    slotProps={{
                      input: {
                        startAdornment:
                          (
                            <InputAdornment position="start">
                              <PhoneIcon
                                sx={{
                                  color:
                                    "#c9a44c",
                                  fontSize: 20,
                                }}
                              />
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

              <Grid
                container
                spacing={2}
                sx={{
                  mb: 3,
                }}
              >
                <Grid
                  item
                  xs={12}
                >
                  <TextField
                    fullWidth
                    label="وصف القطعة"
                    margin="dense"
                    multiline
                    rows={2}
                    {...register(
                      "description"
                    )}
                    error={
                      !!errors.description
                    }
                    helperText={
                      errors.description
                        ?.message
                    }
                    className="repairs-form-field"
                  />
                </Grid>

                {/* الوزن */}

                <Grid
                  item
                  xs={12}
                  sm={4}
                >
                  <TextField
                    fullWidth
                    label="الوزن (غرام)"
                    margin="dense"
                    type="number"
                    {...register(
                      "weight"
                    )}
                    error={
                      !!errors.weight
                    }
                    helperText={
                      errors.weight
                        ?.message
                    }
                    className="repairs-form-field"
                    inputProps={{
                      step: "0.001",
                      min: 0,
                    }}
                    slotProps={{
                      input: {
                        startAdornment:
                          (
                            <InputAdornment position="start">
                              <ScaleIcon
                                sx={{
                                  color:
                                    "#c9a44c",
                                  fontSize: 20,
                                }}
                              />
                            </InputAdornment>
                          ),
                      },
                    }}
                  />
                </Grid>

                {/* العيار */}

                <Grid
                  item
                  xs={12}
                  sm={4}
                >
                  <Controller
                    name="karat"
                    control={control}
                    render={({
                      field,
                    }) => (
                      <TextField
                        {...field}
                        value={
                          field.value ??
                          ""
                        }
                        onChange={(
                          e
                        ) =>
                          field.onChange(
                            e.target.value
                          )
                        }
                        fullWidth
                        select
                        label="العيار"
                        margin="dense"
                        error={
                          !!errors.karat
                        }
                        helperText={
                          errors.karat
                            ?.message
                        }
                        className="repairs-form-field"
                        slotProps={{
                          input: {
                            startAdornment:
                              (
                                <InputAdornment position="start">
                                  <DiamondIcon
                                    sx={{
                                      color:
                                        "#c9a44c",
                                      fontSize: 20,
                                    }}
                                  />
                                </InputAdornment>
                              ),
                          },
                        }}
                      >
                        <MenuItem value="">
                          — بدون تحديد —
                        </MenuItem>

                        {KARAT_OPTIONS.map(
                          (
                            option
                          ) => (
                            <MenuItem
                              key={
                                option
                              }
                              value={
                                option
                              }
                            >
                              {
                                option
                              }
                            </MenuItem>
                          )
                        )}
                      </TextField>
                    )}
                  />
                </Grid>

                {/* العدد */}

                <Grid
                  item
                  xs={12}
                  sm={4}
                >
                  <TextField
                    fullWidth
                    label="العدد"
                    margin="dense"
                    type="number"
                    {...register(
                      "quantity"
                    )}
                    error={
                      !!errors.quantity
                    }
                    helperText={
                      errors.quantity
                        ?.message
                    }
                    className="repairs-form-field"
                    inputProps={{
                      min: 1,
                    }}
                    slotProps={{
                      input: {
                        startAdornment:
                          (
                            <InputAdornment position="start">
                              <NumbersIcon
                                sx={{
                                  color:
                                    "#c9a44c",
                                  fontSize: 20,
                                }}
                              />
                            </InputAdornment>
                          ),
                      },
                    }}
                  />
                </Grid>
              </Grid>

              {/* =================================================
                  صور التصليح
              ================================================= */}

              <Typography className="repairs-section-title">
                صور التصليح
              </Typography>

              <Divider className="repairs-section-divider" />

              <Grid
                container
                spacing={2}
                sx={{
                  mb: 3,
                }}
              >
                <Grid
                  item
                  xs={12}
                >
                  <Box className="repairs-images-upload-container">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      multiple
                      onChange={
                        handleImagesChange
                      }
                      style={{
                        display: "none",
                      }}
                      id="repair-images-input"
                    />

                    {imagePreviews.length >
                      0 && (
                      <Box className="repairs-images-grid">
                        {imagePreviews.map(
                          (
                            preview,
                            index
                          ) => (
                            <Box
                              key={
                                preview.id ||
                                preview.url
                              }
                              className="repairs-image-preview-wrapper"
                            >
                              <img
                                src={
                                  preview.url
                                }
                                alt={`صورة ${
                                  index +
                                  1
                                }`}
                                className="repairs-image-preview"
                              />

                              <IconButton
                                className="repairs-image-remove-btn"
                                onClick={() =>
                                  handleRemoveImage(
                                    index
                                  )
                                }
                                size="small"
                                title="إزالة الصورة"
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          )
                        )}
                      </Box>
                    )}

                    {imagePreviews.length <
                      MAX_IMAGES && (
                      <label
                        htmlFor="repair-images-input"
                        className="repairs-image-upload-label"
                      >
                        <AddPhotoAlternateIcon
                          sx={{
                            fontSize: 40,
                            color:
                              "#c9a44c",
                          }}
                        />

                        <Typography className="repairs-image-upload-text">
                          إضافة صور (
                          {
                            imagePreviews.length
                          }
                          /
                          {MAX_IMAGES})
                        </Typography>

                        <Typography className="repairs-image-upload-hint">
                          JPG, PNG, WEBP
                          — بحد أقصى
                          5MB لكل صورة
                        </Typography>
                      </label>
                    )}
                  </Box>
                </Grid>
              </Grid>

              {/* العمل المطلوب */}

              <Typography className="repairs-section-title">
                العمل المطلوب
              </Typography>

              <Divider className="repairs-section-divider" />

              <Grid
                container
                spacing={2}
                sx={{
                  mb: 3,
                }}
              >
                <Grid
                  item
                  xs={12}
                >
                  <TextField
                    fullWidth
                    label="العمل المطلوب"
                    margin="dense"
                    multiline
                    rows={2}
                    {...register(
                      "requiredWork"
                    )}
                    error={
                      !!errors.requiredWork
                    }
                    helperText={
                      errors.requiredWork
                        ?.message
                    }
                    className="repairs-form-field"
                    slotProps={{
                      input: {
                        startAdornment:
                          (
                            <InputAdornment
                              position="start"
                              sx={{
                                alignSelf:
                                  "flex-start",
                                mt: 1.5,
                              }}
                            >
                              <BuildIcon
                                sx={{
                                  color:
                                    "#c9a44c",
                                  fontSize: 20,
                                }}
                              />
                            </InputAdornment>
                          ),
                      },
                    }}
                  />
                </Grid>
              </Grid>

              {/* الملاحظات */}

              <Typography className="repairs-section-title">
                ملاحظات
              </Typography>

              <Divider className="repairs-section-divider" />

              <Grid
                container
                spacing={2}
                sx={{
                  mb: 3,
                }}
              >
                <Grid
                  item
                  xs={12}
                >
                  <TextField
                    fullWidth
                    label="ملاحظات عامة"
                    margin="dense"
                    multiline
                    rows={2}
                    {...register(
                      "notes"
                    )}
                    error={
                      !!errors.notes
                    }
                    helperText={
                      errors.notes
                        ?.message
                    }
                    className="repairs-form-field"
                  />
                </Grid>
              </Grid>

              {/* =================================================
                  الاستلام والتسليم
              ================================================= */}

              <Typography className="repairs-section-title">
                الاستلام والتسليم
              </Typography>

              <Divider className="repairs-section-divider" />

              <Grid
                container
                spacing={2}
              >

                {/* فرع التسليم */}

                <Grid
                  item
                  xs={12}
                  sm={6}
                >
                  <Controller
                    name="deliveryBranchId"
                    control={control}
                    render={({
                      field,
                    }) => (
                      <TextField
                        {...field}
                        value={
                          field.value ===
                            undefined ||
                          field.value ===
                            null
                            ? ""
                            : field.value
                        }
                        onChange={(
                          e
                        ) =>
                          field.onChange(
                            e.target.value
                          )
                        }
                        fullWidth
                        select
                        label="فرع التسليم للعميل"
                        margin="dense"
                        error={
                          !!errors.deliveryBranchId
                        }
                        helperText={
                          errors
                            .deliveryBranchId
                            ?.message
                        }
                        className="repairs-form-field"
                      >
                        <MenuItem value="">
                          — اختر فرعاً —
                        </MenuItem>

                        {availableBranches.length ===
                        0 ? (
                          <MenuItem
                            value=""
                            disabled
                          >
                            لا توجد فروع
                            نشطة متاحة
                          </MenuItem>
                        ) : (
                          availableBranches.map(
                            (b) => (
                              <MenuItem
                                key={
                                  b.id
                                }
                                value={
                                  b.id
                                }
                              >
                                {
                                  b.name
                                }{" "}
                                {b.code
                                  ? `(${b.code})`
                                  : ""}
                              </MenuItem>
                            )
                          )
                        )}
                      </TextField>
                    )}
                  />
                </Grid>

                {/* الموظف المستلم */}

                <Grid
                  item
                  xs={12}
                  sm={6}
                >
                  <Controller
                    name="customerReceiverEmployeeId"
                    control={
                      control
                    }
                    render={({
                      field,
                    }) => (
                      <TextField
                        {...field}
                        value={
                          field.value ===
                            undefined ||
                          field.value ===
                            null
                            ? ""
                            : field.value
                        }
                        onChange={(
                          e
                        ) =>
                          field.onChange(
                            e.target.value
                          )
                        }
                        fullWidth
                        select
                        label="الموظف المستلم من العميل"
                        margin="dense"
                        error={
                          !!errors.customerReceiverEmployeeId
                        }
                        helperText={
                          errors
                            .customerReceiverEmployeeId
                            ?.message
                        }
                        className="repairs-form-field"
                      >
                        <MenuItem value="">
                          — اختر موظفاً —
                        </MenuItem>

                        {!userBranchId ? (
                          <MenuItem
                            value=""
                            disabled
                          >
                            أنت غير مرتبط
                            بفرع
                          </MenuItem>
                        ) : employees.length ===
                          0 ? (
                          <MenuItem
                            value=""
                            disabled
                          >
                            لا يوجد موظفون
                            نشطون في
                            فرعك
                          </MenuItem>
                        ) : (
                          employees.map(
                            (
                              emp
                            ) => (
                              <MenuItem
                                key={
                                  emp.id
                                }
                                value={
                                  emp.id
                                }
                              >
                                {
                                  emp.fullName
                                }
                              </MenuItem>
                            )
                          )
                        )}
                      </TextField>
                    )}
                  />
                </Grid>
              </Grid>
            </>
          )}

          {/* =================================================
              Actions
          ================================================= */}

          <Box className="repairs-create-actions">

            <Button
              variant="outlined"
              onClick={() =>
                navigate(
                  isEditMode
                    ? `/repairs/${editId}`
                    : "/repairs/list"
                )
              }
              disabled={saving}
              className="repairs-create-cancel"
              startIcon={
                <CloseIcon />
              }
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
                  <CircularProgress
                    size={16}
                    sx={{
                      color:
                        "#fff",
                    }}
                  />
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

// =====================================================
// Main Component
// =====================================================

export default function CreateRepairOrder() {
  const navigate =
    useNavigate();

  // ===================================================
  // دعم جميع أسماء Route Parameters
  // ===================================================

  const params =
    useParams();

  const editId =
    params.id ??
    params.repairId ??
    params.orderId ??
    null;

  const isEditMode =
    !!editId;

  const currentUser =
    useAuthStore(
      (state) => state.user
    );

  const userRoles = useMemo(
    () =>
      currentUser?.roles?.map(
        (r) => r.name
      ) || [],
    [currentUser]
  );

  const userBranchId =
    currentUser?.branchId;

  // ===================================================
  // الفروع
  // ===================================================

  const {
    data: branches = [],
  } = useBranchLookup();

  const availableBranches =
    useMemo(() => {
      return branches.filter(
        (b) =>
          b.isActive !==
          false
      );
    }, [branches]);

  // ===================================================
  // Mutations
  // ===================================================

  const createMutation =
    useCreateRepairOrder();

  const updateMutation =
    useUpdateRepairOrder();

  // ===================================================
  // الطلب الحالي
  // ===================================================

  const {
    data: existingOrder,
    isLoading:
      loadingOrder,
  } = useRepairOrderById(
    editId,
    {
      enabled:
        isEditMode,
    }
  );

  // ===================================================
  // صلاحية الفرع
  // ===================================================

  const isBranchEditor =
    useMemo(
      () =>
        canEditAsBranch(
          userRoles
        ),
      [userRoles]
    );

  // ===================================================
  // صلاحية المشغل
  // ===================================================

  const isOperatorEditor =
    useMemo(
      () =>
        canEditAsOperator(
          userRoles,
          existingOrder?.status
        ),
      [
        userRoles,
        existingOrder?.status,
      ]
    );

  const isOperatorForm =
    isEditMode &&
    isOperatorEditor;

  // ===================================================
  // التحقق من صلاحية التعديل
  // ===================================================

  useEffect(() => {
    if (
      !isEditMode ||
      !existingOrder
    ) {
      return;
    }

    const allowed =
      canEditRepair(
        userRoles,
        existingOrder.status,
        existingOrder.movements ||
          []
      );

    if (!allowed) {
      toast.error(
        "لا تملك صلاحية تعديل هذه التصليحة في حالتها الحالية",
        {
          ...PERSISTENT_TOAST,
          toastId:
            "edit-not-allowed",
        }
      );

      navigate(
        `/repairs/${editId}`,
        {
          replace: true,
        }
      );
    }
  }, [
    isEditMode,
    existingOrder,
    userRoles,
    navigate,
    editId,
  ]);

  // ===================================================
  // الموظفين
  // ===================================================

  const {
    data: employees = [],
  } =
    useBranchEmployees(
      userBranchId,
      {
        enabled:
          !!userBranchId,
      }
    );

  // ===================================================
  // Loading
  // ===================================================

  if (
    isEditMode &&
    (loadingOrder ||
      !existingOrder)
  ) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent:
            "center",
          alignItems:
            "center",
          minHeight:
            "60vh",
        }}
      >
        <CircularProgress
          sx={{
            color:
              "#b8860b",
          }}
        />
      </Box>
    );
  }

  // ===================================================
  // Form
  // ===================================================

  return (
    <RepairFormInner
      key={
        editId ||
        "new"
      }
      isEditMode={
        isEditMode
      }
      editId={
        editId
      }
      existingOrder={
        existingOrder
      }
      isOperatorForm={
        isOperatorForm
      }
      isBranchEditor={
        isBranchEditor
      }
      userBranchId={
        userBranchId
      }
      availableBranches={
        availableBranches
      }
      employees={
        employees
      }
      createMutation={
        createMutation
      }
      updateMutation={
        updateMutation
      }
      navigate={
        navigate
      }
    />
  );
}