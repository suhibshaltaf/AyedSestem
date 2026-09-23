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
  Chip,
  CircularProgress,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
} from "@mui/material";

import GroupIcon from "@mui/icons-material/Group";
import SearchIcon from "@mui/icons-material/Search";
import RefreshIcon from "@mui/icons-material/Refresh";
import InventoryIcon from "@mui/icons-material/Inventory";
import StorefrontIcon from "@mui/icons-material/Storefront";
import BuildIcon from "@mui/icons-material/Build";

import { useRepresentativesSummary } from "../../hooks/useRepairOrders.js";
import "../../styles/repairs.css";

export default function RepresentativesSummary() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: representatives = [], isLoading, refetch } =
    useRepresentativesSummary();

  // فلترة
  const filteredRepresentatives = useMemo(() => {
    if (!searchQuery.trim()) return representatives;
    const q = searchQuery.toLowerCase();
    return representatives.filter((r) => {
      return (
        (r.representativeName || "").toLowerCase().includes(q) ||
        (r.branchName || "").toLowerCase().includes(q)
      );
    });
  }, [representatives, searchQuery]);

  const totalPieces = useMemo(
    () => representatives.reduce((sum, r) => sum + (r.totalPieces || 0), 0),
    [representatives]
  );

  return (
    <div className="repairs-list-container">
      {/* Header */}
      <div className="repairs-list-header">
        <div className="repairs-list-header-icon">
          <GroupIcon sx={{ fontSize: 34 }} />
        </div>

        <Typography className="repairs-list-title">ملخص المندوبين</Typography>

        <Typography className="repairs-list-subtitle">
          عرض القطع الموجودة بحوزة كل مندوب
        </Typography>
      </div>

      {/* Stats */}
      <div className="repairs-summary-stats">
        <Paper elevation={0} className="repairs-summary-stat">
          <Typography className="repairs-summary-stat-value">
            {representatives.length}
          </Typography>
          <Typography className="repairs-summary-stat-label">
            عدد المندوبين
          </Typography>
        </Paper>

        <Paper elevation={0} className="repairs-summary-stat">
          <Typography className="repairs-summary-stat-value">
            {totalPieces}
          </Typography>
          <Typography className="repairs-summary-stat-label">
            إجمالي القطع
          </Typography>
        </Paper>
      </div>

      {/* Toolbar */}
      <div className="repairs-toolbar-simple">
        <TextField
          placeholder="بحث باسم المندوب أو الفرع..."
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
          <IconButton
            onClick={() => refetch()}
            className="repairs-refresh-btn"
          >
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
        ) : filteredRepresentatives.length === 0 ? (
          <Box className="repairs-empty">
            <Typography>
              {searchQuery
                ? "لا توجد نتائج مطابقة للبحث"
                : "لا يوجد مندوبون لعرضهم"}
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow className="repairs-table-head-row">
                  <TableCell className="repairs-th">#</TableCell>
                  <TableCell className="repairs-th">اسم المندوب</TableCell>
                  <TableCell className="repairs-th">الفرع</TableCell>
                  <TableCell className="repairs-th" align="center">
                    <InventoryIcon
                      sx={{ fontSize: 18, verticalAlign: "middle", ml: 0.5 }}
                    />
                    الإجمالي
                  </TableCell>
                  <TableCell className="repairs-th" align="center">
                    <StorefrontIcon
                      sx={{ fontSize: 18, verticalAlign: "middle", ml: 0.5 }}
                    />
                    من الفرع
                  </TableCell>
                  <TableCell className="repairs-th" align="center">
                    <BuildIcon
                      sx={{ fontSize: 18, verticalAlign: "middle", ml: 0.5 }}
                    />
                    من الورشة
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {filteredRepresentatives.map((rep, index) => (
                  <TableRow key={rep.userId} className="repairs-table-row">
                    <TableCell className="repairs-td">
                      {index + 1}
                    </TableCell>

                    <TableCell className="repairs-td repairs-td-name">
                      {rep.representativeName || "—"}
                    </TableCell>

                    <TableCell className="repairs-td">
                      {rep.branchName || "—"}
                    </TableCell>

                    <TableCell className="repairs-td" align="center">
                      <Chip
                        label={rep.totalPieces || 0}
                        size="small"
                        className={`repairs-summary-count-chip ${
                          rep.totalPieces > 0
                            ? "repairs-summary-count-chip-active"
                            : "repairs-summary-count-chip-empty"
                        }`}
                      />
                    </TableCell>

                    <TableCell className="repairs-td" align="center">
                      <Chip
                        label={rep.fromBranch || 0}
                        size="small"
                        className="repairs-summary-branch-chip"
                      />
                    </TableCell>

                    <TableCell className="repairs-td" align="center">
                      <Chip
                        label={rep.fromWorkshop || 0}
                        size="small"
                        className="repairs-summary-workshop-chip"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </div>
  );
}