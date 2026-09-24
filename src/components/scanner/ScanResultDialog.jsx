import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Divider,
  Chip,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import PersonIcon from "@mui/icons-material/Person";
import StorefrontIcon from "@mui/icons-material/Storefront";
import BuildIcon from "@mui/icons-material/Build";
import AccessTimeIcon from "@mui/icons-material/AccessTime";

// عرض صف واحد (label + value)
function ResultRow({ label, value, icon, ltr = false }) {
  if (!value) return null;
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 2,
        py: 1.2,
        borderBottom: "1px dashed var(--border-gold)",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        {icon && (
          <Box sx={{ color: "var(--gold-primary)", display: "flex" }}>
            {icon}
          </Box>
        )}
        <Typography
          sx={{
            fontFamily: "'Cairo', sans-serif",
            fontSize: "0.85rem",
            color: "var(--text-secondary)",
          }}
        >
          {label}
        </Typography>
      </Box>
      <Typography
        sx={{
          fontFamily: "'Cairo', sans-serif",
          fontSize: "0.9rem",
          fontWeight: 700,
          color: "var(--text-primary)",
          direction: ltr ? "ltr" : "rtl",
          textAlign: "left",
          wordBreak: "break-word",
          maxWidth: "60%",
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}

export default function ScanResultDialog({
  open,
  data,
  onClose,
  onScanAnother,
}) {
  if (!data) return null;

  const scannedAt = data.scannedAt
    ? new Date(data.scannedAt).toLocaleString("ar-JO", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      dir="rtl"
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          fontFamily: "'Cairo', sans-serif",
          fontWeight: 700,
          color: "#16a34a",
        }}
      >
        <CheckCircleIcon />
        <span>تمت العملية بنجاح</span>
      </DialogTitle>

      <DialogContent dividers>
        {/* الحركة */}
        {data.movementName && (
          <Box
            sx={{
              p: 2,
              mb: 2,
              borderRadius: 2,
              backgroundColor: "rgba(184, 134, 11, 0.08)",
              border: "1px solid var(--border-gold)",
              textAlign: "center",
            }}
          >
            <Typography
              sx={{
                fontFamily: "'Cairo', sans-serif",
                fontWeight: 700,
                fontSize: "1rem",
                color: "var(--gold-primary)",
              }}
            >
              {data.movementName}
            </Typography>
          </Box>
        )}

        {/* من حالة → إلى حالة */}
        {(data.previousStatusName || data.newStatusName) && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 2,
              mb: 2,
              flexWrap: "wrap",
            }}
          >
            {data.previousStatusName && (
              <Chip
                label={data.previousStatusName}
                sx={{
                  fontFamily: "'Cairo', sans-serif",
                  fontWeight: 700,
                  backgroundColor: "rgba(150,150,150,0.15)",
                  color: "#666",
                }}
              />
            )}
            <ArrowForwardIcon
              sx={{ color: "var(--gold-primary)", transform: "scaleX(-1)" }}
            />
            {data.newStatusName && (
              <Chip
                label={data.newStatusName}
                sx={{
                  fontFamily: "'Cairo', sans-serif",
                  fontWeight: 700,
                  backgroundColor: "rgba(22,163,74,0.15)",
                  color: "#16a34a",
                }}
              />
            )}
          </Box>
        )}

        <Divider sx={{ my: 1 }} />

        {/* التفاصيل */}
        <ResultRow
          label="الباركود"
          value={data.barcode}
          ltr
        />
        <ResultRow
          label="نفّذها"
          value={data.performedByUserName}
          icon={<PersonIcon sx={{ fontSize: 18 }} />}
        />
        <ResultRow
          label="المسؤول الحالي"
          value={data.currentResponsibleUserName}
          icon={<PersonIcon sx={{ fontSize: 18 }} />}
        />
        <ResultRow
          label="الفرع"
          value={data.currentBranchName}
          icon={<StorefrontIcon sx={{ fontSize: 18 }} />}
        />
        <ResultRow
          label="المشغل"
          value={data.workshopName}
          icon={<BuildIcon sx={{ fontSize: 18 }} />}
        />
        <ResultRow
          label="وقت المسح"
          value={scannedAt}
          icon={<AccessTimeIcon sx={{ fontSize: 18 }} />}
        />

        {data.isPendingConfirmation && (
          <Box sx={{ mt: 2, textAlign: "center" }}>
            <Chip
              label="بانتظار التأكيد"
              color="warning"
              sx={{ fontFamily: "'Cairo', sans-serif", fontWeight: 700 }}
            />
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1, flexWrap: "wrap" }}>
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{
            fontFamily: "'Cairo', sans-serif",
            textTransform: "none",
            borderColor: "var(--border-gold-strong)",
            color: "var(--text-secondary)",
          }}
        >
          إغلاق
        </Button>
        {onScanAnother && (
          <Button
            onClick={onScanAnother}
            variant="contained"
            startIcon={<QrCodeScannerIcon />}
            sx={{
              fontFamily: "'Cairo', sans-serif",
              textTransform: "none",
              fontWeight: 700,
              background: "linear-gradient(90deg, #c79a4b, #a67c2e)",
              "&:hover": {
                background: "linear-gradient(90deg, #b8860b, #8b6914)",
              },
            }}
          >
            مسح قطعة أخرى
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}