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
import PrintIcon from "@mui/icons-material/Print";
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

// ===============================
// ✅ الأدوار المسموح لها برؤية رقم الهاتف
// ===============================
const PHONE_VISIBLE_ROLES = [
  "Admin",
  "SuperAdmin",
  "BranchManager",
];

export default function RepairOrdersList() {
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.user);

  const roles = useMemo(
    () => currentUser?.roles?.map((r) => r.name) || [],
    [currentUser]
  );

  const isAdmin = canViewAllBranches(roles);
  const canCreate = canCreateRepair(roles);

  // ✅ هل يسمح له برؤية رقم الهاتف؟
  const canViewPhone = useMemo(
    () => roles.some((role) => PHONE_VISIBLE_ROLES.includes(role)),
    [roles]
  );

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

  /* ==========================================
   * ✅ طباعة الجدول
   * ========================================== */
  const handlePrint = () => {
    if (filteredOrders.length === 0) return;

    const printWindow = window.open("", "_blank", "width=1200,height=800");
    if (!printWindow) {
      alert("الرجاء السماح بالنوافذ المنبثقة للطباعة");
      return;
    }

    // ✅ بناء عنوان الفلاتر
    const filterLabels = [];
    if (fromDate) filterLabels.push(`من: ${fromDate}`);
    if (toDate) filterLabels.push(`إلى: ${toDate}`);
    if (branchFilter) {
      const branch = branches.find((b) => b.id === Number(branchFilter));
      if (branch) filterLabels.push(`الفرع: ${branch.name}`);
    }
    if (statusFilter) {
      const status = statusOptions.find(
        (s) => s.value === Number(statusFilter)
      );
      if (status) filterLabels.push(`الحالة: ${status.label}`);
    }
    if (searchQuery) filterLabels.push(`بحث: ${searchQuery}`);

    const filterText =
      filterLabels.length > 0
        ? `<div class="filters">${filterLabels.join(" | ")}</div>`
        : "";

    // ✅ بناء صفوف الجدول
    const rowsHtml = filteredOrders
      .map((order, index) => {
        const statusName =
          order.statusName || getStatusName(order.status);
        const createdDate = order.createdAt
          ? new Date(order.createdAt).toLocaleDateString("ar-JO")
          : "—";

        // ✅ عمود الهاتف فقط للمصرّح لهم
        const phoneCell = canViewPhone
          ? `<td class="phone">${order.customerPhone || "—"}</td>`
          : "";

        return `
          <tr>
            <td class="center">${index + 1}</td>
            <td class="barcode">${order.barcode || "—"}</td>
            <td>${order.customerName || "—"}</td>
            ${phoneCell}
            <td>${order.description || "—"}</td>
            <td>${order.pickupBranchName || "—"}</td>
            <td class="center">${statusName}</td>
            <td>${order.currentLocationName || "—"}</td>
            <td class="center date">${createdDate}</td>
          </tr>
        `;
      })
      .join("");

    // ✅ عنوان عمود الهاتف
    const phoneHeader = canViewPhone
      ? `<th>الهاتف</th>`
      : "";

    const now = new Date().toLocaleString("ar-JO", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8" />
          <title>كشف التصاليح</title>
          <style>
            * { box-sizing: border-box; }

            body {
              margin: 0;
              padding: 20px;
              font-family: 'Cairo', 'Arial', sans-serif;
              background: #fff;
              color: #222;
              direction: rtl;
            }

            .header {
              text-align: center;
              margin-bottom: 20px;
              padding-bottom: 12px;
              border-bottom: 2px solid #b8860b;
            }

            .header h1 {
              margin: 0 0 6px 0;
              font-size: 1.5rem;
              color: #8b6914;
              font-weight: 700;
            }

            .header .subtitle {
              margin: 0;
              font-size: 0.9rem;
              color: #666;
            }

            .filters {
              margin-top: 10px;
              font-size: 0.85rem;
              color: #555;
              font-weight: 600;
              padding: 8px 12px;
              background: #fdf6e3;
              border-radius: 6px;
              display: inline-block;
            }

            .meta {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 12px;
              font-size: 0.82rem;
              color: #666;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 0.82rem;
            }

            thead {
              background-color: #f5e6c8;
            }

            th {
              padding: 10px 8px;
              text-align: right;
              font-weight: 700;
              color: #8b6914;
              border: 1px solid #d4b876;
              font-size: 0.82rem;
              white-space: nowrap;
            }

            td {
              padding: 8px;
              border: 1px solid #e0d0a0;
              text-align: right;
              color: #333;
            }

            tbody tr:nth-child(even) {
              background-color: #fdfaf2;
            }

            tbody tr:hover {
              background-color: #f9f1de;
            }

            .center { text-align: center; }

            .barcode {
              font-family: 'Courier New', monospace;
              font-weight: 700;
              color: #8b6914;
              letter-spacing: 0.5px;
              font-size: 0.78rem;
            }

            .phone {
              direction: ltr;
              text-align: right;
              font-family: 'Courier New', monospace;
            }

            .date {
              font-size: 0.78rem;
              color: #666;
              white-space: nowrap;
            }

            .footer {
              margin-top: 20px;
              padding-top: 10px;
              border-top: 1px solid #d4b876;
              text-align: center;
              font-size: 0.78rem;
              color: #888;
            }

            @media print {
              @page {
                size: A4 landscape;
                margin: 10mm;
              }

              body {
                padding: 0;
                font-size: 10pt;
              }

              .header h1 { font-size: 14pt; }
              .filters { font-size: 9pt; }

              th, td {
                padding: 6px 4px;
                font-size: 9pt;
              }

              thead {
                background-color: #f5e6c8 !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }

              tbody tr:nth-child(even) {
                background-color: #fdfaf2 !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>مجموعة عايد دعنا</h1>
            <p class="subtitle">كشف التصاليح</p>
            ${filterText}
          </div>

          <div class="meta">
            <span>عدد التصاليح: <strong>${filteredOrders.length}</strong></span>
            <span>تاريخ الطباعة: ${now}</span>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 40px;">#</th>
                <th>الباركود</th>
                <th>العميل</th>
                ${phoneHeader}
                <th>الوصف</th>
                <th>الفرع</th>
                <th>الحالة</th>
                <th>الموقع الحالي</th>
                <th>تاريخ الإنشاء</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>

          <div class="footer">
            نظام GoldSystem — تم إنشاء هذا التقرير تلقائياً
          </div>

          <script>
            window.onload = function () {
              setTimeout(function () {
                window.print();
              }, 400);
            };
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
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

              {/* ✅ زر طباعة الجدول */}
              <Tooltip title="طباعة الجدول">
                <span>
                  <Button
                    variant="outlined"
                    startIcon={<PrintIcon />}
                    onClick={handlePrint}
                    disabled={filteredOrders.length === 0}
                    className="repairs-print-table-btn"
                  >
                    طباعة
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
                    {canViewPhone && (
                      <TableCell className="repairs-th">الهاتف</TableCell>
                    )}
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

                      {canViewPhone && (
                        <TableCell className="repairs-td repairs-td-phone">
                          {order.customerPhone || "—"}
                        </TableCell>
                      )}

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