
import { useState, useMemo, useEffect } from "react";
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
import styles from "../../styles/Branch/BranchDetails.module.css";

const ADMIN_ROLES = ["SuperAdmin", "Admin"];

export default function BranchDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.user);

  const [formDialog, setFormDialog] = useState({
    open: false,
    mode: "add",
    employee: null,
  });

  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    employee: null,
  });

  const isAdmin = useMemo(() => {
    if (!currentUser?.roles) return false;
    const roleNames = currentUser.roles.map((r) => r.name);
    return roleNames.some((name) => ADMIN_ROLES.includes(name));
  }, [currentUser]);

  const canManage = useMemo(() => {
    if (!currentUser?.roles) return false;
    const roleNames = currentUser.roles.map((r) => r.name);

    return (
      isAdmin ||
      roleNames.includes("BranchManager") ||
      roleNames.includes("BranchAccountant")
    );
  }, [currentUser, isAdmin]);

  const {
    data: branches = [],
    isLoading: loadingBranches,
    refetch: refetchBranches,
  } = useBranches();

  const {
    data: employees = [],
    isLoading: loadingEmployees,
    refetch: refetchEmployees,
  } = useBranchEmployees(id);

  const createMutation = useCreateBranchEmployee(id);
  const updateMutation = useUpdateBranchEmployee(id);
  const deleteMutation = useDeleteBranchEmployee(id);

  const saving = createMutation.isPending || updateMutation.isPending;
  const deleting = deleteMutation.isPending;

  const branch = useMemo(() => {
    if (!id) return null;
    const numericId = Number(id);
    if (isNaN(numericId)) return null;

    return branches.find((b) => Number(b.id) === numericId) || null;
  }, [branches, id]);

  const canView = useMemo(() => {
    if (!branch) return false;
    if (isAdmin) return true;

    return Number(currentUser?.branchId) === Number(branch.id);
  }, [branch, isAdmin, currentUser]);

  useEffect(() => {
    if (!branch || isAdmin) return;

    if (!canView) {
      navigate("/unauthorized", { replace: true });
    }
  }, [branch, isAdmin, canView, navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: yupResolver(branchEmployeeSchema),
    defaultValues: { fullName: "" },
  });

  const handleAddClick = () => {
    reset({ fullName: "" });
    setFormDialog({ open: true, mode: "add", employee: null });
  };

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

  const handleDeleteClick = (employee) => {
    setDeleteDialog({ open: true, employee });
  };

  const handleConfirmDelete = async () => {
    const employee = deleteDialog.employee;
    if (!employee) return;

    const result = await deleteMutation.mutateAsync(employee.id);

    if (result?.success) {
      setDeleteDialog({ open: false, employee: null });
    }
  };

  const handleCloseDeleteDialog = () => {
    if (!deleting) {
      setDeleteDialog({ open: false, employee: null });
    }
  };

  if (loadingBranches) {
    return (
      <Box className={styles.branchDetailsLoading}>
        <CircularProgress sx={{ color: "#b8860b" }} />
      </Box>
    );
  }

  if (!branch) {
    return (
      <div className={styles.branchDetailsContainer}>
        <Paper elevation={0} className={styles.branchDetailsCard}>
          <Box className={styles.branchDetailsEmpty}>
            <Typography className={styles.branchDetailsEmptyText}>
              الفرع غير موجود
            </Typography>

            <Button
              variant="contained"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate(isAdmin ? "/branches" : "/dashboard")}
              className={styles.branchDetailsBackBtn}
            >
              العودة
            </Button>
          </Box>
        </Paper>
      </div>
    );
  }

  if (!canView) {
    return null;
  }

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
    <div className={styles.branchDetailsContainer}>
      <div className={styles.branchDetailsHeader}>
        <div className={styles.branchDetailsHeaderIcon}>
          <StorefrontIcon sx={{ fontSize: 34 }} />
        </div>

        <Typography className={styles.branchDetailsTitle}>
          {branch.name}
        </Typography>

        <div className={styles.branchDetailsTitleDecor}>
          <span className={styles.branchDetailsTitleLine} />

          <Typography className={styles.branchDetailsSubtitle}>
            تفاصيل الفرع
          </Typography>

          <span className={styles.branchDetailsTitleLine} />
        </div>
      </div>

      <div className={styles.branchDetailsActions}>
        <Tooltip title="تحديث">
          <IconButton
            onClick={() => {
              refetchBranches();
              refetchEmployees();
            }}
            className={styles.branchDetailsRefreshBtn}
          >
            <RefreshIcon />
          </IconButton>
        </Tooltip>

        {isAdmin && (
          <Tooltip title="العودة إلى قائمة الفروع">
            <IconButton
              onClick={() => navigate("/branches")}
              className={styles.branchDetailsBackIconBtn}
            >
              <ArrowBackIcon />
            </IconButton>
          </Tooltip>
        )}
      </div>

      <Paper elevation={0} className={styles.branchDetailsCard}>
        <div className={styles.branchDetailsStatusRow}>
          <Typography className={styles.branchDetailsStatusLabel}>
            حالة الفرع:
          </Typography>

          <Chip
            label={branch.isActive ? "نشط" : "معطل"}
            className={`${styles.branchDetailsStatusChip} ${
              branch.isActive
                ? styles.branchDetailsStatusChipActive
                : styles.branchDetailsStatusChipInactive
            }`}
          />
        </div>

        <Divider className={styles.branchDetailsDivider} />

        {details.map((item, index) => (
          <div key={item.label}>
            <div className={styles.branchDetailsRow}>
              <Typography
                className={`${styles.branchDetailsValue} ${
                  item.mono ? styles.branchDetailsValueMono : ""
                } ${item.ltr ? styles.branchDetailsValueLtr : ""}`}
              >
                {item.value}
              </Typography>

              <div className={styles.branchDetailsLabel}>
                <span className={styles.branchDetailsLabelText}>
                  {item.label}:
                </span>

                <span className={styles.branchDetailsLabelIcon}>
                  {item.icon}
                </span>
              </div>
            </div>

            {index < details.length - 1 && (
              <Divider className={styles.branchDetailsDivider} />
            )}
          </div>
        ))}
      </Paper>

      <div className={styles.branchEmployeesSection}>
        <div className={styles.branchEmployeesHeader}>
          <div className={styles.branchEmployeesHeaderIcon}>
            <GroupIcon sx={{ fontSize: 26 }} />
          </div>

          <Typography className={styles.branchEmployeesTitle}>
            موظفو الفرع
          </Typography>
        </div>

        <Paper elevation={0} className={styles.branchEmployeesPaper}>
          <div className={styles.branchEmployeesToolbar}>
            <Typography className={styles.branchEmployeesCount}>
              عدد الموظفين: {employees.length}
            </Typography>

            {canManage && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                className={styles.branchEmployeesAddBtn}
                onClick={handleAddClick}
              >
                إضافة موظف
              </Button>
            )}
          </div>

          {loadingEmployees ? (
            <Box className={styles.branchEmployeesLoading}>
              <CircularProgress sx={{ color: "#b8860b" }} size={30} />
            </Box>
          ) : employees.length === 0 ? (
            <Box className={styles.branchEmployeesEmpty}>
              <Typography>لا يوجد موظفون في هذا الفرع</Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow className={styles.branchEmployeesHeadRow}>
                    <TableCell className={styles.branchEmployeesTh}>
                      #
                    </TableCell>

                    <TableCell className={styles.branchEmployeesTh}>
                      اسم الموظف
                    </TableCell>

                    {canManage && (
                      <TableCell
                        className={styles.branchEmployeesTh}
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
                      className={styles.branchEmployeesRow}
                    >
                      <TableCell className={styles.branchEmployeesTd}>
                        {index + 1}
                      </TableCell>

                      <TableCell
                        className={`${styles.branchEmployeesTd} ${styles.branchEmployeesTdName}`}
                      >
                        {employee.fullName || "—"}
                      </TableCell>

                      {canManage && (
                        <TableCell
                          className={styles.branchEmployeesTd}
                          align="center"
                        >
                          <Tooltip title="تعديل">
                            <IconButton
                              size="small"
                              className={`${styles.branchEmployeesActionBtn} ${styles.branchEmployeesEditBtn}`}
                              onClick={() => handleEditClick(employee)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="حذف">
                            <IconButton
                              size="small"
                              className={`${styles.branchEmployeesActionBtn} ${styles.branchEmployeesDeleteBtn}`}
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

      <Dialog
        open={formDialog.open}
        onClose={handleCloseFormDialog}
        PaperProps={{ className: styles.branchEmployeesFormDialog }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle className={styles.branchEmployeesFormTitle}>
          {formDialog.mode === "add"
            ? "إضافة موظف جديد"
            : "تعديل بيانات الموظف"}
        </DialogTitle>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <DialogContent className={styles.branchEmployeesFormContent}>
            <TextField
              fullWidth
              label="اسم الموظف"
              margin="dense"
              {...register("fullName")}
              error={!!errors.fullName}
              helperText={errors.fullName?.message}
              className={styles.branchEmployeesFormField}
              autoFocus
            />
          </DialogContent>

          <DialogActions className={styles.branchEmployeesFormActions}>
            <Button
              onClick={handleCloseFormDialog}
              disabled={saving}
              className={styles.branchEmployeesFormCancel}
              startIcon={<CloseIcon />}
              type="button"
            >
              إلغاء
            </Button>

            <Button
              type="submit"
              disabled={saving}
              variant="contained"
              className={styles.branchEmployeesFormSave}
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

      <Dialog
        open={deleteDialog.open}
        onClose={handleCloseDeleteDialog}
        PaperProps={{ className: styles.branchEmployeesDialog }}
      >
        <DialogTitle className={styles.branchEmployeesDialogTitle}>
          تأكيد الحذف
        </DialogTitle>

        <DialogContent>
          <DialogContentText className={styles.branchEmployeesDialogText}>
            هل أنت متأكد من حذف الموظف{" "}
            <strong>{deleteDialog.employee?.fullName}</strong>؟
            <br />
            لا يمكن التراجع عن هذا الإجراء.
          </DialogContentText>
        </DialogContent>

        <DialogActions className={styles.branchEmployeesDialogActions}>
          <Button
            onClick={handleCloseDeleteDialog}
            disabled={deleting}
            className={styles.branchEmployeesDialogCancel}
          >
            إلغاء
          </Button>

          <Button
            onClick={handleConfirmDelete}
            disabled={deleting}
            variant="contained"
            className={styles.branchEmployeesDialogConfirm}
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
