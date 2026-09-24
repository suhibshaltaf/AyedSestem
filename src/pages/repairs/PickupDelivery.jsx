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
import "../../styles/repairs.css";

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

  const { data: orders = [], isLoading, refetch } = useRepairOrders({});

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
    <div className="repairs-list-container">
      {/* Header */}
      <div className="repairs-list-header">
        <div className="repairs-list-header-icon">
          <LocalShippingIcon sx={{ fontSize: 34 }} />
        </div>

        <Typography className="repairs-list-title">
          الاستلام والتسليم
        </Typography>

        <Typography className="repairs-list-subtitle">
          إدارة تسليم واستلام التصاليح
        </Typography>
      </div>

      {/* Tabs */}
      <Paper elevation={0} className="pickup-delivery-tabs-paper">
        <Tabs
          value={tab}
          onChange={handleTabChange}
          variant="fullWidth"
          className="pickup-delivery-tabs"
        >
          <Tab
            icon={<UploadIcon />}
            iconPosition="start"
            label={
              <div className="pickup-delivery-tab-label">
                <span>تسليم للمندوب</span>
                <Chip
                  label={deliverCount}
                  size="small"
                  className="pickup-delivery-tab-count"
                />
              </div>
            }
          />
          <Tab
            icon={<DownloadIcon />}
            iconPosition="start"
            label={
              <div className="pickup-delivery-tab-label">
                <span>استلام من المندوب</span>
                <Chip
                  label={receiveCount}
                  size="small"
                  className="pickup-delivery-tab-count"
                />
              </div>
            }
          />
        </Tabs>
      </Paper>

      {/* Toolbar */}
      <div className="repairs-toolbar-simple">
        <TextField
          placeholder="بحث بالباركود أو اسم العميل..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          size="small"
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

        <Tooltip title="تحديث">
          <IconButton onClick={() => refetch()} className="repairs-refresh-btn">
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </div>

      {/* Table */}
      <Paper elevation={0} className="repairs-table-paper">
        {isLoading ? (
          <Box className="repairs-loading">
            <CircularProgress sx={{ color: "#b8860b" }} />
          </Box>
        ) : filteredOrders.length === 0 ? (
          <Box className="repairs-empty">
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
                  <TableRow className="repairs-table-head-row">
                    <TableCell className="repairs-th">#</TableCell>
                    <TableCell className="repairs-th">الباركود</TableCell>
                    <TableCell className="repairs-th">العميل</TableCell>
                    <TableCell className="repairs-th">الهاتف</TableCell>
                    <TableCell className="repairs-th">الوصف</TableCell>
                    <TableCell className="repairs-th">الحالة</TableCell>
                    <TableCell className="repairs-th">التاريخ</TableCell>
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

                      <TableCell className="repairs-td repairs-td-date">
                        {order.updatedAt
                          ? new Date(order.updatedAt).toLocaleString("ar-JO", {
                              month: "2-digit",
                              day: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "—"}
                      </TableCell>

                      <TableCell className="repairs-td" align="center">
                        <Tooltip title="عرض التفاصيل">
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