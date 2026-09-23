import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Paper, Typography, TextField, Button, CircularProgress, Alert } from "@mui/material";
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";
import repairOrderService from "../../services/repairOrderService.js";

export default function ScanRepair() {
  const navigate = useNavigate();
  const [barcode, setBarcode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const submit = async (event) => {
    event.preventDefault();
    const value = barcode.trim();
    if (!value || busy) return;
    setBusy(true);
    setError("");
    try {
      const result = await repairOrderService.getRepairOrderByBarcode(value);
      if (result?.data?.id) navigate(`/repairs/${result.data.id}`);
      else setError("لم يتم العثور على التصليحة");
    } catch (err) {
      setError(err?.response?.data?.message || "تعذر العثور على التصليحة أو لا تملك صلاحية عرضها");
    } finally { setBusy(false); }
  };
  return (
    <Box dir="rtl" sx={{ minHeight: "65vh", display: "grid", placeItems: "center", p: 2 }}>
      <Paper component="form" onSubmit={submit} elevation={0} sx={{ width: "100%", maxWidth: 540, p: { xs: 3, sm: 5 },
        textAlign: "center", borderRadius: 4, border: "1px solid var(--border-gold-strong)" }}>
        <QrCodeScannerIcon sx={{ fontSize: 72, color: "var(--gold-primary)", mb: 1 }} />
        <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>امسح الباركود</Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>استخدم قارئ الباركود، أو أدخل الرقم يدويًا ثم اضغط بحث.</Typography>
        <TextField fullWidth autoFocus label="رقم الباركود" value={barcode} onChange={(event) => setBarcode(event.target.value)}
          inputProps={{ dir: "ltr", "aria-label": "رقم الباركود" }} sx={{ mb: 2 }} />
        {error && <Alert severity="error" role="alert" sx={{ mb: 2 }}>{error}</Alert>}
        <Button fullWidth variant="contained" type="submit" disabled={busy || !barcode.trim()} sx={{ py: 1.3 }}>
          {busy ? <CircularProgress size={22} color="inherit" /> : "فتح التصليحة"}
        </Button>
      </Paper>
    </Box>
  );
}
