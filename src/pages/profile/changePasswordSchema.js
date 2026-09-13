import * as yup from "yup";

const changePasswordSchema = yup.object({
  currentPassword: yup
    .string()
    .required("كلمة المرور الحالية مطلوبة"),

  newPassword: yup
    .string()
    .min(6, "كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل")
    .required("كلمة المرور الجديدة مطلوبة"),

  confirmNewPassword: yup
    .string()
    .oneOf(
      [yup.ref("newPassword"), null],
      "كلمتا المرور الجديدتان غير متطابقتين"
    )
    .required("تأكيد كلمة المرور مطلوب"),
});

export default changePasswordSchema;