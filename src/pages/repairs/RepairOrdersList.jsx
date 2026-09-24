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
  Pagination,
  Grid,
  MenuItem,
} from "@mui/material";

import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from "@mui/icons-material/Refresh";
import VisibilityIcon from "@mui/icons-material/Visibility";
import GridOnIcon from "@mui/icons-material/GridOn";
import { useNavigate } from "react-router-dom";

import { useRepairOrders } from "../../hooks/useRepairOrders.js";
import { useBranches } from "../../hooks/useBranches.js";
import useAuthStore from "../../store/useAuthStore.js";
import {
  getStatusName,
  getStatusColor,
  canCreateRepair,
  canViewAllBranches,
} from "../../utils/repairConstants.js";
import { exportRepairsToExcel } from "../../utils/repairExport.js";
import "../../styles/repairs.css";

const PAGE_SIZE = 10;

export default function RepairOrdersList() {
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.user);

  const roles = useMemo(
    () => currentUser?.roles?.map((r) => r.name) || [],
    [currentUser]
  );

  const isAdmin = canViewAllBranches(roles);
  const canCreate = canCreateRepair(roles);

  const [searchQuery, setSearchQuery] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const { data: branches = [] } = useBranches();

  const params = useMemo(() => {
    const p = {};
    if (fromDate) p.fromDate = fromDate;
    if (toDate) p.toDate = toDate;
    if (branchFilter) p.branchId = Number(branchFilter);
    if (statusFilter) p.status = Number(statusFilter);
    return p;
  }, [fromDate, toDate, branchFilter, statusFilter]);

  const { data: orders = [], isLoading, refetch } = useRepairOrders(params);

  const filteredOrders = useMemo(() => {
    if (!searchQuery.trim()) return orders;
    const q = searchQuery.toLowerCase();
    return orders.filter((o) => {
      return (
        (o.barcode || "").toLowerCase().includes(q) ||
        (o.customerName || "").toLowerCase().includes(q) ||
        (o.customerPhone || "").toLowerCase().includes(q) ||
        (o.description || "").toLowerCase().includes(q)
      );
    });
  }, [orders, searchQuery]);

  const pageCount = Math.ceil(filteredOrders.length / PAGE_SIZE);
  const paginatedOrders = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredOrders.slice(start, start + PAGE_SIZE);
  }, [filteredOrders, page]);

  const startItem =
    filteredOrders.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const endItem = Math.min(page * PAGE_SIZE, filteredOrders.length);

  const handleClearFilters = () => {
    setFromDate("");
    setToDate("");
    setBranchFilter("");
    setStatusFilter("");
    setSearchQuery("");
    setPage(1);
  };

  const handleExportExcel = () => {
    exportRepairsToExcel(filteredOrders, "repairs");
  };

  // ✅ الحالات الجديدة (7 حالات)
  const statusOptions = [
    { value: "", label: "الكل" },
    { value: 1, label: "جديدة" },
    { value: 2, label: "مع المندوب" },
    { value: 3, label: "في المشغل" },
    { value: 4, label: "تم التصليح" },
    { value: 5, label: "مع المندوب بعد التصليح" },
    { value: 6, label: "جاهزة للاستلام" },
    { value: 7, label: "تم التسليم للعميل" },
  ];

  return (
    <div className="repairs-list-container">
      {/* Header */}
      <div className="repairs-list-header">
        <div className="repairs-list-header-icon">
          <ReceiptLongIcon sx={{ fontSize: 34 }} />
        </div>

        <Typography className="repairs-list-title">كشف التصاليح</Typography>

        <Typography className="repairs-list-subtitle">
          عرض وإدارة جميع التصاليح
        </Typography>
      </div>

      {/* Toolbar */}
      <Paper elevation={0} className="repairs-filters-paper">
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              size="small"
              placeholder="بحث بالباركود أو اسم العميل..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="repairs-search"
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
          </Grid>

          <Grid item xs={6} sm={3} md={2}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="من تاريخ"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              className="repairs-date-filter"
            />
          </Grid>

          <Grid item xs={6} sm={3} md={2}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="إلى تاريخ"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              className="repairs-date-filter"
            />
          </Grid>

          {isAdmin && (
            <Grid item xs={6} sm={3} md={2}>
              <TextField
                fullWidth
                size="small"
                select
                label="الفرع"
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                className="repairs-branch-filter"
              >
                <MenuItem value="">الكل</MenuItem>
                {branches.map((b) => (
                  <MenuItem key={b.id} value={b.id}>
                    {b.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          )}

          <Grid item xs={6} sm={3} md={2}>
            <TextField
              fullWidth
              size="small"
              select
              label="الحالة"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="repairs-status-filter"
            >
              {statusOptions.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} md="auto">
            <div className="repairs-filters-actions">
              <Tooltip title="تحديث">
                <IconButton
                  onClick={() => refetch()}
                  className="repairs-refresh-btn"
                >
                  <RefreshIcon />
                </IconButton>
              </Tooltip>

              <Button
                variant="outlined"
                onClick={handleClearFilters}
                className="repairs-clear-btn"
              >
                مسح
              </Button>

              <Tooltip title="تصدير Excel">
                <span>
                  <Button
                    variant="outlined"
                    startIcon={<GridOnIcon />}
                    onClick={handleExportExcel}
                    disabled={filteredOrders.length === 0}
                    className="repairs-export-excel-btn"
                  >
                    Excel
                  </Button>
                </span>
              </Tooltip>

              {canCreate && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  className="repairs-add-btn"
                  onClick={() => navigate("/repairs/create")}
                >
                  تصليحة جديدة
                </Button>
              )}
            </div>
          </Grid>
        </Grid>
      </Paper>

      {/* Table */}
      <Paper elevation={0} className="repairs-table-paper">
        {isLoading ? (
          <Box className="repairs-loading">
            <CircularProgress sx={{ color: "#b8860b" }} />
          </Box>
        ) : filteredOrders.length === 0 ? (
          <Box className="repairs-empty">
            <Typography>لا توجد تصاليح لعرضها</Typography>
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow className="repairs-table-head-row">
                    <TableCell className="repairs-th">#</TableCell>
                    <TableCell className="repairs-th">الباركود</TableCell>
                    <TableCell className="repairs-th">العميل</TableCell>
                    <TableCell className="repairs-th">الهاتف</TableCell>
                    <TableCell className="repairs-th">الوصف</TableCell>
                    <TableCell className="repairs-th">الفرع</TableCell>
                    <TableCell className="repairs-th">الحالة</TableCell>
                    <TableCell className="repairs-th">الموقع الحالي</TableCell>
                    <TableCell className="repairs-th">
                      تاريخ الإنشاء
                    </TableCell>
                    <TableCell className="repairs-th" align="center">
                      الإجراءات
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {paginatedOrders.map((order, index) => (
                    <TableRow key={order.id} className="repairs-table-row">
                      <TableCell className="repairs-td">
                        {(page - 1) * PAGE_SIZE + index + 1}
                      </TableCell>

                      <TableCell className="repairs-td">
                        <Chip
                          label={order.barcode || "—"}
                          size="small"
                          className="repairs-barcode-chip"
                        />
                      </TableCell>

                      <TableCell className="repairs-td repairs-td-name">
                        {order.customerName || "—"}
                      </TableCell>

                      <TableCell className="repairs-td repairs-td-phone">
                        {order.customerPhone || "—"}
                      </TableCell>

                      <TableCell className="repairs-td">
                        {order.description || "—"}
                      </TableCell>

                      <TableCell className="repairs-td">
                        {order.pickupBranchName || "—"}
                      </TableCell>

                      <TableCell className="repairs-td">
                        <Chip
                          label={
                            order.statusName || getStatusName(order.status)
                          }
                          size="small"
                          className={`repairs-status-chip repairs-status-${getStatusColor(
                            order.status
                          )}`}
                        />
                      </TableCell>

                      <TableCell className="repairs-td">
                        {order.currentLocationName || "—"}
                        {order.currentResponsibleUserName && (
                          <Typography
                            sx={{
                              fontSize: "0.75rem",
                              color: "var(--text-muted)",
                              mt: 0.5,
                            }}
                          >
                            {order.currentResponsibleUserName}
                          </Typography>
                        )}
                      </TableCell>

                      <TableCell className="repairs-td repairs-td-date">
                        {order.createdAt
                          ? new Date(order.createdAt).toLocaleDateString(
                              "ar-JO"
                            )
                          : "—"}
                      </TableCell>

                      <TableCell className="repairs-td" align="center">
                        <Tooltip title="التفاصيل">
                          <IconButton
                            size="small"
                            className="repairs-action-btn repairs-view-btn"
                            onClick={() => navigate(`/repairs/${order.id}`)}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <div className="repairs-pagination">
              <div className="repairs-pagination-info">
                عرض {startItem} - {endItem} من {filteredOrders.length} تصليحة
              </div>

              <Pagination
                count={pageCount}
                page={page}
                onChange={(e, value) => setPage(value)}
                shape="rounded"
                className="repairs-pagination-control"
                dir="ltr"
              />
            </div>
          </>
        )}
      </Paper>
    </div>
  );
}