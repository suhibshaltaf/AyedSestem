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
  TextField,
  InputAdornment,
  Chip,
  Tooltip,
  CircularProgress,
  Pagination,
  Tabs,
  Tab,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { formatJordanDateTime } from "../../utils/dateUtils";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import SearchIcon from "@mui/icons-material/Search";
import RefreshIcon from "@mui/icons-material/Refresh";
import VisibilityIcon from "@mui/icons-material/Visibility";
import UploadIcon from "@mui/icons-material/Upload";
import DownloadIcon from "@mui/icons-material/Download";

import { useRepairOrders } from "../../hooks/useRepairOrders.js";
import {
  getStatusName,
  getStatusColor,
} from "../../utils/repairConstants.js";
import styles from "../../styles/Repairs/PickupDelivery.module.css";

const PAGE_SIZE = 10;

// ✅ الحالات الجديدة:
// تبويب 1: تسليم للمندوب → القطع الجديدة في الفرع (Status = 1)
// تبويب 2: استلام من المندوب → القطع مع المندوب بعد التصليح (Status = 5)
const DELIVER_TO_REP_STATUSES = [1];
const RECEIVE_FROM_REP_STATUSES = [5];

export default function PickupDelivery() {
  const navigate = useNavigate();

  const [tab, setTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);

const {
  data: ordersResponse,
  isLoading,
  refetch,
} = useRepairOrders({});

const orders = useMemo(() => {
  if (Array.isArray(ordersResponse)) {
    return ordersResponse;
  }

  if (Array.isArray(ordersResponse?.data)) {
    return ordersResponse.data;
  }

  if (Array.isArray(ordersResponse?.items)) {
    return ordersResponse.items;
  }

  if (Array.isArray(ordersResponse?.data?.items)) {
    return ordersResponse.data.items;
  }

  return [];
}, [ordersResponse]);
  const filteredByTab = useMemo(() => {
    if (tab === 0) {
      return orders.filter((o) => DELIVER_TO_REP_STATUSES.includes(o.status));
    }
    return orders.filter((o) =>
      RECEIVE_FROM_REP_STATUSES.includes(o.status)
    );
  }, [orders, tab]);

  const filteredOrders = useMemo(() => {
    if (!searchQuery.trim()) return filteredByTab;
    const q = searchQuery.toLowerCase();
    return filteredByTab.filter((o) => {
      return (
        (o.barcode || "").toLowerCase().includes(q) ||
        (o.customerName || "").toLowerCase().includes(q) ||
        (o.customerPhone || "").toLowerCase().includes(q)
      );
    });
  }, [filteredByTab, searchQuery]);

  const pageCount = Math.ceil(filteredOrders.length / PAGE_SIZE);
  const paginatedOrders = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredOrders.slice(start, start + PAGE_SIZE);
  }, [filteredOrders, page]);

  const startItem =
    filteredOrders.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const endItem = Math.min(page * PAGE_SIZE, filteredOrders.length);

  const handleTabChange = (e, newValue) => {
    setTab(newValue);
    setPage(1);
    setSearchQuery("");
  };

  const deliverCount = orders.filter((o) =>
    DELIVER_TO_REP_STATUSES.includes(o.status)
  ).length;

  const receiveCount = orders.filter((o) =>
    RECEIVE_FROM_REP_STATUSES.includes(o.status)
  ).length;

  return (
    <div className={styles.pageContainer}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div className={styles.pageHeaderIcon}>
          <LocalShippingIcon sx={{ fontSize: 34 }} />
        </div>

        <Typography className={styles.pageTitle}>
          الاستلام والتسليم
        </Typography>

        <Typography className={styles.pageSubtitle}>
          إدارة تسليم واستلام التصاليح
        </Typography>
      </div>

      {/* Tabs */}
      <Paper elevation={0} className={styles.tabsPaper}>
        <Tabs
          value={tab}
          onChange={handleTabChange}
          variant="fullWidth"
          className={styles.tabs}
        >
          <Tab
            icon={<UploadIcon />}
            iconPosition="start"
            label={
              <div className={styles.tabLabel}>
                <span>تسليم للمندوب</span>
                <Chip
                  label={deliverCount}
                  size="small"
                  className={styles.tabCount}
                />
              </div>
            }
          />
          <Tab
            icon={<DownloadIcon />}
            iconPosition="start"
            label={
              <div className={styles.tabLabel}>
                <span>استلام من المندوب</span>
                <Chip
                  label={receiveCount}
                  size="small"
                  className={styles.tabCount}
                />
              </div>
            }
          />
        </Tabs>
      </Paper>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <TextField
          placeholder="بحث بالباركود أو اسم العميل..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          size="small"
          className={styles.searchField}
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

        <Tooltip title="تحديث">
          <IconButton onClick={() => refetch()} className={styles.refreshButton}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </div>

      {/* Table */}
      <Paper elevation={0} className={styles.tablePaper}>
        {isLoading ? (
          <Box className={styles.loading}>
            <CircularProgress sx={{ color: "#b8860b" }} />
          </Box>
        ) : filteredOrders.length === 0 ? (
          <Box className={styles.empty}>
            <Typography>
              {tab === 0
                ? "لا توجد تصاليح جاهزة للتسليم للمندوب"
                : "لا توجد تصاليح لاستلامها من المندوب"}
            </Typography>
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow className={styles.tableHeadRow}>
                    <TableCell className={styles.tableHeadCell}>#</TableCell>
                    <TableCell className={styles.tableHeadCell}>الباركود</TableCell>
                    <TableCell className={styles.tableHeadCell}>العميل</TableCell>
                    <TableCell className={styles.tableHeadCell}>الهاتف</TableCell>
                    <TableCell className={styles.tableHeadCell}>الوصف</TableCell>
                    <TableCell className={styles.tableHeadCell}>الحالة</TableCell>
                    <TableCell className={styles.tableHeadCell}>التاريخ</TableCell>
                    <TableCell className={styles.tableHeadCell} align="center">
                      الإجراءات
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {paginatedOrders.map((order, index) => (
                    <TableRow key={order.id} className={styles.tableRow}>
                      <TableCell className={styles.tableCell}>
                        {(page - 1) * PAGE_SIZE + index + 1}
                      </TableCell>

                      <TableCell className={styles.tableCell}>
                        <Chip
                          label={order.barcode || "—"}
                          size="small"
                          className={styles.barcodeChip}
                        />
                      </TableCell>

                      <TableCell className={`${styles.tableCell} ${styles.nameCell}`}>
                        {order.customerName || "—"}
                      </TableCell>

                      <TableCell className={`${styles.tableCell} ${styles.phoneCell}`}>
                        {order.customerPhone || "—"}
                      </TableCell>

                      <TableCell className={styles.tableCell}>
                        {order.description || "—"}
                      </TableCell>

                      <TableCell className={styles.tableCell}>
                        <Chip
                          label={
                            order.statusName || getStatusName(order.status)
                          }
                          size="small"
                          className={`${styles.statusChip} ${styles[`status${getStatusColor(order.status)}`] || ""}`}
                        />
                      </TableCell>

                    <TableCell className={`${styles.tableCell} ${styles.dateCell}`}>
  {order.updatedAt
    ? formatJordanDateTime(order.updatedAt)
    : "—"}
</TableCell>

                      <TableCell className={styles.tableCell} align="center">
                        <Tooltip title="عرض التفاصيل">
                          <IconButton
                            size="small"
                            className={`${styles.actionButton} ${styles.viewButton}`}
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

            <div className={styles.pagination}>
              <div className={styles.paginationInfo}>
                عرض {startItem} - {endItem} من {filteredOrders.length} تصليحة
              </div>

              <Pagination
                count={pageCount}
                page={page}
                onChange={(e, value) => setPage(value)}
                shape="rounded"
                className={styles.paginationControl}
                dir="ltr"
              />
            </div>
          </>
        )}
      </Paper>
    </div>
  );
}