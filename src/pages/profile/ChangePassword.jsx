
import { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  InputAdornment,
  IconButton,
  CircularProgress,
} from "@mui/material";

import LockResetIcon from "@mui/icons-material/LockReset";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

import authService from "../../services/authService.js";
import changePasswordSchema from "../../pages/profile/changePasswordSchema.js";

import styles from "../../styles/profile/ChangePassword.module.css";

export default function ChangePassword() {
  const navigate = useNavigate();

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    resolver: yupResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  // ======================================
  // إرسال الطلب
  // ======================================

  const onSubmit = async (data) => {
    try {
      const payload = {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
        confirmNewPassword: data.confirmNewPassword,
      };

      const result = await authService.changePassword(payload);

      if (result?.success) {
        toast.success(result?.message || "تم تغيير كلمة المرور بنجاح");

        reset();

        setTimeout(() => navigate("/dashboard"), 1500);
      } else {
        toast.error(result?.message || "فشل تغيير كلمة المرور");
      }
    } catch (error) {
      console.error("Change Password Error:", error);

      const status = error?.response?.status;
      const serverMsg = error?.response?.data?.message;

      if (status === 400) {
        toast.error(serverMsg || "كلمة المرور الحالية غير صحيحة");
        return;
      }

      if (status === 401) {
        toast.error("غير مصرح لك بالدخول");
        return;
      }

      if (status >= 500) {
        toast.error("حدث خطأ في الخادم، حاول لاحقاً");
        return;
      }

      if (!error?.response) {
        toast.error("تعذر الاتصال بالخادم");
        return;
      }

      toast.error(serverMsg || "حدث خطأ أثناء تغيير كلمة المرور");
    }
  };

  // ======================================
  // إظهار / إخفاء كلمة المرور
  // ======================================

  const renderPasswordToggle = (visible, toggle) => (
    <InputAdornment position="end">
      <IconButton
        onClick={toggle}
        edge="end"
        size="small"
        type="button"
        aria-label={visible ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
      >
        {visible ? (
          <VisibilityOffIcon />
        ) : (
          <VisibilityIcon />
        )}
      </IconButton>
    </InputAdornment>
  );

  return (
    <Box className={styles.changePasswordContainer} dir="rtl">

      {/* Header */}

      <Box className={styles.changePasswordHeader}>
        <Box className={styles.changePasswordIconWrapper}>
          <LockResetIcon />
        </Box>

        <Typography className={styles.changePasswordTitle}>
          تغيير كلمة المرور
        </Typography>

        <Typography className={styles.changePasswordSubtitle}>
          قم بتحديث كلمة المرور الخاصة بحسابك للحفاظ على أمانه
        </Typography>

        <Box className={styles.changePasswordTitleDecor}>
          <span className={styles.changePasswordTitleLine} />

          <Typography className={styles.changePasswordDecorText}>
            إعدادات الأمان
          </Typography>

          <span className={styles.changePasswordTitleLine} />
        </Box>
      </Box>

      {/* Form Card */}

      <Paper
        elevation={0}
        className={styles.changePasswordCard}
      >
        <Box
          component="form"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className={styles.changePasswordForm}
        >

          {/* Current Password */}

          <Box className={styles.changePasswordField}>
            <TextField
              fullWidth
              type={showCurrent ? "text" : "password"}
              label="كلمة المرور الحالية"
              autoComplete="current-password"
              {...register("currentPassword")}
              error={!!errors.currentPassword}
              helperText={errors.currentPassword?.message}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlinedIcon />
                    </InputAdornment>
                  ),
                  endAdornment: renderPasswordToggle(
                    showCurrent,
                    () => setShowCurrent((prev) => !prev)
                  ),
                },
              }}
            />
          </Box>

          {/* New Password */}

          <Box className={styles.changePasswordField}>
            <TextField
              fullWidth
              type={showNew ? "text" : "password"}
              label="كلمة المرور الجديدة"
              autoComplete="new-password"
              {...register("newPassword")}
              error={!!errors.newPassword}
              helperText={errors.newPassword?.message}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <CheckCircleIcon />
                    </InputAdornment>
                  ),
                  endAdornment: renderPasswordToggle(
                    showNew,
                    () => setShowNew((prev) => !prev)
                  ),
                },
              }}
            />
          </Box>

          {/* Confirm Password */}

          <Box className={styles.changePasswordField}>
            <TextField
              fullWidth
              type={showConfirm ? "text" : "password"}
              label="تأكيد كلمة المرور الجديدة"
              autoComplete="new-password"
              {...register("confirmNewPassword")}
              error={!!errors.confirmNewPassword}
              helperText={errors.confirmNewPassword?.message}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <CheckCircleIcon />
                    </InputAdornment>
                  ),
                  endAdornment: renderPasswordToggle(
                    showConfirm,
                    () => setShowConfirm((prev) => !prev)
                  ),
                },
              }}
            />
          </Box>

          {/* Actions */}

          <Box className={styles.changePasswordActions}>
            <Button
              variant="outlined"
              onClick={() => navigate("/dashboard")}
              className={styles.changePasswordCancel}
              disabled={isSubmitting}
            >
              إلغاء
            </Button>

            <Button
              type="submit"
              variant="contained"
              disabled={isSubmitting}
              className={styles.changePasswordSubmit}
              startIcon={
                isSubmitting ? (
                  <CircularProgress
                    size={17}
                    sx={{ color: "#fff" }}
                  />
                ) : (
                  <ArrowForwardIcon />
                )
              }
            >
              {isSubmitting ? "جاري الحفظ..." : "حفظ التغييرات"}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}
