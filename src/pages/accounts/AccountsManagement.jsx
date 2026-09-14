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

import authService from "../../services/authService.js";
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
};

export default function AccountsManagement() {
  const currentUser = useAuthStore((state) => state.user);

  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Dialog الحذف
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    user: null,
  });
  const [deleting, setDeleting] = useState(false);

  // Dialog الإضافة/التعديل
  const [formDialog, setFormDialog] = useState({
    open: false,
    mode: "add", // "add" | "edit"
    user: null,
  });
  const [formData, setFormData] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // ===============================
  // جلب المستخدمين
  // ===============================
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const result = await authService.getUsers();

      if (result?.success && Array.isArray(result.data)) {
        setUsers(result.data);
      } else {
        setUsers([]);
        toast.error(result?.message || "تعذر جلب المستخدمين");
      }
    } catch (error) {
      console.error("Fetch Users Error:", error);
      toast.error(
        error?.response?.data?.message || "حدث خطأ أثناء جلب المستخدمين"
      );
    } finally {
      setLoading(false);
    }
  };

  // ===============================
  // جلب الصلاحيات المتاحة
  // ===============================
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
      // لا نعرض Toast لأنها اختيارية
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  // ===============================
  // فلترة المستخدمين
  // ===============================
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    const q = searchQuery.toLowerCase();
    return users.filter((u) => {
      const fullName = (u.fullName || "").toLowerCase();
      const userName = (u.userName || "").toLowerCase();
      const email = (u.email || "").toLowerCase();
      const userRoles = (u.roles || [])
        .map((r) => (r.displayName || r.name || "").toLowerCase())
        .join(" ");
      return (
        fullName.includes(q) ||
        userName.includes(q) ||
        email.includes(q) ||
        userRoles.includes(q)
      );
    });
  }, [users, searchQuery]);

  // ===============================
  // فتح Dialog الإضافة
  // ===============================
  const handleAddClick = () => {
    setFormData(emptyForm);
    setFormErrors({});
    setFormDialog({ open: true, mode: "add", user: null });
  };

  // ===============================
  // فتح Dialog التعديل
  // ===============================
  const handleEditClick = (user) => {
    setFormData({
      userName: user.userName || "",
      email: user.email || "",
      fullName: user.fullName || "",
      password: "", // لا نعرض كلمة المرور
      role: user.roles?.[0]?.name || "",
    });
    setFormErrors({});
    setFormDialog({ open: true, mode: "edit", user });
  };

  // ===============================
  // إغلاق Dialog النموذج
  // ===============================
  const handleCloseFormDialog = () => {
    if (!saving) {
      setFormDialog({ open: false, mode: "add", user: null });
      setFormData(emptyForm);
      setFormErrors({});
    }
  };

  // ===============================
  // تحديث حقل في النموذج
  // ===============================
  const handleFormChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  // ===============================
  // التحقق من النموذج
  // ===============================
  const validateForm = () => {
    const errors = {};

    if (!formData.userName.trim()) {
      errors.userName = "اسم المستخدم مطلوب";
    }

    if (!formData.email.trim()) {
      errors.email = "البريد الإلكتروني مطلوب";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "البريد الإلكتروني غير صحيح";
    }

    if (!formData.fullName.trim()) {
      errors.fullName = "اسم الموظف مطلوب";
    }

    if (formDialog.mode === "add") {
      if (!formData.password) {
        errors.password = "كلمة المرور مطلوبة";
      } else if (formData.password.length < 6) {
        errors.password = "كلمة المرور يجب أن تكون 6 أحرف على الأقل";
      }
    }

    if (!formData.role) {
      errors.role = "الصلاحية مطلوبة";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ===============================
  // حفظ (إضافة أو تعديل)
  // ===============================
  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setSaving(true);

      if (formDialog.mode === "add") {
        // إضافة
        const payload = {
          userName: formData.userName.trim(),
          email: formData.email.trim(),
          fullName: formData.fullName.trim(),
          password: formData.password,
          role: formData.role,
        };

        const result = await authService.createEmployee(payload);

        if (result?.success) {
          toast.success(result?.message || "تم إضافة الموظف بنجاح");
          handleCloseFormDialog();
          fetchUsers();
        } else {
          toast.error(result?.message || "فشل إضافة الموظف");
        }
      } else {
        // تعديل
        const payload = {
          email: formData.email.trim(),
          fullName: formData.fullName.trim(),
        };

        const result = await authService.updateUser(
          formDialog.user.id,
          payload
        );

        if (result?.success) {
          toast.success(result?.message || "تم تعديل الموظف بنجاح");
          handleCloseFormDialog();
          fetchUsers();
        } else {
          toast.error(result?.message || "فشل تعديل الموظف");
        }
      }
    } catch (error) {
      console.error("Save User Error:", error);
      toast.error(
        error?.response?.data?.message || "حدث خطأ أثناء الحفظ"
      );
    } finally {
      setSaving(false);
    }
  };

  // ===============================
  // فتح Dialog الحذف
  // ===============================
  const handleDeleteClick = (user) => {
    if (user.id === currentUser?.id) {
      toast.warning("لا يمكنك حذف حسابك الحالي");
      return;
    }
    setDeleteDialog({ open: true, user });
  };

  // ===============================
  // تأكيد الحذف
  // ===============================
  const handleConfirmDelete = async () => {
    const user = deleteDialog.user;
    if (!user) return;

    try {
      setDeleting(true);
      const result = await authService.deleteUser(user.id);

      if (result?.success) {
        toast.success(result?.message || "تم حذف المستخدم بنجاح");
        setUsers((prev) => prev.filter((u) => u.id !== user.id));
        setDeleteDialog({ open: false, user: null });
      } else {
        toast.error(result?.message || "فشل حذف المستخدم");
      }
    } catch (error) {
      console.error("Delete User Error:", error);
      toast.error(
        error?.response?.data?.message || "حدث خطأ أثناء حذف المستخدم"
      );
    } finally {
      setDeleting(false);
    }
  };

  // ===============================
  // إغلاق Dialog الحذف
  // ===============================
  const handleCloseDeleteDialog = () => {
    if (!deleting) {
      setDeleteDialog({ open: false, user: null });
    }
  };

  // ===============================
  // مساعدات
  // ===============================
  const getRoleName = (user) => {
    if (!user?.roles || user.roles.length === 0) return "—";
    return user.roles[0]?.displayName || user.roles[0]?.name || "—";
  };

  const isAdminUser = (user) => {
    const userRoles = user?.roles?.map((r) => r.name) || [];
    return userRoles.includes("SuperAdmin") || userRoles.includes("Admin");
  };

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
            <IconButton onClick={fetchUsers} className="accounts-refresh-btn">
              <RefreshIcon />
            </IconButton>
          </Tooltip>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            className="accounts-add-btn"
            onClick={handleAddClick}
          >
            إضافة موظف
          </Button>
        </div>
      </div>

      {/* Table */}
      <Paper elevation={0} className="accounts-table-paper">
        {loading ? (
          <Box className="accounts-loading">
            <CircularProgress sx={{ color: "#b8860b" }} />
          </Box>
        ) : filteredUsers.length === 0 ? (
          <Box className="accounts-empty">
            <Typography>
              {searchQuery
                ? "لا توجد نتائج مطابقة للبحث"
                : "لا يوجد مستخدمون لعرضهم"}
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow className="accounts-table-head-row">
                  <TableCell className="accounts-th">#</TableCell>
                  <TableCell className="accounts-th">اسم الموظف</TableCell>
                  <TableCell className="accounts-th">اسم المستخدم</TableCell>
                  <TableCell className="accounts-th">البريد الإلكتروني</TableCell>
                  <TableCell className="accounts-th">الصلاحيات</TableCell>
                  <TableCell className="accounts-th" align="center">
                    الإجراءات
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {filteredUsers.map((user, index) => (
                  <TableRow key={user.id} className="accounts-table-row">
                    <TableCell className="accounts-td">{index + 1}</TableCell>

                    <TableCell className="accounts-td accounts-td-name">
                      {user.fullName || "—"}
                    </TableCell>

                    <TableCell className="accounts-td">
                      {user.userName || "—"}
                    </TableCell>

                    <TableCell className="accounts-td accounts-td-email">
                      {user.email || "—"}
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
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* ===============================
          Dialog الإضافة / التعديل
      =============================== */}
      <Dialog
        open={formDialog.open}
        onClose={handleCloseFormDialog}
        PaperProps={{ className: "accounts-form-dialog" }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle className="accounts-form-title">
          {formDialog.mode === "add" ? "إضافة موظف جديد" : "تعديل بيانات الموظف"}
        </DialogTitle>

        <DialogContent className="accounts-form-content">
          {/* Full Name */}
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

          {/* UserName */}
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

          {/* Email */}
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

          {/* Password (add only) */}
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

          {/* Role */}
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
                <MenuItem
                  key={role.name || role}
                  value={role.name || role}
                >
                  {role.displayName || role.name || role}
                </MenuItem>
              ))
            )}
          </TextField>
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

      {/* ===============================
          Dialog الحذف
      =============================== */}
      <Dialog
        open={deleteDialog.open}
        onClose={handleCloseDeleteDialog}
        PaperProps={{ className: "accounts-dialog" }}
      >
        <DialogTitle className="accounts-dialog-title">
          تأكيد الحذف
        </DialogTitle>

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