import { useMemo, useState } from "react";

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
  Chip,
  Tooltip,
  CircularProgress,
  Grid,
  TextField,
  InputAdornment,
  Pagination,
} from "@mui/material";

import { formatJordanDateTime } from "../../utils/dateUtils";

import BuildIcon from "@mui/icons-material/Build";
import RefreshIcon from "@mui/icons-material/Refresh";
import VisibilityIcon from "@mui/icons-material/Visibility";
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import StorefrontIcon from "@mui/icons-material/Storefront";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import SearchIcon from "@mui/icons-material/Search";

import { useNavigate } from "react-router-dom";

import {
  useOperatorDashboard,
  useOperatorOrders,
} from "../../hooks/useRepairOrders.js";

import { getStatusName } from "../../utils/repairConstants.js";

import style from "../../styles/Repairs/OperatorDashboard.module.css";

const PAGE_SIZE = 10;

export default function OperatorDashboard() {
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);

  const {
    data: dashboard,
    isLoading: loadingStats,
    refetch: refetchStats,
  } = useOperatorDashboard();

  const {
    data: orders = [],
    isLoading: loadingOrders,
    isFetching,
    refetch: refetchOrders,
  } = useOperatorOrders();

  // البحث
  const filteredOrders = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase();

    if (!query) return orders;

    return orders.filter((order) =>
      [
        order.barcode,
        order.customerName,
        order.customerPhone,
        order.description,
        order.pickupBranchName,
        order.statusName,
      ].some((value) =>
        String(value ?? "").toLocaleLowerCase().includes(query)
      )
    );
  }, [orders, searchQuery]);

  // عدد الصفحات
  const pageCount = Math.ceil(filteredOrders.length / PAGE_SIZE);

  // تقسيم النتائج حسب الصفحة
  const paginatedOrders = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredOrders.slice(start, start + PAGE_SIZE);
  }, [filteredOrders, page]);

  const startItem =
    filteredOrders.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;

  const endItem = Math.min(
    page * PAGE_SIZE,
    filteredOrders.length
  );

  // إحصائيات لوحة المشغل
  const stats = useMemo(
    () => [
      {
        title: "إجمالي القطع المستلمة",
        value: dashboard?.totalReceived ?? 0,
        icon: <Inventory2Icon sx={{ fontSize: 30 }} />,
        color: "#b8860b",
      },
      {
        title: "القطع الحالية في المشغل",
        value: dashboard?.currentlyAtWorkshop ?? 0,
        icon: <BuildIcon sx={{ fontSize: 30 }} />,
        color: "#d97706",
      },
      {
        title: "جاهزة للإرجاع",
        value: dashboard?.currentlyCompleted ?? 0,
        icon: <CheckCircleIcon sx={{ fontSize: 30 }} />,
        color: "#16a34a",
      },
      {
        title: "خرجت من المشغل",
        value: dashboard?.leftWorkshop ?? 0,
        icon: <LocalShippingIcon sx={{ fontSize: 30 }} />,
        color: "#2563eb",
      },
    ],
    [dashboard]
  );

  // تحديث البيانات
  const handleRefresh = () => {
    refetchStats();
    refetchOrders();
  };

  const loading = loadingStats || loadingOrders;

  // كلاس لون الحالة من ملف CSS العام
  const getStatusClass = (status) => {
    const statusNumber = Number(status);

    const supportedStatuses = [1, 2, 3, 4, 6, 7];

    return supportedStatuses.includes(statusNumber)
      ? `repairs-status-${statusNumber}`
      : "repairs-status-unknown";
  };

  return (
    <div className={style.pageContainer}>
      {/* Header */}
      <div className={style.pageHeader}>
        <div className={style.pageHeaderIcon}>
          <BuildIcon sx={{ fontSize: 34 }} />
        </div>

        <Typography className={style.pageTitle}>
          لوحة المشغّل
        </Typography>

        <Typography className={style.pageSubtitle}>
          القطع الموجودة حالياً في المشغل
        </Typography>
      </div>

      {/* Actions */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          mb: 3,
          gap: 2,
          flexWrap: "wrap",
        }}
      >
        <Button
          variant="contained"
          size="large"
          startIcon={<QrCodeScannerIcon />}
          onClick={() => navigate("/repairs/scan")}
          sx={{
            fontFamily: "'Cairo', sans-serif",
            textTransform: "none",
            fontWeight: 700,
            background: "linear-gradient(90deg, #c79a4b, #a67c2e)",
            px: 4,
            py: 1.4,
            borderRadius: 2,
            "&:hover": {
              background: "linear-gradient(90deg, #b8860b, #8b6914)",
            },
          }}
        >
          مسح قطعة
        </Button>

        <Tooltip title="تحديث">
          <span>
            <IconButton
              onClick={handleRefresh}
              disabled={isFetching}
              className={style.refreshButton}
              sx={{ width: 52, height: 52 }}
            >
              <RefreshIcon />
            </IconButton>
          </span>
        </Tooltip>
      </Box>

      {/* Statistics */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {stats.map((stat) => (
          <Grid item xs={6} md={3} key={stat.title}>
            <Paper
              elevation={0}
              sx={{
                p: { xs: 2, md: 2.5 },
                borderRadius: 3,
                minHeight: 130,
                border: "1px solid var(--border-gold-strong)",
                backgroundColor: "var(--bg-paper)",
                textAlign: "center",
              }}
            >
              <Box sx={{ color: stat.color, mb: 1 }}>
                {stat.icon}
              </Box>

              <Typography
                variant="h4"
                sx={{
                  fontWeight: 800,
                  color: stat.color,
                  mb: 0.5,
                }}
              >
                {stat.value}
              </Typography>

              <Typography
                sx={{
                  fontFamily: "'Cairo', sans-serif",
                  fontSize: "0.82rem",
                  color: "var(--text-secondary)",
                }}
              >
                {stat.title}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Search */}
      <Paper
        elevation={0}
        className={style.filtersPaper}
        sx={{ mb: 2 }}
      >
        <TextField
          fullWidth
          size="small"
          placeholder="ابحث بالباركود أو اسم العميل أو الوصف..."
          value={searchQuery}
          onChange={(event) => {
            setSearchQuery(event.target.value);
            setPage(1);
          }}
          className={style.searchField}
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
      </Paper>

      {/* Orders Table */}
      <Paper elevation={0} className={style.tablePaper}>
        {loading ? (
          <Box className={style.loading}>
            <CircularProgress sx={{ color: "#b8860b" }} />
          </Box>
        ) : filteredOrders.length === 0 ? (
          <Box className={style.empty}>
            <Typography>
              {searchQuery.trim()
                ? "لا توجد نتائج مطابقة للبحث"
                : "لا توجد قطع حالياً في المشغل"}
            </Typography>
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow className={style.tableHeadRow}>
                    <TableCell className={style.tableHeadCell}>
                      #
                    </TableCell>

                    <TableCell className={style.tableHeadCell}>
                      الباركود
                    </TableCell>

                    <TableCell className={style.tableHeadCell}>
                      العميل
                    </TableCell>

                    <TableCell className={style.tableHeadCell}>
                      الوصف
                    </TableCell>

                    <TableCell className={style.tableHeadCell}>
                      الفرع الداخل
                    </TableCell>

                    <TableCell className={style.tableHeadCell}>
                      الحالة
                    </TableCell>

                    <TableCell className={style.tableHeadCell}>
                      آخر تحديث
                    </TableCell>

                    <TableCell
                      className={style.tableHeadCell}
                      align="center"
                    >
                      الإجراءات
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {paginatedOrders.map((order, index) => (
                    <TableRow
                      key={order.id}
                      className={style.tableRow}
                    >
                      <TableCell className={style.tableCell}>
                        {(page - 1) * PAGE_SIZE + index + 1}
                      </TableCell>

                      <TableCell className={style.tableCell}>
                        <Chip
                          label={order.barcode || "—"}
                          size="small"
                          className={style.barcodeChip}
                        />
                      </TableCell>

                      <TableCell
                        className={`${style.tableCell} ${style.nameCell}`}
                      >
                        {order.customerName || "—"}
                      </TableCell>

                      <TableCell className={style.tableCell}>
                        {order.description || "—"}
                      </TableCell>

                      <TableCell className={style.tableCell}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                          }}
                        >
                          <StorefrontIcon
                            sx={{
                              fontSize: 16,
                              color: "var(--gold-primary)",
                            }}
                          />

                          <span>
                            {order.pickupBranchName || "—"}
                          </span>
                        </Box>
                      </TableCell>

                      {/* Status - Global CSS */}
                      <TableCell className={style.tableCell}>
                        <Chip
                          label={
                            order.statusName ||
                            getStatusName(order.status)
                          }
                          size="small"
                          className={`repairs-status-chip ${getStatusClass(
                            order.status
                          )}`}
                        />
                      </TableCell>

                      <TableCell
                        className={`${style.tableCell} ${style.dateCell}`}
                      >
                        {order.updatedAt
                          ? formatJordanDateTime(order.updatedAt)
                          : "—"}
                      </TableCell>

                      <TableCell
                        className={style.tableCell}
                        align="center"
                      >
                        <Tooltip title="عرض التفاصيل">
                          <IconButton
                            size="small"
                            className={`${style.actionButton} ${style.viewButton}`}
                            onClick={() =>
                              navigate(`/repairs/${order.id}`, {
                                state: {
                                  from: "/repairs/operator",
                                },
                              })
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

            {/* Pagination */}
            <div className={style.pagination}>
              <div className={style.paginationInfo}>
                عرض {startItem} - {endItem} من{" "}
                {filteredOrders.length} تصليحة
              </div>

              <Pagination
                count={pageCount}
                page={Math.min(page, Math.max(pageCount, 1))}
                onChange={(_, value) => setPage(value)}
                shape="rounded"
                className={style.paginationControl}
                dir="ltr"
              />
            </div>
          </>
        )}
      </Paper>
    </div>
  );
}