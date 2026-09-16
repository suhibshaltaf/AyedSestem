import { useState, useMemo } from "react";
import {
  Box,
  Typography,
  Paper,
  Chip,
  CircularProgress,
  Button,
  Divider,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
} from "@mui/material";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useParams, useNavigate } from "react-router-dom";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import StorefrontIcon from "@mui/icons-material/Storefront";
import PersonIcon from "@mui/icons-material/Person";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PhoneIcon from "@mui/icons-material/Phone";
import TagIcon from "@mui/icons-material/Tag";
import RefreshIcon from "@mui/icons-material/Refresh";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SaveIcon from "@mui/icons-material/Save";
import CloseIcon from "@mui/icons-material/Close";
import GroupIcon from "@mui/icons-material/Group";

import { useBranches } from "../../hooks/useBranches.js";
import {
  useBranchEmployees,
  useCreateBranchEmployee,
  useUpdateBranchEmployee,
  useDeleteBranchEmployee,
} from "../../hooks/useBranchEmployees.js";
import branchEmployeeSchema from "./branchEmployeeSchema.js";
import useAuthStore from "../../store/useAuthStore.js";
import "../../styles/branch-details.css";

const ADMIN_ROLES = ["SuperAdmin", "Admin"];

export default function BranchDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.user);

  // ===============================
  // Dialog States
  // ===============================
  const [formDialog, setFormDialog] = useState({
    open: false,
    mode: "add",
    employee: null,
  });
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    employee: null,
  });

  // ===============================
  // الفحص
  // ===============================
  const isAdmin = useMemo(() => {
    if (!currentUser?.roles) return false;
    const roleNames = currentUser.roles.map((r) => r.name);
    return roleNames.some((name) => ADMIN_ROLES.includes(name));
  }, [currentUser]);

  const canManage = isAdmin || currentUser?.roles?.some(
    (r) => r.name === "BranchManager"
  );

  // ===============================
  // React Query
  // ===============================
  const { data: branches = [], isLoading: loadingBranches, refetch: refetchBranches } = useBranches();
  const { data: employees = [], isLoading: loadingEmployees, refetch: refetchEmployees } = useBranchEmployees(id);
  const createMutation = useCreateBranchEmployee(id);
  const updateMutation = useUpdateBranchEmployee(id);
  const deleteMutation = useDeleteBranchEmployee(id);

  const saving = createMutation.isPending || updateMutation.isPending;
  const deleting = deleteMutation.isPending;

  // ===============================
  // الفرع
  // ===============================
  const branch = useMemo(() => {
    if (!id) return null;
    const numericId = Number(id);
    if (isNaN(numericId)) return null;
    return branches.find((b) => b.id === numericId) || null;
  }, [branches, id]);

  // ===============================
  // الصلاحية
  // ===============================
  const canView = useMemo(() => {
    if (!branch) return false;
    if (isAdmin) return true;
    return currentUser?.branchId === branch.id;
  }, [branch, isAdmin, currentUser]);

  // ===============================
  // RHF
  // ===============================
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: yupResolver(branchEmployeeSchema),
    defaultValues: { fullName: "" },
  });

  // ===============================
  // فتح Dialog الإضافة
  // ===============================
  const handleAddClick = () => {
    reset({ fullName: "" });
    setFormDialog({ open: true, mode: "add", employee: null });
  };

  // ===============================
  // فتح Dialog التعديل
  // ===============================
  const handleEditClick = (employee) => {
    reset({ fullName: employee.fullName || "" });
    setFormDialog({ open: true, mode: "edit", employee });
  };

  const handleCloseFormDialog = () => {
    if (!saving) {
      setFormDialog({ open: false, mode: "add", employee: null });
      reset({ fullName: "" });
    }
  };

  // ===============================
  // حفظ
  // ===============================
  const onSubmit = async (data) => {
    const payload = { fullName: data.fullName.trim() };

    if (formDialog.mode === "add") {
      const result = await createMutation.mutateAsync(payload);
      if (result?.success) handleCloseFormDialog();
    } else {
      const result = await updateMutation.mutateAsync({
        employeeId: formDialog.employee.id,
        data: payload,
      });
      if (result?.success) handleCloseFormDialog();
    }
  };

  // ===============================
  // حذف
  // ===============================
  const handleDeleteClick = (employee) => {
    setDeleteDialog({ open: true, employee });
  };

  const handleConfirmDelete = async () => {
    const employee = deleteDialog.employee;
    if (!employee) return;
    const result = await deleteMutation.mutateAsync(employee.id);
    if (result?.success) setDeleteDialog({ open: false, employee: null });
  };

  const handleCloseDeleteDialog = () => {
    if (!deleting) setDeleteDialog({ open: false, employee: null });
  };

  // ===============================
  // Loading
  // ===============================
  if (loadingBranches) {
    return (
      <Box className="branch-details-loading">
        <CircularProgress sx={{ color: "#b8860b" }} />
      </Box>
    );
  }

  // ===============================
  // فرع غير موجود
  // ===============================
  if (!branch) {
    return (
      <div className="branch-details-container">
        <Paper elevation={0} className="branch-details-card">
          <Box className="branch-details-empty">
            <Typography className="branch-details-empty-text">
              الفرع غير موجود
            </Typography>
            <Button
              variant="contained"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate("/branches")}
              className="branch-details-back-btn"
            >
              العودة
            </Button>
          </Box>
        </Paper>
      </div>
    );
  }

  // ===============================
  // ليس لديه صلاحية
  // ===============================
  if (!canView) {
    return (
      <div className="branch-details-container">
        <Paper elevation={0} className="branch-details-card">
          <Box className="branch-details-empty">
            <Typography className="branch-details-empty-text">
              ليس لديك صلاحية لعرض هذا الفرع
            </Typography>
            <Button
              variant="contained"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate("/branches")}
              className="branch-details-back-btn"
            >
              العودة
            </Button>
          </Box>
        </Paper>
      </div>
    );
  }

  // ===============================
  // بيانات العرض
  // ===============================
  const details = [
    {
      label: "كود الفرع",
      value: branch.code || "—",
      icon: <TagIcon />,
      mono: true,
    },
    {
      label: "العنوان",
      value: branch.address || "—",
      icon: <LocationOnIcon />,
    },
    {
      label: "رقم الهاتف",
      value: branch.phoneNumber || "—",
      icon: <PhoneIcon />,
      ltr: true,
    },
    {
      label: "المدير المسؤول",
      value: branch.managerName || "—",
      icon: <PersonIcon />,
    },
    {
      label: "المحاسب المسؤول",
      value: branch.accountantName || "—",
      icon: <AccountBalanceWalletIcon />,
    },
  ];

  return (
    <div className="branch-details-container">
      {/* Header */}
      <div className="branch-details-header">
        <div className="branch-details-header-icon">
          <StorefrontIcon sx={{ fontSize: 34 }} />
        </div>

        <Typography className="branch-details-title">
          {branch.name}
        </Typography>

        <div className="branch-details-title-decor">
          <span className="branch-details-title-line" />
          <Typography className="branch-details-subtitle">
            تفاصيل الفرع
          </Typography>
          <span className="branch-details-title-line" />
        </div>
      </div>

      {/* Actions */}
      <div className="branch-details-actions">
        <Tooltip title="تحديث">
          <IconButton
            onClick={() => {
              refetchBranches();
              refetchEmployees();
            }}
            className="branch-details-refresh-btn"
          >
            <RefreshIcon />
          </IconButton>
        </Tooltip>

        {isAdmin && (
          <Tooltip title="العودة إلى قائمة الفروع">
            <IconButton
              onClick={() => navigate("/branches")}
              className="branch-details-back-icon-btn"
            >
              <ArrowBackIcon />
            </IconButton>
          </Tooltip>
        )}
      </div>

      {/* Card — بيانات الفرع */}
      <Paper elevation={0} className="branch-details-card">
        <div className="branch-details-status-row">
          <Typography className="branch-details-status-label">
            حالة الفرع:
          </Typography>
          <Chip
            label={branch.isActive ? "نشط" : "معطل"}
            className={`branch-details-status-chip ${
              branch.isActive
                ? "branch-details-status-chip-active"
                : "branch-details-status-chip-inactive"
            }`}
          />
        </div>

        <Divider className="branch-details-divider" />

        {details.map((item, index) => (
          <div key={item.label}>
            <div className="branch-details-row">
              <Typography
                className={`branch-details-value ${
                  item.mono ? "branch-details-value-mono" : ""
                } ${item.ltr ? "branch-details-value-ltr" : ""}`}
              >
                {item.value}
              </Typography>

              <div className="branch-details-label">
                <span className="branch-details-label-text">
                  {item.label}:
                </span>
                <span className="branch-details-label-icon">
                  {item.icon}
                </span>
              </div>
            </div>

            {index < details.length - 1 && (
              <Divider className="branch-details-divider" />
            )}
          </div>
        ))}
      </Paper>

      {/* ===============================
          قائمة موظفي الفرع
      =============================== */}
      <div className="branch-employees-section">
        <div className="branch-employees-header">
          <div className="branch-employees-header-icon">
            <GroupIcon sx={{ fontSize: 26 }} />
          </div>

          <Typography className="branch-employees-title">
            موظفو الفرع
          </Typography>
        </div>

        <Paper elevation={0} className="branch-employees-paper">
          {/* Toolbar */}
          <div className="branch-employees-toolbar">
            <Typography className="branch-employees-count">
              عدد الموظفين: {employees.length}
            </Typography>

            {canManage && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                className="branch-employees-add-btn"
                onClick={handleAddClick}
              >
                إضافة موظف
              </Button>
            )}
          </div>

          {loadingEmployees ? (
            <Box className="branch-employees-loading">
              <CircularProgress sx={{ color: "#b8860b" }} size={30} />
            </Box>
          ) : employees.length === 0 ? (
            <Box className="branch-employees-empty">
              <Typography>لا يوجد موظفون في هذا الفرع</Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow className="branch-employees-head-row">
                    <TableCell className="branch-employees-th">#</TableCell>
                    <TableCell className="branch-employees-th">
                      اسم الموظف
                    </TableCell>
                    {canManage && (
                      <TableCell
                        className="branch-employees-th"
                        align="center"
                      >
                        الإجراءات
                      </TableCell>
                    )}
                  </TableRow>
                </TableHead>

                <TableBody>
                  {employees.map((employee, index) => (
                    <TableRow
                      key={employee.id}
                      className="branch-employees-row"
                    >
                      <TableCell className="branch-employees-td">
                        {index + 1}
                      </TableCell>

                      <TableCell className="branch-employees-td branch-employees-td-name">
                        {employee.fullName || "—"}
                      </TableCell>

                      {canManage && (
                        <TableCell
                          className="branch-employees-td"
                          align="center"
                        >
                          <Tooltip title="تعديل">
                            <IconButton
                              size="small"
                              className="branch-employees-action-btn branch-employees-edit-btn"
                              onClick={() => handleEditClick(employee)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="حذف">
                            <IconButton
                              size="small"
                              className="branch-employees-action-btn branch-employees-delete-btn"
                              onClick={() => handleDeleteClick(employee)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      </div>

      {/* ===============================
          Dialog الإضافة / التعديل
      =============================== */}
      <Dialog
        open={formDialog.open}
        onClose={handleCloseFormDialog}
        PaperProps={{ className: "branch-employees-form-dialog" }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle className="branch-employees-form-title">
          {formDialog.mode === "add"
            ? "إضافة موظف جديد"
            : "تعديل بيانات الموظف"}
        </DialogTitle>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <DialogContent className="branch-employees-form-content">
            <TextField
              fullWidth
              label="اسم الموظف"
              margin="dense"
              {...register("fullName")}
              error={!!errors.fullName}
              helperText={errors.fullName?.message}
              className="branch-employees-form-field"
              autoFocus
            />
          </DialogContent>

          <DialogActions className="branch-employees-form-actions">
            <Button
              onClick={handleCloseFormDialog}
              disabled={saving}
              className="branch-employees-form-cancel"
              startIcon={<CloseIcon />}
              type="button"
            >
              إلغاء
            </Button>

            <Button
              type="submit"
              disabled={saving}
              variant="contained"
              className="branch-employees-form-save"
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
        </form>
      </Dialog>

      {/* ===============================
          Dialog الحذف
      =============================== */}
      <Dialog
        open={deleteDialog.open}
        onClose={handleCloseDeleteDialog}
        PaperProps={{ className: "branch-employees-dialog" }}
      >
        <DialogTitle className="branch-employees-dialog-title">
          تأكيد الحذف
        </DialogTitle>

        <DialogContent>
          <DialogContentText className="branch-employees-dialog-text">
            هل أنت متأكد من حذف الموظف{" "}
            <strong>{deleteDialog.employee?.fullName}</strong>؟
            <br />
            لا يمكن التراجع عن هذا الإجراء.
          </DialogContentText>
        </DialogContent>

        <DialogActions className="branch-employees-dialog-actions">
          <Button
            onClick={handleCloseDeleteDialog}
            disabled={deleting}
            className="branch-employees-dialog-cancel"
          >
            إلغاء
          </Button>

          <Button
            onClick={handleConfirmDelete}
            disabled={deleting}
            variant="contained"
            className="branch-employees-dialog-confirm"
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