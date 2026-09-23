// src/pages/login/Login.jsx

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import {
  Box,
  Paper,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  Button,
  CircularProgress,
} from "@mui/material";

import PersonIcon from "@mui/icons-material/Person";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import LoginIcon from "@mui/icons-material/Login";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";

import authService from "../../services/authService";
import useAuthStore from "../../store/useAuthStore";
import loginSchema from "./loginSchema";

export default function Login() {
  const navigate = useNavigate();

  const setToken = useAuthStore((state) => state.setToken);
  const setUser = useAuthStore((state) => state.setUser);
  const logout = useAuthStore((state) => state.logout);

  const [showPassword, setShowPassword] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(loginSchema),
    defaultValues: { UserNameOrEmail: "", Password: "" },
  });

  const onSubmit = async (data) => {
    try {
      const result = await authService.login(data);

      if (!result?.success) {
        toast.error(result?.message || "فشل تسجيل الدخول");
        return;
      }

      const accessToken = result?.data?.accessToken;

      if (!accessToken) {
        toast.error("لم يتم استلام رمز تسجيل الدخول من الخادم");
        return;
      }

      setToken(accessToken);

      const currentUserResult = await authService.getCurrentUser();

      if (!currentUserResult?.success || !currentUserResult?.data) {
        logout();
        toast.error("تعذر تحميل بيانات المستخدم");
        return;
      }

      setUser(currentUserResult.data);
      toast.success(result?.message || "تم تسجيل الدخول بنجاح");
      navigate("/dashboard", { replace: true });
    } catch (error) {
      console.error("Login Error:", error);

      if (error?.response?.status === 400) {
        toast.error(
          error?.response?.data?.message ||
            "اسم المستخدم أو البريد الإلكتروني أو كلمة المرور غير صحيحة"
        );
        return;
      }
      if (error?.response?.status === 401) {
        toast.error("غير مصرح لك بالدخول");
        return;
      }
      if (error?.response?.status >= 500) {
        toast.error("حدث خطأ في الخادم، يرجى المحاولة لاحقاً");
        return;
      }
      if (!error?.response) {
        toast.error("تعذر الاتصال بالخادم، تأكد من تشغيل الخادم");
        return;
      }
      toast.error(error?.response?.data?.message || "حدث خطأ أثناء تسجيل الدخول");
    }
  };

  return (
    <Box
      dir="rtl"
      sx={{
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
        backgroundColor: darkMode ? "#1a1510" : "#faf6ee",
        transition: "background-color 0.4s ease",
      }}
    >
      {/* ============================================
          زر تبديل الثيم (شمس + قمر)
      ============================================ */}
      <Box
        sx={{
          position: "absolute",
          top: { xs: 16, sm: 24 },
          right: { xs: 16, sm: 28 },
          display: "flex",
          alignItems: "center",
          gap: 0.8,
          zIndex: 10,
        }}
      >
        {/* شمس (الوضع النهاري) */}
        <Box
          onClick={() => setDarkMode(false)}
          sx={{
            width: 26,
            height: 26,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: darkMode ? "#666" : "#e0b84c",
            cursor: "pointer",
            transition: "color 0.3s ease",
          }}
        >
          <LightModeIcon sx={{ fontSize: 20 }} />
        </Box>

        {/* دائرة القمر (الوضع الليلي) */}
        <Box
          onClick={() => setDarkMode(true)}
          sx={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: darkMode ? "#2b2113" : "#e8c477",
            border: darkMode ? "1px solid #d4af6a" : "none",
            color: darkMode ? "#f4d58a" : "#5a4a1a",
            cursor: "pointer",
            transition: "all 0.3s ease",
          }}
        >
          <DarkModeIcon sx={{ fontSize: 18 }} />
        </Box>
      </Box>

      {/* ============================================
          الخطوط المنحنية الذهبية (الزوايا)
      ============================================ */}

      {/* الزاوية العلوية اليمنى - خط واحد ينحني */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          right: 0,
          width: { xs: 180, sm: 300 },
          height: { xs: 180, sm: 300 },
          pointerEvents: "none",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            top: -100,
            right: -100,
            width: "100%",
            height: "100%",
            borderRadius: "50%",
            border: darkMode
              ? "1px solid rgba(212,175,106,0.25)"
              : "1px solid rgba(200,160,80,0.45)",
          }}
        />
      </Box>

      {/* الزاوية السفلية اليسرى - خطان متوازيان */}
      <Box
        sx={{
          position: "absolute",
          bottom: 0,
          left: 0,
          width: { xs: 220, sm: 340 },
          height: { xs: 220, sm: 340 },
          pointerEvents: "none",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            bottom: -130,
            left: -130,
            width: "100%",
            height: "100%",
            borderRadius: "50%",
            border: darkMode
              ? "1px solid rgba(212,175,106,0.2)"
              : "1px solid rgba(200,160,80,0.4)",
          }}
        />
        <Box
          sx={{
            position: "absolute",
            bottom: -90,
            left: -90,
            width: "85%",
            height: "85%",
            borderRadius: "50%",
            border: darkMode
              ? "1px solid rgba(212,175,106,0.12)"
              : "1px solid rgba(200,160,80,0.28)",
          }}
        />
      </Box>

      {/* ============================================
          المحتوى الرئيسي
      ============================================ */}
      <Box
        sx={{
          width: "100%",
          maxWidth: 420,
          position: "relative",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          px: 2,
        }}
      >
        {/* ============================================
            الشعار AV + اسم المجموعة
        ============================================ */}
        <Box
          sx={{
            mb: 2,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          {/* شعار AV المتشابك */}
          <Box sx={{ width: 60, height: 55, mb: 0.3 }}>
            <svg
              viewBox="0 0 70 60"
              width="60"
              height="55"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="goldGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#d4af6a" />
                  <stop offset="100%" stopColor="#a67c2e" />
                </linearGradient>
              </defs>
              {/* حرف A */}
              <path
                d="M 10 52 L 22 12 L 34 52"
                stroke="url(#goldGrad)"
                strokeWidth="3.5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <line
                x1="16" y1="38" x2="28" y2="38"
                stroke="url(#goldGrad)"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
              {/* حرف V متداخل */}
              <path
                d="M 32 14 L 42 52 L 52 14"
                stroke="url(#goldGrad)"
                strokeWidth="3.5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* خط علوي أفقي صغير (شكل الشعار) */}
              <line
                x1="22" y1="12" x2="42" y2="12"
                stroke="url(#goldGrad)"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
            </svg>
          </Box>

          {/* اسم المجموعة */}
          <Typography
            sx={{
              fontFamily: "'Amiri', 'Cairo', serif",
              fontSize: { xs: "1.4rem", sm: "1.55rem" },
              fontWeight: 700,
              color: darkMode ? "#e6c878" : "#b8860b",
              textAlign: "center",
              lineHeight: 1.4,
              letterSpacing: "0.3px",
            }}
          >
            مجموعة عايد وإخوانه
          </Typography>
        </Box>

        {/* ============================================
            كارت تسجيل الدخول
        ============================================ */}
        <Paper
          elevation={0}
          sx={{
            width: "100%",
            borderRadius: "20px",
            p: { xs: 3, sm: 4 },
            textAlign: "center",
            backgroundColor: darkMode
              ? "rgba(42,34,22,0.9)"
              : "rgba(255,255,255,0.55)",
            border: darkMode
              ? "1px solid rgba(212,175,106,0.2)"
              : "1px solid rgba(200,160,80,0.3)",
            boxShadow: darkMode
              ? "0 8px 30px rgba(0,0,0,0.4)"
              : "0 6px 24px rgba(200,160,80,0.08)",
            backdropFilter: "blur(14px)",
            transition: "all 0.4s ease",
          }}
        >
          {/* العنوان الرئيسي */}
          <Typography
            sx={{
              fontWeight: 700,
              color: darkMode ? "#e6c878" : "#8b6914",
              mb: 0.5,
              fontSize: "1.25rem",
              fontFamily: "'Cairo', sans-serif",
            }}
          >
            مرحباً بعودتك
          </Typography>

          {/* الوصف */}
          <Typography
            sx={{
              color: darkMode ? "#aaa" : "#999",
              mb: 3.5,
              fontSize: "0.78rem",
              fontFamily: "'Cairo', sans-serif",
            }}
          >
            سجل الدخول لمتابعة حسابك
          </Typography>

          {/* النموذج */}
          <Box
            component="form"
            onSubmit={handleSubmit(onSubmit)}
            sx={{ textAlign: "right" }}
            noValidate
          >
            {/* حقل اسم المستخدم */}
            <TextField
              fullWidth
              placeholder="اسم المستخدم"
              margin="dense"
              autoComplete="username"
              {...register("UserNameOrEmail")}
              error={!!errors.UserNameOrEmail}
              helperText={errors.UserNameOrEmail?.message}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon
                        sx={{
                          color: "#c9a44c",
                          fontSize: 20,
                        }}
                      />
                    </InputAdornment>
                  ),
                },
              }}
              sx={{
                mb: 1.5,
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                  backgroundColor: darkMode
                    ? "rgba(255,255,255,0.05)"
                    : "#ffffff",
                  fontSize: "0.88rem",
                  height: 48,
                  "& fieldset": {
                    borderColor: darkMode
                      ? "rgba(212,175,106,0.25)"
                      : "rgba(200,160,80,0.4)",
                  },
                  "&:hover fieldset": {
                    borderColor: "#c9a44c",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "#b8860b",
                    borderWidth: "1.5px",
                  },
                },
                "& .MuiInputBase-input": {
                  color: darkMode ? "#f1f1f1" : "#3d3d3d",
                  py: 1.3,
                },
                "& .MuiInputBase-input::placeholder": {
                  color: darkMode ? "#888" : "#aaa",
                  opacity: 1,
                  fontSize: "0.85rem",
                },
                "& .MuiFormHelperText-root": {
                  color: "#d32f2f",
                  fontSize: "0.7rem",
                  mt: 0.3,
                },
              }}
            />

            {/* حقل كلمة المرور */}
            <TextField
              fullWidth
              type={showPassword ? "text" : "password"}
              placeholder="كلمة المرور"
              margin="dense"
              autoComplete="current-password"
              {...register("Password")}
              error={!!errors.Password}
              helperText={errors.Password?.message}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlinedIcon
                        sx={{
                          color: "#c9a44c",
                          fontSize: 20,
                        }}
                      />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        edge="end"
                        size="small"
                      >
                        {showPassword ? (
                          <VisibilityOffIcon
                            sx={{ color: "#b0b0b0", fontSize: 20 }}
                          />
                        ) : (
                          <VisibilityIcon
                            sx={{ color: "#b0b0b0", fontSize: 20 }}
                          />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
              sx={{
                mb: 1,
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                  backgroundColor: darkMode
                    ? "rgba(255,255,255,0.05)"
                    : "#ffffff",
                  fontSize: "0.88rem",
                  height: 48,
                  "& fieldset": {
                    borderColor: darkMode
                      ? "rgba(212,175,106,0.25)"
                      : "rgba(200,160,80,0.4)",
                  },
                  "&:hover fieldset": {
                    borderColor: "#c9a44c",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "#b8860b",
                    borderWidth: "1.5px",
                  },
                },
                "& .MuiInputBase-input": {
                  color: darkMode ? "#f1f1f1" : "#3d3d3d",
                  py: 1.3,
                },
                "& .MuiInputBase-input::placeholder": {
                  color: darkMode ? "#888" : "#aaa",
                  opacity: 1,
                  fontSize: "0.85rem",
                },
                "& .MuiFormHelperText-root": {
                  color: "#d32f2f",
                  fontSize: "0.7rem",
                  mt: 0.3,
                },
              }}
            />

            {/* زر تسجيل الدخول */}
            <Button
              type="submit"
              fullWidth
              disabled={isSubmitting}
              sx={{
                mt: 3,
                py: 1.4,
                borderRadius: 2,
                fontSize: "0.95rem",
                fontWeight: 700,
                color: "#fff",
                fontFamily: "'Cairo', sans-serif",
                backgroundColor: darkMode ? "#b8860b" : "#8b6914",
                boxShadow: "0 3px 10px rgba(139,105,20,0.3)",
                "&:hover": {
                  backgroundColor: darkMode ? "#a67c2e" : "#7a5c10",
                  boxShadow: "0 5px 14px rgba(139,105,20,0.4)",
                },
                "&.Mui-disabled": {
                  color: "#fff",
                  backgroundColor: "#c0a068",
                },
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 1.5,
                }}
              >
                {isSubmitting ? (
                  <CircularProgress size={18} sx={{ color: "#fff" }} />
                ) : (
                  <LoginIcon sx={{ fontSize: 20 }} />
                )}
                <span>
                  {isSubmitting ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
                </span>
              </Box>
            </Button>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}
