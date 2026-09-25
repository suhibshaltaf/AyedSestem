import { useEffect, useState, useMemo } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Button,
  TextField,
  InputAdornment,
  Chip,
  Tooltip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  MenuItem,
  Pagination,
} from "@mui/material";
import { toast } from "react-toastify";

import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import RefreshIcon from "@mui/icons-material/Refresh";
import SaveIcon from "@mui/icons-material/Save";
import CloseIcon from "@mui/icons-material/Close";
import LockResetIcon from "@mui/icons-material/LockReset";
import ErrorOutlinedIcon from "@mui/icons-material/ErrorOutlined";

import authService from "../../services/authService.js";
import { useBranches } from "../../hooks/useBranches.js";
import { useWorkshops } from "../../hooks/useWorkshops.js";
import useAuthStore from "../../store/useAuthStore.js";
import "../../styles/accounts.css";

// ===============================
// القيم الافتراضية للنموذج
// ===============================
const emptyForm = {
  userName: "",
  email: "",
  fullName: "",
  password: "",
  role: "",
  branchId: "",
  workshopId: "",
};

// ===============================
// الأدوار
// ===============================
const BRANCH_ROLES = ["BranchManager", "BranchAccountant"];
const WORKSHOP_ROLES = ["OperatorManager"];
const ADMIN_ROLES = ["SuperAdmin", "Admin"];

// ===============================
// عدد العناصر في الصفحة
// ===============================
const PAGE_SIZE = 10;

// ✅ إعدادات موحدة للتوستات المهمة
const PERSISTENT_TOAST_OPTIONS = {
  containerId: "persistent",
  position: "top-center",
  autoClose: false,
  closeOnClick: true,
  closeButton: true,
  pauseOnHover: true,
  draggable: false,
};

export default function AccountsManagement() {
  const currentUser = useAuthStore((state) => state.user);

  // ✅ State — كل المستخدمين
  const [allUsers, setAllUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // ✅ Pagination (client-side)
  const [page, setPage] = useState(1);
  const [pageSize] = useState(PAGE_SIZE);

  // Dialog الحذف
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    user: null,
  });
  const [deleting, setDeleting] = useState(false);

  // Dialog تغيير كلمة المرور
  const [passwordDialog, setPasswordDialog] = useState({
    open: false,
    user: null,
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [savingPassword, setSavingPassword] = useState(false);

  // Dialog الإضافة/التعديل
  const [formDialog, setFormDialog] = useState({
    open: false,
    mode: "add",
    user: null,
  });
  const [formData, setFormData] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // ✅ خطأ الـ Backend (يظهر داخل الـ Dialog)
  const [backendError, setBackendError] = useState("");

  // جلب الفروع والورش
  const { data: branches = [] } = useBranches();
  const { data: workshops = [] } = useWorkshops();

  // هل المستخدم الحالي Admin/SuperAdmin؟
  const isCurrentUserAdmin = useMemo(() => {
    if (!currentUser?.roles) return false;
    const roleNames = currentUser.roles.map((r) => r.name);
    return roleNames.some((name) => ADMIN_ROLES.includes(name));
  }, [currentUser]);

  // Helper: عرض اسم الفرع/الورشة
  const getBranchOrWorkshopName = (user) => {
    if (user?.branchName) {
      return `فرع ${user.branchName}`;
    }
    if (user?.workshopName) {
      return user.workshopName;
    }
    return "—";
  };

  // Helper: تنسيق التاريخ (UTC → Local)
  const formatDateTime = (value) => {
    if (!value) return "—";
    try {
      let isoValue = String(value);

      if (!isoValue.endsWith("Z") && !isoValue.match(/[+-]\d{2}:\d{2}$/)) {
        isoValue = isoValue + "Z";
      }

      const d = new Date(isoValue);
      if (isNaN(d.getTime())) return "—";

      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");

      let h = d.getHours();
      const min = String(d.getMinutes()).padStart(2, "0");
      const period = h >= 12 ? "م" : "ص";
      h = h % 12 || 12;

      return `${y}/${m}/${day} ${String(h).padStart(2, "0")}:${min} ${period}`;
    } catch {
      return "—";
    }
  };

  // Helper: حالة الحساب
  const getAccountStatus = (user) => {
    if (user?.isActive === false) {
      return { label: "غير نشط", type: "inactive" };
    }

    const isReallyOnline = () => {
      if (!user?.lastActivityAt) return false;
      try {
        let isoValue = String(user.lastActivityAt);
        if (!isoValue.endsWith("Z") && !isoValue.match(/[+-]\d{2}:\d{2}$/)) {
          isoValue = isoValue + "Z";
        }
        const lastActivity = new Date(isoValue);
        const now = new Date();
        const diffMinutes = (now - lastActivity) / 1000 / 60;
        return diffMinutes < 5;
      } catch {
        return false;
      }
    };

    if (isReallyOnline()) {
      return { label: "متصل الآن", type: "online" };
    }

    return { label: "نشط", type: "active" };
  };

  // هل نحتاج dropdown الفرع/الورشة؟
  const needsBranch = BRANCH_ROLES.includes(formData.role);
  const needsWorkshop = WORKSHOP_ROLES.includes(formData.role);

  // ===============================
  // ✅ جلب كل المستخدمين مرة وحدة
  // ===============================
  const fetchAllUsers = async () => {
    try {
      setLoading(true);

      const result = await authService.getUsers({
        pageNumber: 1,
        pageSize: 10000,
      });

      const payload = result?.data;
      let items = [];

      if (Array.isArray(payload)) {
        items = payload;
      } else if (payload && Array.isArray(payload.items)) {
        items = payload.items;
      } else if (Array.isArray(result)) {
        items = result;
      }

      setAllUsers(items);
    } catch (error) {
      console.error("Fetch Users Error:", error);
      setAllUsers([]);
      toast.error(
        error?.response?.data?.message || "حدث خطأ أثناء جلب المستخدمين",
        PERSISTENT_TOAST_OPTIONS
      );
    } finally {
      setLoading(false);
    }
  };

  // جلب الصلاحيات
  const fetchRoles = async () => {
    try {
      const result = await authService.getAvailableRoles();
      if (result?.success && Array.isArray(result.data)) {
        setRoles(result.data);
      } else if (Array.isArray(result)) {
        setRoles(result);
      } else {
        setRoles([]);
      }
    } catch (error) {
      console.error("Fetch Roles Error:", error);
    }
  };

  // تحميل أولي
  useEffect(() => {
    fetchAllUsers();
    fetchRoles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ===============================
  // ✅ فلترة client-side — على كل المستخدمين
  // ===============================
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return allUsers;
    const q = searchQuery.toLowerCase().trim();

    return allUsers.filter((u) => {
      const fullName = (u.fullName || "").toLowerCase();
      const userName = (u.userName || "").toLowerCase();
      const email = (u.email || "").toLowerCase();
      const branchName = (u.branchName || "").toLowerCase();
      const workshopName = (u.workshopName || "").toLowerCase();
      const userRoles = (u.roles || [])
        .map((r) => (r.displayName || r.name || "").toLowerCase())
        .join(" ");

      return (
        fullName.includes(q) ||
        userName.includes(q) ||
        email.includes(q) ||
        branchName.includes(q) ||
        workshopName.includes(q) ||
        userRoles.includes(q)
      );
    });
  }, [allUsers, searchQuery]);

  // ===============================
  // ✅ Pagination على النتائج المفلترة
  // ===============================
  const totalCount = filteredUsers.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const paginatedUsers = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, page, pageSize]);

  const startItem = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, totalCount);

  // ✅ رجّع للصفحة 1 عند البحث
  useEffect(() => {
    setPage(1);
  }, [searchQuery]);

  // فتح Dialog الإضافة
  const handleAddClick = () => {
    setFormData(emptyForm);
    setFormErrors({});
    setBackendError("");
    setFormDialog({ open: true, mode: "add", user: null });
  };

  // فتح Dialog التعديل
  const handleEditClick = (user) => {
    setFormData({
      userName: user.userName || "",
      email: user.email || "",
      fullName: user.fullName || "",
      password: "",
      role: user.roles?.[0]?.name || "",
      branchId: user.branchId || "",
      workshopId: user.workshopId || "",
    });
    setFormErrors({});
    setBackendError("");
    setFormDialog({ open: true, mode: "edit", user });
  };

  // إغلاق Dialog
  const handleCloseFormDialog = () => {
    if (!saving) {
      setFormDialog({ open: false, mode: "add", user: null });
      setFormData(emptyForm);
      setFormErrors({});
      setBackendError("");
    }
  };

  // تحديث حقل
  const handleFormChange = (field, value) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === "role") {
        if (!BRANCH_ROLES.includes(value)) updated.branchId = "";
        if (!WORKSHOP_ROLES.includes(value)) updated.workshopId = "";
      }
      return updated;
    });

    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: "" }));
    }

    if (backendError) {
      setBackendError("");
    }
  };

  // التحقق
  const validateForm = () => {
    const errors = {};

    if (!formData.userName.trim()) errors.userName = "اسم المستخدم مطلوب";

    if (!formData.email.trim()) {
      errors.email = "البريد الإلكتروني مطلوب";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "البريد الإلكتروني غير صحيح";
    }

    if (!formData.fullName.trim()) errors.fullName = "اسم الموظف مطلوب";

    if (formDialog.mode === "add") {
      if (!formData.password) {
        errors.password = "كلمة المرور مطلوبة";
      } else if (formData.password.length < 6) {
        errors.password = "كلمة المرور يجب أن تكون 6 أحرف على الأقل";
      }
    }

    if (!formData.role) errors.role = "الصلاحية مطلوبة";

    if (BRANCH_ROLES.includes(formData.role) && !formData.branchId) {
      errors.branchId = "الفرع مطلوب لهذه الصلاحية";
    }

    if (WORKSHOP_ROLES.includes(formData.role) && !formData.workshopId) {
      errors.workshopId = "الورشة مطلوبة لهذه الصلاحية";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ===============================
  // ✅ حفظ
  // ===============================
  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setSaving(true);
      setBackendError("");

      if (formDialog.mode === "add") {
        const payload = {
          userName: formData.userName.trim(),
          email: formData.email.trim(),
          fullName: formData.fullName.trim(),
          password: formData.password,
          role: formData.role,
          branchId: BRANCH_ROLES.includes(formData.role)
            ? Number(formData.branchId)
            : null,
          workshopId: WORKSHOP_ROLES.includes(formData.role)
            ? Number(formData.workshopId)
            : null,
        };

        const result = await authService.createEmployee(payload);

        if (result?.success) {
          toast.success(result?.message || "تم إضافة الموظف بنجاح", {
            ...PERSISTENT_TOAST_OPTIONS,
            toastId: "create-employee-success",
          });
          handleCloseFormDialog();
          fetchAllUsers();
        } else {
          const errorMsg = result?.message || "فشل إضافة الموظف";
          setBackendError(errorMsg);
          toast.error(errorMsg, {
            ...PERSISTENT_TOAST_OPTIONS,
            toastId: "save-user-error",
          });
        }
      } else {
        const payload = {
          email: formData.email.trim(),
          fullName: formData.fullName.trim(),
        };

        const result = await authService.updateUser(
          formDialog.user.id,
          payload
        );

        if (result?.success) {
          toast.success(result?.message || "تم تعديل الموظف بنجاح", {
            ...PERSISTENT_TOAST_OPTIONS,
            toastId: "update-employee-success",
          });
          handleCloseFormDialog();
          fetchAllUsers();
        } else {
          const errorMsg = result?.message || "فشل تعديل الموظف";
          setBackendError(errorMsg);
          toast.error(errorMsg, {
            ...PERSISTENT_TOAST_OPTIONS,
            toastId: "save-user-error",
          });
        }
      }
    } catch (error) {
      console.error("Save User Error:", error);

      const errorMsg =
        error?.response?.data?.message ||
        error?.response?.data?.title ||
        (Array.isArray(error?.response?.data?.errors)
          ? error.response.data.errors[0]
          : null) ||
        error?.message ||
        "حدث خطأ أثناء الحفظ";

      setBackendError(errorMsg);

      toast.error(errorMsg, {
        ...PERSISTENT_TOAST_OPTIONS,
        toastId: "save-user-error",
      });
    } finally {
      setSaving(false);
    }
  };

  // حذف
  const handleDeleteClick = (user) => {
    if (user.id === currentUser?.id) {
      toast.warning("لا يمكنك حذف حسابك الحالي", {
        position: "top-center",
        autoClose: 4000,
      });
      return;
    }
    setDeleteDialog({ open: true, user });
  };

  const handleConfirmDelete = async () => {
    const user = deleteDialog.user;
    if (!user) return;

    try {
      setDeleting(true);
      const result = await authService.deleteUser(user.id);

      if (result?.success) {
        toast.success(result?.message || "تم حذف المستخدم بنجاح", {
          ...PERSISTENT_TOAST_OPTIONS,
          toastId: "delete-user-success",
        });
        setDeleteDialog({ open: false, user: null });
        fetchAllUsers();
      } else {
        toast.error(result?.message || "فشل حذف المستخدم", {
          ...PERSISTENT_TOAST_OPTIONS,
          toastId: "delete-user-error",
        });
      }
    } catch (error) {
      console.error("Delete User Error:", error);
      toast.error(
        error?.response?.data?.message || "حدث خطأ أثناء حذف المستخدم",
        {
          ...PERSISTENT_TOAST_OPTIONS,
          toastId: "delete-user-error",
        }
      );
    } finally {
      setDeleting(false);
    }
  };

  const handleCloseDeleteDialog = () => {
    if (!deleting) {
      setDeleteDialog({ open: false, user: null });
    }
  };

  // تغيير كلمة المرور
  const handlePasswordClick = (user) => {
    setPasswordDialog({
      open: true,
      user,
      newPassword: "",
      confirmPassword: "",
    });
    setPasswordErrors({});
  };

  const handleClosePasswordDialog = () => {
    if (!savingPassword) {
      setPasswordDialog({
        open: false,
        user: null,
        newPassword: "",
        confirmPassword: "",
      });
      setPasswordErrors({});
    }
  };

  const handleSavePassword = async () => {
    const { newPassword, confirmPassword, user } = passwordDialog;

    const errors = {};

    if (!newPassword) {
      errors.newPassword = "كلمة المرور الجديدة مطلوبة";
    } else if (newPassword.length < 6) {
      errors.newPassword = "كلمة المرور يجب أن تكون 6 أحرف على الأقل";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
      errors.newPassword =
        "كلمة المرور يجب أن تحتوي على حرف كبير وحرف صغير ورقم على الأقل";
    }

    if (!confirmPassword) {
      errors.confirmPassword = "تأكيد كلمة المرور مطلوب";
    } else if (newPassword !== confirmPassword) {
      errors.confirmPassword = "كلمتا المرور غير متطابقتين";
    }

    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      return;
    }

    try {
      setSavingPassword(true);

      const result = await authService.resetUserPassword(user.id, {
        newPassword: newPassword,
        confirmNewPassword: confirmPassword,
      });

      if (result?.success) {
        toast.success(result?.message || "تم تغيير كلمة المرور بنجاح", {
          ...PERSISTENT_TOAST_OPTIONS,
          toastId: "password-success",
        });
        handleClosePasswordDialog();
      } else {
        toast.error(result?.message || "فشل تغيير كلمة المرور", {
          ...PERSISTENT_TOAST_OPTIONS,
          toastId: "password-error",
        });
      }
    } catch (error) {
      console.error("Change Password Error:", error);
      toast.error(
        error?.response?.data?.message || "حدث خطأ أثناء تغيير كلمة المرور",
        {
          ...PERSISTENT_TOAST_OPTIONS,
          toastId: "password-error",
        }
      );
    } finally {
      setSavingPassword(false);
    }
  };

  // مساعدات
  const getRoleName = (user) => {
    if (!user?.roles || user.roles.length === 0) return "—";
    return user.roles[0]?.displayName || user.roles[0]?.name || "—";
  };

  const isAdminUser = (user) => {
    const userRoles = user?.roles?.map((r) => r.name) || [];
    return userRoles.includes("SuperAdmin") || userRoles.includes("Admin");
  };

  // ===============================
  // Render
  // ===============================
  return (
    <div className="accounts-container">
      {/* Header */}
      <div className="accounts-header">
        <div className="accounts-header-icon">
          <ManageAccountsIcon sx={{ fontSize: 34 }} />
        </div>

        <Typography className="accounts-title">إدارة الحسابات</Typography>

        <Typography className="accounts-subtitle">
          إدارة مستخدمي النظام والصلاحيات
        </Typography>
      </div>

      {/* Toolbar */}
      <div className="accounts-toolbar">
        <TextField
          placeholder="البحث عن مستخدم..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          size="small"
          className="accounts-search"
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: "#c9a44c", fontSize: 20 }} />
                </InputAdornment>
              ),
            },
          }}
        />

        <div className="accounts-actions">
          <Tooltip title="تحديث">
            <IconButton
              onClick={fetchAllUsers}
              className="accounts-refresh-btn"
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            className="accounts-add-btn"
            onClick={handleAddClick}
          >
            إضافة مستخدم جديد
          </Button>
        </div>
      </div>

      {/* Table */}
      <Paper elevation={0} className="accounts-table-paper">
        {loading ? (
          <Box className="accounts-loading">
            <CircularProgress sx={{ color: "#b8860b" }} />
          </Box>
        ) : paginatedUsers.length === 0 ? (
          <Box className="accounts-empty">
            <Typography>
              {searchQuery
                ? "لا توجد نتائج مطابقة للبحث"
                : "لا يوجد مستخدمون لعرضهم"}
            </Typography>
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow className="accounts-table-head-row">
                    <TableCell className="accounts-th">#</TableCell>
                    <TableCell className="accounts-th">اسم المستخدم</TableCell>
                    <TableCell className="accounts-th">اسم الموظف</TableCell>
                    <TableCell className="accounts-th">الصلاحيات</TableCell>
                    <TableCell className="accounts-th">الفرع / الورشة</TableCell>
                    <TableCell className="accounts-th">حالة الحساب</TableCell>
                    <TableCell className="accounts-th">
                      آخر تسجيل دخول
                    </TableCell>
                    <TableCell className="accounts-th" align="center">
                      الإجراءات
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {paginatedUsers.map((user, index) => {
                    const status = getAccountStatus(user);
                    return (
                      <TableRow key={user.id} className="accounts-table-row">
                        <TableCell className="accounts-td">
                          {(page - 1) * pageSize + index + 1}
                        </TableCell>

                        <TableCell className="accounts-td accounts-td-username">
                          {user.userName || "—"}
                        </TableCell>

                        <TableCell className="accounts-td accounts-td-name">
                          {user.fullName || "—"}
                        </TableCell>

                        <TableCell className="accounts-td">
                          <Chip
                            label={getRoleName(user)}
                            size="small"
                            className={`accounts-role-chip ${
                              isAdminUser(user)
                                ? "accounts-role-chip-admin"
                                : "accounts-role-chip-user"
                            }`}
                          />
                        </TableCell>

                        <TableCell className="accounts-td accounts-td-branch">
                          {getBranchOrWorkshopName(user)}
                        </TableCell>

                        <TableCell className="accounts-td">
                          <Chip
                            label={status.label}
                            size="small"
                            className={`accounts-status-chip accounts-status-chip-${status.type}`}
                          />
                        </TableCell>

                        <TableCell className="accounts-td accounts-td-date">
                          {user.lastLoginAt
                            ? formatDateTime(user.lastLoginAt)
                            : "—"}
                        </TableCell>

                        <TableCell className="accounts-td" align="center">
                          <Tooltip title="تعديل">
                            <IconButton
                              size="small"
                              className="accounts-action-btn accounts-edit-btn"
                              onClick={() => handleEditClick(user)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          {isCurrentUserAdmin && (
                            <Tooltip title="تغيير كلمة المرور">
                              <IconButton
                                size="small"
                                className="accounts-action-btn accounts-password-btn"
                                onClick={() => handlePasswordClick(user)}
                              >
                                <LockResetIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}

                          <Tooltip title="حذف">
                            <IconButton
                              size="small"
                              className="accounts-action-btn accounts-delete-btn"
                              onClick={() => handleDeleteClick(user)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="accounts-pagination">
                <div className="accounts-pagination-info">
                  عرض {startItem} - {endItem} من {totalCount} مستخدمين
                </div>

                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={(e, value) => setPage(value)}
                  shape="rounded"
                  className="accounts-pagination-control"
                  dir="ltr"
                />
              </div>
            )}
          </>
        )}
      </Paper>

      {/* Dialog الإضافة / التعديل */}
      <Dialog
        open={formDialog.open}
        onClose={handleCloseFormDialog}
        PaperProps={{ className: "accounts-form-dialog" }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle className="accounts-form-title">
          {formDialog.mode === "add"
            ? "إضافة موظف جديد"
            : "تعديل بيانات الموظف"}
        </DialogTitle>

        <DialogContent className="accounts-form-content">
          {backendError && (
            <Box
              sx={{
                mb: 2,
                p: 1.5,
                borderRadius: 1.5,
                backgroundColor: "#ffebee",
                border: "1px solid #ef5350",
                display: "flex",
                alignItems: "flex-start",
                gap: 1,
              }}
            >
              <ErrorOutlinedIcon
                sx={{
                  color: "#d32f2f",
                  fontSize: 20,
                  mt: 0.2,
                  flexShrink: 0,
                }}
              />
              <Typography
                sx={{
                  color: "#c62828",
                  fontSize: "0.85rem",
                  fontFamily: "'Cairo', sans-serif",
                  fontWeight: 600,
                  lineHeight: 1.5,
                }}
              >
                {backendError}
              </Typography>
            </Box>
          )}

          <TextField
            fullWidth
            label="اسم الموظف"
            value={formData.fullName}
            onChange={(e) => handleFormChange("fullName", e.target.value)}
            error={!!formErrors.fullName}
            helperText={formErrors.fullName}
            margin="dense"
            className="accounts-form-field"
          />

          <TextField
            fullWidth
            label="اسم المستخدم"
            value={formData.userName}
            onChange={(e) => handleFormChange("userName", e.target.value)}
            error={!!formErrors.userName}
            helperText={formErrors.userName}
            margin="dense"
            disabled={formDialog.mode === "edit"}
            className="accounts-form-field"
          />

          <TextField
            fullWidth
            label="البريد الإلكتروني"
            type="email"
            value={formData.email}
            onChange={(e) => handleFormChange("email", e.target.value)}
            error={!!formErrors.email}
            helperText={formErrors.email}
            margin="dense"
            className="accounts-form-field"
          />

          {formDialog.mode === "add" && (
            <TextField
              fullWidth
              label="كلمة المرور"
              type="password"
              value={formData.password}
              onChange={(e) => handleFormChange("password", e.target.value)}
              error={!!formErrors.password}
              helperText={formErrors.password}
              margin="dense"
              className="accounts-form-field"
            />
          )}

          <TextField
            fullWidth
            select
            label="الصلاحية"
            value={formData.role}
            onChange={(e) => handleFormChange("role", e.target.value)}
            error={!!formErrors.role}
            helperText={formErrors.role}
            margin="dense"
            className="accounts-form-field"
            disabled={formDialog.mode === "edit"}
          >
            {roles.length === 0 ? (
              <MenuItem value="" disabled>
                جاري التحميل...
              </MenuItem>
            ) : (
              roles.map((role) => (
                <MenuItem key={role.name || role} value={role.name || role}>
                  {role.displayName || role.name || role}
                </MenuItem>
              ))
            )}
          </TextField>

          {needsBranch && (
            <TextField
              fullWidth
              select
              label="الفرع"
              value={formData.branchId}
              onChange={(e) => handleFormChange("branchId", e.target.value)}
              error={!!formErrors.branchId}
              helperText={formErrors.branchId}
              margin="dense"
              className="accounts-form-field"
            >
              {branches.length === 0 ? (
                <MenuItem value="" disabled>
                  لا توجد فروع متاحة
                </MenuItem>
              ) : (
                branches.map((branch) => (
                  <MenuItem key={branch.id} value={branch.id}>
                    {branch.name} {branch.code ? `(${branch.code})` : ""}
                  </MenuItem>
                ))
              )}
            </TextField>
          )}

          {needsWorkshop && (
            <TextField
              fullWidth
              select
              label="الورشة"
              value={formData.workshopId}
              onChange={(e) => handleFormChange("workshopId", e.target.value)}
              error={!!formErrors.workshopId}
              helperText={formErrors.workshopId}
              margin="dense"
              className="accounts-form-field"
            >
              {workshops.length === 0 ? (
                <MenuItem value="" disabled>
                  لا توجد ورش متاحة
                </MenuItem>
              ) : (
                workshops.map((workshop) => (
                  <MenuItem key={workshop.id} value={workshop.id}>
                    {workshop.name}
                  </MenuItem>
                ))
              )}
            </TextField>
          )}
        </DialogContent>

        <DialogActions className="accounts-form-actions">
          <Button
            onClick={handleCloseFormDialog}
            disabled={saving}
            className="accounts-form-cancel"
            startIcon={<CloseIcon />}
          >
            إلغاء
          </Button>

          <Button
            onClick={handleSave}
            disabled={saving}
            variant="contained"
            className="accounts-form-save"
            startIcon={
              saving ? (
                <CircularProgress size={16} sx={{ color: "#fff" }} />
              ) : (
                <SaveIcon />
              )
            }
          >
            {saving
              ? "جاري الحفظ..."
              : formDialog.mode === "add"
              ? "إضافة"
              : "حفظ التعديلات"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog تغيير كلمة المرور */}
      <Dialog
        open={passwordDialog.open}
        onClose={handleClosePasswordDialog}
        PaperProps={{ className: "accounts-form-dialog" }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle className="accounts-form-title">
          تغيير كلمة مرور الموظف
        </DialogTitle>

        <DialogContent className="accounts-form-content">
          <Typography
            sx={{
              fontFamily: "'Cairo', sans-serif",
              fontSize: "0.88rem",
              color: "var(--text-secondary)",
              mb: 2,
            }}
          >
            الموظف: <strong>{passwordDialog.user?.fullName}</strong>
          </Typography>

          <TextField
            fullWidth
            label="كلمة المرور الجديدة"
            type="password"
            value={passwordDialog.newPassword}
            onChange={(e) =>
              setPasswordDialog((prev) => ({
                ...prev,
                newPassword: e.target.value,
              }))
            }
            error={!!passwordErrors.newPassword}
            helperText={
              passwordErrors.newPassword ||
              "يجب أن تحتوي على حرف كبير وحرف صغير ورقم (6+ أحرف)"
            }
            margin="dense"
            className="accounts-form-field"
          />

          <TextField
            fullWidth
            label="تأكيد كلمة المرور"
            type="password"
            value={passwordDialog.confirmPassword}
            onChange={(e) =>
              setPasswordDialog((prev) => ({
                ...prev,
                confirmPassword: e.target.value,
              }))
            }
            error={!!passwordErrors.confirmPassword}
            helperText={passwordErrors.confirmPassword}
            margin="dense"
            className="accounts-form-field"
          />
        </DialogContent>

        <DialogActions className="accounts-form-actions">
          <Button
            onClick={handleClosePasswordDialog}
            disabled={savingPassword}
            className="accounts-form-cancel"
            startIcon={<CloseIcon />}
          >
            إلغاء
          </Button>

          <Button
            onClick={handleSavePassword}
            disabled={savingPassword}
            variant="contained"
            className="accounts-form-save"
            startIcon={
              savingPassword ? (
                <CircularProgress size={16} sx={{ color: "#fff" }} />
              ) : (
                <LockResetIcon />
              )
            }
          >
            {savingPassword ? "جاري الحفظ..." : "تغيير كلمة المرور"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog الحذف */}
      <Dialog
        open={deleteDialog.open}
        onClose={handleCloseDeleteDialog}
        PaperProps={{ className: "accounts-dialog" }}
      >
        <DialogTitle className="accounts-dialog-title">تأكيد الحذف</DialogTitle>

        <DialogContent>
          <DialogContentText className="accounts-dialog-text">
            هل أنت متأكد من حذف المستخدم{" "}
            <strong>{deleteDialog.user?.fullName}</strong>؟
            <br />
            لا يمكن التراجع عن هذا الإجراء.
          </DialogContentText>
        </DialogContent>

        <DialogActions className="accounts-dialog-actions">
          <Button
            onClick={handleCloseDeleteDialog}
            disabled={deleting}
            className="accounts-dialog-cancel"
          >
            إلغاء
          </Button>

          <Button
            onClick={handleConfirmDelete}
            disabled={deleting}
            variant="contained"
            className="accounts-dialog-confirm"
          >
            {deleting ? (
              <CircularProgress size={18} sx={{ color: "#fff" }} />
            ) : (
              "حذف"
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}