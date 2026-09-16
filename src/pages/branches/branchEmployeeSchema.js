import * as yup from "yup";

const branchEmployeeSchema = yup.object({
  fullName: yup
    .string()
    .trim()
    .required("اسم الموظف مطلوب")
    .min(2, "اسم الموظف يجب أن يكون حرفين على الأقل")
    .max(100, "اسم الموظف يجب ألا يتجاوز 100 حرف"),
});

export default branchEmployeeSchema;