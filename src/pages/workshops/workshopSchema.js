import * as yup from "yup";

const workshopSchema = yup.object({
  name: yup
    .string()
    .trim()
    .required("اسم الورشة مطلوب")
    .min(2, "اسم الورشة يجب أن يكون حرفين على الأقل")
    .max(100, "اسم الورشة يجب ألا يتجاوز 100 حرف"),

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

export default workshopSchema;