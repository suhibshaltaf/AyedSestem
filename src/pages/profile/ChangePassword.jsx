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
import "../../styles/change-password.css";

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

  // ===============================
  // إرسال الطلب
  // ===============================
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

  return (
    <div className="change-password-container">
      {/* ===============================
          Header
      =============================== */}
      <div className="change-password-header">
        <div className="change-password-icon-wrapper">
          <LockResetIcon sx={{ fontSize: 32 }} />
        </div>

        <Typography className="change-password-title">
          تغيير كلمة المرور
        </Typography>

        <Typography className="change-password-subtitle">
          أدخل كلمة المرور الحالية والجديدة
        </Typography>
      </div>

      {/* ===============================
          Card
      =============================== */}
      <Paper elevation={0} className="change-password-card">
        <Box
          component="form"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          sx={{ textAlign: "right" }}
        >
          {/* ===============================
              Current Password
          =============================== */}
          <TextField
            fullWidth
            type={showCurrent ? "text" : "password"}
            label="كلمة المرور الحالية"
            margin="normal"
            autoComplete="current-password"
            {...register("currentPassword")}
            error={!!errors.currentPassword}
            helperText={errors.currentPassword?.message}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlinedIcon
                      sx={{ color: "#c9a44c", fontSize: 20 }}
                    />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowCurrent((p) => !p)}
                      edge="end"
                      size="small"
                      type="button"
                    >
                      {showCurrent ? (
                        <VisibilityOffIcon
                          sx={{ fontSize: 20, color: "#b0b0b0" }}
                        />
                      ) : (
                        <VisibilityIcon
                          sx={{ fontSize: 20, color: "#b0b0b0" }}
                        />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />

          {/* ===============================
              New Password
          =============================== */}
          <TextField
            fullWidth
            type={showNew ? "text" : "password"}
            label="كلمة المرور الجديدة"
            margin="normal"
            autoComplete="new-password"
            {...register("newPassword")}
            error={!!errors.newPassword}
            helperText={errors.newPassword?.message}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <CheckCircleIcon
                      sx={{ color: "#c9a44c", fontSize: 20 }}
                    />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowNew((p) => !p)}
                      edge="end"
                      size="small"
                      type="button"
                    >
                      {showNew ? (
                        <VisibilityOffIcon
                          sx={{ fontSize: 20, color: "#b0b0b0" }}
                        />
                      ) : (
                        <VisibilityIcon
                          sx={{ fontSize: 20, color: "#b0b0b0" }}
                        />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />

          {/* ===============================
              Confirm Password
          =============================== */}
          <TextField
            fullWidth
            type={showConfirm ? "text" : "password"}
            label="تأكيد كلمة المرور الجديدة"
            margin="normal"
            autoComplete="new-password"
            {...register("confirmNewPassword")}
            error={!!errors.confirmNewPassword}
            helperText={errors.confirmNewPassword?.message}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <CheckCircleIcon
                      sx={{ color: "#c9a44c", fontSize: 20 }}
                    />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowConfirm((p) => !p)}
                      edge="end"
                      size="small"
                      type="button"
                    >
                      {showConfirm ? (
                        <VisibilityOffIcon
                          sx={{ fontSize: 20, color: "#b0b0b0" }}
                        />
                      ) : (
                        <VisibilityIcon
                          sx={{ fontSize: 20, color: "#b0b0b0" }}
                        />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />

          {/* ===============================
              Actions
          =============================== */}
          <div className="change-password-actions">
            <Button
              variant="outlined"
              onClick={() => navigate("/dashboard")}
              className="change-password-cancel"
              disabled={isSubmitting}
            >
              إلغاء
            </Button>

            <Button
              type="submit"
              variant="contained"
              disabled={isSubmitting}
              className="change-password-submit"
              startIcon={
                isSubmitting ? (
                  <CircularProgress size={16} sx={{ color: "#fff" }} />
                ) : (
                  <ArrowForwardIcon />
                )
              }
            >
              {isSubmitting ? "جاري الحفظ..." : "حفظ التغييرات"}
            </Button>
          </div>
        </Box>
      </Paper>
    </div>
  );
}