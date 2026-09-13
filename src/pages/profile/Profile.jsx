import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Divider,
  CircularProgress,
} from "@mui/material";
import { toast } from "react-toastify";

import PersonIcon from "@mui/icons-material/Person";
import BadgeIcon from "@mui/icons-material/Badge";
import TagIcon from "@mui/icons-material/Tag";
import ShieldIcon from "@mui/icons-material/Shield";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";

import authService from "../../services/authService.js";
import useAuthStore from "../../store/useAuthStore.js";
import "../../styles/profile.css";

export default function Profile() {
  const userFromStore = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);

  const [loading, setLoading] = useState(!userFromStore);
  const [user, setLocalUser] = useState(userFromStore || null);

  // ===============================
  // جلب بيانات المستخدم
  // ===============================
  useEffect(() => {
    let mounted = true;

    const fetchUser = async () => {
      try {
        setLoading(true);
        const result = await authService.getCurrentUser();

        if (!mounted) return;

        if (result?.success && result?.data) {
          setLocalUser(result.data);
          setUser(result.data);
        } else {
          toast.error(result?.message || "تعذر جلب بيانات المستخدم");
        }
      } catch (error) {
        console.error("Fetch User Error:", error);
        if (mounted) {
          toast.error(
            error?.response?.data?.message || "حدث خطأ أثناء جلب البيانات"
          );
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchUser();

    return () => {
      mounted = false;
    };
  }, [setUser]);

  // ===============================
  // استخراج الصلاحية الأولى
  // ===============================
  const getRoleDisplayName = () => {
    if (!user?.roles || user.roles.length === 0) return "—";
    return user.roles[0]?.displayName || user.roles[0]?.name || "—";
  };

  // ===============================
  // Loading
  // ===============================
  if (loading) {
    return (
      <Box className="profile-loading">
        <CircularProgress sx={{ color: "#b8860b" }} />
      </Box>
    );
  }

  // ===============================
  // البيانات للعرض
  // ===============================
  const profileData = [
    {
      label: "اسم الموظف",
      value: user?.fullName || "—",
      icon: <PersonIcon />,
    },
    {
      label: "اسم المستخدم",
      value: user?.userName || "—",
      icon: <BadgeIcon />,
    },
    {
      label: "البريد الإلكتروني",
      value: user?.email ? user.email : "—",
      icon: <TagIcon />,
      isId: true,
    },
    {
      label: "الصلاحيات",
      value: getRoleDisplayName(),
      icon: <ShieldIcon />,
    },
  ];

  return (
    <div className="profile-container">
      {/* ===============================
          العنوان الرئيسي
      =============================== */}
      <div className="profile-header">
        <div className="profile-header-icon">
          <AccountCircleIcon sx={{ fontSize: 36 }} />
        </div>

        <Typography className="profile-title">حسابي</Typography>

        {/* خطان زخرفيان حول العنوان */}
        <div className="profile-title-decor">
          <span className="profile-title-line" />
          <Typography className="profile-subtitle">
            معلومات المستخدم
          </Typography>
          <span className="profile-title-line" />
        </div>
      </div>

      {/* ===============================
          كارت المعلومات
      =============================== */}
      <Paper elevation={0} className="profile-card">
        {profileData.map((item, index) => (
          <div key={item.label}>
            <div className="profile-row">
              {/* القيمة (يمين) */}
              <Typography
                className={`profile-value ${item.isId ? "profile-value-id" : ""}`}
              >
                {item.value}
              </Typography>

              {/* الليبل (يسار) */}
              <div className="profile-label">
                <span className="profile-label-text">{item.label}:</span>
                <span className="profile-label-icon">{item.icon}</span>
              </div>
            </div>

            {index < profileData.length - 1 && (
              <Divider className="profile-divider" />
            )}
          </div>
        ))}
      </Paper>
    </div>
  );
}