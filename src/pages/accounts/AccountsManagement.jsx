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
} from "@mui/material";
import { toast } from "react-toastify";

import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import RefreshIcon from "@mui/icons-material/Refresh";

import authService from "../../services/authService.js";
import useAuthStore from "../../store/useAuthStore.js";
import "../../styles/accounts.css";

export default function AccountsManagement() {
  const currentUser = useAuthStore((state) => state.user);

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    user: null,
  });
  const [deleting, setDeleting] = useState(false);

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

  useEffect(() => {
    fetchUsers();
  }, []);

  // ===============================
  // فلترة المستخدمين حسب البحث
  // ===============================
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    const q = searchQuery.toLowerCase();
    return users.filter((u) => {
      const fullName = (u.fullName || "").toLowerCase();
      const userName = (u.userName || "").toLowerCase();
      const email = (u.email || "").toLowerCase();
      const roles = (u.roles || [])
        .map((r) => (r.displayName || r.name || "").toLowerCase())
        .join(" ");
      return (
        fullName.includes(q) ||
        userName.includes(q) ||
        email.includes(q) ||
        roles.includes(q)
      );
    });
  }, [users, searchQuery]);

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
  // إغلاق Dialog
  // ===============================
  const handleCloseDialog = () => {
    if (!deleting) {
      setDeleteDialog({ open: false, user: null });
    }
  };

  // ===============================
  // اسم الصلاحية (displayName)
  // ===============================
  const getRoleName = (user) => {
    if (!user?.roles || user.roles.length === 0) return "—";
    return user.roles[0]?.displayName || user.roles[0]?.name || "—";
  };

  // ===============================
  // هل المستخدم Admin/SuperAdmin؟
  // ===============================
  const isAdminUser = (user) => {
    const roles = user?.roles?.map((r) => r.name) || [];
    return roles.includes("SuperAdmin") || roles.includes("Admin");
  };

  return (
    <div className="accounts-container">
      {/* ===============================
          Header
      =============================== */}
      <div className="accounts-header">
        <div className="accounts-header-icon">
          <ManageAccountsIcon sx={{ fontSize: 34 }} />
        </div>

        <Typography className="accounts-title">إدارة الحسابات</Typography>

        <Typography className="accounts-subtitle">
          إدارة مستخدمي النظام والصلاحيات
        </Typography>
      </div>

      {/* ===============================
          Toolbar
      =============================== */}
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
            onClick={() => {
              toast.info("صفحة إضافة موظف جديد (قريباً)");
            }}
          >
            إضافة موظف
          </Button>
        </div>
      </div>

      {/* ===============================
          Table
      =============================== */}
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
                  <TableCell className="accounts-th">الصلاحيات</TableCell>
                  <TableCell className="accounts-th" align="center">
                    الإجراءات
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {filteredUsers.map((user, index) => (
                  <TableRow key={user.id} className="accounts-table-row">
                    <TableCell className="accounts-td">
                      {index + 1}
                    </TableCell>

                    <TableCell className="accounts-td accounts-td-name">
                      {user.fullName || "—"}
                    </TableCell>

                    <TableCell className="accounts-td">
                      {user.userName || "—"}
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
                          onClick={() => {
                            toast.info(`تعديل: ${user.fullName} (قريباً)`);
                          }}
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
          Dialog الحذف
      =============================== */}
      <Dialog
        open={deleteDialog.open}
        onClose={handleCloseDialog}
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
            onClick={handleCloseDialog}
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