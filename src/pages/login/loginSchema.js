import * as yup from "yup";

const loginSchema = yup.object({
  UserNameOrEmail: yup
    .string()
    .trim()
    .required(
      "اسم المستخدم أو البريد الإلكتروني مطلوب"
    ),

  Password: yup
    .string()
    .required("كلمة المرور مطلوبة"),
});

export default loginSchema;