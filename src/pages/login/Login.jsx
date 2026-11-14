import { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import companyLogo from "../../assets/Logo.svg";

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

import style from "../../styles/Auth/Login.module.css";

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
    defaultValues: {
      UserNameOrEmail: "",
      Password: "",
    },
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

      toast.error(
        error?.response?.data?.message ||
          "حدث خطأ أثناء تسجيل الدخول"
      );
    }
  };

  return (
    <Box
      dir="rtl"
      className={`${style.loginPage} ${
        darkMode ? style.darkMode : ""
      }`}
    >
      {/* Background Decorations */}
      <div className={style.backgroundDecoration}>
        <span className={style.circleTop} />
        <span className={style.circleBottom} />
        <span className={style.circleBottomInner} />
      </div>

      {/* Theme Switch */}
      <div className={style.themeSwitcher}>
        <IconButton
          type="button"
          onClick={() => setDarkMode(false)}
          className={`${style.themeButton} ${
            !darkMode ? style.activeTheme : ""
          }`}
          aria-label="الوضع النهاري"
          title="الوضع النهاري"
        >
          <LightModeIcon />
        </IconButton>

        <IconButton
          type="button"
          onClick={() => setDarkMode(true)}
          className={`${style.themeButton} ${
            darkMode ? style.activeTheme : ""
          }`}
          aria-label="الوضع الليلي"
          title="الوضع الليلي"
        >
          <DarkModeIcon />
        </IconButton>
      </div>

      {/* Main Content */}
      <div className={style.loginContent}>
        {/* Company Branding */}
        <div className={style.brandSection}>
          <div className={style.logoWrapper}>
            <img
              src={companyLogo}
              alt="مجموعة عايد دعنا"
              className={style.companyLogo}
            />
          </div>

          <Typography className={style.companyName}>
            مجموعة عايد دعنا
          </Typography>

          <Typography className={style.companySubtitle}>
            نظام إدارة ومتابعة التصليحات
          </Typography>
        </div>

        {/* Login Card */}
        <Paper
          elevation={0}
          className={style.loginCard}
        >
          <div className={style.cardHeader}>
            <div className={style.loginIconWrapper}>
              <LoginIcon />
            </div>

            <Typography className={style.cardTitle}>
              مرحباً بعودتك
            </Typography>

            <Typography className={style.cardSubtitle}>
              سجل الدخول للمتابعة إلى حسابك
            </Typography>
          </div>

          {/* Login Form */}
          <Box
            component="form"
            onSubmit={handleSubmit(onSubmit)}
            className={style.loginForm}
            noValidate
          >
            {/* Username */}
            <div className={style.formGroup}>
              <Typography className={style.fieldLabel}>
                اسم المستخدم
              </Typography>

              <TextField
                fullWidth
                placeholder="أدخل اسم المستخدم"
                autoComplete="username"
                {...register("UserNameOrEmail")}
                error={!!errors.UserNameOrEmail}
                helperText={errors.UserNameOrEmail?.message}
                className={style.loginInput}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon />
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </div>

            {/* Password */}
            <div className={style.formGroup}>
              <Typography className={style.fieldLabel}>
                كلمة المرور
              </Typography>

              <TextField
                fullWidth
                type={showPassword ? "text" : "password"}
                placeholder="أدخل كلمة المرور"
                autoComplete="current-password"
                {...register("Password")}
                error={!!errors.Password}
                helperText={errors.Password?.message}
                className={style.loginInput}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockOutlinedIcon />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          type="button"
                          onClick={() =>
                            setShowPassword((prev) => !prev)
                          }
                          edge="end"
                          size="small"
                          aria-label={
                            showPassword
                              ? "إخفاء كلمة المرور"
                              : "إظهار كلمة المرور"
                          }
                        >
                          {showPassword ? (
                            <VisibilityOffIcon />
                          ) : (
                            <VisibilityIcon />
                          )}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </div>

            {/* Submit */}
            <Button
              type="submit"
              fullWidth
              disabled={isSubmitting}
              className={style.loginButton}
            >
              {isSubmitting ? (
                <>
                  <CircularProgress
                    size={19}
                    className={style.loadingIcon}
                  />
                  <span>جاري تسجيل الدخول...</span>
                </>
              ) : (
                <>
                  <LoginIcon />
                  <span>تسجيل الدخول</span>
                </>
              )}
            </Button>
          </Box>

          <div className={style.cardFooter}>
            <span className={style.footerLine} />
            <Typography className={style.footerText}>
              نظام مجموعة عايد دعنا
            </Typography>
            <span className={style.footerLine} />
          </div>
        </Paper>

        {/* Footer */}
        <Typography className={style.pageFooter}>
          جميع الحقوق محفوظة © مجموعة عايد دعنا
        </Typography>
      </div>
    </Box>
  );
}