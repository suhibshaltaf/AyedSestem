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
import "../../styles/branches.css";

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

  // ✅ الأدوار
  const isAdmin = useMemo(() => {
    if (!currentUser?.roles) return false;
    const roleNames = currentUser.roles.map((r) => r.name);
    return roleNames.some((name) => ADMIN_ROLES.includes(name));
  }, [currentUser]);

  // React Query
  const { data: branches = [], isLoading, refetch } = useBranches();
  const createMutation = useCreateBranch();
  const updateMutation = useUpdateBranch();
  const deleteMutation = useDeleteBranch();

  const saving = createMutation.isPending || updateMutation.isPending;
  const deleting = deleteMutation.isPending;

  // RHF
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

  // فلترة
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
    if (result?.success) setDeleteDialog({ open: false, branch: null });
  };

  const handleCloseDeleteDialog = () => {
    if (!deleting) setDeleteDialog({ open: false, branch: null });
  };

  return (
    <div className="branches-container">
      {/* Header */}
      <div className="branches-header">
        <div className="branches-header-icon">
          <StorefrontIcon sx={{ fontSize: 34 }} />
        </div>

        <Typography className="branches-title">إدارة الفروع</Typography>

        <Typography className="branches-subtitle">
          إدارة فروع الشركة وبياناتها
        </Typography>
      </div>

      {/* Toolbar */}
      <div className="branches-toolbar">
        <TextField
          placeholder="البحث عن فرع..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          size="small"
          className="branches-search"
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

        <div className="branches-actions">
          <Tooltip title="تحديث">
            <IconButton
              onClick={() => refetch()}
              className="branches-refresh-btn"
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            className="branches-add-btn"
            onClick={handleAddClick}
          >
            إضافة فرع
          </Button>
        </div>
      </div>

      {/* Table */}
      <Paper elevation={0} className="branches-table-paper">
        {isLoading ? (
          <Box className="branches-loading">
            <CircularProgress sx={{ color: "#b8860b" }} />
          </Box>
        ) : filteredBranches.length === 0 ? (
          <Box className="branches-empty">
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
                <TableRow className="branches-table-head-row">
                  <TableCell className="branches-th">#</TableCell>
                  <TableCell className="branches-th">اسم الفرع</TableCell>
                  <TableCell className="branches-th">الكود</TableCell>
                  <TableCell className="branches-th">العنوان</TableCell>
                  <TableCell className="branches-th">الهاتف</TableCell>
                  <TableCell className="branches-th">المدير المسؤول</TableCell>
                  <TableCell className="branches-th">المحاسب المسؤول</TableCell>
                  <TableCell className="branches-th">الحالة</TableCell>
                  <TableCell className="branches-th" align="center">
                    الإجراءات
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {filteredBranches.map((branch, index) => (
                  <TableRow key={branch.id} className="branches-table-row">
                    <TableCell className="branches-td">
                      {index + 1}
                    </TableCell>

                    <TableCell className="branches-td branches-td-name">
                      {branch.name || "—"}
                    </TableCell>

                    <TableCell className="branches-td">
                      <Chip
                        label={branch.code || "—"}
                        size="small"
                        className="branches-code-chip"
                      />
                    </TableCell>

                    <TableCell className="branches-td">
                      {branch.address || "—"}
                    </TableCell>

                    <TableCell className="branches-td branches-td-phone">
                      {branch.phoneNumber || "—"}
                    </TableCell>

                    <TableCell className="branches-td branches-td-manager">
                      {branch.managerName ? (
                        <Chip
                          label={branch.managerName}
                          size="small"
                          className="branches-manager-chip"
                        />
                      ) : (
                        <span className="branches-td-empty">—</span>
                      )}
                    </TableCell>

                    <TableCell className="branches-td branches-td-accountant">
                      {branch.accountantName ? (
                        <Chip
                          label={branch.accountantName}
                          size="small"
                          className="branches-accountant-chip"
                        />
                      ) : (
                        <span className="branches-td-empty">—</span>
                      )}
                    </TableCell>

                    <TableCell className="branches-td">
                      <Chip
                        label={branch.isActive ? "نشط" : "معطل"}
                        size="small"
                        className={`branches-status-chip ${
                          branch.isActive
                            ? "branches-status-chip-active"
                            : "branches-status-chip-inactive"
                        }`}
                      />
                    </TableCell>

                    <TableCell className="branches-td" align="center">
                      <Tooltip title="عرض التفاصيل">
                        <IconButton
                          size="small"
                          className="branches-action-btn branches-view-btn"
                          onClick={() => handleViewClick(branch)}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="تعديل">
                        <IconButton
                          size="small"
                          className="branches-action-btn branches-edit-btn"
                          onClick={() => handleEditClick(branch)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="حذف">
                        <IconButton
                          size="small"
                          className="branches-action-btn branches-delete-btn"
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

      {/* Dialog الإضافة / التعديل */}
      <Dialog
        open={formDialog.open}
        onClose={handleCloseFormDialog}
        PaperProps={{ className: "branches-form-dialog" }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle className="branches-form-title">
          {formDialog.mode === "add" ? "إضافة فرع جديد" : "تعديل بيانات الفرع"}
        </DialogTitle>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <DialogContent className="branches-form-content">
            <TextField
              fullWidth
              label="اسم الفرع"
              margin="dense"
              {...register("name")}
              error={!!errors.name}
              helperText={errors.name?.message}
              className="branches-form-field"
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
              className="branches-form-field"
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
              className="branches-form-field"
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
              className="branches-form-field"
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
                    className="branches-form-switch"
                  />
                )}
              />
            )}
          </DialogContent>

          <DialogActions className="branches-form-actions">
            <Button
              onClick={handleCloseFormDialog}
              disabled={saving}
              className="branches-form-cancel"
              startIcon={<CloseIcon />}
              type="button"
            >
              إلغاء
            </Button>

            <Button
              type="submit"
              disabled={saving}
              variant="contained"
              className="branches-form-save"
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

      {/* Dialog الحذف */}
      <Dialog
        open={deleteDialog.open}
        onClose={handleCloseDeleteDialog}
        PaperProps={{ className: "branches-dialog" }}
      >
        <DialogTitle className="branches-dialog-title">
          تأكيد الحذف
        </DialogTitle>

        <DialogContent>
          <DialogContentText className="branches-dialog-text">
            هل أنت متأكد من حذف الفرع{" "}
            <strong>{deleteDialog.branch?.name}</strong>؟
            <br />
            لا يمكن التراجع عن هذا الإجراء.
          </DialogContentText>
        </DialogContent>

        <DialogActions className="branches-dialog-actions">
          <Button
            onClick={handleCloseDeleteDialog}
            disabled={deleting}
            className="branches-dialog-cancel"
          >
            إلغاء
          </Button>

          <Button
            onClick={handleConfirmDelete}
            disabled={deleting}
            variant="contained"
            className="branches-dialog-confirm"
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