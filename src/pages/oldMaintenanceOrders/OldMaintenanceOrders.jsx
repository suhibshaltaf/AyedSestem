import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Pagination,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

import {
  Add,
  Archive,
  Delete,
  Edit,
  Search,
  Visibility,
  Refresh,
  Clear,
  Storefront,
} from "@mui/icons-material";

import useAuthStore from "../../store/useAuthStore.js";
import { useBranches } from "../../hooks/useBranches.js";

import {
  useOldMaintenanceOrders,
  useDeleteOldMaintenanceOrder,
} from "../../hooks/useOldMaintenanceOrders.js";

import styles from "../../styles/OldMaintenanceOrders/old-maintenance-orders.module.css";

const PAGE_SIZE = 10;

/* =========================================================
   Helpers
   ========================================================= */

const read = (object, name) =>
  object?.[name.charAt(0).toLowerCase() + name.slice(1)] ??
  object?.[name];

const extractItems = (response) => {
  let result = response;

  for (let i = 0; i < 5 && result; i++) {
    if (Array.isArray(result)) {
      return result;
    }

    const items =
      result?.items ??
      result?.Items ??
      result?.data?.items ??
      result?.data?.Items;

    if (Array.isArray(items)) {
      return items;
    }

    if (result?.data && typeof result.data === "object") {
      result = result.data;
      continue;
    }

    break;
  }

  return [];
};

const extractTotal = (response, items) => {
  const value =
    response?.totalCount ??
    response?.TotalCount ??
    response?.data?.totalCount ??
    response?.data?.TotalCount;

  return Number(value ?? items.length);
};

const extractTotalPages = (response, totalCount) => {
  const value =
    response?.totalPages ??
    response?.TotalPages ??
    response?.data?.totalPages ??
    response?.data?.TotalPages;

  return Number(value ?? Math.ceil(totalCount / PAGE_SIZE));
};

const formatDate = (value) => {
  if (!value) return "—";

  // المحافظة على التاريخ كما هو بدون تحويله إلى اليوم السابق بسبب UTC
  const dateOnly = String(value).split("T")[0];
  const parts = dateOnly.split("-");

  if (parts.length === 3) {
    const [year, month, day] = parts;

    if (year && month && day) {
      return `${day}/${month}/${year}`;
    }
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-GB");
};

const formatNumber = (value) => {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  const number = Number(value);

  if (Number.isNaN(number)) {
    return "—";
  }

  return number.toLocaleString("en-US");
};

/* =========================================================
   Component
   ========================================================= */

const OldMaintenanceOrders = () => {
  const navigate = useNavigate();

  const currentUser = useAuthStore((state) => state.user);

  /* ================= Permissions ================= */

  const roles = useMemo(
    () => currentUser?.roles?.map((role) => role.name) || [],
    [currentUser]
  );

  const isAdmin = roles.some((role) =>
    ["Admin", "SuperAdmin"].includes(role)
  );

  /* ================= Branches ================= */

  const { data: branches = [] } = useBranches();

  /* ================= Filters State ================= */

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [status, setStatus] = useState("");
  const [branchId, setBranchId] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  /* ================= Pagination ================= */

  const [page, setPage] = useState(1);

  /* ================= Delete ================= */

  const [deleteId, setDeleteId] = useState(null);

  /* =========================================================
     Debounce Search
     ========================================================= */

  useEffect(() => {
    const trimmed = search.trim();

    if (trimmed === debouncedSearch) {
      return undefined;
    }

    const timeoutId = setTimeout(() => {
      setDebouncedSearch(trimmed);
      setPage(1);
    }, 350);

    return () => clearTimeout(timeoutId);
  }, [search, debouncedSearch]);

  /* =========================================================
     Query Params
     ========================================================= */

  const params = useMemo(
    () => ({
      pageNumber: page,
      pageSize: PAGE_SIZE,
      search: debouncedSearch || undefined,
      status: status || undefined,
      branchId: isAdmin ? branchId || undefined : undefined,
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
    }),
    [
      page,
      debouncedSearch,
      status,
      branchId,
      fromDate,
      toDate,
      isAdmin,
    ]
  );

  /* ================= Queries ================= */

  const {
    data: response,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useOldMaintenanceOrders(params);

  const deleteMutation = useDeleteOldMaintenanceOrder();

  /* ================= Response Data ================= */

  const orders = useMemo(
    () => extractItems(response),
    [response]
  );

  const totalCount = useMemo(
    () => extractTotal(response, orders),
    [response, orders]
  );

  const pageCount = Math.max(
    1,
    extractTotalPages(response, totalCount)
  );

  const startItem =
    totalCount === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;

  const endItem =
    totalCount === 0
      ? 0
      : Math.min(
          (page - 1) * PAGE_SIZE + orders.length,
          totalCount
        );

  /* =========================================================
     Statistics
     ملاحظة: الإحصائيات التالية للصفحة الحالية فقط
     ========================================================= */

  const readyCount = useMemo(
    () =>
      orders.filter(
        (order) => Number(read(order, "Status")) === 1
      ).length,
    [orders]
  );

  const deliveredCount = useMemo(
    () =>
      orders.filter(
        (order) => Number(read(order, "Status")) === 2
      ).length,
    [orders]
  );

  const totalFees = useMemo(
    () =>
      orders.reduce(
        (sum, order) =>
          sum + Number(read(order, "Fees") || 0),
        0
      ),
    [orders]
  );

  /* =========================================================
     Keep Page In Range
     ========================================================= */

  useEffect(() => {
    if (page > pageCount) {
      setPage(pageCount);
    }
  }, [page, pageCount]);

  /* =========================================================
     Handlers
     ========================================================= */

  const handleFilterChange = (setter) => (event) => {
    setter(event.target.value);
    setPage(1);
  };

  const clearFilters = () => {
    setSearch("");
    setDebouncedSearch("");

    setStatus("");
    setBranchId("");
    setFromDate("");
    setToDate("");

    setPage(1);
  };

  const handleDelete = () => {
    if (deleteId === null) return;

    deleteMutation.mutate(deleteId, {
      onSuccess: () => {
        setDeleteId(null);
      },
    });
  };

  const closeDeleteDialog = () => {
    if (!deleteMutation.isPending) {
      setDeleteId(null);
    }
  };

  /* =========================================================
     Render
     ========================================================= */

  return (
    <Box className={styles.page}>
      {/* ================= HEADER ================= */}

      <Box className={styles.header}>
        <Box className={styles.headerIcon}>
          <Archive sx={{ fontSize: 34 }} />
        </Box>

        <Typography
          component="h1"
          className={styles.headerTitle}
        >
          أرشيف التصاليح القديمة
        </Typography>

        <Typography className={styles.headerSubtitle}>
          متابعة التصاليح المسجلة على الوصولات الورقية القديمة
        </Typography>
      </Box>

      {/* ================= STATISTICS ================= */}

      <Box className={styles.stats}>
        <Card className={styles.statCard}>
          <CardContent>
            <Typography className={styles.statLabel}>
              إجمالي السجلات
            </Typography>

            <Typography className={styles.statValue}>
              {formatNumber(totalCount)}
            </Typography>
          </CardContent>
        </Card>

        <Card className={styles.statCard}>
          <CardContent>
            <Typography className={styles.statLabel}>
              جاهز للتسليم
            </Typography>

            <Typography className={styles.statValue}>
              {formatNumber(readyCount)}
            </Typography>

            <Typography className={styles.statCaption}>
              في الصفحة الحالية
            </Typography>
          </CardContent>
        </Card>

        <Card className={styles.statCard}>
          <CardContent>
            <Typography className={styles.statLabel}>
              تم التسليم
            </Typography>

            <Typography className={styles.statValue}>
              {formatNumber(deliveredCount)}
            </Typography>

            <Typography className={styles.statCaption}>
              في الصفحة الحالية
            </Typography>
          </CardContent>
        </Card>

        <Card className={styles.statCard}>
          <CardContent>
            <Typography className={styles.statLabel}>
              مجموع الأجور
            </Typography>

            <Typography className={styles.statValue}>
              {formatNumber(totalFees)}
            </Typography>

            <Typography className={styles.statCaption}>
              في الصفحة الحالية
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* ================= FILTERS ================= */}

      <Paper
        elevation={0}
        className={styles.filtersPaper}
      >
        <Box className={styles.filtersFields}>
          {/* Search */}

          <Box
            className={`${styles.filterField} ${styles.filterFieldWide}`}
          >
            <TextField
              fullWidth
              size="small"
              label="بحث"
              placeholder="رقم الوصل أو اسم الزبون أو الهاتف..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className={styles.searchField}
              slotProps={{
                inputLabel: {
                  shrink: true,
                },
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search
                        sx={{
                          color: "#c9a44c",
                          fontSize: 20,
                        }}
                      />
                    </InputAdornment>
                  ),

                  endAdornment: search && (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => setSearch("")}
                        aria-label="مسح البحث"
                      >
                        <Clear fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Box>

          {/* Status */}

          <Box className={styles.filterField}>
            <TextField
              fullWidth
              size="small"
              select
              label="الحالة"
              value={status}
              onChange={handleFilterChange(setStatus)}
              slotProps={{
                inputLabel: {
                  shrink: true,
                },
              }}
            >
              <MenuItem value="">
                كل الحالات
              </MenuItem>

              <MenuItem value={1}>
                جاهز للتسليم
              </MenuItem>

              <MenuItem value={2}>
                تم التسليم
              </MenuItem>
            </TextField>
          </Box>

          {/* Branch */}

          {isAdmin && (
            <Box className={styles.filterField}>
              <TextField
                fullWidth
                size="small"
                select
                label="الفرع"
                value={branchId}
                onChange={handleFilterChange(setBranchId)}
                slotProps={{
                  inputLabel: {
                    shrink: true,
                  },

                  select: {
                    displayEmpty: true,
                    renderValue: (selected) => {
                      if (selected === "") {
                        return (
                          <span className={styles.branchPlaceholder}>
                            كل الفروع
                          </span>
                        );
                      }

                      const branch = branches.find(
                        (item) =>
                          Number(item.id ?? item.Id) ===
                          Number(selected)
                      );

                      return (
                        branch?.name ??
                        branch?.Name ??
                        "كل الفروع"
                      );
                    },
                  },

                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Storefront
                          sx={{
                            color: "#c9a44c",
                            fontSize: 20,
                          }}
                        />
                      </InputAdornment>
                    ),
                  },
                }}
              >
                <MenuItem value="">
                  كل الفروع
                </MenuItem>

                {branches.map((branch) => {
                  const id = branch.id ?? branch.Id;
                  const name = branch.name ?? branch.Name;

                  return (
                    <MenuItem key={id} value={id}>
                      {name}
                    </MenuItem>
                  );
                })}
              </TextField>
            </Box>
          )}

          {/* From Date */}

          <Box className={styles.filterField}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="من تاريخ"
              value={fromDate}
              onChange={handleFilterChange(setFromDate)}
              slotProps={{
                inputLabel: {
                  shrink: true,
                },
              }}
            />
          </Box>

          {/* To Date */}

          <Box className={styles.filterField}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="إلى تاريخ"
              value={toDate}
              onChange={handleFilterChange(setToDate)}
              slotProps={{
                inputLabel: {
                  shrink: true,
                },
              }}
            />
          </Box>
        </Box>

        {/* Filter Actions */}

        <Box className={styles.filtersActions}>
          <Tooltip title="تحديث">
            <span>
              <IconButton
                onClick={() => refetch()}
                disabled={isFetching || deleteMutation.isPending}
                className={styles.refreshButton}
                aria-label="تحديث"
              >
                <Refresh />
              </IconButton>
            </span>
          </Tooltip>

          <Button
            variant="outlined"
            startIcon={<Clear />}
            onClick={clearFilters}
            className={styles.clearButton}
            disabled={deleteMutation.isPending}
          >
            مسح الفلاتر
          </Button>

          <Button
            variant="contained"
            startIcon={<Add />}
            className={styles.addButton}
            onClick={() =>
              navigate("/old-maintenance-orders/create")
            }
            disabled={deleteMutation.isPending}
          >
            إضافة تصليح قديم
          </Button>
        </Box>
      </Paper>

      {/* ================= ERROR ================= */}

      {isError && (
        <Alert
          severity="error"
          className={styles.errorAlert}
        >
          {error?.response?.data?.message ||
            "حدث خطأ أثناء تحميل أرشيف التصاليح القديمة"}
        </Alert>
      )}

      {/* ================= TABLE ================= */}

      <Paper
        elevation={0}
        className={styles.tablePaper}
      >
        {/* Table Header */}

        <Box className={styles.tableHeader}>
          <Box>
            <Typography className={styles.tableHeaderTitle}>
              سجلات التصاليح القديمة
            </Typography>

            <Typography className={styles.tableHeaderSubtitle}>
              {formatNumber(totalCount)} سجل
            </Typography>
          </Box>

          <Archive className={styles.tableHeaderIcon} />
        </Box>

        {/* Loading */}

        {isLoading ? (
          <Box className={styles.loading}>
            <CircularProgress
              sx={{ color: "#b8860b" }}
            />

            <Typography>
              جاري تحميل السجلات...
            </Typography>
          </Box>
        ) : orders.length === 0 ? (
          /* Empty */

          <Box className={styles.empty}>
            <Archive sx={{ fontSize: 46, opacity: 0.4 }} />

            <Typography fontWeight={700}>
              لا توجد سجلات
            </Typography>

            <Typography variant="body2">
              لا توجد سجلات مطابقة للبحث أو الفلاتر
            </Typography>
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table className={styles.table}>
                <TableHead>
                  <TableRow className={styles.tableHeadRow}>
                    <TableCell className={styles.tableTh}>
                      #
                    </TableCell>

                    <TableCell className={styles.tableTh}>
                      رقم الوصل
                    </TableCell>

                    <TableCell className={styles.tableTh}>
                      اسم الزبون
                    </TableCell>

                    <TableCell className={styles.tableTh}>
                      الهاتف
                    </TableCell>

                    <TableCell className={styles.tableTh}>
                      تاريخ الوصل
                    </TableCell>

                    <TableCell className={styles.tableTh}>
                      نوع القطعة
                    </TableCell>

                    <TableCell className={styles.tableTh}>
                      الوزن
                    </TableCell>

                    <TableCell className={styles.tableTh}>
                      الأجور
                    </TableCell>

                    <TableCell className={styles.tableTh}>
                      الفرع
                    </TableCell>

                    <TableCell className={styles.tableTh}>
                      الحالة
                    </TableCell>

                    <TableCell
                      align="center"
                      className={styles.tableTh}
                    >
                      الإجراءات
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {orders.map((order, index) => {
                    const id = read(order, "Id");

                    const delivered =
                      Number(read(order, "Status")) === 2;

                    return (
                      <TableRow
                        key={id}
                        hover
                        className={styles.tableRow}
                      >
                        <TableCell
                          className={styles.tableTd}
                          data-label="#"
                        >
                          {(page - 1) * PAGE_SIZE + index + 1}
                        </TableCell>

                        <TableCell
                          className={styles.tableTd}
                          data-label="رقم الوصل"
                        >
                          <span className={styles.receiptNumber}>
                            {read(order, "ReceiptNumber") || "—"}
                          </span>
                        </TableCell>

                        <TableCell
                          className={`${styles.tableTd} ${styles.tableTdName}`}
                          data-label="اسم الزبون"
                        >
                          {read(order, "CustomerName") || "—"}
                        </TableCell>

                        <TableCell
                          className={`${styles.tableTd} ${styles.phoneCell}`}
                          data-label="الهاتف"
                        >
                          {read(order, "CustomerPhone") || "—"}
                        </TableCell>

                        <TableCell
                          className={styles.tableTd}
                          data-label="تاريخ الوصل"
                        >
                          {formatDate(read(order, "ReceiptDate"))}
                        </TableCell>

                        <TableCell
                          className={styles.tableTd}
                          data-label="نوع القطعة"
                        >
                          {read(order, "ItemType") || "—"}
                        </TableCell>

                        <TableCell
                          className={styles.tableTd}
                          data-label="الوزن"
                        >
                          {formatNumber(read(order, "Weight"))}
                        </TableCell>

                        <TableCell
                          className={styles.tableTd}
                          data-label="الأجور"
                        >
                          {formatNumber(read(order, "Fees"))}
                        </TableCell>

                        <TableCell
                          className={styles.tableTd}
                          data-label="الفرع"
                        >
                          {read(order, "BranchName") || "—"}
                        </TableCell>

                        <TableCell
                          className={styles.tableTd}
                          data-label="الحالة"
                        >
                          <Chip
                            size="small"
                            className={`${styles.statusChip} ${
                              delivered
                                ? styles.statusDelivered
                                : styles.statusReady
                            }`}
                            label={
                              delivered
                                ? "تم التسليم"
                                : "جاهز للتسليم"
                            }
                          />
                        </TableCell>

                        <TableCell
                          align="center"
                          className={styles.tableTd}
                          data-label="الإجراءات"
                        >
                          <Box className={styles.actions}>
                            <Tooltip title="التفاصيل">
                              <IconButton
                                size="small"
                                className={`${styles.actionButton} ${styles.viewButton}`}
                                onClick={() =>
                                  navigate(
                                    `/old-maintenance-orders/${id}`
                                  )
                                }
                                aria-label="التفاصيل"
                              >
                                <Visibility fontSize="small" />
                              </IconButton>
                            </Tooltip>

                            <Tooltip title="تعديل">
                              <IconButton
                                size="small"
                                className={`${styles.actionButton} ${styles.editButton}`}
                                onClick={() =>
                                  navigate(
                                    `/old-maintenance-orders/edit/${id}`
                                  )
                                }
                                aria-label="تعديل"
                              >
                                <Edit fontSize="small" />
                              </IconButton>
                            </Tooltip>

                            <Tooltip title="حذف">
                              <IconButton
                                size="small"
                                className={`${styles.actionButton} ${styles.deleteButton}`}
                                onClick={() => setDeleteId(id)}
                                aria-label="حذف"
                              >
                                <Delete fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Pagination */}

            <Box className={styles.pagination}>
              <Typography className={styles.paginationInfo}>
                عرض {startItem} - {endItem} من {totalCount} سجل
                {isFetching ? " — جاري التحديث..." : ""}
              </Typography>

              <Pagination
                count={pageCount}
                page={Math.min(page, pageCount)}
                onChange={(_event, value) => setPage(value)}
                shape="rounded"
                className={styles.paginationControl}
                dir="ltr"
                disabled={isFetching}
              />
            </Box>
          </>
        )}
      </Paper>

      {/* ================= DELETE DIALOG ================= */}

      <Dialog
        open={deleteId !== null}
        onClose={closeDeleteDialog}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>
          حذف سجل التصليح القديم
        </DialogTitle>

        <DialogContent>
          <DialogContentText>
            هل أنت متأكد من حذف هذا السجل؟ لا يمكن التراجع عن الحذف.
          </DialogContentText>
        </DialogContent>

        <DialogActions>
          <Button
            onClick={closeDeleteDialog}
            disabled={deleteMutation.isPending}
          >
            إلغاء
          </Button>

          <Button
            color="error"
            variant="contained"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending
              ? "جاري الحذف..."
              : "حذف"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OldMaintenanceOrders;