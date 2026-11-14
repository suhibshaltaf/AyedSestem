
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
  MenuItem,
} from "@mui/material";

import { toast } from "react-toastify";

import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from "@mui/icons-material/Refresh";
import VisibilityIcon from "@mui/icons-material/Visibility";
import GridOnIcon from "@mui/icons-material/GridOn";
import PrintIcon from "@mui/icons-material/Print";
import ClearIcon from "@mui/icons-material/Clear";
import StorefrontIcon from "@mui/icons-material/Storefront";

import { useNavigate } from "react-router-dom";

import { useRepairOrders } from "../../hooks/useRepairOrders.js";
import { useBranches } from "../../hooks/useBranches.js";
import useAuthStore from "../../store/useAuthStore.js";

import repairOrderService from "../../services/repairOrderService.js";

import {
  getStatusName,
  canCreateRepair,
  canViewAllBranches,
} from "../../utils/repairConstants.js";

import { exportRepairsToExcel } from "../../utils/repairExport.js";

import style from "../../styles/Repairs/repairs-list.module.css";

const PAGE_SIZE = 10;
const EXPORT_PAGE_SIZE = 100;

const PHONE_VISIBLE_ROLES = ["Admin", "SuperAdmin"];

const STATUS_OPTIONS = [
  { value: 1, label: "جديدة" },
  { value: 2, label: "مع المندوب" },
  { value: 3, label: "في المشغل" },
  { value: 4, label: "تم التصليح" },
  { value: 6, label: "جاهزة للاستلام" },
  { value: 7, label: "تم التسليم للعميل" },
];

const SEARCH_TYPES = [
  { value: "text", label: "بحث بالاسم / الباركود / الهاتف" },
  { value: "date", label: "بحث بالتاريخ" },
  { value: "status", label: "بحث بالحالة" },
];

// =====================================
// معالجة استجابة API
// =====================================

const normalizePagedResponse = (result) => {
  let payload = result?.data ?? result;

  for (let i = 0; i < 5 && payload; i++) {
    if (Array.isArray(payload)) {
      return {
        items: payload,
        pageNumber: 1,
        pageSize: payload.length || EXPORT_PAGE_SIZE,
        totalCount: payload.length,
        totalPages: 1,
      };
    }

    if (typeof payload !== "object") break;

    const items = payload.items ?? payload.Items;

    if (Array.isArray(items)) {
      const totalCount = Number(
        payload.totalCount ?? payload.TotalCount ?? items.length
      );

      const pageSize = Number(
        payload.pageSize ?? payload.PageSize ?? EXPORT_PAGE_SIZE
      );

      const totalPages = Number(
        payload.totalPages ??
          payload.TotalPages ??
          Math.ceil(totalCount / (pageSize || EXPORT_PAGE_SIZE))
      );

      return {
        items,
        pageNumber: Number(
          payload.pageNumber ?? payload.PageNumber ?? 1
        ),
        pageSize,
        totalCount,
        totalPages,
      };
    }

    if (payload.data && typeof payload.data === "object") {
      payload = payload.data;
    } else {
      break;
    }
  }

  console.error("استجابة التصاليح غير متوقعة:", result);

  throw new Error("تعذر قراءة بيانات التصاليح من الخادم");
};

// =====================================
// جلب جميع التصاليح للتصدير والطباعة
// =====================================

const fetchAllRepairOrders = async (filters) => {
  const firstResponse = await repairOrderService.getRepairOrders({
    ...filters,
    pageNumber: 1,
    pageSize: EXPORT_PAGE_SIZE,
  });

  const firstPage = normalizePagedResponse(firstResponse);

  const allOrders = [...firstPage.items];

  const totalPages =
    firstPage.totalPages ||
    Math.ceil(
      firstPage.totalCount /
        (firstPage.pageSize || EXPORT_PAGE_SIZE)
    );

  if (totalPages > 1) {
    const remainingPages = [];

    for (let pageNumber = 2; pageNumber <= totalPages; pageNumber++) {
      remainingPages.push(
        repairOrderService.getRepairOrders({
          ...filters,
          pageNumber,
          pageSize: EXPORT_PAGE_SIZE,
        })
      );
    }

    const responses = await Promise.all(remainingPages);

    responses.forEach((response) => {
      const pageData = normalizePagedResponse(response);
      allOrders.push(...pageData.items);
    });
  }

  return allOrders;
};

// =====================================
// تنسيق التاريخ
// =====================================

const safeFormatDateTime = (value) => {
  if (!value) return "—";

  try {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "—";

    return date.toLocaleString("ar-JO");
  } catch {
    return "—";
  }
};

// =====================================
// حماية HTML
// =====================================

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

// =====================================
// Component
// =====================================

export default function RepairOrdersList() {
  const navigate = useNavigate();

  const currentUser = useAuthStore((state) => state.user);

  // -----------------------------------
  // States
  // -----------------------------------

  const [searchType, setSearchType] = useState("text");

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [branchFilter, setBranchFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState(1);

  const [page, setPage] = useState(1);

  const [isExporting, setIsExporting] = useState(false);

  // -----------------------------------
  // Permissions
  // -----------------------------------

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

  // -----------------------------------
  // Branches
  // -----------------------------------

  const { data: branches = [] } = useBranches();

  // ===================================
  // تأخير البحث النصي
  // ===================================

  useEffect(() => {
    const trimmed = searchQuery.trim();

    if (trimmed === debouncedSearch) return undefined;

    const timeoutId = setTimeout(() => {
      setDebouncedSearch(trimmed);
      setPage(1);
    }, 350);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, debouncedSearch]);

  // ===================================
  // تجهيز الفلاتر
  // ===================================

  const filters = useMemo(() => {
    const queryParams = {};

    if (searchType === "text" && debouncedSearch) {
      queryParams.search = debouncedSearch;
    }

    if (searchType === "date") {
      if (fromDate) queryParams.fromDate = fromDate;
      if (toDate) queryParams.toDate = toDate;
    }

    if (searchType === "status") {
      queryParams.status = Number(statusFilter);
    }

    if (
      branchFilter !== "" &&
      !Number.isNaN(Number(branchFilter))
    ) {
      queryParams.branchId = Number(branchFilter);
    }

    return queryParams;
  }, [
    debouncedSearch,
    fromDate,
    toDate,
    branchFilter,
    statusFilter,
    searchType,
  ]);

  // ===================================
  // باراميترز الجدول
  // ===================================

  const params = useMemo(
    () => ({
      ...filters,
      pageNumber: page,
      pageSize: PAGE_SIZE,
    }),
    [filters, page]
  );

  // ===================================
  // بيانات التصاليح
  // ===================================

  const {
    data: pageData,
    isLoading,
    isFetching,
    refetch,
  } = useRepairOrders(params);

  const orders = useMemo(() => {
    if (Array.isArray(pageData)) return pageData;

    const items = pageData?.items ?? pageData?.Items;

    return Array.isArray(items) ? items : [];
  }, [pageData]);

  const totalCount = useMemo(() => {
    if (Array.isArray(pageData)) return pageData.length;

    return Number(
      pageData?.totalCount ?? pageData?.TotalCount ?? 0
    );
  }, [pageData]);

  const apiTotalPages = useMemo(() => {
    if (Array.isArray(pageData)) {
      return Math.ceil(pageData.length / PAGE_SIZE);
    }

    return Number(
      pageData?.totalPages ??
        pageData?.TotalPages ??
        Math.ceil(totalCount / PAGE_SIZE)
    );
  }, [pageData, totalCount]);

  const pageCount = Math.max(1, apiTotalPages);

  const startItem =
    totalCount === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;

  const endItem =
    totalCount === 0
      ? 0
      : Math.min(
          (page - 1) * PAGE_SIZE + orders.length,
          totalCount
        );

  useEffect(() => {
    if (page > pageCount) {
      setPage(pageCount);
    }
  }, [page, pageCount]);

  // ===================================
  // مسح الفلاتر
  // ===================================

  const handleClearFilters = () => {
    setSearchQuery("");
    setDebouncedSearch("");

    setFromDate("");
    setToDate("");

    setBranchFilter("");
    setStatusFilter(1);

    setSearchType("text");
    setPage(1);
  };

  const handleFilterChange = (setter) => (event) => {
    setter(event.target.value);
    setPage(1);
  };

  // ===================================
  // تغيير نوع البحث
  // ===================================

  const handleSearchTypeChange = (event) => {
    setSearchType(event.target.value);

    setSearchQuery("");
    setDebouncedSearch("");

    setFromDate("");
    setToDate("");

    setStatusFilter(1);
    setPage(1);
  };

  // ===================================
  // تصدير Excel
  // ===================================

  const handleExportExcel = async () => {
    if (isExporting) return;

    setIsExporting(true);

    try {
      const allOrders = await fetchAllRepairOrders(filters);

      if (allOrders.length === 0) {
        toast.info("لا توجد تصاليح لتصديرها");
        return;
      }

      exportRepairsToExcel(
        allOrders,
        "repairs",
        canViewPhone
      );

      toast.success(
        `تم تصدير ${allOrders.length} تصليحة بنجاح`
      );
    } catch (error) {
      console.error("Excel Export Error:", error);

      toast.error(
        error?.response?.data?.message ||
          error.message ||
          "حدث خطأ أثناء تصدير ملف Excel"
      );
    } finally {
      setIsExporting(false);
    }
  };

  // ===================================
  // طباعة جميع النتائج
  // ===================================

  const handlePrint = async () => {
    if (isExporting) return;

    const printWindow = window.open(
      "",
      "_blank",
      "width=1200,height=800"
    );

    if (!printWindow) {
      toast.error("الرجاء السماح بالنوافذ المنبثقة للطباعة");
      return;
    }

    setIsExporting(true);

    try {
      const allOrders = await fetchAllRepairOrders(filters);

      if (allOrders.length === 0) {
        printWindow.close();
        toast.info("لا توجد تصاليح للطباعة");
        return;
      }

      const filterLabels = [];

      if (searchType === "text" && debouncedSearch) {
        filterLabels.push(`بحث: ${debouncedSearch}`);
      }

      if (searchType === "date") {
        if (fromDate) filterLabels.push(`من: ${fromDate}`);
        if (toDate) filterLabels.push(`إلى: ${toDate}`);
      }

      if (searchType === "status") {
        const status = STATUS_OPTIONS.find(
          (item) => item.value === Number(statusFilter)
        );

        if (status) {
          filterLabels.push(`الحالة: ${status.label}`);
        }
      }

      if (branchFilter) {
        const branch = branches.find(
          (item) => item.id === Number(branchFilter)
        );

        if (branch) {
          filterLabels.push(`الفرع: ${branch.name}`);
        }
      }

      const filterText =
        filterLabels.length > 0
          ? `<div class="filters">${filterLabels
              .map(escapeHtml)
              .join(" | ")}</div>`
          : "";

      const rowsHtml = allOrders
        .map((order) => {
          const statusName =
            order.statusName ||
            getStatusName(order.status) ||
            "—";

          return `
            <tr>
              <td class="barcode">${escapeHtml(order.barcode)}</td>
              <td>${escapeHtml(order.customerName)}</td>
              ${
                canViewPhone
                  ? `<td class="phone">${escapeHtml(order.customerPhone)}</td>`
                  : ""
              }
              <td class="center">${escapeHtml(statusName)}</td>
              <td>${escapeHtml(order.pickupBranchName)}</td>
              <td>${escapeHtml(order.description)}</td>
            </tr>
          `;
        })
        .join("");

      const now = safeFormatDateTime(new Date());

      printWindow.document.open();

      printWindow.document.write(`
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
          <head>
            <meta charset="UTF-8" />
            <title>كشف التصاليح</title>

            <style>
              * {
                box-sizing: border-box;
              }

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
                gap: 12px;
                margin-bottom: 12px;
                font-size: .82rem;
                color: #666;
              }

              table {
                width: 100%;
                border-collapse: collapse;
                font-size: .85rem;
              }

              thead {
                background: #f5e6c8;
              }

              th {
                padding: 10px 8px;
                text-align: right;
                color: #8b6914;
                border: 1px solid #d4b876;
                white-space: nowrap;
              }

              td {
                padding: 9px 8px;
                border: 1px solid #e0d0a0;
                text-align: right;
                overflow-wrap: anywhere;
              }

              tbody tr:nth-child(even) {
                background: #fdfaf2;
              }

              .center {
                text-align: center;
              }

              .barcode {
                font-family: monospace;
                font-weight: bold;
                color: #8b6914;
                direction: ltr;
                text-align: center;
                white-space: nowrap;
              }

              .phone {
                direction: ltr;
                text-align: center;
                white-space: nowrap;
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

                body {
                  padding: 0;
                }

                th,
                td {
                  padding: 7px 5px;
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
              <span>
                إجمالي التصاليح:
                <strong>${allOrders.length}</strong>
              </span>

              <span>
                تاريخ الطباعة:
                ${escapeHtml(now)}
              </span>
            </div>

            <table>
              <thead>
                <tr>
                  <th>رقم الباركود</th>
                  <th>اسم العميل</th>
                  ${canViewPhone ? "<th>رقم الهاتف</th>" : ""}
                  <th>الحالة</th>
                  <th>الفرع</th>
                  <th>الوصف</th>
                </tr>
              </thead>

              <tbody>
                ${rowsHtml}
              </tbody>
            </table>

            <div class="footer">
              مجوهرات عايد دعنا
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

      toast.success(
        `تم تجهيز ${allOrders.length} تصليحة للطباعة`
      );
    } catch (error) {
      console.error("Print Error:", error);

      printWindow.close();

      toast.error(
        error?.response?.data?.message ||
          error.message ||
          "حدث خطأ أثناء تجهيز الطباعة"
      );
    } finally {
      setIsExporting(false);
    }
  };

  // ===================================
  // UI
  // ===================================

  return (
    <div className={style.repairsListContainer}>
      {/* Header */}

      <div className={style.repairsListHeader}>
        <div className={style.repairsListHeaderIcon}>
          <ReceiptLongIcon sx={{ fontSize: 34 }} />
        </div>

        <Typography className={style.repairsListTitle}>
          كشف التصاليح
        </Typography>

        <Typography className={style.repairsListSubtitle}>
          عرض وإدارة جميع التصاليح
        </Typography>
      </div>

      {/* Filters */}

      <Paper
        elevation={0}
        className={style.repairsFiltersPaper}
      >
        <div
          className={`${style.repairsFiltersFields} ${
            searchType === "date"
              ? style.repairsFiltersFieldsDates
              : ""
          }`}
        >
          {/* نوع البحث */}

          <div className={style.repairsFilterField}>
            <TextField
              fullWidth
              size="small"
              select
              label="بحث بـ"
              value={searchType}
              onChange={handleSearchTypeChange}
              className={style.repairsSearchTypeFilter}
              slotProps={{
                inputLabel: { shrink: true },
              }}
            >
              {SEARCH_TYPES.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  {type.label}
                </MenuItem>
              ))}
            </TextField>
          </div>

          {/* البحث النصي */}

          {searchType === "text" && (
            <div
              className={`${style.repairsFilterField} ${style.repairsFilterFieldWide}`}
            >
              <TextField
                fullWidth
                size="small"
                placeholder="اكتب للبحث..."
                value={searchQuery}
                onChange={(event) =>
                  setSearchQuery(event.target.value)
                }
                className={style.repairsSearch}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon
                          sx={{ color: "#c9a44c", fontSize: 20 }}
                        />
                      </InputAdornment>
                    ),

                    endAdornment: searchQuery && (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          onClick={() => setSearchQuery("")}
                          aria-label="مسح البحث"
                        >
                          <ClearIcon fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </div>
          )}

          {/* البحث بالتاريخ */}

          {searchType === "date" && (
            <>
              <div className={style.repairsFilterField}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="من تاريخ"
                  value={fromDate}
                  onChange={handleFilterChange(setFromDate)}
                  slotProps={{
                    inputLabel: { shrink: true },
                  }}
                  className={style.repairsDateFilter}
                />
              </div>

              <div className={style.repairsFilterField}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="إلى تاريخ"
                  value={toDate}
                  onChange={handleFilterChange(setToDate)}
                  slotProps={{
                    inputLabel: { shrink: true },
                  }}
                  className={style.repairsDateFilter}
                />
              </div>
            </>
          )}

          {/* البحث بالحالة */}

          {searchType === "status" && (
            <div className={style.repairsFilterField}>
              <TextField
                fullWidth
                size="small"
                select
                label="الحالة"
                value={statusFilter}
                onChange={handleFilterChange(setStatusFilter)}
                className={style.repairsStatusFilter}
                slotProps={{
                  inputLabel: { shrink: true },
                }}
              >
                {STATUS_OPTIONS.map((option) => (
                  <MenuItem
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </div>
          )}

          {/* فلتر الفرع */}

          {isAdmin && (
            <div className={style.repairsFilterField}>
              <TextField
                fullWidth
                size="small"
                select
                label="الفرع"
                value={branchFilter}
                onChange={handleFilterChange(setBranchFilter)}
                className={style.repairsBranchFilter}
                slotProps={{
                  inputLabel: { shrink: true },

                  select: {
                    displayEmpty: true,

                    renderValue: (selected) => {
                      if (
                        selected === "" ||
                        selected === undefined ||
                        selected === null
                      ) {
                        return (
                          <span className={style.repairsBranchPlaceholder}>
                            كل الفروع
                          </span>
                        );
                      }

                      const branch = branches.find(
                        (item) =>
                          Number(item.id) === Number(selected)
                      );

                      return branch?.name || "كل الفروع";
                    },
                  },

                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <StorefrontIcon
                          sx={{ color: "#c9a44c", fontSize: 20 }}
                        />
                      </InputAdornment>
                    ),
                  },
                }}
              >
                <MenuItem value="">
                  كل الفروع
                </MenuItem>

                {branches.map((branch) => (
                  <MenuItem key={branch.id} value={branch.id}>
                    {branch.name}
                  </MenuItem>
                ))}
              </TextField>
            </div>
          )}
        </div>

        {/* أزرار التحكم */}

        <div className={style.repairsFiltersActions}>
          <Tooltip title="تحديث">
            <span>
              <IconButton
                onClick={() => refetch()}
                disabled={isFetching || isExporting}
                className={style.repairsRefreshBtn}
                aria-label="تحديث"
              >
                <RefreshIcon />
              </IconButton>
            </span>
          </Tooltip>

          <Button
            variant="outlined"
            onClick={handleClearFilters}
            disabled={isExporting}
            className={style.repairsClearBtn}
          >
            مسح
          </Button>

          <Tooltip title="تصدير جميع النتائج إلى Excel">
            <span>
              <Button
                variant="outlined"
                startIcon={
                  isExporting ? (
                    <CircularProgress size={16} />
                  ) : (
                    <GridOnIcon />
                  )
                }
                onClick={handleExportExcel}
                disabled={isExporting}
                className={style.repairsExportExcelBtn}
              >
                {isExporting ? "جاري التجهيز..." : "Excel"}
              </Button>
            </span>
          </Tooltip>

          <Tooltip title="طباعة جميع النتائج">
            <span>
              <Button
                variant="outlined"
                startIcon={<PrintIcon />}
                onClick={handlePrint}
                disabled={isExporting}
                className={style.repairsPrintTableBtn}
              >
                {isExporting ? "جاري التجهيز..." : "طباعة"}
              </Button>
            </span>
          </Tooltip>

          {canCreate && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              className={style.repairsAddBtn}
              onClick={() => navigate("/repairs/create")}
              disabled={isExporting}
            >
              تصليحة جديدة
            </Button>
          )}
        </div>
      </Paper>

      {/* Repairs Table */}

      <Paper
        elevation={0}
        className={style.repairsTablePaper}
      >
        {isLoading ? (
          <Box className={style.repairsLoading}>
            <CircularProgress sx={{ color: "#b8860b" }} />
          </Box>
        ) : orders.length === 0 ? (
          <Box className={style.repairsEmpty}>
            <Typography>
              لا توجد تصاليح مطابقة للبحث أو الفلاتر
            </Typography>
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow className={style.repairsTableHeadRow}>
                    <TableCell className={style.repairsTh}>
                      #
                    </TableCell>

                    <TableCell className={style.repairsTh}>
                      الباركود
                    </TableCell>

                    <TableCell className={style.repairsTh}>
                      العميل
                    </TableCell>

                    {canViewPhone && (
                      <TableCell className={style.repairsTh}>
                        الهاتف
                      </TableCell>
                    )}

                    <TableCell className={style.repairsTh}>
                      الوصف
                    </TableCell>

                    <TableCell className={style.repairsTh}>
                      الفرع
                    </TableCell>

                    <TableCell className={style.repairsTh}>
                      الحالة
                    </TableCell>

                    <TableCell
                      className={style.repairsTh}
                      align="center"
                    >
                      الإجراءات
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {orders.map((order, index) => (
                    <TableRow
                      key={order.id}
                      className={style.repairsTableRow}
                    >
                      <TableCell
                        className={style.repairsTd}
                        data-label="#"
                      >
                        {(page - 1) * PAGE_SIZE + index + 1}
                      </TableCell>

                      <TableCell
                        className={style.repairsTd}
                        data-label="الباركود"
                      >
                        <Chip
                          label={order.barcode || "—"}
                          size="small"
                          className={style.repairsBarcodeChip}
                        />
                      </TableCell>

                      <TableCell
                        className={`${style.repairsTd} ${style.repairsTdName}`}
                        data-label="العميل"
                      >
                        {order.customerName || "—"}
                      </TableCell>

                      {canViewPhone && (
                        <TableCell
                          className={`${style.repairsTd} ${style.repairsTdPhone}`}
                          data-label="الهاتف"
                        >
                          {order.customerPhone || "—"}
                        </TableCell>
                      )}

                      <TableCell
                        className={style.repairsTd}
                        data-label="الوصف"
                      >
                        {order.description || "—"}
                      </TableCell>

                      <TableCell
                        className={style.repairsTd}
                        data-label="الفرع"
                      >
                        {order.pickupBranchName || "—"}
                      </TableCell>

                      <TableCell
                        className={style.repairsTd}
                        data-label="الحالة"
                      >
                        <Chip
                          label={
                            order.statusName ||
                            getStatusName(order.status) ||
                            "—"
                          }
                          size="small"
                          className={`repairs-status-chip repairs-status-${
                            [1, 2, 3, 4, 6, 7].includes(
                              Number(order.status)
                            )
                              ? Number(order.status)
                              : "unknown"
                          }`}
                        />
                      </TableCell>

                      <TableCell
                        className={style.repairsTd}
                        align="center"
                        data-label="الإجراءات"
                      >
                        <Tooltip title="التفاصيل">
                          <IconButton
                            size="small"
                            className={`${style.repairsActionBtn} ${style.repairsViewBtn}`}
                            onClick={() =>
                              navigate(`/repairs/${order.id}`)
                            }
                            aria-label="عرض التفاصيل"
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

            {/* Pagination */}

            <div className={style.repairsPagination}>
              <div className={style.repairsPaginationInfo}>
                عرض {startItem} - {endItem} من {totalCount} تصليحة
                {isFetching ? " — جاري التحديث..." : ""}
              </div>

              <Pagination
                count={pageCount}
                page={Math.min(page, pageCount)}
                onChange={(_event, value) => setPage(value)}
                shape="rounded"
                className={style.repairsPaginationControl}
                dir="ltr"
                disabled={isFetching || isExporting}
              />
            </div>
          </>
        )}
      </Paper>
    </div>
  );
}
