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

import BuildIcon from "@mui/icons-material/Build";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import RefreshIcon from "@mui/icons-material/Refresh";
import SaveIcon from "@mui/icons-material/Save";
import CloseIcon from "@mui/icons-material/Close";

import {
  useWorkshops,
  useCreateWorkshop,
  useUpdateWorkshop,
  useDeleteWorkshop,
} from "../../hooks/useWorkshops.js";
import workshopSchema from "./workshopSchema.js";
import "../../styles/workshops.css";

// ===============================
// القيم الافتراضية
// ===============================
const emptyForm = {
  name: "",
  address: "",
  phoneNumber: "",
  isActive: true,
};

export default function WorkshopsManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [formDialog, setFormDialog] = useState({
    open: false,
    mode: "add",
    workshop: null,
  });
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    workshop: null,
  });

  // React Query
  const { data: workshops = [], isLoading, refetch } = useWorkshops();
  const createMutation = useCreateWorkshop();
  const updateMutation = useUpdateWorkshop();
  const deleteMutation = useDeleteWorkshop();

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
    resolver: yupResolver(workshopSchema),
    defaultValues: emptyForm,
  });

  // ===============================
  // فلترة
  // ===============================
  const filteredWorkshops = useMemo(() => {
    if (!searchQuery.trim()) return workshops;
    const q = searchQuery.toLowerCase();
    return workshops.filter((w) => {
      return (
        (w.name || "").toLowerCase().includes(q) ||
        (w.address || "").toLowerCase().includes(q) ||
        (w.phoneNumber || "").toLowerCase().includes(q) ||
        (w.managerName || "").toLowerCase().includes(q)
      );
    });
  }, [workshops, searchQuery]);

  // ===============================
  // فتح Dialog الإضافة
  // ===============================
  const handleAddClick = () => {
    reset(emptyForm);
    setFormDialog({ open: true, mode: "add", workshop: null });
  };

  // ===============================
  // فتح Dialog التعديل
  // ===============================
  const handleEditClick = (workshop) => {
    reset({
      name: workshop.name || "",
      address: workshop.address || "",
      phoneNumber: workshop.phoneNumber || "",
      isActive: workshop.isActive ?? true,
    });
    setFormDialog({ open: true, mode: "edit", workshop });
  };

  // ===============================
  // إغلاق Dialog
  // ===============================
  const handleCloseFormDialog = () => {
    if (!saving) {
      setFormDialog({ open: false, mode: "add", workshop: null });
      reset(emptyForm);
    }
  };

  // ===============================
  // حفظ
  // ===============================
  const onSubmit = async (data) => {
    const payload = {
      name: data.name.trim(),
      address: data.address?.trim() || null,
      phoneNumber: data.phoneNumber?.trim() || null,
      isActive: data.isActive,
    };

    if (formDialog.mode === "add") {
      const result = await createMutation.mutateAsync(payload);
      if (result?.success) {
        handleCloseFormDialog();
      }
    } else {
      const result = await updateMutation.mutateAsync({
        id: formDialog.workshop.id,
        data: payload,
      });
      if (result?.success) {
        handleCloseFormDialog();
      }
    }
  };

  // ===============================
  // حذف
  // ===============================
  const handleDeleteClick = (workshop) => {
    setDeleteDialog({ open: true, workshop });
  };

  const handleConfirmDelete = async () => {
    const workshop = deleteDialog.workshop;
    if (!workshop) return;

    const result = await deleteMutation.mutateAsync(workshop.id);
    if (result?.success) {
      setDeleteDialog({ open: false, workshop: null });
    }
  };

  const handleCloseDeleteDialog = () => {
    if (!deleting) {
      setDeleteDialog({ open: false, workshop: null });
    }
  };

  return (
    <div className="workshops-container">
      {/* Header */}
      <div className="workshops-header">
        <div className="workshops-header-icon">
          <BuildIcon sx={{ fontSize: 34 }} />
        </div>

        <Typography className="workshops-title">إدارة الورش</Typography>

        <Typography className="workshops-subtitle">
          إدارة الورش وبياناتها
        </Typography>
      </div>

      {/* Toolbar */}
      <div className="workshops-toolbar">
        <TextField
          placeholder="البحث عن ورشة..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          size="small"
          className="workshops-search"
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

        <div className="workshops-actions">
          <Tooltip title="تحديث">
            <IconButton
              onClick={() => refetch()}
              className="workshops-refresh-btn"
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            className="workshops-add-btn"
            onClick={handleAddClick}
          >
            إضافة ورشة
          </Button>
        </div>
      </div>

      {/* Table */}
      <Paper elevation={0} className="workshops-table-paper">
        {isLoading ? (
          <Box className="workshops-loading">
            <CircularProgress sx={{ color: "#b8860b" }} />
          </Box>
        ) : filteredWorkshops.length === 0 ? (
          <Box className="workshops-empty">
            <Typography>
              {searchQuery
                ? "لا توجد نتائج مطابقة للبحث"
                : "لا يوجد ورش لعرضها"}
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow className="workshops-table-head-row">
                  <TableCell className="workshops-th">#</TableCell>
                  <TableCell className="workshops-th">اسم الورشة</TableCell>
                  <TableCell className="workshops-th">العنوان</TableCell>
                  <TableCell className="workshops-th">الهاتف</TableCell>
                  <TableCell className="workshops-th">المسؤول</TableCell>
                  <TableCell className="workshops-th">الحالة</TableCell>
                  <TableCell className="workshops-th" align="center">
                    الإجراءات
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {filteredWorkshops.map((workshop, index) => (
                  <TableRow key={workshop.id} className="workshops-table-row">
                    <TableCell className="workshops-td">
                      {index + 1}
                    </TableCell>

                    <TableCell className="workshops-td workshops-td-name">
                      {workshop.name || "—"}
                    </TableCell>

                    <TableCell className="workshops-td">
                      {workshop.address || "—"}
                    </TableCell>

                    <TableCell className="workshops-td workshops-td-phone">
                      {workshop.phoneNumber || "—"}
                    </TableCell>

                    {/* ✅ المسؤول */}
                    <TableCell className="workshops-td workshops-td-manager">
                      {workshop.managerName ? (
                        <Chip
                          label={workshop.managerName}
                          size="small"
                          className="workshops-manager-chip"
                        />
                      ) : (
                        <span className="workshops-td-empty">—</span>
                      )}
                    </TableCell>

                    <TableCell className="workshops-td">
                      <Chip
                        label={workshop.isActive ? "نشطة" : "معطلة"}
                        size="small"
                        className={`workshops-status-chip ${
                          workshop.isActive
                            ? "workshops-status-chip-active"
                            : "workshops-status-chip-inactive"
                        }`}
                      />
                    </TableCell>

                    <TableCell className="workshops-td" align="center">
                      <Tooltip title="تعديل">
                        <IconButton
                          size="small"
                          className="workshops-action-btn workshops-edit-btn"
                          onClick={() => handleEditClick(workshop)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="حذف">
                        <IconButton
                          size="small"
                          className="workshops-action-btn workshops-delete-btn"
                          onClick={() => handleDeleteClick(workshop)}
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
        PaperProps={{ className: "workshops-form-dialog" }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle className="workshops-form-title">
          {formDialog.mode === "add"
            ? "إضافة ورشة جديدة"
            : "تعديل بيانات الورشة"}
        </DialogTitle>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <DialogContent className="workshops-form-content">
            {/* Name */}
            <TextField
              fullWidth
              label="اسم الورشة"
              margin="dense"
              {...register("name")}
              error={!!errors.name}
              helperText={errors.name?.message}
              className="workshops-form-field"
            />

            {/* Address */}
            <TextField
              fullWidth
              label="العنوان"
              margin="dense"
              {...register("address")}
              error={!!errors.address}
              helperText={errors.address?.message}
              className="workshops-form-field"
            />

            {/* Phone */}
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
              className="workshops-form-field"
              inputProps={{
                inputMode: "numeric",
                maxLength: 10,
              }}
            />

            {/* IsActive (edit only) */}
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
                    label="الورشة نشطة"
                    className="workshops-form-switch"
                  />
                )}
              />
            )}
          </DialogContent>

          <DialogActions className="workshops-form-actions">
            <Button
              onClick={handleCloseFormDialog}
              disabled={saving}
              className="workshops-form-cancel"
              startIcon={<CloseIcon />}
              type="button"
            >
              إلغاء
            </Button>

            <Button
              type="submit"
              disabled={saving}
              variant="contained"
              className="workshops-form-save"
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
        PaperProps={{ className: "workshops-dialog" }}
      >
        <DialogTitle className="workshops-dialog-title">
          تأكيد الحذف
        </DialogTitle>

        <DialogContent>
          <DialogContentText className="workshops-dialog-text">
            هل أنت متأكد من حذف الورشة{" "}
            <strong>{deleteDialog.workshop?.name}</strong>؟
            <br />
            لا يمكن التراجع عن هذا الإجراء.
          </DialogContentText>
        </DialogContent>

        <DialogActions className="workshops-dialog-actions">
          <Button
            onClick={handleCloseDeleteDialog}
            disabled={deleting}
            className="workshops-dialog-cancel"
          >
            إلغاء
          </Button>

          <Button
            onClick={handleConfirmDelete}
            disabled={deleting}
            variant="contained"
            className="workshops-dialog-confirm"
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