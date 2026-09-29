import * as yup from "yup";

const repairOrderSchema = yup.object({
  customerName: yup
    .string()
    .trim()
    .required("اسم العميل مطلوب")
    .min(
      2,
      "اسم العميل يجب أن يكون حرفين على الأقل"
    )
    .max(
      100,
      "اسم العميل يجب ألا يتجاوز 100 حرف"
    ),

  customerPhone: yup
    .string()
    .trim()
    .required("رقم الهاتف مطلوب")
    .matches(
      /^[0-9]+$/,
      "رقم الهاتف يجب أن يحتوي على أرقام فقط"
    )
    .min(
      7,
      "رقم الهاتف يجب أن يكون 7 أرقام على الأقل"
    )
    .max(
      20,
      "رقم الهاتف يجب ألا يتجاوز 20 رقم"
    ),

  description: yup
    .string()
    .trim()
    .required("وصف القطعة مطلوب")
    .min(
      2,
      "الوصف يجب أن يكون حرفين على الأقل"
    )
    .max(
      500,
      "الوصف يجب ألا يتجاوز 500 حرف"
    ),

  weight: yup
    .number()
    .typeError("الوزن يجب أن يكون رقماً")
    .min(
      0.001,
      "الوزن يجب أن يكون أكبر من صفر"
    )
    .required("الوزن مطلوب"),

  // العيار ليس عليه Validation
  karat: yup
    .string()
    .nullable()
    .notRequired(),

  quantity: yup
    .number()
    .typeError("العدد يجب أن يكون رقماً")
    .min(
      1,
      "العدد يجب أن يكون 1 على الأقل"
    )
    .required("العدد مطلوب"),

  requiredWork: yup
    .string()
    .trim()
    .required("العمل المطلوب مطلوب")
    .max(
      1000,
      "العمل المطلوب يجب ألا يتجاوز 1000 حرف"
    ),

  price: yup
    .number()
    .typeError("السعر يجب أن يكون رقماً")
    .min(
      0,
      "السعر لا يمكن أن يكون سالباً"
    )
    .nullable()
    .transform(
      (value, originalValue) =>
        originalValue === "" ||
        originalValue === null
          ? undefined
          : value
    ),

  notes: yup
    .string()
    .trim()
    .max(
      1000,
      "الملاحظات يجب ألا تتجاوز 1000 حرف"
    )
    .notRequired(),

  operatorNotes: yup
    .string()
    .trim()
    .max(
      1000,
      "ملاحظات المشغل يجب ألا تتجاوز 1000 حرف"
    )
    .notRequired(),

  // لا يوجد Validation هنا
  // التحقق يتم فقط عند الإنشاء داخل onSubmit
  deliveryBranchId: yup
    .mixed()
    .nullable()
    .notRequired(),

  // لا يوجد Validation هنا
  // التحقق يتم فقط عند الإنشاء داخل onSubmit
  customerReceiverEmployeeId: yup
    .mixed()
    .nullable()
    .notRequired(),
});

export default repairOrderSchema;