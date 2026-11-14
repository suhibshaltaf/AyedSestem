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
import "../../styles/Repairs/RepresentativeDashboard.css";

export default function RepresentativeDashboard() {
  const [searchQuery, setSearchQuery] = useState("");

  const {
    data: representatives = [],
    isLoading,
    refetch,
  } = useRepresentativesSummary();

  const filteredRepresentatives = useMemo(() => {
    if (!searchQuery.trim()) return representatives;

    const q = searchQuery.toLowerCase().trim();

    return representatives.filter((r) => {
      return (
        (r.representativeName || "").toLowerCase().includes(q) ||
        (r.branchName || "").toLowerCase().includes(q)
      );
    });
  }, [representatives, searchQuery]);

  const totalPieces = useMemo(
    () =>
      representatives.reduce(
        (sum, r) => sum + Number(r.totalPieces || 0),
        0
      ),
    [representatives]
  );

  return (
    <div className="representative-dashboard">
      {/* Header */}
      <div className="representative-dashboard-header">
        <div className="representative-dashboard-header-icon">
          <GroupIcon sx={{ fontSize: 34 }} />
        </div>

        <Typography className="representative-dashboard-title">
          ملخص المندوبين
        </Typography>

        <Typography className="representative-dashboard-subtitle">
          عرض القطع الموجودة بحوزة كل مندوب
        </Typography>
      </div>

      {/* Stats */}
      <div className="representative-dashboard-stats">
        <Paper elevation={0} className="representative-dashboard-stat">
          <Typography className="representative-dashboard-stat-value">
            {representatives.length}
          </Typography>

          <Typography className="representative-dashboard-stat-label">
            عدد المندوبين
          </Typography>
        </Paper>

        <Paper elevation={0} className="representative-dashboard-stat">
          <Typography className="representative-dashboard-stat-value">
            {totalPieces}
          </Typography>

          <Typography className="representative-dashboard-stat-label">
            إجمالي القطع
          </Typography>
        </Paper>
      </div>

      {/* Toolbar */}
      <div className="representative-dashboard-toolbar">
        <TextField
          placeholder="بحث باسم المندوب أو الفرع..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          size="small"
          className="representative-dashboard-search"
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
            className="representative-dashboard-refresh"
          >
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </div>

      {/* Table */}
      <Paper elevation={0} className="representative-dashboard-table-paper">
        {isLoading ? (
          <Box className="representative-dashboard-loading">
            <CircularProgress sx={{ color: "#b8860b" }} />
          </Box>
        ) : filteredRepresentatives.length === 0 ? (
          <Box className="representative-dashboard-empty">
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
                <TableRow className="representative-dashboard-table-head-row">
                  <TableCell className="representative-dashboard-th">
                    #
                  </TableCell>

                  <TableCell className="representative-dashboard-th">
                    اسم المندوب
                  </TableCell>

                  <TableCell className="representative-dashboard-th">
                    الفرع
                  </TableCell>

                  <TableCell
                    className="representative-dashboard-th"
                    align="center"
                  >
                    <InventoryIcon
                      sx={{
                        fontSize: 18,
                        verticalAlign: "middle",
                        ml: 0.5,
                      }}
                    />
                    الإجمالي
                  </TableCell>

                  <TableCell
                    className="representative-dashboard-th"
                    align="center"
                  >
                    <StorefrontIcon
                      sx={{
                        fontSize: 18,
                        verticalAlign: "middle",
                        ml: 0.5,
                      }}
                    />
                    من الفرع
                  </TableCell>

                  <TableCell
                    className="representative-dashboard-th"
                    align="center"
                  >
                    <BuildIcon
                      sx={{
                        fontSize: 18,
                        verticalAlign: "middle",
                        ml: 0.5,
                      }}
                    />
                    من الورشة
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {filteredRepresentatives.map((rep, index) => {
                  const total = Number(rep.totalPieces || 0);
                  const fromBranch = Number(rep.fromBranch || 0);
                  const fromWorkshop = Number(rep.fromWorkshop || 0);

                  return (
                    <TableRow
                      key={rep.userId}
                      className="representative-dashboard-table-row"
                    >
                      <TableCell className="representative-dashboard-td">
                        {index + 1}
                      </TableCell>

                      <TableCell className="representative-dashboard-td representative-dashboard-td-name">
                        {rep.representativeName || "—"}
                      </TableCell>

                      <TableCell className="representative-dashboard-td">
                        {rep.branchName || "—"}
                      </TableCell>

                      <TableCell
                        className="representative-dashboard-td"
                        align="center"
                      >
                        <Chip
                          label={total}
                          size="small"
                          className={`representative-dashboard-count-chip ${
                            total > 0
                              ? "representative-dashboard-count-chip-active"
                              : "representative-dashboard-count-chip-empty"
                          }`}
                        />
                      </TableCell>

                      <TableCell
                        className="representative-dashboard-td"
                        align="center"
                      >
                        <Chip
                          label={fromBranch}
                          size="small"
                          className="representative-dashboard-branch-chip"
                        />
                      </TableCell>

                      <TableCell
                        className="representative-dashboard-td"
                        align="center"
                      >
                        <Chip
                          label={fromWorkshop}
                          size="small"
                          className="representative-dashboard-workshop-chip"
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </div>
  );
}