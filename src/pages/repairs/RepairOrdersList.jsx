
import { useState, useMemo, useEffect } from "react";
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

const PHONE_VISIBLE_ROLES = [
  "Admin",
  "SuperAdmin",
  "BranchManager",
];

const STATUS_OPTIONS = [
  { value: "", label: "الكل" },
  { value: 1, label: "جديدة" },
  { value: 2, label: "مع المندوب" },
  { value: 3, label: "في المشغل" },
  { value: 4, label: "تم التصليح" },
  { value: 5, label: "مع المندوب بعد التصليح" },
  { value: 6, label: "جاهزة للاستلام" },
  { value: 7, label: "تم التسليم للعميل" },
];

export default function RepairOrdersList() {
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.user);

  const roles = useMemo(
    () => currentUser?.roles?.map((role) => role.name) || [],
    [currentUser]
  );

  const isAdmin = canViewAllBranches(roles);
  const canCreate = canCreateRepair(roles);

  const canViewPhone = useMemo(
    () => roles.some((role) => PHONE_VISIBLE_ROLES.includes(role)),
    [roles]
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const { data: branches = [] } = useBranches();

  // تأخير إرسال البحث قليلًا حتى لا نرسل طلبًا مع كل حرف
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
      setPage(1);
    }, 350);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // معاملات البحث والفلاتر وتقسيم الصفحات المرسلة إلى الـ API
  const params = useMemo(() => {
    const queryParams = {
      pageNumber: page,
      pageSize: PAGE_SIZE,
    };

    if (debouncedSearch) {
      queryParams.search = debouncedSearch;
    }

    if (fromDate) {
      queryParams.fromDate = fromDate;
    }

    if (toDate) {
      queryParams.toDate = toDate;
    }

    if (branchFilter) {
      queryParams.branchId = Number(branchFilter);
    }

    if (statusFilter !== "") {
      queryParams.status = Number(statusFilter);
    }

    return queryParams;
  }, [
    page,
    debouncedSearch,
    fromDate,
    toDate,
    branchFilter,
    statusFilter,
  ]);

  const {
    data: pageData,
    isLoading,
    isFetching,
    refetch,
  } = useRepairOrders(params);

  // يدعم شكل البيانات المرقمة، وكذلك الشكل القديم مؤقتًا
  const orders = Array.isArray(pageData)
    ? pageData
    : pageData?.items ?? pageData?.Items ?? [];

  const totalCount = Array.isArray(pageData)
    ? pageData.length
    : Number(pageData?.totalCount ?? pageData?.TotalCount ?? 0);

  const apiTotalPages = Array.isArray(pageData)
    ? Math.ceil(pageData.length / PAGE_SIZE)
    : Number(
        pageData?.totalPages ??
          pageData?.TotalPages ??
          Math.ceil(totalCount / PAGE_SIZE)
      );

  const pageCount = Math.max(1, apiTotalPages);
  const startItem = totalCount === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const endItem =
    totalCount === 0
      ? 0
      : Math.min((page - 1) * PAGE_SIZE + orders.length, totalCount);

  const handleClearFilters = () => {
    setSearchQuery("");
    setDebouncedSearch("");
    setFromDate("");
    setToDate("");
    setBranchFilter("");
    setStatusFilter("");
    setPage(1);
  };

  const handleFilterChange = (setter) => (event) => {
    setter(event.target.value);
    setPage(1);
  };

  const handleExportExcel = () => {
    if (orders.length === 0) return;

    exportRepairsToExcel(orders, "repairs");
  };

  const handlePrint = () => {
    if (orders.length === 0) return;

    const printWindow = window.open("", "_blank", "width=1200,height=800");

    if (!printWindow) {
      alert("الرجاء السماح بالنوافذ المنبثقة للطباعة");
      return;
    }

    const filterLabels = [];

    if (fromDate) filterLabels.push(`من: ${fromDate}`);
    if (toDate) filterLabels.push(`إلى: ${toDate}`);

    if (branchFilter) {
      const branch = branches.find(
        (item) => item.id === Number(branchFilter)
      );

      if (branch) {
        filterLabels.push(`الفرع: ${branch.name}`);
      }
    }

    if (statusFilter !== "") {
      const status = STATUS_OPTIONS.find(
        (item) => item.value === Number(statusFilter)
      );

      if (status) {
        filterLabels.push(`الحالة: ${status.label}`);
      }
    }

    if (debouncedSearch) {
      filterLabels.push(`بحث: ${debouncedSearch}`);
    }

    const escapeHtml = (value) =>
      String(value ?? "—").replace(/[&<>"']/g, (char) => {
        const entities = {
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        };

        return entities[char];
      });

    const filterText =
      filterLabels.length > 0
        ? `<div class="filters">${filterLabels
            .map(escapeHtml)
            .join(" | ")}</div>`
        : "";

    const rowsHtml = orders
      .map((order, index) => {
        const statusName =
          order.statusName || getStatusName(order.status);

        const createdDate = order.createdAt
          ? new Date(order.createdAt).toLocaleDateString("ar-JO")
          : "—";

        const phoneCell = canViewPhone
          ? `<td class="phone">${escapeHtml(order.customerPhone)}</td>`
          : "";

        return `
          <tr>
            <td class="center">${(page - 1) * PAGE_SIZE + index + 1}</td>
            <td class="barcode">${escapeHtml(order.barcode)}</td>
            <td>${escapeHtml(order.customerName)}</td>
            ${phoneCell}
            <td>${escapeHtml(order.description)}</td>
            <td>${escapeHtml(order.pickupBranchName)}</td>
            <td class="center">${escapeHtml(statusName)}</td>
            <td>${escapeHtml(order.currentLocationName)}</td>
            <td class="center date">${escapeHtml(createdDate)}</td>
          </tr>
        `;
      })
      .join("");

    const phoneHeader = canViewPhone ? "<th>الهاتف</th>" : "";

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
              font-family: Arial, sans-serif;
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
              margin: 0 0 6px;
              font-size: 1.5rem;
              color: #8b6914;
            }

            .subtitle {
              margin: 0;
              font-size: .9rem;
              color: #666;
            }

            .filters {
              margin-top: 10px;
              padding: 8px 12px;
              display: inline-block;
              background: #fdf6e3;
              border-radius: 6px;
              font-size: .85rem;
            }

            .meta {
              display: flex;
              justify-content: space-between;
              margin-bottom: 12px;
              font-size: .82rem;
              color: #666;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              font-size: .82rem;
            }

            thead { background: #f5e6c8; }

            th {
              padding: 10px 8px;
              text-align: right;
              color: #8b6914;
              border: 1px solid #d4b876;
              white-space: nowrap;
            }

            td {
              padding: 8px;
              border: 1px solid #e0d0a0;
              text-align: right;
              overflow-wrap: anywhere;
            }

            tbody tr:nth-child(even) { background: #fdfaf2; }
            .center { text-align: center; }

            .barcode {
              font-family: monospace;
              font-weight: bold;
              color: #8b6914;
            }

            .phone {
              direction: ltr;
              font-family: monospace;
            }

            .date {
              white-space: nowrap;
              color: #666;
            }

            .footer {
              margin-top: 20px;
              padding-top: 10px;
              border-top: 1px solid #d4b876;
              text-align: center;
              font-size: .78rem;
              color: #888;
            }

            @media print {
              @page {
                size: A4 landscape;
                margin: 10mm;
              }

              body { padding: 0; }

              th, td {
                padding: 6px 4px;
                font-size: 9pt;
              }

              thead {
                background: #f5e6c8 !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }

              tbody tr:nth-child(even) {
                background: #fdfaf2 !important;
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
            <span>عدد التصاليح في هذه الصفحة: <strong>${orders.length}</strong></span>
            <span>إجمالي النتائج المطابقة: <strong>${totalCount}</strong></span>
            <span>تاريخ الطباعة: ${escapeHtml(now)}</span>
          </div>

          <table>
            <thead>
              <tr>
                <th>#</th>
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
            <tbody>${rowsHtml}</tbody>
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

  return (
    <div className="repairs-list-container">
      <div className="repairs-list-header">
        <div className="repairs-list-header-icon">
          <ReceiptLongIcon sx={{ fontSize: 34 }} />
        </div>

        <Typography className="repairs-list-title">
          كشف التصاليح
        </Typography>

        <Typography className="repairs-list-subtitle">
          عرض وإدارة جميع التصاليح
        </Typography>
      </div>

      <Paper elevation={0} className="repairs-filters-paper">
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              size="small"
              placeholder="بحث بالباركود أو اسم العميل أو الهاتف..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
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
              onChange={handleFilterChange(setFromDate)}
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
              onChange={handleFilterChange(setToDate)}
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
                onChange={handleFilterChange(setBranchFilter)}
                className="repairs-branch-filter"
              >
                <MenuItem value="">الكل</MenuItem>
                {branches.map((branch) => (
                  <MenuItem key={branch.id} value={branch.id}>
                    {branch.name}
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
              onChange={handleFilterChange(setStatusFilter)}
              className="repairs-status-filter"
            >
              {STATUS_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} md="auto">
            <div className="repairs-filters-actions">
              <Tooltip title="تحديث">
                <span>
                  <IconButton
                    onClick={() => refetch()}
                    disabled={isFetching}
                    className="repairs-refresh-btn"
                  >
                    <RefreshIcon />
                  </IconButton>
                </span>
              </Tooltip>

              <Button
                variant="outlined"
                onClick={handleClearFilters}
                className="repairs-clear-btn"
              >
                مسح
              </Button>

              <Tooltip title="تصدير Excel — الصفحة الحالية">
                <span>
                  <Button
                    variant="outlined"
                    startIcon={<GridOnIcon />}
                    onClick={handleExportExcel}
                    disabled={orders.length === 0}
                    className="repairs-export-excel-btn"
                  >
                    Excel
                  </Button>
                </span>
              </Tooltip>

              <Tooltip title="طباعة الصفحة الحالية">
                <span>
                  <Button
                    variant="outlined"
                    startIcon={<PrintIcon />}
                    onClick={handlePrint}
                    disabled={orders.length === 0}
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

      <Paper elevation={0} className="repairs-table-paper">
        {isLoading ? (
          <Box className="repairs-loading">
            <CircularProgress sx={{ color: "#b8860b" }} />
          </Box>
        ) : orders.length === 0 ? (
          <Box className="repairs-empty">
            <Typography>
              لا توجد تصاليح مطابقة للبحث أو الفلاتر
            </Typography>
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
                  {orders.map((order, index) => (
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
                            onClick={() =>
                              navigate(`/repairs/${order.id}`)
                            }
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
                عرض {startItem} - {endItem} من {totalCount} تصليحة
                {isFetching ? " — جاري التحديث..." : ""}
              </div>

              <Pagination
                count={pageCount}
                page={Math.min(page, pageCount)}
                onChange={(_event, value) => setPage(value)}
                shape="rounded"
                className="repairs-pagination-control"
                dir="ltr"
                disabled={isFetching}
              />
            </div>
          </>
        )}
      </Paper>
    </div>
  );
}
