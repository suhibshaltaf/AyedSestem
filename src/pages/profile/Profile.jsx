
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

import styles from "../../styles/profile/Profile.module.css";

export default function Profile() {
  const userFromStore = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);

  const [loading, setLoading] = useState(!userFromStore);
  const [user, setLocalUser] = useState(userFromStore || null);

  // ======================================
  // جلب بيانات المستخدم
  // ======================================

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
          toast.error(
            result?.message || "تعذر جلب بيانات المستخدم"
          );
        }
      } catch (error) {
        console.error("Fetch User Error:", error);

        if (mounted) {
          toast.error(
            error?.response?.data?.message ||
            "حدث خطأ أثناء جلب البيانات"
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchUser();

    return () => {
      mounted = false;
    };
  }, [setUser]);

  // ======================================
  // استخراج الصلاحية
  // ======================================

  const getRoleDisplayName = () => {
    if (!user?.roles || user.roles.length === 0) {
      return "—";
    }

    return (
      user.roles[0]?.displayName ||
      user.roles[0]?.name ||
      "—"
    );
  };

  // ======================================
  // Loading
  // ======================================

  if (loading) {
    return (
      <Box className={styles.profileLoading}>
        <CircularProgress />
        <Typography>
          جاري تحميل بيانات الحساب...
        </Typography>
      </Box>
    );
  }

  // ======================================
  // بيانات المستخدم
  // ======================================

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
      value: user?.email || "—",
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
    <Box className={styles.profileContainer} dir="rtl">

      {/* Header */}

      <Box className={styles.profileHeader}>
        <Box className={styles.profileHeaderIcon}>
          <AccountCircleIcon />
        </Box>

        <Typography className={styles.profileTitle}>
          حسابي
        </Typography>

        <Typography className={styles.profileDescription}>
          عرض وإدارة معلومات حسابك الشخصي
        </Typography>

        <Box className={styles.profileTitleDecor}>
          <span className={styles.profileTitleLine} />

          <Typography className={styles.profileSubtitle}>
            معلومات المستخدم
          </Typography>

          <span className={styles.profileTitleLine} />
        </Box>
      </Box>

      {/* Profile Card */}

      <Paper
        elevation={0}
        className={styles.profileCard}
      >
        <Box className={styles.profileCardHeader}>
          <Box className={styles.profileCardHeaderIcon}>
            <PersonIcon />
          </Box>

          <Box>
            <Typography className={styles.profileCardTitle}>
              البيانات الشخصية
            </Typography>

            <Typography className={styles.profileCardSubtitle}>
              المعلومات المسجلة في النظام
            </Typography>
          </Box>
        </Box>

        <Divider className={styles.profileMainDivider} />

        {/* Profile Information */}

        <Box className={styles.profileDataList}>
          {profileData.map((item, index) => (
            <Box key={item.label}>
              <Box className={styles.profileRow}>

                {/* Label */}

                <Box className={styles.profileLabel}>
                  <Box className={styles.profileLabelIcon}>
                    {item.icon}
                  </Box>

                  <Typography className={styles.profileLabelText}>
                    {item.label}
                  </Typography>
                </Box>

                {/* Value */}

                <Typography
                  className={`${styles.profileValue} ${
                    item.isId ? styles.profileValueId : ""
                  }`}
                  dir={item.isId ? "ltr" : "auto"}
                >
                  {item.value}
                </Typography>
              </Box>

              {index < profileData.length - 1 && (
                <Divider className={styles.profileDivider} />
              )}
            </Box>
          ))}
        </Box>
      </Paper>
    </Box>
  );
}
