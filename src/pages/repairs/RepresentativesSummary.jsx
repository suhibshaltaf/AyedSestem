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
import styles from "../../styles/Repairs/RepresentativesSummary.module.css";

export default function RepresentativesSummary() {
  const [searchQuery, setSearchQuery] = useState("");

  const {
    data: representatives = [],
    isLoading,
    refetch,
  } = useRepresentativesSummary();

  const filteredRepresentatives = useMemo(() => {
    if (!searchQuery.trim()) return representatives;

    const q = searchQuery.toLowerCase().trim();

    return representatives.filter(
      (r) =>
        (r.representativeName || "").toLowerCase().includes(q) ||
        (r.branchName || "").toLowerCase().includes(q)
    );
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
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <div className={styles.pageHeaderIcon}>
          <GroupIcon sx={{ fontSize: 34 }} />
        </div>

        <Typography className={styles.pageTitle}>
          ملخص المندوبين
        </Typography>

        <Typography className={styles.pageSubtitle}>
          عرض القطع الموجودة بحوزة كل مندوب
        </Typography>
      </div>

      <div className={styles.summaryStats}>
        <Paper elevation={0} className={styles.summaryStat}>
          <Typography className={styles.summaryStatValue}>
            {representatives.length}
          </Typography>

          <Typography className={styles.summaryStatLabel}>
            عدد المندوبين
          </Typography>
        </Paper>

        <Paper elevation={0} className={styles.summaryStat}>
          <Typography className={styles.summaryStatValue}>
            {totalPieces}
          </Typography>

          <Typography className={styles.summaryStatLabel}>
            إجمالي القطع
          </Typography>
        </Paper>
      </div>

      <div className={styles.toolbar}>
        <TextField
          placeholder="بحث باسم المندوب أو الفرع..."
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
          <IconButton
            onClick={() => refetch()}
            className={styles.refreshButton}
          >
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </div>

      <Paper elevation={0} className={styles.tablePaper}>
        {isLoading ? (
          <Box className={styles.loading}>
            <CircularProgress />
          </Box>
        ) : filteredRepresentatives.length === 0 ? (
          <Box className={styles.empty}>
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
                <TableRow>
                  <TableCell className={styles.tableHeadCell}>
                    #
                  </TableCell>

                  <TableCell className={styles.tableHeadCell}>
                    اسم المندوب
                  </TableCell>

                  <TableCell className={styles.tableHeadCell}>
                    الفرع
                  </TableCell>

                  <TableCell
                    className={styles.tableHeadCell}
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
                    className={styles.tableHeadCell}
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
                    className={styles.tableHeadCell}
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
                    <TableRow key={rep.userId} hover>
                      <TableCell className={styles.tableCell}>
                        {index + 1}
                      </TableCell>

                      <TableCell
                        className={`${styles.tableCell} ${styles.nameCell}`}
                      >
                        {rep.representativeName || "—"}
                      </TableCell>

                      <TableCell className={styles.tableCell}>
                        {rep.branchName || "—"}
                      </TableCell>

                      <TableCell
                        className={styles.tableCell}
                        align="center"
                      >
                        <Chip
                          label={total}
                          size="small"
                          className={`${styles.countChip} ${
                            total > 0
                              ? styles.countChipActive
                              : styles.countChipEmpty
                          }`}
                        />
                      </TableCell>

                      <TableCell
                        className={styles.tableCell}
                        align="center"
                      >
                        <Chip
                          label={fromBranch}
                          size="small"
                          className={styles.branchChip}
                        />
                      </TableCell>

                      <TableCell
                        className={styles.tableCell}
                        align="center"
                      >
                        <Chip
                          label={fromWorkshop}
                          size="small"
                          className={styles.workshopChip}
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