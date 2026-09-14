import * as yup from "yup";

const branchSchema = yup.object({
  name: yup
    .string()
    .trim()
    .required("اسم الفرع مطلوب")
    .min(2, "اسم الفرع يجب أن يكون حرفين على الأقل")
    .max(100, "اسم الفرع يجب ألا يتجاوز 100 حرف"),

  code: yup
    .string()
    .trim()
    .required("كود الفرع مطلوب")
    .min(2, "كود الفرع يجب أن يكون حرفين على الأقل")
    .max(10, "كود الفرع يجب ألا يتجاوز 10 أحرف")
    .matches(
      /^[A-Za-z0-9-]+$/,
      "كود الفرع يقبل الأحرف الإنجليزية والأرقام والشرطة فقط"
    ),

  address: yup
    .string()
    .trim()
    .max(200, "العنوان يجب ألا يتجاوز 200 حرف"),

  phoneNumber: yup
    .string()
    .trim()
    .max(10, "رقم الهاتف يجب ألا يتجاوز 10 خانة")
    .matches(
      /^[0-9]*$/,
      "رقم الهاتف يجب أن يحتوي على أرقام فقط"
    ),

  isActive: yup.boolean(),
});

export default branchSchema;