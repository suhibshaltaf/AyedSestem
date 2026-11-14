
import { useState, useMemo } from "react";
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
  FormControlLabel,
  Switch,
} from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useNavigate } from "react-router-dom";

import StorefrontIcon from "@mui/icons-material/Storefront";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import RefreshIcon from "@mui/icons-material/Refresh";
import SaveIcon from "@mui/icons-material/Save";
import CloseIcon from "@mui/icons-material/Close";
import VisibilityIcon from "@mui/icons-material/Visibility";

import {
  useBranches,
  useCreateBranch,
  useUpdateBranch,
  useDeleteBranch,
} from "../../hooks/useBranches.js";
import branchSchema from "./branchSchema.js";
import useAuthStore from "../../store/useAuthStore.js";
import styles from "../../styles/Branch/Branches.module.css";

const emptyForm = {
  name: "",
  code: "",
  address: "",
  phoneNumber: "",
  isActive: true,
};

const ADMIN_ROLES = ["SuperAdmin", "Admin"];

export default function BranchesManagement() {
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.user);

  const [searchQuery, setSearchQuery] = useState("");

  const [formDialog, setFormDialog] = useState({
    open: false,
    mode: "add",
    branch: null,
  });

  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    branch: null,
  });

  const isAdmin = useMemo(() => {
    if (!currentUser?.roles) return false;
    const roleNames = currentUser.roles.map((r) => r.name);

    return roleNames.some((name) => ADMIN_ROLES.includes(name));
  }, [currentUser]);

  const { data: branches = [], isLoading, refetch } = useBranches();

  const createMutation = useCreateBranch();
  const updateMutation = useUpdateBranch();
  const deleteMutation = useDeleteBranch();

  const saving = createMutation.isPending || updateMutation.isPending;
  const deleting = deleteMutation.isPending;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control,
    setValue,
  } = useForm({
    resolver: yupResolver(branchSchema),
    defaultValues: emptyForm,
  });

  const filteredBranches = useMemo(() => {
    if (!searchQuery.trim()) return branches;

    const q = searchQuery.toLowerCase();

    return branches.filter((b) => {
      return (
        (b.name || "").toLowerCase().includes(q) ||
        (b.code || "").toLowerCase().includes(q) ||
        (b.address || "").toLowerCase().includes(q) ||
        (b.phoneNumber || "").toLowerCase().includes(q) ||
        (b.managerName || "").toLowerCase().includes(q) ||
        (b.accountantName || "").toLowerCase().includes(q)
      );
    });
  }, [branches, searchQuery]);

  const handleAddClick = () => {
    reset(emptyForm);
    setFormDialog({ open: true, mode: "add", branch: null });
  };

  const handleEditClick = (branch) => {
    reset({
      name: branch.name || "",
      code: branch.code || "",
      address: branch.address || "",
      phoneNumber: branch.phoneNumber || "",
      isActive: branch.isActive ?? true,
    });

    setFormDialog({ open: true, mode: "edit", branch });
  };

  const handleViewClick = (branch) => {
    navigate(`/branches/${branch.id}`);
  };

  const handleCloseFormDialog = () => {
    if (!saving) {
      setFormDialog({ open: false, mode: "add", branch: null });
      reset(emptyForm);
    }
  };

  const onSubmit = async (data) => {
    const payload = {
      name: data.name.trim(),
      code: data.code.trim().toUpperCase(),
      address: data.address?.trim() || null,
      phoneNumber: data.phoneNumber?.trim() || null,
    };

    if (formDialog.mode === "add") {
      const result = await createMutation.mutateAsync(payload);
      if (result?.success) handleCloseFormDialog();
    } else {
      const result = await updateMutation.mutateAsync({
        id: formDialog.branch.id,
        data: { ...payload, isActive: data.isActive },
      });

      if (result?.success) handleCloseFormDialog();
    }
  };

  const handleDeleteClick = (branch) => {
    setDeleteDialog({ open: true, branch });
  };

  const handleConfirmDelete = async () => {
    const branch = deleteDialog.branch;
    if (!branch) return;

    const result = await deleteMutation.mutateAsync(branch.id);

    if (result?.success) {
      setDeleteDialog({ open: false, branch: null });
    }
  };

  const handleCloseDeleteDialog = () => {
    if (!deleting) {
      setDeleteDialog({ open: false, branch: null });
    }
  };

  return (
    <div className={styles.branchesContainer}>
      <div className={styles.branchesHeader}>
        <div className={styles.branchesHeaderIcon}>
          <StorefrontIcon sx={{ fontSize: 34 }} />
        </div>

        <Typography className={styles.branchesTitle}>
          إدارة الفروع
        </Typography>

        <Typography className={styles.branchesSubtitle}>
          إدارة فروع الشركة وبياناتها
        </Typography>
      </div>

      <div className={styles.branchesToolbar}>
        <TextField
          placeholder="البحث عن فرع..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          size="small"
          className={styles.branchesSearch}
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

        <div className={styles.branchesActions}>
          <Tooltip title="تحديث">
            <IconButton
              onClick={() => refetch()}
              className={styles.branchesRefreshBtn}
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            className={styles.branchesAddBtn}
            onClick={handleAddClick}
          >
            إضافة فرع
          </Button>
        </div>
      </div>

      <Paper elevation={0} className={styles.branchesTablePaper}>
        {isLoading ? (
          <Box className={styles.branchesLoading}>
            <CircularProgress sx={{ color: "#b8860b" }} />
          </Box>
        ) : filteredBranches.length === 0 ? (
          <Box className={styles.branchesEmpty}>
            <Typography>
              {searchQuery
                ? "لا توجد نتائج مطابقة للبحث"
                : "لا يوجد فروع لعرضها"}
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow className={styles.branchesTableHeadRow}>
                  <TableCell className={styles.branchesTh}>#</TableCell>
                  <TableCell className={styles.branchesTh}>
                    اسم الفرع
                  </TableCell>
                  <TableCell className={styles.branchesTh}>الكود</TableCell>
                  <TableCell className={styles.branchesTh}>
                    العنوان
                  </TableCell>
                  <TableCell className={styles.branchesTh}>الهاتف</TableCell>
                  <TableCell className={styles.branchesTh}>
                    المدير المسؤول
                  </TableCell>
                  <TableCell className={styles.branchesTh}>
                    المحاسب المسؤول
                  </TableCell>
                  <TableCell className={styles.branchesTh}>الحالة</TableCell>
                  <TableCell
                    className={styles.branchesTh}
                    align="center"
                  >
                    الإجراءات
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {filteredBranches.map((branch, index) => (
                  <TableRow
                    key={branch.id}
                    className={styles.branchesTableRow}
                  >
                    <TableCell className={styles.branchesTd}>
                      {index + 1}
                    </TableCell>

                    <TableCell
                      className={`${styles.branchesTd} ${styles.branchesTdName}`}
                    >
                      {branch.name || "—"}
                    </TableCell>

                    <TableCell className={styles.branchesTd}>
                      <Chip
                        label={branch.code || "—"}
                        size="small"
                        className={styles.branchesCodeChip}
                      />
                    </TableCell>

                    <TableCell className={styles.branchesTd}>
                      {branch.address || "—"}
                    </TableCell>

                    <TableCell
                      className={`${styles.branchesTd} ${styles.branchesTdPhone}`}
                    >
                      {branch.phoneNumber || "—"}
                    </TableCell>

                    <TableCell
                      className={`${styles.branchesTd} ${styles.branchesTdManager}`}
                    >
                      {branch.managerName ? (
                        <Chip
                          label={branch.managerName}
                          size="small"
                          className={styles.branchesManagerChip}
                        />
                      ) : (
                        <span className={styles.branchesTdEmpty}>—</span>
                      )}
                    </TableCell>

                    <TableCell
                      className={`${styles.branchesTd} ${styles.branchesTdAccountant}`}
                    >
                      {branch.accountantName ? (
                        <Chip
                          label={branch.accountantName}
                          size="small"
                          className={styles.branchesAccountantChip}
                        />
                      ) : (
                        <span className={styles.branchesTdEmpty}>—</span>
                      )}
                    </TableCell>

                    <TableCell className={styles.branchesTd}>
                      <Chip
                        label={branch.isActive ? "نشط" : "معطل"}
                        size="small"
                        className={`${styles.branchesStatusChip} ${
                          branch.isActive
                            ? styles.branchesStatusChipActive
                            : styles.branchesStatusChipInactive
                        }`}
                      />
                    </TableCell>

                    <TableCell
                      className={styles.branchesTd}
                      align="center"
                    >
                      <Tooltip title="عرض التفاصيل">
                        <IconButton
                          size="small"
                          className={`${styles.branchesActionBtn} ${styles.branchesViewBtn}`}
                          onClick={() => handleViewClick(branch)}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="تعديل">
                        <IconButton
                          size="small"
                          className={`${styles.branchesActionBtn} ${styles.branchesEditBtn}`}
                          onClick={() => handleEditClick(branch)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="حذف">
                        <IconButton
                          size="small"
                          className={`${styles.branchesActionBtn} ${styles.branchesDeleteBtn}`}
                          onClick={() => handleDeleteClick(branch)}
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

      <Dialog
        open={formDialog.open}
        onClose={handleCloseFormDialog}
        PaperProps={{ className: styles.branchesFormDialog }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle className={styles.branchesFormTitle}>
          {formDialog.mode === "add"
            ? "إضافة فرع جديد"
            : "تعديل بيانات الفرع"}
        </DialogTitle>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <DialogContent className={styles.branchesFormContent}>
            <TextField
              fullWidth
              label="اسم الفرع"
              margin="dense"
              {...register("name")}
              error={!!errors.name}
              helperText={errors.name?.message}
              className={styles.branchesFormField}
            />

            <TextField
              fullWidth
              label="كود الفرع"
              margin="dense"
              placeholder="مثال: AMM-01"
              {...register("code")}
              error={!!errors.code}
              helperText={
                errors.code?.message ||
                "يُستخدم هذا الكود في توليد الباركود لاحقاً"
              }
              className={styles.branchesFormField}
              inputProps={{
                style: { textTransform: "uppercase" },
              }}
            />

            <TextField
              fullWidth
              label="العنوان"
              margin="dense"
              {...register("address")}
              error={!!errors.address}
              helperText={errors.address?.message}
              className={styles.branchesFormField}
            />

            <TextField
              fullWidth
              label="رقم الهاتف"
              margin="dense"
              {...register("phoneNumber", {
                onChange: (e) => {
                  const digitsOnly = e.target.value.replace(/\D/g, "");

                  setValue("phoneNumber", digitsOnly, {
                    shouldValidate: false,
                    shouldDirty: true,
                  });
                },
              })}
              error={!!errors.phoneNumber}
              helperText={errors.phoneNumber?.message}
              className={styles.branchesFormField}
              inputProps={{
                inputMode: "numeric",
                maxLength: 10,
              }}
            />

            {formDialog.mode === "edit" && (
              <Controller
                name="isActive"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Switch
                        checked={!!field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                        color="primary"
                      />
                    }
                    label="الفرع نشط"
                    className={styles.branchesFormSwitch}
                  />
                )}
              />
            )}
          </DialogContent>

          <DialogActions className={styles.branchesFormActions}>
            <Button
              onClick={handleCloseFormDialog}
              disabled={saving}
              className={styles.branchesFormCancel}
              startIcon={<CloseIcon />}
              type="button"
            >
              إلغاء
            </Button>

            <Button
              type="submit"
              disabled={saving}
              variant="contained"
              className={styles.branchesFormSave}
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
        PaperProps={{ className: styles.branchesDialog }}
      >
        <DialogTitle className={styles.branchesDialogTitle}>
          تأكيد الحذف
        </DialogTitle>

        <DialogContent>
          <DialogContentText className={styles.branchesDialogText}>
            هل أنت متأكد من حذف الفرع{" "}
            <strong>{deleteDialog.branch?.name}</strong>؟
            <br />
            لا يمكن التراجع عن هذا الإجراء.
          </DialogContentText>
        </DialogContent>

        <DialogActions className={styles.branchesDialogActions}>
          <Button
            onClick={handleCloseDeleteDialog}
            disabled={deleting}
            className={styles.branchesDialogCancel}
          >
            إلغاء
          </Button>

          <Button
            onClick={handleConfirmDelete}
            disabled={deleting}
            variant="contained"
            className={styles.branchesDialogConfirm}
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
